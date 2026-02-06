# Shiprocket Setup - Getting Started in 5 Minutes

## Step 1: Get Shiprocket Credentials (2 minutes)

1. Go to [Shiprocket Dashboard](https://dashboard.shiprocket.in)
2. Login to your account
3. Go to **Settings**
4. Note down:
   - Email address (the one used for account)
   - Password (account password)
   - Verify pickup location is set to "Primary"

## Step 2: Update Environment File (1 minute)

Edit `backend/.env`:

```env
SHIPROCKET_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_password
SHIPROCKET_PICKUP=Primary
```

**⚠️ Important**: Never commit `.env` to git!

## Step 3: Restart Backend (1 minute)

```bash
cd backend
npm install  # if needed
npm start
```

Check logs for:
```
✓ Server running on port 5000
✓ Database connected
```

## Step 4: Create Test Order (1 minute)

### Via Frontend
1. Go to http://localhost:3000
2. Add products to cart
3. Checkout with test card: `4242 4242 4242 4242`
4. Order created ✓

### Via API
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
    "items": [{"product": "PRODUCT_ID", "title": "Test", "price": 100, "quantity": 1}],
    "total": 100,
    "paymentStatus": "completed",
    "status": "paid"
  }'
```

## Step 5: Verify Integration Works

### Check Backend Logs
```
[Order] Created order: 65a1b2c3d4e5f6g7h8i9j0k1
[Order] Shiprocket shipment created: { shipmentId: 12345, awbCode: 'ABL123456789' }
```

### Check Database
```bash
# MongoDB
db.orders.findOne({shipmentId:{$exists:true}})

# Should show shipmentDetail with AWB code
```

### Track Order
```bash
curl -X POST http://localhost:5000/api/shiprocket/track-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "test@example.com"
  }'
```

## Common Issues & Quick Fixes

### Issue: "Credentials not configured"
**Fix**: Check `.env` file has correct email/password
```bash
cat backend/.env | grep SHIPROCKET
```

### Issue: "Order created but no shipment"
**Fix**: Ensure `paymentStatus: 'completed'` is set
```javascript
// Must have:
{
  paymentStatus: 'completed'  // ← Important!
}
// Not:
{
  paymentStatus: 'pending'    // ✗ Won't create shipment
}
```

### Issue: "Cannot read property 'shipmentId' of null"
**Fix**: Order creation failed. Check error response:
```bash
# Check MongoDB
db.orders.find({}).pretty()
# Check backend logs for validation errors
```

### Issue: "Shiprocket API Error"
**Fix**: 
1. Verify email/password correct
2. Check Shiprocket account is active
3. Verify pickup location exists
4. Check internet connection

## Verification Checklist

After setup, verify:

- [ ] `.env` has `SHIPROCKET_EMAIL` set
- [ ] `.env` has `SHIPROCKET_PASSWORD` set
- [ ] Backend starts without errors
- [ ] Can create order via API
- [ ] Order has `shipmentId` in database
- [ ] Order has `trackingNumber` set
- [ ] Tracking endpoint returns data
- [ ] No errors in backend logs

## What Should Happen

### When Order is Created with paymentStatus='completed':

1. ✓ Order saved to MongoDB with status='paid'
2. ✓ Shiprocket authenticates with credentials
3. ✓ Order sent to Shiprocket API
4. ✓ Gets back `shipment_id` and `order_id`
5. ✓ Requests AWB (tracking number) assignment
6. ✓ Gets back `awb_code` and `courier_name`
7. ✓ Order updated with tracking details
8. ✓ Response sent to frontend with tracking number
9. ✓ Customer sees tracking number
10. ✓ Order status changes to 'shipped'

### Expected Response:
```javascript
{
  item: {
    _id: "65a1b2c3d4e5f6g7h8i9j0k1",
    shipmentId: 12345,
    trackingNumber: "ABL123456789",
    status: "shipped",
    shipmentDetail: {
      awb_code: "ABL123456789",
      courier_name: "DHL Express"
    }
  }
}
```

## Next: Configure Webhooks (Optional but Recommended)

Once orders are shipping:

1. Go to Shiprocket Dashboard
2. Settings → Webhooks
3. Add webhook:
   - **URL**: `https://yourdomain.com/api/shiprocket/webhook`
   - **Events**: Select all
   - **Method**: POST
4. Test webhook
5. Order status updates in real-time

### Without Webhooks:
- Orders track fine
- Status updates are delayed
- Manual refresh needed

### With Webhooks:
- Real-time status updates
- Instant customer notifications
- Automatic email alerts

## Production Deployment

When going live:

```bash
# 1. Ensure .env not in git
echo ".env" >> .gitignore

# 2. Set production credentials securely
# Use environment variables or secrets manager

# 3. Test with real account (not test mode)

# 4. Configure webhooks

# 5. Deploy
npm start
```

## Key Files to Know

| File | What It Does |
|------|---------|
| `backend/services/shiprocket.js` | Shiprocket API calls |
| `backend/routes/shiprocket.js` | Webhook & tracking endpoints |
| `backend/controller/orderController.js` | Order creation & shipment trigger |
| `SHIPROCKET_INTEGRATION_GUIDE.md` | Complete technical docs |

## Getting Help

1. **For integration questions**: 
   - Read `SHIPROCKET_INTEGRATION_GUIDE.md`
   - Check `SHIPROCKET_QUICK_REFERENCE.md`

2. **For testing**:
   - Follow `SHIPROCKET_TESTING_GUIDE.md`

3. **For Shiprocket API issues**:
   - Contact Shiprocket: support@shiprocket.in
   - Check: https://developers.shiprocket.in/api/

4. **For code issues**:
   - Check backend logs
   - Check MongoDB orders
   - Verify .env configuration

## Testing Checklist

```bash
# 1. Backend running?
curl http://localhost:5000/api/commerce/orders -H "Authorization: Bearer token"

# 2. Shiprocket connected?
# Check logs for: "[Shiprocket] Token obtained successfully"

# 3. Can create orders?
# POST to /api/commerce/orders (create test order above)

# 4. Shipments created?
# Check MongoDB: db.orders.findOne({shipmentId:{$exists:true}})

# 5. Tracking works?
# POST to /api/shiprocket/track-order (track test order)
```

## That's It! 🎉

Your Shiprocket integration is now:
- ✅ Configured
- ✅ Connected
- ✅ Working
- ✅ Ready for use

**Next Steps**:
1. Create a few test orders
2. Verify tracking numbers
3. Configure webhooks for production
4. Train support team
5. Deploy to production

---

**Have questions?** See the detailed documentation files in the project.
