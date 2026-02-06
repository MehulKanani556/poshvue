# Shiprocket API Integration Guide

## Overview
This guide explains the complete Shiprocket integration with your React + Node.js application. When a customer places an order and makes payment, the order is automatically sent to Shiprocket for fulfillment, and the tracking number is stored in the database.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│  1. User selects products and checkout                      │
│  2. Creates payment intent via Stripe                       │
│  3. Confirms payment & creates order                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────┤
│  POST /api/commerce/orders                                  │
│  ├─ Validates order data                                    │
│  ├─ Saves to MongoDB                                        │
│  └─ If paymentStatus === 'completed'                        │
│     └─ Call Shiprocket service                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│           Shiprocket Service                                │
├─────────────────────────────────────────────────────────────┤
│  POST /orders/create/adhoc  (Create order)                 │
│  ├─ Authenticates with Shiprocket                           │
│  ├─ Sends order details                                     │
│  └─ Returns order_id & shipment_id                          │
│                                                              │
│  POST /courier/assign/awb   (Assign courier)               │
│  ├─ Assigns AWB number                                      │
│  ├─ Selects courier                                         │
│  └─ Returns tracking number                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│           Database (MongoDB)                                │
├─────────────────────────────────────────────────────────────┤
│  Order {                                                     │
│    shipmentId: 12345,                                       │
│    trackingNumber: 'ABL123456789',                          │
│    shipmentDetail: {                                        │
│      awb_code: 'ABL123456789',                              │
│      courier_name: 'DHL',                                   │
│      order_status: 'in_transit'                             │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Shiprocket Account**
   - Email address
   - Password
   - Verified pickup location

2. **Environment Variables** (`.env`)
   ```
   SHIPROCKET_URL=https://apiv2.shiprocket.in/v1/external
   SHIPROCKET_EMAIL=your_shiprocket_email@example.com
   SHIPROCKET_PASSWORD=your_shiprocket_password
   SHIPROCKET_PICKUP=Primary
   ```

3. **Stripe Integration** (for payment processing)
   - Stripe publishable and secret keys configured

## Complete Order Flow

### 1. Frontend - Create Payment Intent
```javascript
// Checkout.jsx
const piRes = await createPaymentIntent({
  amount: total,
  currency: 'inr',
  paymentMethod: 'card',
});
```

### 2. Frontend - Confirm Payment
```javascript
const { paymentIntent, error } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: { name, email, phone }
    }
  }
);
```

### 3. Frontend - Create Order (after payment succeeds)
```javascript
const orderRes = await axios.post(
  '/api/commerce/orders',
  {
    customerName: values.fullName,
    customerEmail: values.email,
    customerPhone: values.phone,
    address: values.address,
    pincode: values.pincode,
    items: cartItems.map(item => ({
      product: item.product._id,
      title: item.product.title,
      price: item.product.salePrice,
      quantity: item.quantity,
    })),
    total: totalAmount,
    status: 'paid',
    paymentStatus: 'completed',
    paymentIntentId: paymentIntent.id,
  },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### 4. Backend - Receive Order & Create Shipment
```javascript
// orderController.js - create() function
const item = await Order.create(payload);

if (item.paymentStatus === 'completed') {
  const shipData = await createShipmentForOrder(item);
  if (shipData) {
    await updateOrderWithShipmentData(item, shipData);
    await item.save();
  }
}
```

### 5. Shiprocket Service - Create Shipment
```javascript
// services/shiprocket.js
exports.createShipmentForOrder = async (order) => {
  // Step 1: Authenticate
  const token = await getToken();
  
  // Step 2: Create order in Shiprocket
  const res = await axios.post(
    `${SHIPROCKET_URL}/orders/create/adhoc`,
    {
      order_id: order._id,
      order_items: items,
      billing_customer_name: order.customerName,
      // ... other fields
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  // Step 3: Assign AWB (tracking number)
  const awbData = await assignAwbToShipment(res.data.shipment_id);
  
  // Step 4: Return shipment details
  return {
    shipmentId: res.data.shipment_id,
    orderId: res.data.order_id,
    awbCode: awbData.awb_code,
    courierName: awbData.courier_name,
  };
};
```

### 6. Database - Store Tracking Info
```javascript
// Order document in MongoDB
{
  _id: ObjectId('...'),
  shipmentId: 12345,              // Shiprocket shipment ID
  trackingNumber: 'ABL123456789', // AWB number for customer tracking
  shipmentDetail: {
    order_id: 12345,
    shipment_id: 12346,
    awb_code: 'ABL123456789',
    courier_name: 'DHL Express',
    courier_company_id: '3',
    assigned_date_time: '2024-02-06T10:30:00Z',
    label_url: 'https://...',
    manifest_url: 'https://...',
    pickup_scheduled_date: '2024-02-07T00:00:00Z',
  }
}
```

## API Endpoints

### Order Creation
```
POST /api/commerce/orders
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9876543210",
  "address": "123 Main St",
  "pincode": "400001",
  "items": [
    {
      "product": "60d5ec49c1234567890abcde",
      "title": "Product Name",
      "price": 999,
      "quantity": 2
    }
  ],
  "total": 1998,
  "paymentMethod": "card",
  "paymentStatus": "completed",
  "status": "paid"
}

Response:
{
  "item": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "shipmentId": 12345,
    "trackingNumber": "ABL123456789",
    "shipmentDetail": { ... },
    "status": "paid"
  }
}
```

### Track Order
```
POST /api/shiprocket/track-order
Content-Type: application/json

Request:
{
  "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "email": "john@example.com"
}

Response:
{
  "order": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "shipped",
    "trackingNumber": "ABL123456789",
    "shipmentDetail": { ... }
  },
  "tracking": {
    "status": "in_transit",
    "current_location": "Delhi",
    "estimated_delivery": "2024-02-10"
  }
}
```

### Get Shipment Tracking (Authenticated)
```
GET /api/shiprocket/tracking/{shipmentId}
Authorization: Bearer {token}

Response:
{
  "tracking": {
    "status": "in_transit",
    "current_location": "Bangalore",
    "estimated_delivery": "2024-02-10",
    "events": [
      {
        "status": "picked_up",
        "timestamp": "2024-02-07T14:30:00Z",
        "location": "Mumbai"
      }
    ]
  }
}
```

### Webhook Handler
```
POST /api/shiprocket/webhook

Receives updates from Shiprocket for:
- shipment_created
- awb_assigned
- label_generated
- shipment_picked_up
- in_transit
- out_for_delivery
- delivered
- shipment_cancelled
- return_created
- return_picked_up
- return_delivered
```

## Shiprocket Token Authentication

The service uses token-based authentication with caching:

1. **Token Request**
   - Endpoint: `POST /auth/login`
   - Body: `{ email, password }`
   - Response: `{ token }`
   - Duration: 10 minutes validity
   - Cached for: 8 minutes (to refresh before expiry)

2. **Usage**
   - Every API call includes: `Authorization: Bearer {token}`
   - Token is automatically refreshed when expired

3. **Error Handling**
   - If token is invalid, a new token is requested
   - No manual token management required

## Error Handling

### Common Errors

1. **Missing Shiprocket Credentials**
   ```
   Error: Credentials not configured
   Solution: Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env
   ```

2. **Invalid Order Data**
   ```
   Error: Missing order_id or shipment_id
   Solution: Ensure order has all required fields
   ```

3. **AWB Assignment Failed**
   ```
   Warning: AWB assignment returned null
   Solution: Check Shiprocket account balance/limits
   ```

4. **Token Expiration**
   ```
   Error: Invalid authorization token
   Solution: Automatic, token is refreshed
   ```

## Webhook Integration

To enable real-time shipment updates:

1. **Configure Webhook in Shiprocket Dashboard**
   - Webhook URL: `https://yourdomain.com/api/shiprocket/webhook`
   - Events: Select all shipment and return events
   - Method: POST

2. **Webhook Processing**
   - Order status updates in real-time
   - Tracking information synchronized
   - Return orders tracked

3. **Webhook Events Handled**
   - `shipment_created` → status: "processing"
   - `awb_assigned` → status: "shipped"
   - `out_for_delivery` → status: "out_for_delivery"
   - `delivered` → status: "delivered"

## Testing

### Test Order Creation
```bash
curl -X POST http://localhost:5000/api/commerce/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "9876543210",
    "address": "123 Main St, Mumbai",
    "pincode": "400001",
    "items": [
      {
        "product": "PRODUCT_ID",
        "title": "Test Product",
        "price": 999,
        "quantity": 1
      }
    ],
    "total": 999,
    "paymentStatus": "completed",
    "status": "paid"
  }'
```

### Test Tracking
```bash
curl -X POST http://localhost:5000/api/shiprocket/track-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "email": "test@example.com"
  }'
```

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/shiprocket/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "awb_assigned",
    "shipment_id": 12345,
    "data": {
      "awb_code": "ABL123456789",
      "courier_name": "DHL Express"
    }
  }'
