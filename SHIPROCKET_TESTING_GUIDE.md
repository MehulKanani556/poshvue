# Shiprocket Integration Testing Guide

## Pre-Testing Checklist

- [ ] Shiprocket account created and verified
- [ ] Shiprocket credentials set in `.env`
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Test products created in database
- [ ] Stripe keys configured

## Environment Setup

### Step 1: Configure Shiprocket Credentials

Edit `backend/.env`:
```env
SHIPROCKET_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_password
SHIPROCKET_PICKUP=Primary
```

### Step 2: Verify Database Connection

```bash
# In backend directory
npm install
node index.js
```

Check console output:
```
✓ Database connected
✓ Server running on port 5000
```

## Test Scenarios

### Test 1: Basic Order Creation

**Objective**: Create an order and verify Shiprocket shipment is created

**Steps**:
1. Go to frontend: http://localhost:3000
2. Add products to cart
3. Proceed to checkout
4. Enter test credentials:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "9876543210"
   - Address: "123 Main St, Mumbai"
   - Pincode: "400001"
5. Select payment method
6. Enter test card: 4242 4242 4242 4242 (Stripe test card)
7. Complete payment

**Expected Results**:
- Order created successfully
- Shiprocket shipment created (check backend logs)
- Tracking number assigned
- Order status changes to "shipped"
- Customer receives confirmation

**Verification**:
```bash
# Check backend logs for:
[Order] Created order: 65a1b2c3d4e5f6g7h8i9j0k1
[Order] Shiprocket shipment created: { shipmentId: 12345, awbCode: 'ABL123456789' }

# MongoDB check:
db.orders.findOne({ _id: ObjectId('65a1b2c3d4e5f6g7h8i9j0k1') })
# Should show shipmentDetail and trackingNumber
```

---

### Test 2: Track Order

**Objective**: Verify order tracking functionality

**Steps**:
1. After order is created, note the Order ID from URL
2. Go to `http://localhost:3000/TrackOrder`
3. Enter:
   - Order ID: (from previous order)
   - Email: test@example.com
4. Click "Track Order"

**Expected Results**:
- Order details displayed
- Tracking number shown
- Current delivery status visible
- Estimated delivery date shown

**Verification**:
```bash
# API endpoint test:
curl -X POST http://localhost:5000/api/shiprocket/track-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "test@example.com"
  }'

# Response should include:
# - order.trackingNumber
# - order.shipmentDetail
# - tracking (live from Shiprocket)
```

---

### Test 3: Multiple Orders

**Objective**: Test bulk order creation and shipment

**Steps**:
1. Create 3-5 orders with different products
2. Verify each creates separate shipments in Shiprocket
3. Check that different AWB codes are assigned

**Expected Results**:
- All orders successfully created
- Each has unique shipmentId
- Each has unique AWB code
- All appear in order tracking

**Verification**:
```javascript
// MongoDB check:
db.orders.find({ 
  shipmentId: { $exists: true, $ne: null } 
}).pretty()

// Should show multiple orders with different shipmentIds
```

---

### Test 4: Error Handling

**Objective**: Test system behavior when errors occur

**Test 4a: Missing Shiprocket Credentials**

**Steps**:
1. Remove SHIPROCKET_EMAIL from `.env`
2. Restart backend
3. Try to create an order

**Expected Results**:
- Order created successfully (local)
- Shiprocket integration skipped gracefully
- Error logged: "[Shiprocket] ERROR: Credentials not configured"
- Order status: "pending" (not shipped automatically)

**Test 4b: Invalid Order Data**

**Steps**:
1. Use API to create order with missing fields:
   ```bash
   curl -X POST http://localhost:5000/api/commerce/orders \
     -H "Authorization: Bearer INVALID_TOKEN" \
     -d '{ "items": [] }'
   ```

**Expected Results**:
- 400 error returned
- Message: "Order must have at least one item"
- No order created

**Test 4c: Payment Not Completed**

**Steps**:
1. Create order with `paymentStatus: "pending"`

**Expected Results**:
- Order created successfully
- Shiprocket shipment NOT created
- Order status remains "pending"
- Need to manually trigger shipment creation

---

### Test 5: Admin Features

**Objective**: Test admin functions for order management

**Steps**:
1. Login as admin
2. Go to Orders page
3. View all orders with shipment details

**Expected Results**:
- All orders visible with Shiprocket details
- Tracking numbers displayed
- Courier information shown
- Status updates reflected

**Verification**:
```bash
# Admin API endpoint:
curl -X GET http://localhost:5000/api/commerce/orders \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Test 6: Webhook Reception

**Objective**: Verify webhook handling from Shiprocket

**Setup**:
1. Configure Shiprocket dashboard to send webhooks to:
   `http://localhost:5000/api/shiprocket/webhook`

**Simulate Webhook**:
```bash
curl -X POST http://localhost:5000/api/shiprocket/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "awb_assigned",
    "shipment_id": 12345,
    "order_id": 54321,
    "data": {
      "awb_code": "ABL987654321",
      "courier_name": "DHL Express",
      "assigned_date_time": "2024-02-06T10:30:00Z"
    }
  }'
```

