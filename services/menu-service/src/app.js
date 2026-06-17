const { createApp, errorHandler } = require('@feastfleet/shared');
const menuRoutes = require('./routes/menuRoutes');

const app = createApp('menu-service');
app.use('/api/menu', menuRoutes);

// Error handler must be the last middleware (after all routes).
app.use(errorHandler);

module.exports = app;
