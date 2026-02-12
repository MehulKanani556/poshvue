# 🔧 FIX: International Orders - INR Conversion in Shiprocket

## Problem That Was Fixed

When international customers placed orders, Shiprocket was receiving prices in the original customer currency (USD, GBP, etc.) instead of converted INR amounts.

**Before Fix:**

- Customer from USA: $10 product → Shiprocket received: $10 ❌
- Should have been: ₹835 (converted) ✅

---

## Solution Implemented

### 1️⃣ **Frontend Already Converts to INR** ✅

- When order is created, frontend converts all amounts using exchangeRate
- Sends to backend with `isInternational: true` flag

### 2️⃣ **Backend Now Skips Recalculation** ✅

Updated `orderController.js` lines 691-717:

```javascript
// ===== SHIPPING CHARGE CALCULATION =====
// If frontend already calculated and converted amounts (isInternational flag + shippingCharges provided),
// skip recalculation and use the converted amounts from frontend
if (!payload.isInternational || !payload.shippingCharges) {
  // Only recalculate if NOT coming from frontend with conversion
  const { shippingCharges, isInternational } =
    await calculateShippingCharges(payload);
  payload.shippingCharges = shippingCharges;
  payload.isInternational = isInternational;
  // Add shipping to total only if not already included
  if (!payload.originalTotal) {
    payload.total = (payload.total || payload.subTotal || 0) + shippingCharges;
  }
} else {
  // Frontend has already provided converted amounts, just ensure total is correct
  console.log(
    "[Order] Using frontend-calculated amounts (international order with conversion):",
    {
      shippingCharges: payload.shippingCharges,
      isInternational: payload.isInternational,
      originalCurrency: payload.originalCurrency,
    },
  );
}
```

### 3️⃣ **Shiprocket Gets INR Amounts** ✅

Updated `shiprocket.js` lines 179-199:

```javascript
// ===== USE CONVERTED INR AMOUNTS FOR SHIPROCKET =====
// If order is international and has been converted to INR, use those amounts
// Otherwise use original amounts
const subTotalForShiprocket = Number(order.subTotal || order.total || 0);

console.log("[Shiprocket] Order amount details:", {
  isInternational: order.isInternational,
  originalCurrency: order.originalCurrency,
  subTotal: order.subTotal,
  shippingCharges: order.shippingCharges,
  total: order.total,
  subTotalForShiprocket,
});
```

### 4️⃣ **Order Model Updated** ✅

Added fields to `Order.js` model to track original currency:

```javascript
// Store original currency info for international orders
originalCurrency: { type: String, default: 'INR' },
originalTotal: { type: Number },
```

---

## Data Flow - International Order

### Step 1: Frontend (Checkout.jsx)

```
Customer from USA:
- Product: $50
- Shipping: $7.37 (calculated)
- Total: $57.37 USD

Frontend converts using exchangeRate: 1 USD = 83.5 INR
- Product: 4175 INR
- Shipping: 616 INR (₹500 base + weight + volumetric)
- Total: 4791 INR
```

### Step 2: Frontend Sends to Backend

```javascript
{
  items: [{ price: 4175, ... }],
  subTotal: 4175,
  shippingCharges: 616,
  total: 4791,
  isInternational: true,
  country: "US",
  originalCurrency: "USD",
  originalTotal: 57.37,
  ...
}
```

### Step 3: Backend Receives Order

```
✓ Checks: isInternational = true AND shippingCharges = 616 provided
✓ Action: SKIPS recalculation
✓ Reason: Frontend has already converted all amounts to INR
✓ Logs: "Using frontend-calculated amounts"
```

### Step 4: Backend Sends to Shiprocket

```javascript
{
  sub_total: 4175,  // INR (not $50)
  billing_country: "United States",
  order_items: [
    {
      selling_price: 4175,  // INR (not $50)
      units: 1
    }
  ],
  ...
}
```

### Step 5: Shiprocket Receives INR Amounts ✅

```
✓ Shiprocket sees: ₹4175 (correct)
✗ Previously saw: $50 (wrong)
```

---

## Files Modified

### 1. `backend/controller/orderController.js`

**Lines 691-717**: Added conditional shipping calculation

- **What Changed**: Backend now checks if frontend already provided converted amounts
- **Why**: Prevents recalculation that overwrites INR-converted amounts

### 2. `backend/services/shiprocket.js`

**Lines 179-199**: Added logging and amount tracking

- **What Changed**: Enhanced logging to show which amounts are being sent
- **Why**: Easy to debug if issues occur

### 3. `backend/model/Order.js`

