const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const paymentController = require('../controller/paymentController');

// Customer creates a payment intent for checkout
router.post('/create-intent', auth, requireRole('user'), paymentController.createPaymentIntent);

// Verify payment status (for UPI and NetBanking)
router.post('/verify', auth, requireRole('user'), paymentController.verifyPayment);

module.exports = router;


