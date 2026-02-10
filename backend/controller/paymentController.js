const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET = process.env.CASHFREE_SECRET || '';
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
const CASHFREE_API_BASE =
  CASHFREE_ENV === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Payment intents will not work until it is configured.');
}
if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not set. Razorpay payments will not work until configured.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const razorpay = (razorpayKeyId && razorpayKeySecret) ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret }) : null;

// Create a PaymentIntent for different payment methods (Card, NetBanking, UPI)
exports.createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured on the server.' });
    }

    const { amount, currency = 'inr', paymentMethod = 'card' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Force INR for UPI as required by Stripe
    const effectiveCurrency = (paymentMethod === 'upi' ? 'inr' : currency || 'inr').toLowerCase();

    // Use automatic payment methods to avoid invalid type errors and let Stripe determine supported methods
    const createParams = {
      amount: Math.round(amount * 100), // convert to smallest currency unit
      currency: effectiveCurrency,
      automatic_payment_methods: { enabled: true },
    };

    const paymentIntent = await stripe.paymentIntents.create(createParams);

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentMethod: paymentMethod,
      amount: amount,
      currency: effectiveCurrency
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return res.status(500).json({ message: 'Failed to create payment intent: ' + err.message });
  }
};

// Verify payment status (for UPI and NetBanking which may require manual verification)
exports.verifyPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured on the server.' });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return res.json({
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method_types[0],
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
};

const CASHFREE_BASE = process.env.CASHFREE_ENV === 'PROD'
  ? 'https://api.cashfree.com/pg/orders'
  : 'https://sandbox.cashfree.com/pg/orders';

exports.createCashfreeOrder = async (req, res) => {
  try {
    const { amount, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const orderId = `pv_${Date.now()}`;

    const headers = {
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    };

    const payload = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: req.user?._id?.toString() || orderId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      // Restrict to UPI only for this order
      payment_methods: 'upi',
    };

    const cfRes = await axios.post(CASHFREE_BASE.replace('/pg/orders', '') + '/pg/orders', payload, { headers });

    const paymentSessionId = cfRes?.data?.payment_session_id;
    if (!paymentSessionId) {
      return res.status(502).json({ message: 'Cashfree did not return payment_session_id', data: cfRes?.data });
    }

    return res.json({
      ok: true,
      orderId,
      paymentSessionId,
      cashfree: cfRes.data,
    });
  } catch (err) {
    console.error('Cashfree order creation error:', err?.response?.data || err.message);
    return res.status(500).json({
      message: 'Failed to create Cashfree order',
      error: err?.response?.data || err.message,
    });
  }
};

exports.fetchCashfreeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const headers = {
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET,
      'x-api-version': '2023-08-01',
    };

    const url = `${CASHFREE_BASE}/${orderId}`;
    const cfRes = await axios.get(url, { headers });

    return res.json({ ok: true, order: cfRes.data });
  } catch (err) {
    console.error('Cashfree fetch order error:', err?.response?.data || err.message);
    return res.status(500).json({
      message: 'Failed to fetch Cashfree order',
      error: err?.response?.data || err.message,
    });
  }
};







