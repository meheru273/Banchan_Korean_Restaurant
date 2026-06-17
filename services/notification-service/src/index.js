require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createLogger } = require('@feastfleet/shared');
const { startOrderWorker, startDeliveryWorker } = require('./workers');

const logger = createLogger('notification-service');

const orderWorker = startOrderWorker();
const deliveryWorker = startDeliveryWorker();
logger.info('Notification service running — workers active');

const shutdown = async () => {
  logger.info('Shutting down workers');
  await orderWorker.close();
  await deliveryWorker.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