```

## Monitoring & Debugging

### Enable Logging
The service includes comprehensive logging with `[Shiprocket]` prefix:

```javascript
[Shiprocket] Requesting new authentication token...
[Shiprocket] Creating shipment for order 65a1b2c3d4e5f6g7h8i9j0k1...
[Shiprocket] Order creation response: { order_id: 12345, shipment_id: 12346 }
[Shiprocket] Assigning AWB to shipment 12346...
[Shiprocket] AWB assignment response: { success: true, awb_code: 'ABL123456789' }
```

### Check Order Status
```javascript
// MongoDB command
db.orders.findOne({ _id: ObjectId('...') })
  .then(order => console.log(order.shipmentDetail))
```

### Verify Shiprocket Connection
```javascript
// In Node.js console
const shiprocketService = require('./services/shiprocket');
const token = await shiprocketService.getToken();
console.log(token ? 'Connected' : 'Connection failed');
```

## Best Practices

1. **Always include shipping information** in order creation
2. **Validate payment status** before creating shipments
3. **Handle Shiprocket errors gracefully** - don't fail order if shipment fails
4. **Cache tracking numbers** for faster customer lookups
5. **Implement webhook verification** for security
6. **Set order_date** in proper format for Shiprocket
7. **Use correct dimensions** for accurate shipping cost
8. **Provide accurate product weights** for courier assignment

## Troubleshooting

### Orders not appearing in Shiprocket
- Check: Order status is "paid" or "shipped"
- Check: Payment status is "completed"
- Check: Shiprocket email/password are correct
- Check: Network connectivity to Shiprocket API

### AWB numbers not assigned
- Check: Shiprocket account has active balance
- Check: Pickup location is verified
- Check: Shipment was created successfully first
- Check: Shiprocket API response for errors

### Tracking information not updating
- Check: Webhooks are enabled in Shiprocket
- Check: Webhook URL is accessible
- Check: Shipment status in Shiprocket dashboard
- Check: Order has valid shipmentId

## Support

For issues with:
- **Shiprocket API**: Contact Shiprocket support
- **Application code**: Check console logs and error messages
- **Webhook integration**: Verify webhook configuration

---
**Last Updated**: February 2024
**Version**: 1.0
