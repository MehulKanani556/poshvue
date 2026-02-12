# Shipping Calculation & International Order Conversion Implementation

## Overview

This document details the implementation of dynamic shipping fee calculation based on product dimensions and the INR conversion for international orders in the Checkout flow.

---

## Key Features Implemented

### 1. **Dynamic Shipping Fee Calculation**

Based on product packaging dimensions (length, breadth, height, weight):

#### **Domestic (India) - Country Code "IN"**

- Base Rate: ₹50
- Weight Charge: Weight (kg) × ₹10
- Volumetric Charge: (Length × Breadth × Height / 5000) × ₹2
- **Formula**: Base + Weight Charge + Volumetric Charge

#### **International (Non-India)**

- Base Rate: ₹500
- Weight Charge: Weight (kg) × ₹100
- Volumetric Charge: (Length × Breadth × Height / 5000) × ₹20
- **Formula**: Base + Weight Charge + Volumetric Charge

### 2. **INR Conversion for International Orders**

When an international order is placed:

- All amounts (subtotal, discount, shipping charges, total) are converted from the customer's currency to INR
- Conversion uses the `exchangeRate` from the Country/CurrencyContext
- All calculations are stored in INR in the database
- Original currency information is preserved for reference

---

## Code Changes

### File: `frontend/src/user/container/Checkout.jsx`

#### Change 1: Updated `calculateShippingCharges` Function (Lines 1269-1335)

**What Changed:**

- Replaced simple API call-based calculation with direct dimension-based calculation
- Added proper volumetric weight calculation
- Separated logic for domestic vs international shipping
- Added comprehensive logging

**Key Logic:**

```javascript
// Determine if international or domestic
const isInternationalOrder = selectedCountry?.code !== "IN";

// Calculate shipping charges based on dimensions and destination
const baseRate = isInternationalOrder ? 500 : 50;
const weightCharge = dimensions.weight * (isInternationalOrder ? 100 : 10);
const volumetricWeight =
  (dimensions.length * dimensions.breadth * dimensions.height) / 5000;
const volumetricCharge = volumetricWeight * (isInternationalOrder ? 20 : 2);
const calculatedCharges = Math.ceil(baseRate + weightCharge + volumetricCharge);
```

**Product Dimensions Used:**

- `product.weight` (default: 0.5 kg)
- `product.length` (default: 10 cm)
- `product.breadth` (default: 10 cm)
- `product.height` (default: 5 cm)

#### Change 2: Updated `createOrder` Function (Lines 491-665)

**What Changed:**

- Added INR conversion logic for international orders
- Converts all monetary amounts before sending to backend
- Preserves original currency info for reference
- Enhanced logging for debugging

**INR Conversion Logic:**

```javascript
// Convert amounts to INR if international order
let finalSubTotal = subTotal;
let finalDiscount = discount;
let finalShippingCharges = shippingCharges;
let finalTotal = total;

if (
  isInternational &&
  selectedCountry?.exchangeRate &&
  selectedCountry?.code !== "IN"
) {
  // Convert all amounts to INR for database and Shiprocket
  const exchangeRate = parseFloat(selectedCountry.exchangeRate) || 1;
  finalSubTotal = Math.round(subTotal * exchangeRate);
  finalDiscount = Math.round(discount * exchangeRate);
  finalShippingCharges = Math.round(shippingCharges * exchangeRate);
  finalTotal = Math.round(total * exchangeRate);
}
```

**Order Payload Includes:**

```javascript
{
  subTotal: finalSubTotal,        // INR converted if international
  total: finalTotal,              // INR converted if international
  discount: finalDiscount,        // INR converted if international
  shippingCharges: finalShippingCharges,  // INR converted if international
  isInternational: isInternational,
  originalCurrency: selectedCountry?.currency || "INR",
  originalTotal: total,           // Original amount in customer's currency
  ...
}
```

---

## Database & Shiprocket Integration

### Order Model Fields Updated:

- `subTotal` - Always stored in INR
- `discount` - Always stored in INR
- `shippingCharges` - Always stored in INR
- `total` - Always stored in INR
- `isInternational` - Boolean flag for international orders
- `originalCurrency` - Customer's original currency (e.g., "USD", "GBP")
- `originalTotal` - Original amount before INR conversion
- `dimension` - Package dimensions for shipping

### Shiprocket Integration:

- Receives all amounts in INR
- Uses dimension data for actual carrier rate calculation
- Properly handles international shipments with INR-based pricing

---

## Frontend Display vs. Database Storage

### On Frontend (User Sees)

```
If customer is from USA:
- Product Price: $50
- Tax: $5
- Shipping: $25
- Total: $80 USD
```

### In Database (Stored)

```
If exchange rate USD to INR is 83.5:
- Product Price: 4175 INR
- Tax: 418 INR
- Shipping: 2088 INR
- Total: 6681 INR
```

---

## Testing Checklist

- [ ] Test domestic (India) order shipping calculation
  - Verify Base: ₹50
  - Verify Weight × ₹10
  - Verify Volumetric charge × ₹2

- [ ] Test international order shipping calculation
  - Verify Base: ₹500
  - Verify Weight × ₹100
  - Verify Volumetric charge × ₹20

- [ ] Test INR conversion
  - Verify all amounts converted using exchangeRate
  - Verify originalCurrency and originalTotal stored
  - Verify isInternational flag set correctly

- [ ] Test database storage
  - Verify all amounts in INR
  - Verify shipping calculation matches formula

- [ ] Test Shiprocket integration
  - Verify dimension data sent correctly
  - Verify INR-based calculations used

---

## Console Logs for Debugging

The implementation includes detailed console logs:

```javascript
// Shipping Calculation Logs
console.log("Shipping calculation:", {
  weight: dimensions.weight,
  volumetricWeight: volumetricWeight.toFixed(2),
  baseRate,
  weightCharge: weightCharge.toFixed(2),
  volumetricCharge: volumetricCharge.toFixed(2),
  total: calculatedCharges,
  isInternational: isInternationalOrder,
});

// International Order Conversion Logs
console.log("International Order - Currency Conversion:", {
  originalCurrency: selectedCountry.currency,
  exchangeRate: exchangeRate,
  originalSubTotal: subTotal,
  convertedSubTotal: finalSubTotal,
  originalTotal: total,
  convertedTotal: finalTotal,
});
```

---

## Product Model Requirements

Products should have these fields for proper shipping calculation:

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  weight: Number,      // in kg (default: 0.5)
  length: Number,      // in cm (default: 10)
  breadth: Number,     // in cm (default: 10)
  height: Number,      // in cm (default: 5)
  salePrice: Number,
  ...
}
```

---

## Advantage of This Approach

1. **Accurate Shipping**: Based on actual product dimensions
2. **Currency Consistency**: All database entries in INR
3. **Shiprocket Compatible**: Proper dimension data for carrier rates
4. **Traceable**: Original currency/amounts preserved for reference
5. **International Ready**: Separate rates for international vs domestic
6. **Fallback Logic**: Works even if external API fails

---

## Related Files

- Frontend: `/frontend/src/user/container/Checkout.jsx`
- Backend: `/backend/services/shiprocket.js`
- Backend: `/backend/controller/orderController.js`
- Backend: `/backend/model/Order.js`
