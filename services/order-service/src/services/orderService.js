const axios = require('axios');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const {
  ApiError, createQueue,
  QUEUE_NAMES, ORDER_STATUS, EVENT_TYPES,
} = require('@feastfleet/shared');

const stripe = require('./stripeClient');

const MENU_SERVICE_URL = process.env.MENU_SERVICE_URL || 'http://localhost:3002';
const orderQueue = createQueue(QUEUE_NAMES.ORDER_EVENTS);

/**
 * Ask the menu service for the live price + availability of each cart item.
 * Returns the items with server-side prices (do NOT trust prices from the cart).
 * Throws ApiError if any item is unavailable or missing.
 */
async function validateCartItems(cartItems) {
  const validated = [];
  for (const item of cartItems) {
    let res;
    try {
      res = await axios.get(`${MENU_SERVICE_URL}/api/menu/items/${item.menuItemId}`, { timeout: 5000 });
    } catch (err) {
      if (err.response?.status === 404) {
        throw ApiError.badRequest(`"${item.name}" is no longer on the menu`);
      }
      throw ApiError.serviceUnavailable('Menu service is unreachable');
    }

    const menuItem = res.data?.data;
    if (!menuItem) throw ApiError.badRequest(`"${item.name}" not found`);
    if (!menuItem.isAvailable) throw ApiError.badRequest(`"${menuItem.name}" is currently unavailable`);

    validated.push({
      menuItemId: item.menuItemId,
      name: menuItem.name,
      price: menuItem.price,                // server-side price wins
      quantity: item.quantity,
      specialInstructions: item.specialInstructions || '',
    });
  }
  return validated;
}

/**
 * Place an order. Steps:
 *   1. Load cart, sanity-check it isn't empty.
 *   2. Validate items against the menu service (live prices, availability).
 *   3. Create the Order document with status PENDING.
 *   4. Emit ORDER_PLACED so the notification service emails the customer.
 *   5. Clear the cart.
 *
 * Payment is NOT processed here. Phase 4b adds Stripe and flips paymentStatus.
 * For now the customer sees "Order placed, awaiting payment" in the UI.
 */
exports.placeOrder = async ({ userId, userEmail, userName, deliveryAddress, restaurantId, customerNotes }) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

  const items = await validateCartItems(cart.items);

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const deliveryFee = 2.99;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const order = await Order.create({
    userId, userEmail, userName,
    restaurantId,
    items,
    subtotal, deliveryFee, total,
    deliveryAddress,
    customerNotes,
    status: ORDER_STATUS.PENDING,
    statusHistory: [{ status: ORDER_STATUS.PENDING, note: 'Order placed' }],
  });

  await Cart.findOneAndDelete({ userId });

  await orderQueue.add(EVENT_TYPES.ORDER_PLACED, {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    userId, userEmail, userName,
    total: order.total,
    items: order.items,
    deliveryAddress: order.deliveryAddress,
  });

  return order;
};

/**
 * Admin: move an order forward (or backward) in the status pipeline.
 */
exports.updateStatus = async (orderId, status, note) => {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw ApiError.badRequest(`Invalid status: ${status}`);
  }
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  order.status = status;
  order.statusHistory.push({ status, note: note || `Status: ${status}` });
  await order.save();

  await orderQueue.add(`order.${status}`, {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.userId,
    userEmail: order.userEmail,
    status,
  });

  return order;
};

/**
 * Customer cancels their own order (only while still pending/confirmed).
 */
exports.cancelOrder = async (order, reason) => {
  const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];
  if (!cancellable.includes(order.status)) {
    throw ApiError.badRequest(`Cannot cancel order in "${order.status}" state`);
  }
  order.status = ORDER_STATUS.CANCELLED;
  order.statusHistory.push({ status: ORDER_STATUS.CANCELLED, note: reason || 'Cancelled' });
  await order.save();

  await orderQueue.add(EVENT_TYPES.ORDER_CANCELLED, {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.userId,
    userEmail: order.userEmail,
    reason: reason || 'Cancelled',
  });

  return order;
};

/**
 * Create a Stripe PaymentIntent for an order.
 * Returns the client_secret the frontend needs.
 *
 * Two important rules:
 *   - The amount comes from the Order document in the DB. Never from the request body.
 *   - PaymentIntents are idempotent: if the order already has one, return it instead of creating another.
 */
exports.createPaymentIntent = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.userId !== userId) throw ApiError.forbidden();
  if (order.paymentStatus === 'paid') throw ApiError.badRequest('Order already paid');

  // Reuse existing PaymentIntent if there is one (e.g. user reloaded the checkout page)
  if (order.paymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
      return { clientSecret: existing.client_secret, paymentIntentId: existing.id };
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),           // Stripe wants the smallest unit (pence)
    currency: process.env.STRIPE_CURRENCY || 'gbp',
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: order.userId,
    },
    automatic_payment_methods: { enabled: true },     // lets Stripe show cards, Apple Pay, etc.
  });

  order.paymentIntentId = intent.id;
  await order.save();

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
};
