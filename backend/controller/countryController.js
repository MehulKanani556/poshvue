const { Country } = require('../model');



exports.list = async (req, res) => {

  try {

    const { page = 1, limit = 50, q, active } = req.query;

    const query = {};

    if (q) {

      query.$or = [

        { name: { $regex: q, $options: 'i' } },

        { code: { $regex: q, $options: 'i' } },

      ];

    }

    if (active !== undefined) query.active = active === 'true';



    const [items, total] = await Promise.all([

      Country.find(query)

        .sort({ isDefault: -1, name: 1 })

        .skip((page - 1) * limit)

        .limit(Number(limit)),

      Country.countDocuments(query),

    ]);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });

  } catch (err) {

    return res.status(500).json({ message: 'Server error', error: err.message });

  }

};



exports.get = async (req, res) => {

  try {

    const item = await Country.findById(req.params.id);

    if (!item) return res.status(404).json({ message: 'Not found' });

    return res.json({ item });

  } catch (err) {

    return res.status(500).json({ message: 'Server error' });

  }

};



exports.getActive = async (req, res) => {

  try {

    const items = await Country.find({ active: true }).sort({ isDefault: -1, name: 1 });

    return res.json({ items });

  } catch (err) {

    return res.status(500).json({ message: 'Server error' });

  }

};



exports.getDefault = async (req, res) => {

  try {

    let item = await Country.findOne({ isDefault: true, active: true });

    if (!item) {

      // Fallback to first active country

      item = await Country.findOne({ active: true });

    }

    if (!item) return res.status(404).json({ message: 'No country found' });

    return res.json({ item });

  } catch (err) {

    return res.status(500).json({ message: 'Server error' });

  }

};



exports.create = async (req, res) => {

  try {

    const { name, code, currency, currencySymbol, flagUrl, exchangeRate = 1, active = true, isDefault = false } = req.body;



    if (!name || !code || !currency || !currencySymbol || !flagUrl) {

      return res.status(400).json({ message: 'Missing required fields' });

    }



    // If setting as default, unset other defaults

    if (isDefault) {

      await Country.updateMany({}, { $set: { isDefault: false } });

    }



    const item = await Country.create({

      name,

      code: code.toUpperCase(),

      currency: currency.toUpperCase(),

      currencySymbol,

      flagUrl,

      exchangeRate: Number(exchangeRate),

      active,

      isDefault,

    });

    return res.status(201).json({ 
      item,
      message: 'Country created successfully'
    });

  } catch (err) {

    if (err.code === 11000) {

      return res.status(400).json({ message: 'Country name or code already exists' });

    }

    return res.status(400).json({ message: 'Invalid data', error: err.message });

  }

};



exports.update = async (req, res) => {

  try {

    const { name, code, currency, currencySymbol, flagUrl, exchangeRate, active, isDefault } = req.body;

    const updateData = {};



    if (name) updateData.name = name;

    if (code) updateData.code = code.toUpperCase();

    if (currency) updateData.currency = currency.toUpperCase();

    if (currencySymbol) updateData.currencySymbol = currencySymbol;

    if (flagUrl) updateData.flagUrl = flagUrl;

    if (exchangeRate !== undefined) updateData.exchangeRate = Number(exchangeRate);

    if (active !== undefined) updateData.active = active;

    // IMPORTANT: Only admin can set default country (protected by requireRole('admin') middleware)

    // User country selection in frontend does NOT call this endpoint

    if (isDefault !== undefined) {

      updateData.isDefault = isDefault;

      // If setting as default, unset other defaults - ensures only one default country

      if (isDefault) {

        await Country.updateMany({ _id: { $ne: req.params.id } }, { $set: { isDefault: false } });

      }

    }



    const item = await Country.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    if (!item) return res.status(404).json({ message: 'Not found' });

    return res.json({ 
      item,
      message: 'Country updated successfully'
    });

  } catch (err) {

    if (err.code === 11000) {

      return res.status(400).json({ message: 'Country name or code already exists' });

    }

    return res.status(400).json({ message: 'Invalid data', error: err.message });

  }

};



