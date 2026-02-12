const express = require('express');
const router = express.Router();
const country = require('../controller/countryController');
const { auth, requireRole } = require('../middleware/auth');

// Public endpoints
router.get('/active', country.getActive);
router.get('/default', country.getDefault);
router.post('/set-default', country.setDefault); // Public endpoint for user to set default country

// Live exchange rate endpoints (for frontend checkout)
router.get('/checkout-rate/:countryCode', country.getCheckoutExchangeRate); // Get live rate for checkout
router.get('/exchange-rate/:countryCode', country.getLiveExchangeRate); // Get live exchange rate

// Admin endpoints for updating rates
router.post('/update-exchange-rates', auth, requireRole('admin'), country.updateExchangeRates);

router.get('/:id', country.get);

// Admin-only endpoints
router.get('/', auth, requireRole('admin'), country.list);
router.post('/', auth, requireRole('admin'), country.create);
router.put('/:id', auth, requireRole('admin'), country.update);
router.delete('/:id', auth, requireRole('admin'), country.remove);

module.exports = router;
