const express = require('express');
const router = express.Router();
const order = require('../controller/orderController');
const coupon = require('../controller/couponController');
const { auth, optionalAuth, requireRole } = require('../middleware/auth');
const shiprocketRoutes = require('./shiprocket');

// Orders
router.get('/orders', auth, requireRole('admin'), order.list); // admin list
router.get('/orders/:id', optionalAuth, order.get); // customer/admin view (optional auth)
router.post('/orders', optionalAuth, order.create); // customer create (guest supported)
router.put('/orders/:id/status', auth, requireRole('admin'), order.updateStatus);
router.get("/orders/:userId", auth, requireRole('admin','user'), order.getOrdersByUser);
router.post('/orders/track', order.trackOrder); // Public endpoint to track order
router.post('/calculate-shipping', auth, order.calculateShipping); // Calculate shipping charges

// Backward-compatible alias for frontend calls:
// Frontend uses /commerce/shiprocket/track/:awb
router.use('/shiprocket', shiprocketRoutes);

// Coupons
router.get('/coupons', coupon.list);
router.get('/coupons/active', coupon.listActive);
router.post('/coupons/validate', optionalAuth, coupon.validate); // Public endpoint, but uses user if logged in
router.post('/coupons', auth, requireRole('admin','user'), coupon.create);
router.get('/coupons/:id', coupon.get);
router.put('/coupons/:id', auth, requireRole('admin','user'), coupon.update);
router.delete('/coupons/:id', auth, requireRole('admin','user'), coupon.remove);

module.exports = router;