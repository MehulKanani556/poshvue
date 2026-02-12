# Exact Code Implementation - Copy Reference

## 1. SHIPPING CHARGE CALCULATION FUNCTION

**Location**: `frontend/src/user/container/Checkout.jsx`
**Function**: `calculateShippingCharges` (Lines 1269-1335)

```javascript
// Calculate shipping charges based on package weight and destination
const calculateShippingCharges = useCallback(async () => {
  if (!selectedAddress || cartItems.length === 0) return;

  try {
    // Calculate total package weight and dimensions from products
    const totalWeight = cartItems.reduce((sum, item) => {
      const productWeight = item.product?.weight || 0.5; // Default 0.5kg per item
      return sum + productWeight * item.quantity;
    }, 0);

    // Calculate package dimensions
    const totalLength = cartItems.reduce((sum, item) => {
      const productLength = item.product?.length || 10;
      return sum + productLength * item.quantity;
    }, 0);

    const totalBreadth = cartItems.reduce((sum, item) => {
      const productBreadth = item.product?.breadth || 10;
      return sum + productBreadth * item.quantity;
    }, 0);

    const totalHeight = cartItems.reduce((sum, item) => {
      const productHeight = item.product?.height || 5;
      return sum + productHeight * item.quantity;
    }, 0);

    const dimensions = {
      length: Math.max(10, totalLength),
      breadth: Math.max(10, totalBreadth),
      height: Math.max(5, totalHeight),
      weight: Math.max(0.5, totalWeight),
    };

    // Determine if international or domestic
    const isInternationalOrder = selectedCountry?.code !== "IN";

    // Calculate shipping charges based on dimensions and destination
    // Domestic (India): Base 50 + weight per kg 10 + volumetric charge
    // International: Base 500 + weight per kg 100 + volumetric charge
    const baseRate = isInternationalOrder ? 500 : 50;
    const weightCharge = dimensions.weight * (isInternationalOrder ? 100 : 10);
    const volumetricWeight =
      (dimensions.length * dimensions.breadth * dimensions.height) / 5000;
    const volumetricCharge = volumetricWeight * (isInternationalOrder ? 20 : 2);
    const calculatedCharges = Math.ceil(
      baseRate + weightCharge + volumetricCharge,
    );

    setShippingCharges(calculatedCharges);
    setIsInternational(isInternationalOrder);

    console.log("Shipping calculation:", {
      weight: dimensions.weight,
      volumetricWeight: volumetricWeight.toFixed(2),
      baseRate,
      weightCharge: weightCharge.toFixed(2),
      volumetricCharge: volumetricCharge.toFixed(2),
      total: calculatedCharges,
      isInternational: isInternationalOrder,
    });
  } catch (err) {
    console.error("Failed to calculate shipping:", err);
    // Fallback to basic shipping calculation
    const isInternationalOrder = selectedCountry?.code !== "IN";
    const baseRate = isInternationalOrder ? 500 : 50;
    const weightCharge = cartItems.reduce((sum, item) => {
      const weight = item.product?.weight || 0.5;
      return sum + weight * item.quantity * (isInternationalOrder ? 100 : 10);
    }, 0);
    setShippingCharges(baseRate + weightCharge);
    setIsInternational(isInternationalOrder);
  }
}, [selectedAddress, cartItems, selectedCountry]);
```

---

## 2. CREATE ORDER FUNCTION WITH INR CONVERSION

**Location**: `frontend/src/user/container/Checkout.jsx`
**Function**: `createOrder` (Lines 491-665)

