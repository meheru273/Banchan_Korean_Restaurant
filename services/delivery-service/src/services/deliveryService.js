const Delivery = require('../models/Delivery');
const {
  ApiError, createQueue,
  QUEUE_NAMES, DELIVERY_STATUS, EVENT_TYPES,
} = require('@feastfleet/shared');

const deliveryQueue = createQueue(QUEUE_NAMES.DELIVERY_EVENTS);

exports.createFromOrder = async (orderData) => {
  // Idempotent — if the same event fires twice, don't create two deliveries
  const existing = await Delivery.findOne({ orderId: orderData.orderId });
  if (existing) return existing;

  return Delivery.create({
    orderId:       orderData.orderId,
    orderNumber:   orderData.orderNumber,
    restaurantId:  orderData.restaurantId,
    customerId:    orderData.userId,
    customerName:  orderData.userName,
    customerEmail: orderData.userEmail,
    deliveryAddress: orderData.deliveryAddress,
    status: DELIVERY_STATUS.PENDING,
    statusHistory: [{ status: DELIVERY_STATUS.PENDING, note: 'Awaiting driver' }],
  });
};

exports.assignDriver = async (deliveryId, { driverId, driverName, driverPhone }) => {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw ApiError.notFound('Delivery not found');
  if (delivery.status !== DELIVERY_STATUS.PENDING) {
    throw ApiError.badRequest('Delivery already assigned');
  }

  delivery.driverId = driverId;
  delivery.driverName = driverName;
  delivery.driverPhone = driverPhone;
  delivery.status = DELIVERY_STATUS.ASSIGNED;
  delivery.assignedAt = new Date();
  delivery.statusHistory.push({ status: DELIVERY_STATUS.ASSIGNED, note: `Assigned to ${driverName}` });
  await delivery.save();

  await deliveryQueue.add(EVENT_TYPES.DELIVERY_ASSIGNED, {
    deliveryId: delivery._id.toString(),
    orderId: delivery.orderId,
    orderNumber: delivery.orderNumber,
    driverName, driverPhone,
    customerId: delivery.customerId,
    customerEmail: delivery.customerEmail,
  });

  return delivery;
};

exports.updateStatus = async (deliveryId, status, note) => {
  if (!Object.values(DELIVERY_STATUS).includes(status)) {
    throw ApiError.badRequest(`Invalid status: ${status}`);
  }

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw ApiError.notFound('Delivery not found');

  delivery.status = status;
  delivery.statusHistory.push({ status, note });
  if (status === DELIVERY_STATUS.PICKED_UP) delivery.pickedUpAt = new Date();
  if (status === DELIVERY_STATUS.DELIVERED) delivery.deliveredAt = new Date();
  await delivery.save();

  const eventMap = {
    [DELIVERY_STATUS.PICKED_UP]: EVENT_TYPES.DELIVERY_PICKED_UP,
    [DELIVERY_STATUS.EN_ROUTE]:  EVENT_TYPES.DELIVERY_EN_ROUTE,
    [DELIVERY_STATUS.DELIVERED]: EVENT_TYPES.DELIVERY_COMPLETED,
    [DELIVERY_STATUS.FAILED]:    EVENT_TYPES.DELIVERY_FAILED,
  };
  if (eventMap[status]) {
    await deliveryQueue.add(eventMap[status], {
      deliveryId: delivery._id.toString(),
      orderId: delivery.orderId,
      orderNumber: delivery.orderNumber,
      status,
      customerId: delivery.customerId,
      customerEmail: delivery.customerEmail,
      driverName: delivery.driverName,
    });
  }

  return delivery;
};
