const MenuItem = require('../models/MenuItem');
const { cacheGetOrSet, cacheInvalidate } = require('../config/redis');
const { ApiError } = require('@feastfleet/shared');

// GET /api/menu/items — Public, cached
exports.getMenuItems = async (req, res, next) => {
  try {
    const { category, dietary, search, page = 1, limit = 50 } = req.query;

    const cacheKey = `menu:items:${category || 'all'}:${dietary || ''}:${search || ''}:${page}:${limit}`;

    const result = await cacheGetOrSet(cacheKey, async () => {
      const filter = { isAvailable: true };
      if (category) filter.category = category;
      if (dietary === 'vegetarian') filter['dietary.isVegetarian'] = true;
      if (dietary === 'vegan') filter['dietary.isVegan'] = true;
      if (dietary === 'halal') filter['dietary.isHalal'] = true;
      if (dietary === 'gluten-free') filter['dietary.isGlutenFree'] = true;

      let query = MenuItem.find(filter);
      if (search) {
        query = MenuItem.find({ ...filter, $text: { $search: search } });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [items, total] = await Promise.all([
        query.populate('category', 'name slug').sort('sortOrder').skip(skip).limit(parseInt(limit)).lean(),
        MenuItem.countDocuments(filter),
      ]);

      return {
        items,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      };
    }, 120); // Cache for 2 minutes

    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/items/:id — Public, cached
exports.getMenuItem = async (req, res, next) => {
  try {
    const cacheKey = `menu:items:${req.params.id}`;
    const item = await cacheGetOrSet(cacheKey, async () => {
      const found = await MenuItem.findById(req.params.id).populate('category', 'name slug').lean();
      if (!found) throw ApiError.notFound('Menu item not found');
      return found;
    }, 300);

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// POST /api/menu/items — Admin only
exports.createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    await cacheInvalidate('menu:items:*');
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/menu/items/:id — Admin only
exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) throw ApiError.notFound('Menu item not found');
    await cacheInvalidate(`menu:items:${req.params.id}`, 'menu:items:*');
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/menu/items/:id — Admin only (soft delete)
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { isAvailable: false }, { new: true });
    if (!item) throw ApiError.notFound('Menu item not found');
    await cacheInvalidate(`menu:items:${req.params.id}`, 'menu:items:*');
    res.json({ success: true, data: { message: 'Item deactivated' } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/menu/items/:id/toggle — Admin: quick toggle availability
exports.toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) throw ApiError.notFound('Menu item not found');
    item.isAvailable = !item.isAvailable;
    await item.save();
    await cacheInvalidate(`menu:items:${req.params.id}`, 'menu:items:*');
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};
