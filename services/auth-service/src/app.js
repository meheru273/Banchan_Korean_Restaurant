const cookieParser = require('cookie-parser');
const { createApp, errorHandler } = require('@feastfleet/shared');
const authRoutes = require('./routes/authRoutes');

const app = createApp('auth-service');
app.use(cookieParser());
app.use('/api/auth', authRoutes);

// Error handler must be the last middleware (after all routes).
app.use(errorHandler);

module.exports = app;
