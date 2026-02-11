const express = require('express');
const router = express.Router();
const { auth, requireRole,optionalAuth } = require('../middleware/auth');
const paymentController = require('../controller/paymentController');

// Customer creates a payment intent for checkout
router.post('/create-intent', auth, requireRole('user'), paymentController.createPaymentIntent);

// Verify payment status (for UPI and NetBanking)
router.post('/verify', auth, requireRole('user'), paymentController.verifyPayment);

// optionalAuth use kariye jethi guest/logged-in banne initiate kari sake
router.post('/cashfree/order', optionalAuth, paymentController.createCashfreeOrder);
router.get('/cashfree/order/:orderId', optionalAuth, paymentController.fetchCashfreeOrder);

module.exports = router;


