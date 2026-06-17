const express = require('express');
const router = express.Router();
const stripe = require('../services/stripeClient');
const Order = require('../models/Order');
const { createQueue, QUEUE_NAMES, EVENT_TYPES, ORDER_STATUS } = require('@feastfleet/shared');

const orderQueue = createQueue(QUEUE_NAMES.ORDER_EVENTS);

// NOTE: express.raw — Stripe needs the unparsed body to verify the signature
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Stripe expects a 200 within a few seconds. Acknowledge first, then process.
  // But for clarity here we process inline (orders are quick) — if anything heavy,
  // queue it and respond 200 immediately.
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const order = await Order.findOne({ paymentIntentId: intent.id });
        if (!order) {
          console.warn(`[Stripe webhook] No order for intent ${intent.id}`);
          break;
        }
        if (order.paymentStatus === 'paid') break;     // idempotent: webhook can fire twice

        order.paymentStatus = 'paid';
        order.status = ORDER_STATUS.CONFIRMED;
        order.statusHistory.push({ status: ORDER_STATUS.CONFIRMED, note: 'Payment confirmed' });
        await order.save();

        await orderQueue.add(EVENT_TYPES.ORDER_CONFIRMED, {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          restaurantId: order.restaurantId,   // delivery-service requires this
          userId: order.userId,
          userEmail: order.userEmail,
          userName: order.userName,
          total: order.total,
          items: order.items,
          deliveryAddress: order.deliveryAddress,
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const order = await Order.findOne({ paymentIntentId: intent.id });
        if (!order) break;

        order.paymentStatus = 'failed';
        order.statusHistory.push({
          status: order.status,
          note: `Payment failed: ${intent.last_payment_error?.message || 'unknown'}`,
        });
        await order.save();
        break;
      }

      default:
        // Lots of event types exist. Log unhandled ones for visibility.
        console.log(`[Stripe webhook] Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe webhook] Handler error:', err);
    res.status(500).send('Webhook handler failed');
  }
});

module.exports = router;
