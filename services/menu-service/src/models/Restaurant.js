const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, default: 'London' },
      postcode: { type: String, required: true },
    },
    phone: { type: String, required: true },
    email: { type: String },
    // Operating hours (24h format)
    openingHours: {
      monday:    { open: { type: String, default: '11:00' }, close: { type: String, default: '22:00' } },
      tuesday:   { open: { type: String, default: '11:00' }, close: { type: String, default: '22:00' } },
      wednesday: { open: { type: String, default: '11:00' }, close: { type: String, default: '22:00' } },
      thursday:  { open: { type: String, default: '11:00' }, close: { type: String, default: '22:00' } },
      friday:    { open: { type: String, default: '11:00' }, close: { type: String, default: '23:00' } },
      saturday:  { open: { type: String, default: '11:00' }, close: { type: String, default: '23:00' } },
      sunday:    { open: { type: String, default: '12:00' }, close: { type: String, default: '21:00' } },
    },
    deliveryRadius: { type: Number, default: 5 }, // km
    minimumOrder: { type: Number, default: 10 },   // GBP
    deliveryFee: { type: Number, default: 2.99 },   // GBP
    isActive: { type: Boolean, default: true },
    // Coordinates for distance calculations
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },
  { timestamps: true }
);

restaurantSchema.index({ location: '2dsphere' });

restaurantSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
