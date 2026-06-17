const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },           // snapshot for UI
  price: { type: Number, required: true },          // snapshot for UI
  quantity: { type: Number, required: true, min: 1, max: 20 },
  specialInstructions: { type: String, maxlength: 200, default: '' },
}, { _id: false });

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, default: null },
    items: [cartItemSchema],
    subtotal: { type: Number, default: 0 },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.pre('save', function (next) {
  this.subtotal = Math.round(
    this.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
  ) / 100;
  this.itemCount = this.items.reduce((sum, i) => sum + i.quantity, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