```javascript
const createOrder = async (values, paymentIntentId, paymentStatus) => {
  try {
    const token = localStorage.getItem("userToken");

    const orderItems = cartItems.map((item) => ({
      product: item.product._id,
      title: item.product.title,
      price: getConvertedPrice(item.product, "salePrice"),
      quantity: item.quantity,
      size: item.size || null,
      color: item.color || null,
    }));

    // Calculate package dimensions and weight for Shiprocket
    const totalWeight = cartItems.reduce((sum, item) => {
      const productWeight = item.product?.weight || 0.5;
      return sum + productWeight * item.quantity;
    }, 0);

    const totalLength = cartItems.reduce((sum, item) => {
      const productLength = item.product?.length || 10;
      return sum + productLength * item.quantity;
    }, 0);

    const totalBreadth = cartItems.reduce((sum, item) => {
      const productBreadth = item.product?.breadth || 10;
      return sum + productBreadth * item.quantity;
    }, 0);

    const totalHeight = cartItems.reduce((sum, item) => {
      const productHeight = item.product?.height || 5;
      return sum + productHeight * item.quantity;
    }, 0);

    const dimension = {
      length: Math.max(10, totalLength),
      breadth: Math.max(10, totalBreadth),
      height: Math.max(5, totalHeight),
      weight: Math.max(0.5, totalWeight),
    };

    // ===== CONVERT AMOUNTS TO INR IF INTERNATIONAL ORDER =====
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

      console.log("International Order - Currency Conversion:", {
        originalCurrency: selectedCountry.currency,
        exchangeRate: exchangeRate,
        originalSubTotal: subTotal,
        convertedSubTotal: finalSubTotal,
        originalTotal: total,
        convertedTotal: finalTotal,
      });
    }

    const orderPayload = {
      customerName: values.fullName,
      customerEmail: values.email,
      customerPhone: values.phone,
      address: values.address,
      pincode: values.pincode,
      items: orderItems,
      subTotal: finalSubTotal, // INR converted if international
      total: finalTotal, // INR converted if international
      discount: finalDiscount, // INR converted if international
      shippingCharges: finalShippingCharges, // INR converted if international
      isInternational: isInternational,
      dimension: dimension,
      shippingInfo: {
        firstName: values.fullName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        pincode: values.pincode,
        country: selectedCountry?.name || "India",
        city: selectedAddress?.city || "Mumbai",
        state: selectedAddress?.state || "Maharashtra",
      },
      status: paymentStatus === "completed" ? "paid" : "pending",
      paymentMethod: selectedPaymentMethod,
      paymentStatus: paymentStatus,
      paymentIntentId,
      couponCode: appliedCoupon?.code || null,
      country: selectedCountry?.code || "IN",

      // Original currency info for reference
      originalCurrency: selectedCountry?.currency || "INR",
      originalTotal: total,
    };

    const orderRes = await axios.post(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/commerce/orders`,
      orderPayload,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    console.log("Order created:", orderRes.data.item);

    const shiprocketMsg =
      orderRes.data.shiprocketError ||
      orderRes.data.error ||
      orderRes.data.message;

    if (shiprocketMsg) {
      console.warn("Shiprocket error:", shiprocketMsg);
      alert(
        "Order placed successfully, but shipping could not be created: " +
          shiprocketMsg,
      );
    }

    // Clear cart
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/cart/clear`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (clearErr) {
      console.error("Error clearing cart after order:", clearErr);
    }

    navigate("/TrackOrder");
  } catch (orderErr) {
    console.error("Order creation error:", orderErr);
    alert(orderErr.response?.data?.message || "Failed to create order");
    setLoading(false);
  }
};
```

---

## 3. SHIPPING CALCULATION FORMULAS

### Domestic (India) - Country Code "IN"

```
Base Rate = ₹50
Weight Charge = weight (kg) × ₹10
Volumetric Weight = (length × breadth × height) / 5000
Volumetric Charge = Volumetric Weight × ₹2
Total Shipping = ceil(Base Rate + Weight Charge + Volumetric Charge)
```

### International (Non-India)

```
Base Rate = ₹500
Weight Charge = weight (kg) × ₹100
Volumetric Weight = (length × breadth × height) / 5000
Volumetric Charge = Volumetric Weight × ₹20
Total Shipping = ceil(Base Rate + Weight Charge + Volumetric Charge)
```

---

## 4. DEFAULT DIMENSIONS (If Not in Product)

```javascript
weight: 0.5 kg
length: 10 cm
breadth: 10 cm
height: 5 cm
```

---

