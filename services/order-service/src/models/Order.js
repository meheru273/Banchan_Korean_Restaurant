const mongoose = require('mongoose');
const { ORDER_STATUS } = require('@feastfleet/shared');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },     // verified price from menu service
  quantity: { type: Number, required: true },
  specialInstructions: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // FF-20240115-001
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    restaurantId: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 2.99 },
    total: { type: Number, required: true },
    deliveryAddress: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, default: 'London' },
      postcode: { type: String, required: true },
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    statusHistory: [{
      status: String,
      at: { type: Date, default: Date.now },
      note: String,
    }],
    // Filled in by phase 4b (Stripe). For now both stay at defaults.
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: { type: String, default: null },
    customerNotes: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// Auto-generate human-readable order number: FF-YYYYMMDD-001
orderSchema.pre('save', async function (next) {
  if (this.orderNumber) return next();
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const count = await this.constructor.countDocuments({ createdAt: { $gte: startOfDay } });
  this.orderNumber = `FF-${datePart}-${String(count + 1).padStart(3, '0')}`;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
