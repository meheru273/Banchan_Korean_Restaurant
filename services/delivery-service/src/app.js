const { createApp, errorHandler } = require('@feastfleet/shared');
const deliveryRoutes = require('./routes/deliveryRoutes');

const app = createApp('delivery-service');
app.use('/api/deliveries', deliveryRoutes);

// Error handler must be the last middleware (after all routes).
app.use(errorHandler);

module.exports = app;
