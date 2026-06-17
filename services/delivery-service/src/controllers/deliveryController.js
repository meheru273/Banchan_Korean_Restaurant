const Delivery = require('../models/Delivery');
const deliveryService = require('../services/deliveryService');
const { ApiError, DELIVERY_STATUS } = require('@feastfleet/shared');

exports.listPending = async (_req, res, next) => {
  try {
    const deliveries = await Delivery.find({ status: DELIVERY_STATUS.PENDING }).sort('createdAt').lean();
    res.json({ success: true, data: deliveries });
  } catch (err) { next(err); }
};

exports.assignDriver = async (req, res, next) => {
  try {
    const { driverId, driverName, driverPhone } = req.body;
    if (!driverId || !driverName) throw ApiError.badRequest('driverId and driverName are required');
    const delivery = await deliveryService.assignDriver(req.params.id, { driverId, driverName, driverPhone });
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateStatus(req.params.id, req.body.status, req.body.note);
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
};

exports.listMine = async (req, res, next) => {
  try {
    const filter = { driverId: req.user.userId };
    if (req.query.status) filter.status = req.query.status;
    const deliveries = await Delivery.find(filter).sort('-createdAt').lean();
    res.json({ success: true, data: deliveries });
  } catch (err) { next(err); }
};

exports.getByOrderId = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId }).lean();
    if (!delivery) throw ApiError.notFound('Delivery not found');
    if (req.user.role === 'customer' && delivery.customerId !== req.user.userId) {
      throw ApiError.forbidden();
    }
    res.json({ success: true, data: delivery });
  } catch (err) { next(err); }
};
