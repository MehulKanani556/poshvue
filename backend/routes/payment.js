const express = require('express');
const router = express.Router();
const { auth, optionalAuth, requireRole } = require('../middleware/auth');
const paymentController = require('../controller/paymentController');

// Customer creates a payment intent for checkout (Stripe)
router.post('/create-intent', optionalAuth, paymentController.createPaymentIntent);

// Verify payment status (Stripe)
router.post('/verify', optionalAuth, paymentController.verifyPayment);

// Razorpay: Create order
router.post('/razorpay/order', optionalAuth, paymentController.createRazorpayOrder);

// Razorpay: Verify signature
router.post('/razorpay/verify', optionalAuth, paymentController.verifyRazorpaySignature);

// Razorpay: Validate VPA (UPI Collect)
router.post('/razorpay/validate-vpa', optionalAuth, paymentController.validateVpa);

// Razorpay: Create UPI Collect payment (S2S, no checkout modal)
router.post('/razorpay/collect', optionalAuth, paymentController.createUpiCollectPayment);

// Razorpay: Fetch payments for an order (polling support)
router.get('/razorpay/order/:orderId/payments', optionalAuth, paymentController.getRazorpayOrderPayments);

module.exports = router;


