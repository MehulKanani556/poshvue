const axios = require('axios');

const SHIPROCKET_URL = process.env.SHIPROCKET_URL || 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get authentication token from Shiprocket
 */
async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    console.log('[Shiprocket] Using cached token');
    return cachedToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    console.error('[Shiprocket] ERROR: Credentials not configured');
    return null;
  }

  try {
    console.log('[Shiprocket] Requesting new authentication token...');
    const res = await axios.post(`${SHIPROCKET_URL}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    if (!res.data.token) {
      console.error('[Shiprocket] No token in response');
      return null;
    }

    cachedToken = res.data.token;
    tokenExpiresAt = now + 8 * 60 * 1000;
    console.log('[Shiprocket] Token obtained successfully');

    return cachedToken;
  } catch (err) {
    console.error('[Shiprocket] Token request failed:', err.message);
    return null;
  }
}

/**
 * Assign AWB to a shipment
 */
async function assignAwbToShipment(shipmentId, courierId = null) {
  try {
    const token = await getToken();
    if (!token || !shipmentId) {
      console.error('[Shiprocket] Cannot assign AWB: Missing token or shipmentId');
      return null;
    }

    console.log(`[Shiprocket] Assigning AWB to shipment ${shipmentId}...`);

    const payload = { shipment_id: shipmentId };
    if (courierId) payload.courier_id = courierId;

    const res = await axios.post(
      `${SHIPROCKET_URL}/courier/assign/awb`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[Shiprocket] AWB assignment response:', res.data);

    if (res.data.success) {
      return {
        awb_code: res.data.awb_code,
        courier_name: res.data.courier_name,
        courier_company_id: res.data.courier_company_id,
        assigned_date_time: new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error('[Shiprocket] AWB assignment failed:', err.message);
    return null;
  }
}

/**
 * Create shipment for order in Shiprocket
 */
exports.createShipmentForOrder = async (order) => {
  try {
    const token = await getToken();
    if (!token) {
      console.error('[Shiprocket] Cannot create shipment: No token');
      return null;
    }

    console.log(`[Shiprocket] Creating shipment for order ${order._id}...`);

    const items = order.items.map((item, index) => ({
      name: item.name || item.title || `Item ${index + 1}`,
      sku: String(item.product || ''),
      units: item.qty || item.quantity,
      selling_price: item.price,
    }));

    const shippingInfo = order.shippingInfo || {};
    const dimension = order.dimension || { length: 10, breadth: 10, height: 5, weight: 0.5 };
    const pincode = (shippingInfo.pincode || order.pincode || '').toString().trim();
    const billingPincode = /^\d{6}$/.test(pincode) ? pincode : '400001';
    const phone = (shippingInfo.phone || order.customerPhone || '').toString().replace(/\D/g, '').slice(0, 10) || '9999999999';

    const payload = {
      order_id: String(order._id),
      order_date: order.order_date || new Date(order.createdAt || Date.now()).toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP || 'Primary',
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || '',
      billing_customer_name: shippingInfo.firstName || order.customerName || 'Customer',
      billing_last_name: shippingInfo.lastName || '',
      billing_address: (shippingInfo.address || order.address || 'NA').toString().slice(0, 200),
      billing_city: (shippingInfo.city || 'Mumbai').toString().slice(0, 50),
      billing_pincode: billingPincode,
      billing_state: (shippingInfo.state || 'Maharashtra').toString().slice(0, 50),
      billing_country: shippingInfo.country || 'India',
      billing_email: (shippingInfo.email || order.customerEmail || '').toString().trim() || 'no-email@placeholder.in',
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items,
      payment_method: order.paymentStatus === 'completed' ? 'Prepaid' : 'COD',
      sub_total: Number(order.subTotal || order.total || 0),
      length: Number(dimension.length || 10),
      breadth: Number(dimension.breadth || 10),
      height: Number(dimension.height || 5),
      weight: Number(dimension.weight || 0.5),
    };

    const res = await axios.post(
      `${SHIPROCKET_URL}/orders/create/adhoc`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[Shiprocket] Order creation response:', res.data);

    if (res.data.status_code === 0) {
      console.error('[Shiprocket] API returned status_code 0:', res.data.message || res.data);
      return null;
    }
    if (!res.data.order_id || !res.data.shipment_id) {
      console.error('[Shiprocket] Invalid response: Missing order_id or shipment_id');
      return null;
    }

    // Assign AWB
    const awbData = await assignAwbToShipment(res.data.shipment_id);

    const shipmentDetail = {
      pickup_location_added: res.data.pickup_location_added || 0,
      order_created: res.data.order_created || 1,
      awb_generated: awbData ? 1 : (res.data.awb_generated || 0),
      label_generated: res.data.label_generated || 0,
      pickup_generated: res.data.pickup_generated || 0,
      manifest_generated: res.data.manifest_generated || 0,
      pickup_scheduled_date: res.data.pickup_scheduled_date || null,
      pickup_booked_date: res.data.pickup_booked_date || null,
      order_id: res.data.order_id,
      shipment_id: res.data.shipment_id,
      awb_code: awbData?.awb_code || res.data.awb_code || '',
      courier_company_id: awbData?.courier_company_id || res.data.courier_company_id || '',
      courier_name: awbData?.courier_name || res.data.courier_name || '',
      assigned_date_time: awbData?.assigned_date_time || res.data.assigned_date_time || '',
      applied_weight: res.data.applied_weight || dimension.weight || 0.5,
      cod: res.data.cod || 0,
      label_url: res.data.label_url || null,
      manifest_url: res.data.manifest_url || null,
      awb_assign_error: res.data.awb_assign_error || '',
      order_shipment_id: res.data.order_shipment_id || res.data.shipment_id,
      channel_order_id: String(order._id),
    };

    return {
      shipmentDetail,
      shipmentId: res.data.shipment_id,
      orderId: res.data.order_id,
      awbCode: awbData?.awb_code || res.data.awb_code || null,
      courierName: awbData?.courier_name || res.data.courier_name || null,
    };
  } catch (err) {
    console.error('[Shiprocket] Shipment creation failed:', err.message);
    return null;
  }
};

/**
 * Get shipment tracking details from Shiprocket
 */
exports.getShipmentTracking = async (shipmentId) => {
  try {
    const token = await getToken();
    if (!token || !shipmentId) return null;

    console.log(`[Shiprocket] Fetching tracking for shipment ${shipmentId}...`);

    const res = await axios.get(
      `${SHIPROCKET_URL}/courier/track/shipment/${shipmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error('[Shiprocket] Tracking failed:', err.message);
    return null;
  }
};

/**
 * Get order by Shiprocket order ID
 */
exports.getOrderByShiprocketId = async (shiprocketOrderId) => {
  try {
    const token = await getToken();
    if (!token || !shiprocketOrderId) return null;

    const res = await axios.get(
      `${SHIPROCKET_URL}/orders/show/${shiprocketOrderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error('[Shiprocket] Get order failed:', err.message);
    return null;
  }
};

/**
 * Update order with Shiprocket shipment data
 */
exports.updateOrderWithShipmentData = async (order, shiprocketData) => {
  try {
    if (!shiprocketData) return order;

    order.orderId = shiprocketData.orderId;
    order.shipmentId = shiprocketData.shipmentId;
    order.shipmentDetail = shiprocketData.shipmentDetail;
    order.trackingNumber = shiprocketData.awbCode || shiprocketData.shipmentId;

    if (!order.order_date) {
      order.order_date = new Date(order.createdAt).toISOString().replace('T', ' ').split('.')[0];
    }

    return order;
  } catch (err) {
    console.error('[Shiprocket] Update failed:', err.message);
    return order;
  }
};

/**
 * Create return order
 */
exports.createReturnOrder = async (orderId, returnData) => {
  try {
    const token = await getToken();
    if (!token) return null;

    const payload = {
      shipment_id: returnData.shipmentId,
      return_reason: returnData.returnReason || 'Product defective',
      return_comments: returnData.returnComments || '',
    };

    const res = await axios.post(
      `${SHIPROCKET_URL}/orders/create/return`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const returnOrderDetail = {
      order_id: res.data.order_id,
      channel_order_id: `RET-${orderId}`,
      shipment_id: res.data.shipment_id,
      status: res.data.status || 'RETURN PENDING',
      status_code: res.data.status_code || 21,
      company_name: returnData.companyName || '',
      is_qc_check: res.data.is_qc_check || 0,
    };

    return {
      returnOrderDetail,
      returnShipmentId: res.data.shipment_id,
    };
  } catch (err) {
    console.error('[Shiprocket] Return order creation failed:', err.message);
    return null;
  }
};

/**
 * Update shipment status (webhook handler)
 */
exports.updateShipmentStatus = async (webhookData) => {
  try {
    return {
      success: true,
      data: webhookData,
    };
  } catch (err) {
    console.error('[Shiprocket] Webhook processing failed:', err);
    return null;
  }
};

module.exports.getToken = getToken;
