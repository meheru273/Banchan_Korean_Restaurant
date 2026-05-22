require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createApp, createLogger } = require('@feastfleet/shared');
const connectDB = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');

const logger = createLogger('menu-service');
const app = createApp('menu-service');

app.use('/api/menu', menuRoutes);

const PORT = process.env.PORT || 3002;

const start = async () => {
  await connectDB(logger);
  app.listen(PORT, () => {
    logger.info(`Menu service running on port ${PORT}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start menu service', { error: err.message });
  process.exit(1);
});
