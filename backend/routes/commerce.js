const express = require('express');
const router = express.Router();
const order = require('../controller/orderController');
const coupon = require('../controller/couponController');
const { auth, optionalAuth, requireRole } = require('../middleware/auth');

// Orders
router.get('/orders', auth, requireRole('admin'), order.list); // admin list
router.get('/orders/:id', optionalAuth, order.get); // customer/admin view (optional auth)
router.post('/orders', optionalAuth, order.create); // customer create (guest supported)
router.put('/orders/:id/status', auth, requireRole('admin'), order.updateStatus);
router.get("/orders/:userId", auth, requireRole('admin','user'), order.getOrdersByUser);
router.post('/orders/track', order.trackOrder); // Public endpoint to track order


// Coupons
router.get('/coupons', coupon.list);
router.get('/coupons/active', coupon.listActive);
router.post('/coupons/validate', coupon.validate); // Public endpoint to validate coupon
router.post('/coupons', auth, requireRole('admin','user'), coupon.create);
router.get('/coupons/:id', coupon.get);
router.put('/coupons/:id', auth, requireRole('admin','user'), coupon.update);
router.delete('/coupons/:id', auth, requireRole('admin','user'), coupon.remove);

module.exports = router;