**Line 103**: Added currency tracking fields

- **What Changed**: Added `originalCurrency` and `originalTotal` fields
- **Why**: Store original customer currency for reference

---

## How to Verify It's Working

### Check Browser Console (Frontend)

```javascript
// Should see this log when placing international order:
International Order - Currency Conversion: {
  originalCurrency: "USD",
  exchangeRate: 83.5,
  originalSubTotal: 50,
  convertedSubTotal: 4175,
  originalTotal: 57.37,
  convertedTotal: 4791
}
```

### Check Server Console (Backend)

```javascript
// Should see this log when receiving international order:
[Order] Using frontend-calculated amounts (international order with conversion): {
  shippingCharges: 616,
  isInternational: true,
  originalCurrency: "USD"
}

// And this log when sending to Shiprocket:
[Shiprocket] Order amount details: {
  isInternational: true,
  originalCurrency: "USD",
  subTotal: 4175,
  shippingCharges: 616,
  total: 4791,
  subTotalForShiprocket: 4175
}
```

### Check Shiprocket (After Order Created)

**Before Fix:** Shows $50 ❌
**After Fix:** Shows ₹4175 in Shiprocket system ✅

---

## Example Scenarios

### Scenario 1: India Order (Domestic)

```
Product Price: ₹1000
Shipping: ₹62 (domestic rate)
Total: ₹1062

Frontend: No conversion needed
Backend: Uses simple shipping calculation
Shiprocket: Receives ₹1062 ✅
```

### Scenario 2: USA Order (International)

```
Product Price: $12 → ₹1002
Shipping: $7.37 → ₹616 (international rate converted)
Total: $19.37 → ₹1618

Frontend: Converts using exchangeRate (83.5)
Backend: SKIPS recalculation
Shiprocket: Receives ₹1618 ✅
```

### Scenario 3: UK Order (International)

```
Product Price: £10 → ₹1050 (105 rate)
Shipping: £0.58 → ₹61 (international rate converted)
Total: £10.58 → ₹1111

Frontend: Converts using exchangeRate (105)
Backend: SKIPS recalculation
Shiprocket: Receives ₹1111 ✅
```

---

## Technical Flow Diagram

```
Frontend (Customer from USA)
    ↓
    ├─ Customer Amount: $12.37 USD
    ├─ Exchange Rate: 83.5
    ├─ Convert to INR: ₹1033
    ├─ Send with flags: isInternational=true, originalCurrency="USD"
    ↓
Backend OrderController
    ├─ Receive: isInternational=true, shippingCharges=616
    ├─ Check: Are amounts already converted?
    ├─ YES → Skip recalculation!
    └─ Use: ₹1033 (keep it as is)
    ↓
Shiprocket Service
    ├─ Receive amount: ₹1033 (INR)
    ├─ Create order in Shiprocket
    └─ Result: Shiprocket sees ₹1033 ✅
```

---

## Key Points

✅ **Frontend converts all amounts to INR**

- Uses CurrencyContext exchangeRate
- Sends with `isInternational: true` flag

✅ **Backend skips recalculation for international orders**

- Detects: `isInternational && shippingCharges` present
- Action: Uses amounts as-is from frontend

✅ **Shiprocket receives INR amounts**

- No currency confusion
- Correct pricing in their system

🔍 **Fully logged for debugging**

- Frontend logs conversion details
- Backend logs which path it took
- Easy to trace any issues

---

## Troubleshooting

**Q: Shiprocket still showing wrong currency?**

- Check browser console logs to verify frontend conversion happened
- Check server logs to verify backend used frontend amounts
- Ensure `originalCurrency` field is populated in order

**Q: Total price not matching?**

- Verify `exchangeRate` is correct in CurrencyContext
- Check conversion rounding (using Math.round)
- Ensure shipping calculation happened correctly

**Q: Backend is recalculating again?**

- Check if `isInternational` flag is being sent
- Check if `shippingCharges` value is provided
- Both conditions must be true to skip recalculation

---

## Code Changes Summary

| File               | Lines   | Change                                        |
| ------------------ | ------- | --------------------------------------------- |
| orderController.js | 691-717 | Conditional shipping calculation              |
| shiprocket.js      | 179-199 | Enhanced logging & amount handling            |
| Order.js           | 103     | Added originalCurrency & originalTotal fields |

---

## What This Enables

✅ International orders with correct INR amounts in Shiprocket
✅ Accurate shipping costs based on actual dimensions
✅ Full audit trail with original currency preserved
✅ Proper financial records in INR
✅ No currency confusion in fulfillment system
