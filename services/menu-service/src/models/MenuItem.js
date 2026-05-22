const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: { type: String, required: true },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    image: { type: String, default: null },
    // Restaurant-specific availability
    availableAt: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    // Dietary & allergy info (important for UK food regulations)
    dietary: {
      isVegetarian: { type: Boolean, default: false },
      isVegan: { type: Boolean, default: false },
      isGlutenFree: { type: Boolean, default: false },
      isHalal: { type: Boolean, default: false },
    },
    allergens: [
      {
        type: String,
        enum: [
          'celery', 'gluten', 'crustaceans', 'eggs', 'fish', 'lupin',
          'milk', 'molluscs', 'mustard', 'nuts', 'peanuts', 'sesame',
          'soybeans', 'sulphites',
        ],
      },
    ],
    // Nutritional info (optional)
    calories: { type: Number, default: null },
    preparationTime: { type: Number, default: 15 }, // minutes
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound indexes for common queries
menuItemSchema.index({ category: 1, isAvailable: 1, sortOrder: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
