require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createLogger } = require('@feastfleet/shared');
const connectDB = require('./config/db');
const app = require('./app');

const logger = createLogger('order-service');
const PORT = process.env.PORT || 3003;

(async () => {
  try {
    await connectDB(logger);
    app.listen(PORT, () => logger.info(`Order service running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start order service', { error: err.message });
    process.exit(1);
  }
})();
