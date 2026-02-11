const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');

// ================= ENV =================
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET = process.env.CASHFREE_SECRET || '';
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();

const CASHFREE_BASE =
  CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg/orders'
    : 'https://sandbox.cashfree.com/pg/orders';

// ================= WARNINGS =================
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Payment intents will not work.');
}
if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('RAZORPAY_KEY_ID/SECRET not set.');
}
if (!CASHFREE_APP_ID || !CASHFREE_SECRET) {
  console.warn('CASHFREE_APP_ID/SECRET not set.');
}

// ================= CLIENTS =================
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const razorpay =
  razorpayKeyId && razorpayKeySecret
    ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
    : null;

// =====================================================
// STRIPE - CREATE PAYMENT INTENT (AUTO METHODS)
// =====================================================
exports.createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const { amount, currency = 'inr', paymentMethod = 'card' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // UPI must be INR
    const effectiveCurrency =
      paymentMethod === 'upi' ? 'inr' : currency.toLowerCase();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: effectiveCurrency,
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentMethod,
      amount,
      currency: effectiveCurrency,
    });
  } catch (err) {
    console.error('Stripe create error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to create payment intent: ' + err.message });
  }
};

// =====================================================
// STRIPE - VERIFY PAYMENT
// =====================================================
exports.verifyPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'paymentIntentId required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    return res.json({
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method_types[0],
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
};

// =====================================================
// CASHFREE - CREATE UPI ORDER
// =====================================================
exports.createCashfreeOrder = async (req, res) => {
  try {
    const { amount, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const orderId = `pv_${Date.now()}`;

    // ✅ Generate shipment & tracking
    const shipmentId = Date.now(); 
    const trackingNumber = shipmentId.toString();

    const headers = {
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET,
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
      paymentIntentId: orderId,
      shipmentId,        // ✅ added
      trackingNumber, 
      payment_methods: 'upi',
    };

    const cfRes = await axios.post(CASHFREE_BASE, payload, { headers });

    const paymentSessionId = cfRes?.data?.payment_session_id;

    if (!paymentSessionId) {
      return res.status(502).json({
        message: 'Cashfree did not return payment_session_id',
        data: cfRes?.data,
      });
    }

    return res.json({
      ok: true,
      orderId,
      shipmentId,        // ✅ added
      trackingNumber,    // ✅ added
      paymentSessionId,
      cashfree: cfRes.data,
    });

  } catch (err) {
    console.error('Cashfree create error:', err?.response?.data || err.message);
    return res.status(500).json({
      message: 'Failed to create Cashfree order',
      error: err?.response?.data || err.message,
    });
  }
};


// =====================================================
// CASHFREE - FETCH ORDER STATUS
// =====================================================
exports.fetchCashfreeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId required' });
    }

    const headers = {
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET,
      'x-api-version': '2023-08-01',
    };

    const url = `${CASHFREE_BASE}/${orderId}`;
    const cfRes = await axios.get(url, { headers });

    return res.json({ ok: true, order: cfRes.data });
  } catch (err) {
    console.error('Cashfree fetch error:', err?.response?.data || err.message);
    return res.status(500).json({
      message: 'Failed to fetch Cashfree order',
      error: err?.response?.data || err.message,
    });
  }
};
