const mongoose = require('mongoose');

/* ---------- Order Item ---------- */
const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    qty: { type: Number }, // alternate field name
    size: { type: String },
    color: { type: String },

    // extra from second schema
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ---------- Shipping Info ---------- */
const ShippingInfoSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
  },
  { _id: false }
);

/* ---------- Dimension ---------- */
const DimensionSchema = new mongoose.Schema(
  {
    length: Number,
    breadth: Number,
    height: Number,
    weight: Number,
  },
  { _id: false }
);

/* ---------- Shipment Detail ---------- */
const ShipmentDetailSchema = new mongoose.Schema(
  {
    pickup_location_added: { type: Number, default: 0 },
    order_created: { type: Number, default: 0 },
    awb_generated: { type: Number, default: 0 },
    label_generated: { type: Number, default: 0 },
    pickup_generated: { type: Number, default: 0 },
    manifest_generated: { type: Number, default: 0 },
    pickup_scheduled_date: String,
    pickup_booked_date: String,
    order_id: Number,
    shipment_id: Number,
    awb_code: String,
    courier_company_id: String,
    courier_name: String,
    assigned_date_time: String,
    applied_weight: Number,
    cod: { type: Number, default: 0 },
    label_url: String,
    manifest_url: String,
  },
  { _id: false }
);

/* ---------- Return Order ---------- */
const ReturnOrderDetailSchema = new mongoose.Schema(
  {
    order_id: Number,
    channel_order_id: String,
    shipment_id: Number,
    status: String,
    status_code: Number,
    company_name: String,
    is_qc_check: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ---------- Main Order Schema ---------- */
const OrderSchema = new mongoose.Schema(
  {
    // ===== ORIGINAL FIELDS (UNCHANGED) =====
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true },
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 }, // For compatibility
    isInternational: { type: Boolean, default: false },
    country: { type: String, default: 'IN' },
    // Store original currency info for international orders
    originalCurrency: { type: String, default: 'INR' },
    originalTotal: { type: Number },
    liveExchangeRate: { type: Number }, // Exchange rate used at time of order
    
    // Original currency data object for complete tracking
    originalData: {
      currency: String,
      exchangeRate: Number,
      subTotal: Number,
      total: Number,
      discount: Number,
      shippingCharges: Number,
      createdAt: Date
    },
    status: {
      type: String,
      enum: [
        'pending',
        'paid',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    address: String,
    paymentIntentId: String,
    shippingData: mongoose.Schema.Types.Mixed,

    // ===== EXTRA FIELDS FROM SECOND SCHEMA =====
    pickup_location: { type: mongoose.Schema.Types.ObjectId },
    shippingInfo: ShippingInfoSchema,
    dimension: DimensionSchema,

    paymentMethod: {
      type: String,
      enum: ['card', 'upi'],
      default: 'card',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    orderId: Number, // Shiprocket order id
    order_date: String,
    shipmentDetail: ShipmentDetailSchema,
    shipmentId: Number,

    returnOrderDetail: ReturnOrderDetailSchema,
    returnShipmentId: Number,

    trackingNumber: String,
    trackingUrl: String,

    // Coupon related fields
    couponCode: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