**Expected Results**:
- Webhook processed successfully
- Order updated in database
- Status: 200 OK

**Verification**:
```bash
# Check logs for:
[Webhook] Received Shiprocket webhook
[Webhook] Order updated: { orderId: '...', status: 'shipped' }
```

---

### Test 7: Shipment Tracking Endpoint

**Objective**: Test authenticated tracking endpoint

**Steps**:
```bash
# Get tracking for authenticated user
curl -X GET http://localhost:5000/api/shiprocket/tracking/12345 \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Results**:
- 200 OK
- Real-time tracking data from Shiprocket
- Order details included
- Current location and status shown

---

## Performance Testing

### Test Load: Multiple Simultaneous Orders

**Setup**:
```javascript
// test-orders.js
const axios = require('axios');

async function createTestOrders(count = 5) {
  const token = 'YOUR_TEST_TOKEN';
  
  for (let i = 0; i < count; i++) {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/commerce/orders',
        {
          customerName: `Test User ${i}`,
          customerEmail: `test${i}@example.com`,
          customerPhone: '9876543210',
          address: '123 Main St, Mumbai',
          pincode: '400001',
          items: [...],
          total: 999,
          paymentStatus: 'completed',
          status: 'paid'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`Order ${i+1} created:`, res.data.item._id);
    } catch (err) {
      console.error(`Order ${i+1} failed:`, err.message);
    }
  }
}

createTestOrders(5);
```

**Run**:
```bash
node test-orders.js
```

**Expected Results**:
- All 5 orders created successfully
- Each gets unique Shiprocket shipment
- Completion time: < 30 seconds
- No memory leaks
- All tracking numbers assigned

---

## Database Verification

### Check Order with Shipment Details

```bash
# MongoDB shell
use poshvue
db.orders.findOne({ shipmentId: { $exists: true } })
```

**Expected Output**:
```javascript
{
  _id: ObjectId('65a1b2c3d4e5f6g7h8i9j0k1'),
  customerName: 'Test User',
  status: 'shipped',
  paymentStatus: 'completed',
  shipmentId: 12345,
  trackingNumber: 'ABL123456789',
  orderId: 12345,
  shipmentDetail: {
    order_id: 12345,
    shipment_id: 12346,
    awb_code: 'ABL123456789',
    awb_generated: 1,
    courier_company_id: '3',
    courier_name: 'DHL Express',
    assigned_date_time: '2024-02-06T10:30:00.000Z',
    label_url: 'https://...',
    pickup_scheduled_date: '2024-02-07T00:00:00.000Z',
    ...
  }
}
```

### Check Failing Orders

```bash
db.orders.find({ 
  shipmentId: { $exists: false },
  paymentStatus: 'completed'
}).pretty()
```

If any found, check logs for Shiprocket errors.

---

## Stress Testing

### Test 1: Rapid API Calls

```bash
# Send 20 tracking requests in 5 seconds
for i in {1..20}; do
  curl -X POST http://localhost:5000/api/shiprocket/track-order \
    -H "Content-Type: application/json" \
    -d '{"orderId":"65a1b2c3d4e5f6g7h8i9j0k1","email":"test@example.com"}' &
done
```

**Expected**: All complete without error

### Test 2: Large Payload Order

```bash
# Order with 50 items
curl -X POST http://localhost:5000/api/commerce/orders \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "items": [... 50 items ...],
    "total": 49999,
    ...
  }'
```

**Expected**: Order created, Shiprocket handles it

---

## Cleanup After Testing

```bash
# Delete test orders
db.orders.deleteMany({ customerEmail: /test\d+@example\.com/ })

# Delete test Shiprocket orders (admin dashboard)
# Go to Shiprocket dashboard → Orders → Filter test orders → Delete
```

---

## Test Results Report

**Test Date**: __________
**Backend Version**: v1.0
**Shiprocket Integration**: Active

| Test | Result | Notes |
|------|--------|-------|
| Order Creation | ✓/✗ | |
| Shipment Creation | ✓/✗ | |
| AWB Assignment | ✓/✗ | |
| Tracking | ✓/✗ | |
| Webhooks | ✓/✗ | |
| Error Handling | ✓/✗ | |
| Performance | ✓/✗ | |

**Issues Found**:
- [ ] None

**Action Items**:
- [ ] None

---

## Debugging Commands

### Monitor Real-time Logs
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Watch for Shiprocket logs
tail -f backend.log | grep "Shiprocket"
```

### Test Token Generation
```javascript
// nodejs console
const shiprocket = require('./backend/services/shiprocket');
const token = await shiprocket.getToken();
console.log(token);
```

### Check Shiprocket Account
```bash
# Verify credentials
curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

---

**Next Steps After Testing**:
1. ✓ Deploy to staging environment
2. ✓ Test with real Shiprocket account
3. ✓ Configure webhooks in Shiprocket
4. ✓ Deploy to production
5. ✓ Monitor order creation in production
