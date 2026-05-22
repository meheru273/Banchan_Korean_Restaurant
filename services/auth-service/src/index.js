require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const cookieParser = require('cookie-parser');
const { createApp, createLogger } = require('@feastfleet/shared');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const logger = createLogger('auth-service');
const app = createApp('auth-service');

// Cookie parser (for refresh tokens)
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Start
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
