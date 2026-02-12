const axios = require('axios');

// Free exchange rate API options:
// 1. exchangerate-api.com (Free tier: 1500 requests/month)
// 2. fixer.io (Free tier with 100 requests/month)
// 3. open-exchange-rates.org
// 4. api.exchangerate-api.com (No key required for basic)

// Using exchangerate-api.com (Free - No API key required)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';

// For live rates, use open-exchange-rates or other premium services
// Add to .env: EXCHANGE_RATE_API_KEY=your_key

const exchangeRateCache = new Map();
const CACHE_DURATION = 1 * 60 * 60 * 1000; // Cache for 1 hour

/**
 * Fetch live exchange rate from INR to target currency
 * @param {string} targetCurrency - Target currency code (e.g., 'USD', 'GBP')
 * @returns {Promise<number>} Exchange rate
 */
exports.getLiveExchangeRate = async (targetCurrency = 'USD') => {
    try {
        // Check cache first
        const cacheKey = `INR_TO_${targetCurrency}`;
        const cachedRate = exchangeRateCache.get(cacheKey);

        if (cachedRate && cachedRate.expiry > Date.now()) {
            console.log(`[ExchangeRate] Using cached rate for ${targetCurrency}: ${cachedRate.rate}`);
            return cachedRate.rate;
        }

        // Fetch live rate from INR to target currency
        console.log(`[ExchangeRate] Fetching live rate for INR → ${targetCurrency}...`);

        const response = await axios.get(`${EXCHANGE_RATE_API}/INR`, {
            timeout: 5000,
        });

        const rate = response.data.rates[targetCurrency];

        if (!rate) {
            throw new Error(`Currency ${targetCurrency} not found`);
        }

        // Cache the rate
        exchangeRateCache.set(cacheKey, {
            rate,
            expiry: Date.now() + CACHE_DURATION,
        });

        console.log(`[ExchangeRate] Live rate INR → ${targetCurrency}: ${rate}`);
        return rate;
    } catch (error) {
        console.error(`[ExchangeRate] Failed to fetch rate for ${targetCurrency}:`, error.message);

        // Fallback: Return cached rate even if expired
        const cacheKey = `INR_TO_${targetCurrency}`;
        const cachedRate = exchangeRateCache.get(cacheKey);
        if (cachedRate) {
            console.log(`[ExchangeRate] Using expired cached rate as fallback: ${cachedRate.rate}`);
            return cachedRate.rate;
        }

        // Final fallback: Return 1 (or database value)
        return 1;
    }
};

/**
 * Get exchange rate from INR (base) to target currency
 * INR is always the base currency (rate = 1 for INR)
 */
exports.getExchangeRate = async (targetCurrency = 'USD') => {
    if (targetCurrency === 'INR') return 1;

    const rate = await exports.getLiveExchangeRate(targetCurrency);
    return rate;
};

/**
 * Update all country exchange rates with live rates
 * Run periodically (every 1-2 hours)
 */
exports.updateAllExchangeRates = async () => {
    try {
        const Country = require('../model').Country;

        const countries = await Country.find({ active: true });
        console.log(`[ExchangeRate] Updating rates for ${countries.length} countries...`);

        for (const country of countries) {
            if (country.code === 'IN') {
                country.exchangeRate = 1;
            } else {
                const liveRate = await exports.getExchangeRate(country.currency);
                country.exchangeRate = liveRate;
            }

            await country.save();
            console.log(`[ExchangeRate] Updated ${country.name} (${country.currency}): ${country.exchangeRate}`);
        }

        console.log('[ExchangeRate] Exchange rates updated successfully');
    } catch (error) {
        console.error('[ExchangeRate] Failed to update exchange rates:', error.message);
    }
};

/**
 * Clear exchange rate cache
 */
exports.clearExchangeRateCache = () => {
    exchangeRateCache.clear();
    console.log('[ExchangeRate] Cache cleared');
};

module.exports = exports;
