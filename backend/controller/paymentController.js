const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

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

// Razorpay: Create order for UPI payments
exports.createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server.' });
    }

    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        purpose: 'Checkout UPI payment'
      }
    };

    const order = await razorpay.orders.create(options);
    return res.json({ orderId: order.id, keyId: razorpayKeyId, amount: amount, currency: 'INR' });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({ message: 'Failed to create Razorpay order: ' + err.message });
  }
};

// Razorpay: Verify payment signature after client checkout
exports.verifyRazorpaySignature = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'orderId, paymentId and signature are required' });
    }

    const hmac = crypto.createHmac('sha256', razorpayKeySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    const verified = expectedSignature === signature;
    return res.json({ verified });
  } catch (err) {
    console.error('Error verifying Razorpay signature:', err);
    return res.status(500).json({ message: 'Failed to verify Razorpay signature' });
  }
};


// Razorpay: Validate VPA for UPI Collect flow
exports.validateVpa = async (req, res) => {
  try {
    if (!razorpay) {
      console.error('validateVpa: Razorpay not configured');
      return res.status(500).json({ message: 'Razorpay is not configured on the server.' });
    }
    const { vpa } = req.body;
    console.log('validateVpa: incoming VPA:', vpa);
    if (!vpa) {
      return res.status(400).json({ message: 'VPA is required' });
    }

    // Use Razorpay REST API to validate VPA
    const rpRes = await axios.post(
      'http://localhost:5000/api/payment/razorpay/validate-vpa',
      { vpa },
      {
        auth: { username: razorpayKeyId, password: razorpayKeySecret },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    console.log('validateVpa: response data:', rpRes.data);
// -    return res.json(rpRes.data);
// +    return res.json({ success: true, message: 'VPA validated', data: rpRes.data });
  } catch (err) {
    console.error('Error validating VPA:', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.error?.description || err?.response?.data?.message || err.message || 'Failed to validate VPA';
    return res.status(status).json({ message });
  }
};

// Razorpay: Create UPI Collect payment S2S (no modal)
exports.createUpiCollectPayment = async (req, res) => {
  try {
    if (!razorpay) {
      console.error('createUpiCollectPayment: Razorpay not configured');
      return res.status(500).json({ message: 'Razorpay is not configured on the server.' });
    }
    const { orderId, amount, vpa, email, contact, expiryMinutes = 5, description, notes } = req.body;
    console.log('createUpiCollectPayment: incoming payload', { orderId, amount, vpa, email, contact, expiryMinutes, description, notes });
    if (!orderId || !amount || amount <= 0 || !vpa) {
      return res.status(400).json({ message: 'orderId, amount and vpa are required' });
    }
    const paise = Math.round(Number(amount) * 100);
    const payload = {
      amount: paise,
      currency: 'INR',
      order_id: orderId,
      email,
      contact,
      method: 'upi',
      description: description || 'UPI Collect Payment',
      notes: notes || { purpose: 'UPI collect' },
      upi: {
        flow: 'collect',
        vpa,
        expiry_time: expiryMinutes,
      },
    };
    console.log('createUpiCollectPayment: request payload to Razorpay', payload);

    // Attempt via SDK; if not available, fallback to REST
    let created;
    if (razorpay.payments && typeof razorpay.payments.createUpi === 'function') {
      created = await razorpay.payments.createUpi(payload);
    } else {
      const rpRes = await axios.post(
        'https://api.razorpay.com/v1/payments/create',
        payload,
        {
          auth: { username: razorpayKeyId, password: razorpayKeySecret },
          headers: { 'Content-Type': 'application/json' },
        }
      );
      created = rpRes.data;
    }
    console.log('createUpiCollectPayment: created response', created);
    return res.json({
      message: 'UPI collect initiated. Please approve the request in your UPI app.',
      paymentId: created?.razorpay_payment_id || created?.id,
      status: created?.status || 'created',
      orderId,
      amount,
      raw: created,
    });
  } catch (err) {
    console.error('Error creating UPI collect payment:', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.error?.description || err?.response?.data?.message || err.message || 'Failed to create UPI collect payment';
    return res.status(status).json({ message });
  }
};

// Razorpay: Fetch payments for an order (polling)
exports.getRazorpayOrderPayments = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server.' });
    }
    const { orderId } = req.params;
    console.log('getRazorpayOrderPayments: fetching payments for orderId', orderId);
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }
    const payments = await razorpay.orders.fetchPayments(orderId);
    console.log('getRazorpayOrderPayments: payments response statuses:', (payments.items || []).map(p => ({ id: p.id, status: p.status })));
    return res.json(payments);
  } catch (err) {
    console.error('Error fetching Razorpay order payments:', err);
    return res.status(500).json({ message: 'Failed to fetch Razorpay order payments: ' + err.message });
  }
};


