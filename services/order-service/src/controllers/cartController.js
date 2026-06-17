const Cart = require('../models/Cart');
const { ApiError } = require('@feastfleet/shared');

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    res.json({ success: true, data: cart || { items: [], subtotal: 0, itemCount: 0 } });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { menuItemId, name, price, quantity, specialInstructions, restaurantId } = req.body;

    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) cart = new Cart({ userId: req.user.userId, restaurantId, items: [] });

    // One-restaurant rule: if you add an item from a different restaurant, the cart resets.
    if (cart.restaurantId && cart.restaurantId !== restaurantId && cart.items.length > 0) {
      cart.items = [];
    }
    cart.restaurantId = restaurantId;

    const existing = cart.items.find((i) => i.menuItemId === menuItemId);
    if (existing) {
      existing.quantity += quantity;
      if (existing.quantity > 20) throw ApiError.badRequest('Maximum 20 of any single item');
    } else {
      cart.items.push({ menuItemId, name, price, quantity, specialInstructions });
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) throw ApiError.notFound('Cart not found');

    const item = cart.items.find((i) => i.menuItemId === req.params.menuItemId);
    if (!item) throw ApiError.notFound('Item not in cart');

    if (req.body.quantity !== undefined) {
      if (req.body.quantity === 0) {
        cart.items = cart.items.filter((i) => i.menuItemId !== req.params.menuItemId);
      } else {
        item.quantity = req.body.quantity;
      }
    }
    if (req.body.specialInstructions !== undefined) {
      item.specialInstructions = req.body.specialInstructions;
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) throw ApiError.notFound('Cart not found');
    cart.items = cart.items.filter((i) => i.menuItemId !== req.params.menuItemId);
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.userId });
    res.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } });
  } catch (err) { next(err); }
};
