require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createLogger } = require('@feastfleet/shared');
const connectDB = require('./config/db');
const app = require('./app');
const startOrderWorker = require('./workers/orderWorker');

const logger = createLogger('delivery-service');
const PORT = process.env.PORT || 3004;

(async () => {
  try {
    await connectDB(logger);
    app.listen(PORT, () => logger.info(`Delivery service running on port ${PORT}`));
    startOrderWorker(logger);
  } catch (err) {
    logger.error('Failed to start delivery service', { error: err.message });
    process.exit(1);
  }
})();
