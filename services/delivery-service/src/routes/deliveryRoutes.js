const router = require('express').Router();
const ctrl = require('../controllers/deliveryController');
const { authenticate, authorize } = require('@feastfleet/shared');

router.use(authenticate);

// Customer: track their delivery
router.get('/order/:orderId', ctrl.getByOrderId);

// Driver
router.get('/my', authorize('driver'), ctrl.listMine);
router.patch('/:id/status', authorize('driver', 'admin'), ctrl.updateStatus);

// Admin
router.get('/pending', authorize('admin'), ctrl.listPending);
router.post('/:id/assign', authorize('admin'), ctrl.assignDriver);

module.exports = router;
