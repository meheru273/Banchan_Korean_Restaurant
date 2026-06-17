const { createWorker, QUEUE_NAMES, EVENT_TYPES } = require('@feastfleet/shared');
const deliveryService = require('../services/deliveryService');

module.exports = function startOrderWorker(logger) {
  const worker = createWorker(QUEUE_NAMES.ORDER_EVENTS, async (job) => {
    if (job.name !== EVENT_TYPES.ORDER_CONFIRMED) return;     // ignore others

    const delivery = await deliveryService.createFromOrder(job.data);
    logger.info(`Delivery created for order ${job.data.orderNumber}`, { deliveryId: delivery._id });
  });

  logger.info('Delivery order-events worker started');
  return worker;
};
