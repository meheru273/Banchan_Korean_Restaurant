const Order = require('../models/Order');
const orderService = require('../services/orderService');
const { ApiError } = require('@feastfleet/shared');

exports.placeOrder = async (req, res, next) => {
  try {
    const order = await orderService.placeOrder({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.body.userName,
      deliveryAddress: req.body.deliveryAddress,
      restaurantId: req.body.restaurantId,
      customerNotes: req.body.customerNotes,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.listOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.user.role === 'customer') filter.userId = req.user.userId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total, pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) throw ApiError.notFound('Order not found');
    if (req.user.role === 'customer' && order.userId !== req.user.userId) {
      throw ApiError.forbidden();
    }
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw ApiError.notFound('Order not found');
    if (req.user.role === 'customer' && order.userId !== req.user.userId) {
      throw ApiError.forbidden();
    }
    const updated = await orderService.cancelOrder(order, req.body.reason);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const updated = await orderService.updateStatus(req.params.id, req.body.status, req.body.note);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const result = await orderService.createPaymentIntent(req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
