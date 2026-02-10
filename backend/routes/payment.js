// ... existing code ...
const express = require('express');
const router = express.Router();
// FIX: destructure sachi rite import karo
const { auth, optionalAuth } = require('../middleware/auth');
const paymentController = require('../controller/paymentController');

// Customer creates a payment intent for checkout (Stripe)
router.post('/create-intent', optionalAuth, paymentController.createPaymentIntent);

// Verify payment status (Stripe)
router.post('/verify', optionalAuth, paymentController.verifyPayment);

// Cashfree UPI endpoints
// optionalAuth use kariye jethi guest/logged-in banne initiate kari sake
router.post('/cashfree/order', optionalAuth, paymentController.createCashfreeOrder);
router.get('/cashfree/order/:orderId', optionalAuth, paymentController.fetchCashfreeOrder);

module.exports = router;
// ... existing code ...