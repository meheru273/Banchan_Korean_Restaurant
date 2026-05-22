const Category = require('../models/Category');
const { cacheGetOrSet, cacheInvalidate } = require('../config/redis');
const { ApiError } = require('@feastfleet/shared');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await cacheGetOrSet('menu:categories:all', async () => {
      return Category.find({ isActive: true }).sort('sortOrder').lean();
    }, 600); // Cache 10 minutes — categories change rarely

    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    await cacheInvalidate('menu:categories:*');
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) throw ApiError.notFound('Category not found');
    await cacheInvalidate('menu:categories:*', 'menu:items:*');
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};