exports.remove = async (req, res) => {
  try {
    const item = await Country.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Country deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};



// Public endpoint: Detect country by user's IP location

exports.detectByLocation = async (req, res) => {

  try {

    let countryCode = null;



    try {

      const response = await fetch('https://ipapi.co/json/');

      const data = await response.json();

      countryCode = data.country_code || data.country;

    } catch (error) {

      console.error('Primary location service failed:', error);



      try {

        const fallbackResponse = await fetch('https://ipinfo.io/json');

        const fallbackData = await fallbackResponse.json();

        countryCode = fallbackData.country;

      } catch (fallbackError) {

        console.error('Fallback location service failed:', fallbackError);

      }

    }



    if (!countryCode) {

      return res.status(404).json({ message: 'Unable to detect country' });

    }



    // Find matching country in database

    const country = await Country.findOne({

      code: countryCode.toUpperCase(),

      active: true

    });



    if (!country) {

      return res.status(404).json({

        message: 'Detected country not available',

        detectedCountry: countryCode

      });

    }



    return res.json({

      item: country,

      detectedCountry: countryCode

    });

  } catch (err) {

    console.error('Error detecting country:', err);

    return res.status(500).json({ message: 'Server error', error: err.message });

  }

};



// Public endpoint: Set country as default (for user selection)

exports.setDefault = async (req, res) => {

  console.log("🔵 setDefault endpoint called");

  console.log("📥 Request body:", req.body);

  console.log("📥 Request headers:", req.headers);



  try {

    const { countryId } = req.body;



    console.log("📋 Received countryId:", countryId);



    if (!countryId) {

      console.error("❌ Country ID missing in request");

      return res.status(400).json({ message: 'Country ID is required' });

    }



    // Check if country exists and is active

    console.log("🔍 Finding country with ID:", countryId);

    const country = await Country.findById(countryId);



    if (!country) {

      console.error("❌ Country not found with ID:", countryId);

      return res.status(404).json({ message: 'Country not found' });

    }



    console.log("✅ Country found:", country.name, "Active:", country.active, "Current isDefault:", country.isDefault);



    if (country.active === false) {

      console.error("❌ Country is inactive:", country.name);

      return res.status(400).json({ message: 'Cannot set inactive country as default' });

    }



    // Step 1: Unset all other countries' isDefault to false

    console.log("🔄 Unsetting all other countries' isDefault to false");

    const unsetResult = await Country.updateMany(

      { _id: { $ne: countryId } },

      { $set: { isDefault: false } }

    );

    console.log("✅ Unset result:", unsetResult.modifiedCount, "countries updated");



    // Step 2: Set selected country's isDefault to true

    console.log("🔄 Setting selected country's isDefault to true");

    const updatedCountry = await Country.findByIdAndUpdate(

      countryId,

      { $set: { isDefault: true } },

      { new: true, runValidators: true }

    );



    console.log("✅ Country updated successfully:", updatedCountry.name, "isDefault:", updatedCountry.isDefault);



    return res.json({

      message: 'Default country updated successfully',

      item: updatedCountry

    });

  } catch (err) {

    console.error("❌ Error in setDefault:", err);

    return res.status(500).json({ message: 'Server error', error: err.message });

  }

};

/**
 * Get live exchange rate for a specific country
 * GET /country/exchange-rate/:countryCode
 */
exports.getLiveExchangeRate = async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { exchangeRate } = require('../services/exchangeRate');

    if (!countryCode || countryCode.length !== 2) {
      return res.status(400).json({ message: 'Invalid country code' });
    }

    // Get country from database
    const country = await Country.findOne({ code: countryCode.toUpperCase(), active: true });
    if (!country) {
      return res.status(404).json({ message: 'Country not found' });
    }

    // Fetch live rate
    const liveRate = await exchangeRate(country.currency);

    return res.json({
      countryCode: country.code,
      currency: country.currency,
      liveRate,
      cachedRate: country.exchangeRate,
      lastUpdated: country.updatedAt,
    });
  } catch (err) {
    console.error('Error fetching live exchange rate:', err);
    return res.status(500).json({ message: 'Failed to fetch exchange rate', error: err.message });
  }
};

/**
 * Update all exchange rates
 * POST /country/update-exchange-rates (admin only)
 */
exports.updateExchangeRates = async (req, res) => {
  try {
    // Check if user is admin (implement based on your auth)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { updateAllExchangeRates } = require('../services/exchangeRate');
    await updateAllExchangeRates();

    const countries = await Country.find({ active: true });
    return res.json({
      message: 'Exchange rates updated successfully',
      countries: countries.map(c => ({
        name: c.name,
        code: c.code,
        currency: c.currency,
        exchangeRate: c.exchangeRate,
      })),
    });
  } catch (err) {
    console.error('Error updating exchange rates:', err);
    return res.status(500).json({ message: 'Failed to update exchange rates', error: err.message });
  }
};

/**
 * Get exchange rate for checkout
 * GET /country/checkout-rate/:countryCode
 * Used by frontend during checkout to get latest rates
 */
exports.getCheckoutExchangeRate = async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { getExchangeRate } = require('../services/exchangeRate');

    if (!countryCode) {
      return res.status(400).json({ message: 'Country code required' });
    }

    const country = await Country.findOne({ code: countryCode.toUpperCase(), active: true });
    if (!country) {
      return res.status(404).json({ message: 'Country not found' });
    }

    // Get live rate
    const liveRate = await getExchangeRate(country.currency);

    return res.json({
      countryCode: country.code,
      currency: country.currency,
      exchangeRate: liveRate,
      name: country.name,
      currencySymbol: country.currencySymbol,
    });
  } catch (err) {
    console.error('Error fetching checkout exchange rate:', err);
    return res.status(500).json({ message: 'Failed to fetch rate', error: err.message });
  }
};

