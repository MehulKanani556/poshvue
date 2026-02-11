const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Payment intents will not work until it is configured.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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

    // Configure payment methods based on selection
    let paymentMethodOptions = {};
    
    if (paymentMethod === 'upi') {
      // UPI payment (India only)
      paymentMethodOptions = {
        upi: {
          enabled: true,
        },
      };
    } else if (paymentMethod === 'netbanking') {
      // NetBanking (India)
      paymentMethodOptions = {
        netbanking: {
          enabled: true,
        },
      };
    } else {
      // Card payment (default) - supports international cards
      paymentMethodOptions = {
        card: {
          enabled: true,
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to smallest currency unit
      currency: currency.toLowerCase(),
      payment_method_types: paymentMethod === 'upi' ? ['upi'] : 
                           paymentMethod === 'netbanking' ? ['netbanking'] : 
                           ['card'],
      ...(paymentMethod === 'upi' || paymentMethod === 'netbanking' ? {
        payment_method_options: paymentMethodOptions,
      } : {}),
    });

    return res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentMethod: paymentMethod,
      amount: amount,
      currency: currency
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


