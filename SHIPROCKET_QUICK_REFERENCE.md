# Shiprocket Integration - Quick Reference

## Key Files

| File | Purpose |
|------|---------|
| `backend/services/shiprocket.js` | Shiprocket API service layer |
| `backend/routes/shiprocket.js` | Webhook & tracking endpoints |
| `backend/controller/orderController.js` | Order creation & shipment logic |
| `backend/model/Order.js` | Database schema with shipment fields |

## Core Functions

### Service: `shiprocket.js`

```javascript
// Get authentication token (cached)
getToken() → Promise<string>

// Create shipment and assign AWB
createShipmentForOrder(order) → Promise<shipmentData>

// Get tracking information
getShipmentTracking(shipmentId) → Promise<trackingData>

// Update order with shipment details
updateOrderWithShipmentData(order, shiprocketData) → Promise<order>

// Create return order
createReturnOrder(orderId, returnData) → Promise<returnOrderData>
```

## Order Fields in Database

```javascript
{
  // Shiprocket IDs
  shipmentId: Number,        // Shiprocket shipment ID
  orderId: Number,           // Shiprocket order ID
  trackingNumber: String,    // AWB code / Tracking number
  
  // Shipment Details
  shipmentDetail: {
    order_id: Number,
    shipment_id: Number,
    awb_code: String,        // Tracking number
    courier_name: String,    // e.g. "DHL Express"
    courier_company_id: String,
    assigned_date_time: String,
    label_url: String,       // Shipping label PDF
    manifest_url: String,    // Manifest document
    pickup_scheduled_date: String,
    awb_generated: Number,   // 0 or 1
    order_created: Number,   // 0 or 1
  },
  
  // Status
  status: String,            // "pending", "paid", "shipped", "delivered"
  paymentStatus: String,     // "pending", "completed"
}
```

## Order Status Flow

```
pending (new order)
  ↓
paid (payment confirmed)
  ↓ [Shiprocket creates shipment]
processing (order being picked)
  ↓
shipped (out for delivery)
  ↓
out_for_delivery
  ↓
delivered (completed)
```

## API Endpoints

```
POST   /api/commerce/orders              Create order
GET    /api/commerce/orders              List orders
PUT    /api/commerce/orders/:id/status   Update status

POST   /api/shiprocket/webhook           Receive webhooks
POST   /api/shiprocket/track-order       Public tracking
GET    /api/shiprocket/tracking/:id      Get tracking (auth)
GET    /api/shiprocket/shipment/:id      Get shipment (admin)
```

## Environment Variables

```env
SHIPROCKET_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_EMAIL=your_email@shiprocket.com
SHIPROCKET_PASSWORD=your_password
SHIPROCKET_PICKUP=Primary
```

## Common Code Snippets

### Create Order with Auto-Shipment
```javascript
const order = await Order.create({
  items: [...],
  total: 1000,
  paymentStatus: 'completed',  // ← Triggers shipment
  status: 'paid',
  // ... other fields
});

// Shiprocket shipment auto-created ✓
```

### Manual Shipment Creation
```javascript
const { createShipmentForOrder, updateOrderWithShipmentData } 
  = require('./services/shiprocket');

const order = await Order.findById(orderId);
const shipData = await createShipmentForOrder(order);

if (shipData) {
  await updateOrderWithShipmentData(order, shipData);
  await order.save();
}
```

### Track Order
```javascript
const tracking = await getShipmentTracking(order.shipmentId);
console.log(tracking);
// {
//   status: 'in_transit',
//   current_location: 'Bangalore',
//   estimated_delivery: '2024-02-10'
// }
```

### Handle Webhook
```javascript
POST /api/shiprocket/webhook
{
  "event_type": "awb_assigned",
  "shipment_id": 12345,
  "data": {
    "awb_code": "ABL123456789",
    "courier_name": "DHL"
  }
}
// Order auto-updated with tracking number ✓
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No shipment created | Check `paymentStatus === 'completed'` |
| No AWB assigned | Check Shiprocket account balance |
| Token error | Credentials in .env correct? |
| Tracking null | Wait for webhook / shipment may not have moved |
| Order not found | Verify orderId is correct |

## Log Patterns

```
[Shiprocket] Using cached token              ← Normal
[Shiprocket] Requesting new token...         ← Normal
[Shiprocket] Creating shipment...            ← Creating
[Shiprocket] Assigning AWB...                ← Assigning tracking
[Shiprocket] Shipment created: {shipmentId}  ← Success ✓
[Shiprocket] ERROR:                          ← Check error
[Shiprocket] Webhook received                ← Real-time update
```

## Key Concepts

1. **Order Creation** → Saved to MongoDB, Shiprocket not involved yet
2. **Payment Confirmation** → Triggers Shiprocket shipment creation
3. **Shipment Creation** → Order sent to Shiprocket, gets shipment_id
4. **AWB Assignment** → Shiprocket assigns courier, generates tracking number
5. **Webhooks** → Real-time updates as delivery progresses
6. **Tracking** → Customer can check order status anytime

## Test Data

```javascript
// Test payment-completed order
{
  customerName: "Test User",
  customerEmail: "test@example.com",
  items: [{ product: "ID", quantity: 1, price: 999 }],
  total: 999,
  paymentStatus: "completed",  // ← Important!
  status: "paid"               // ← For shipping
}
```

## Performance Notes

- Token cached for 8 minutes
- 1 order creation = 2 Shiprocket API calls (order + AWB)
- ~500-1000ms per shipment creation
- Tracking queries don't timeout
- Use Promise.all() for bulk operations

## Frontend Integration

```javascript
// After payment success
const orderRes = await axios.post('/api/commerce/orders', {
  items: cartItems,
  total: amount,
  paymentStatus: 'completed',  // ← Triggers shipping
});

// customer gets tracking number immediately
console.log(orderRes.data.item.trackingNumber);

// Track anytime
const tracking = await axios.post(
  '/api/shiprocket/track-order',
  { orderId, email }
);
```

## Admin Tools

```javascript
// Get all shipped orders
db.orders.find({ shipmentId: { $exists: true } })

// Find orders without shipments
db.orders.find({ 
  paymentStatus: 'completed',
  shipmentId: { $exists: false }
})

// Get tracking for order
GET /api/shiprocket/tracking/{shipmentId}
```

## Deployment Checklist

- [ ] Shiprocket email in .env
- [ ] Shiprocket password in .env
- [ ] Pickup location verified in Shiprocket dashboard
- [ ] Webhook URL configured in Shiprocket
- [ ] Stripe keys configured
- [ ] Database backup taken
- [ ] Test order created and tracked
- [ ] CORS origins updated for deployment  
- [ ] Error logging configured
- [ ] Monitoring enabled

---

**Version**: 1.0
**Last Modified**: Feb 2024
