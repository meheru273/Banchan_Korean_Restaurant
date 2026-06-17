require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const http = require('http');
const { createLogger } = require('@feastfleet/shared');
const { startOrderWorker, startDeliveryWorker } = require('./workers');

const logger = createLogger('notification-service');

const orderWorker = startOrderWorker();
const deliveryWorker = startDeliveryWorker();
logger.info('Notification service running — workers active');

// Minimal HTTP server so Render's health check passes on free web plan
const PORT = process.env.PORT || 3005;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'notification' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
server.listen(PORT, () => logger.info(`Health endpoint on :${PORT}`));

const shutdown = async () => {
  logger.info('Shutting down workers');
  await orderWorker.close();
  await deliveryWorker.close();
  server.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
