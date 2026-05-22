const router = require('express').Router();
const menuCtrl = require('../controllers/menuController');
const categoryCtrl = require('../controllers/categoryController');
const restaurantCtrl = require('../controllers/restaurantController');
const { authenticate, authorize } = require('@feastfleet/shared');

// ── Public routes (no auth needed) ──
router.get('/items', menuCtrl.getMenuItems);
router.get('/items/:id', menuCtrl.getMenuItem);
router.get('/categories', categoryCtrl.getCategories);
router.get('/restaurants', restaurantCtrl.getRestaurants);
router.get('/restaurants/:id', restaurantCtrl.getRestaurant);

// ── Admin routes ──
router.use(authenticate);
router.use(authorize('admin'));

// Menu items
router.post('/items', menuCtrl.createMenuItem);
router.patch('/items/:id', menuCtrl.updateMenuItem);
router.delete('/items/:id', menuCtrl.deleteMenuItem);
router.patch('/items/:id/toggle', menuCtrl.toggleAvailability);

// Categories
router.post('/categories', categoryCtrl.createCategory);
router.patch('/categories/:id', categoryCtrl.updateCategory);

// Restaurants
router.post('/restaurants', restaurantCtrl.createRestaurant);
router.patch('/restaurants/:id', restaurantCtrl.updateRestaurant);

module.exports = router;
