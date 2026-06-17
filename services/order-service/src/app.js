const { createApp, errorHandler } = require('@feastfleet/shared');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = createApp('order-service');

// Webhook MUST come before the JSON-parsed order routes. createApp skips JSON
// parsing for any '/webhook' path so Stripe's raw body reaches express.raw().
app.use('/api/orders/webhook', webhookRoutes);
app.use('/api/orders', orderRoutes);

// Error handler must be the last middleware (after all routes).
app.use(errorHandler);

module.exports = app;
