const router = require('express').Router();
const cartCtrl = require('../controllers/cartController');
const orderCtrl = require('../controllers/orderController');
const {
  validateAddToCart, validateUpdateCartItem, validatePlaceOrder,
} = require('../validators/orderValidator');
const { authenticate, authorize } = require('@feastfleet/shared');

router.use(authenticate);

// Cart
router.get('/cart', cartCtrl.getCart);
router.post('/cart/items', validateAddToCart, cartCtrl.addToCart);
router.patch('/cart/items/:menuItemId', validateUpdateCartItem, cartCtrl.updateCartItem);
router.delete('/cart/items/:menuItemId', cartCtrl.removeFromCart);
router.delete('/cart', cartCtrl.clearCart);

// Orders
router.post('/', validatePlaceOrder, orderCtrl.placeOrder);
router.get('/', orderCtrl.listOrders);
router.get('/:id', orderCtrl.getOrder);
router.post('/:id/cancel', orderCtrl.cancelOrder);
router.post('/:id/pay', orderCtrl.createPaymentIntent);

// Admin
router.patch('/:id/status', authorize('admin'), orderCtrl.updateStatus);

module.exports = router;