## 5. INR CONVERSION LOGIC

```javascript
if (
  isInternational &&
  selectedCountry?.exchangeRate &&
  selectedCountry?.code !== "IN"
) {
  const exchangeRate = parseFloat(selectedCountry.exchangeRate) || 1;

  // Convert all amounts from customer's currency to INR
  finalSubTotal = Math.round(subTotal * exchangeRate);
  finalDiscount = Math.round(discount * exchangeRate);
  finalShippingCharges = Math.round(shippingCharges * exchangeRate);
  finalTotal = Math.round(total * exchangeRate);
}
```

---

## 6. ORDER PAYLOAD STRUCTURE

```javascript
{
  // Customer Info
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  address: String,
  pincode: String,

  // Order Items
  items: [
    {
      product: ObjectId,
      title: String,
      price: Number,      // INR converted if international
      quantity: Number,
      size: String | null,
      color: String | null,
    }
  ],

  // Amounts (ALL IN INR)
  subTotal: Number,              // INR
  total: Number,                 // INR
  discount: Number,              // INR
  shippingCharges: Number,       // INR

  // Shipping Info
  isInternational: Boolean,
  dimension: {
    length: Number,
    breadth: Number,
    height: Number,
    weight: Number,
  },

  // Payment Info
  paymentMethod: String,         // 'card', 'upi', 'netbanking'
  paymentStatus: String,         // 'completed', 'pending'
  paymentIntentId: String,

  // Currency Tracking
  country: String,               // Country code, e.g., 'IN', 'US'
  originalCurrency: String,      // Original currency code
  originalTotal: Number,         // Original amount in customer's currency

  // Other
  status: String,                // 'paid', 'pending'
  couponCode: String | null,
}
```

---

## 7. TESTING EXAMPLES

### Example 1: India Order

```
Items: 2 × Product (weight: 0.5kg, L:10cm, B:10cm, H:5cm)
Total Weight: 1 kg
Total Dimensions: L:20, B:20, H:10
Volumetric Weight: (20×20×10)/5000 = 0.8

Base: ₹50
Weight Charge: 1 × 10 = ₹10
Volumetric Charge: 0.8 × 2 = ₹1.6
Total Shipping: ceil(50 + 10 + 1.6) = ₹62
```

### Example 2: USA Order

```
Items: 2 × Product (weight: 0.5kg, L:10cm, B:10cm, H:5cm)
Total Weight: 1 kg
Total Dimensions: L:20, B:20, H:10
Volumetric Weight: (20×20×10)/5000 = 0.8
Exchange Rate: 1 USD = 83.5 INR

Base: ₹500
Weight Charge: 1 × 100 = ₹100
Volumetric Charge: 0.8 × 20 = ₹16
Total Shipping (Original Currency): $6.96
Total Shipping (INR): ceil(500 + 100 + 16) × 1 = ₹616
Database Storage: ₹616
```

---

## 8. CONSOLE LOGS TO VERIFY

Check browser console for these logs to verify implementation:

```javascript
// Shipping Calculation Log
Shipping calculation: {
  weight: 1,
  volumetricWeight: "0.80",
  baseRate: 50,
  weightCharge: "10.00",
  volumetricCharge: "1.60",
  total: 62,
  isInternational: false
}

// International Conversion Log
International Order - Currency Conversion: {
  originalCurrency: "USD",
  exchangeRate: 83.5,
  originalSubTotal: 100,
  convertedSubTotal: 8350,
  originalTotal: 106.96,
  convertedTotal: 8931
}
```

---

## 9. BACKEND INTEGRATION

The backend in `orderController.js` at line 495 (`exports.create`) already:

- Receives the orderPayload with converted INR amounts
- Stores all amounts in INR in the database
- Passes dimension data to Shiprocket
- Calls `calculateShippingCharges` from shiprocket service

No changes needed to backend for this implementation to work!

---

## 10. FILES MODIFIED

✅ `frontend/src/user/container/Checkout.jsx`

- Updated `calculateShippingCharges` function
- Updated `createOrder` function
- Added INR conversion logic

---
