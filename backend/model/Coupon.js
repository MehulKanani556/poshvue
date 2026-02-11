const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    amount: { type: Number, required: true },
    // Admin-provided human-readable condition(s) for coupon applicability
    conditions: { type: String, default: '' },
    // Structured rules array for advanced validation (minSubtotal, firstTimeUser, etc.)
    rules: [
      {
        type: { type: String, enum: ['minSubtotal', 'minQuantity', 'allowedCategories', 'excludedCategories', 'requiredProducts', 'firstTimeUser', 'maxUsesPerUser', 'dateRange', 'minOrder', 'maxOrder', 'custom'], default: 'minSubtotal' },
        value: mongoose.Schema.Types.Mixed,
        productId: String,
        categories: [String],
        products: [String],
        from: Date,
        to: Date,
        name: String, // for custom rule hooks
      }
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    maxUses: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', CouponSchema);