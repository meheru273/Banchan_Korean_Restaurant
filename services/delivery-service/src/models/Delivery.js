const mongoose = require('mongoose');
const { DELIVERY_STATUS } = require('@feastfleet/shared');

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String, required: true },
    restaurantId: { type: String, required: true },

    customerId:    { type: String, required: true },
    customerName:  { type: String, required: true },
    customerEmail: { type: String },

    deliveryAddress: {
      line1:    { type: String, required: true },
      line2:    String,
      city:     { type: String, default: 'London' },
      postcode: { type: String, required: true },
    },

    driverId:    { type: String, default: null, index: true },
    driverName:  { type: String, default: null },
    driverPhone: { type: String, default: null },

    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.PENDING,
      index: true,
    },
    statusHistory: [{
      status: String,
      at: { type: Date, default: Date.now },
      note: String,
    }],

    assignedAt:  Date,
    pickedUpAt:  Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
