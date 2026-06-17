require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createLogger } = require('@feastfleet/shared');
const connectDB = require('./config/db');
const app = require('./app');

const logger = createLogger('auth-service');
const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB(logger);
  app.listen(PORT, () => {
    logger.info(`Auth service running on port ${PORT}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start auth service', { error: err.message });
  process.exit(1);
});
