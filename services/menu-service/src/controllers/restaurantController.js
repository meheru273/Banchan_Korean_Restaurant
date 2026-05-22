const Restaurant = require('../models/Restaurant');
const { cacheGetOrSet, cacheInvalidate } = require('../config/redis');
const { ApiError } = require('@feastfleet/shared');

exports.getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await cacheGetOrSet('menu:restaurants:all', async () => {
      return Restaurant.find({ isActive: true }).lean();
    }, 600);

    res.json({ success: true, data: restaurants });
  } catch (err) {
    next(err);
  }
};

exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await cacheGetOrSet(`menu:restaurants:${req.params.id}`, async () => {
      const found = await Restaurant.findById(req.params.id).lean();
      if (!found) throw ApiError.notFound('Restaurant not found');
      return found;
    }, 600);

    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    await cacheInvalidate('menu:restaurants:*');
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!restaurant) throw ApiError.notFound('Restaurant not found');
    await cacheInvalidate(`menu:restaurants:${req.params.id}`, 'menu:restaurants:*');
    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
};
