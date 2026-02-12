const axios = require("axios");

const SHIPROCKET_URL =
  process.env.SHIPROCKET_URL || "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

// Dummy function to simulate external shipping rate calculation
async function calculateExternalShippingRate(
  destinationPincode,
  dimension,
  isInternational,
) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseRate = isInternational ? 500 : 50; // INR
      const weightCharge =
        (dimension.weight || 0.5) * (isInternational ? 100 : 10);
      const volumetricCharge =
        ((dimension.length * dimension.breadth * dimension.height) / 5000) *
        (isInternational ? 20 : 2); // Assuming volumetric weight factor of 5000
      const finalCharge = baseRate + weightCharge + volumetricCharge;
      resolve(finalCharge);
    }, 500); // Simulate API call delay
  });
}

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get authentication token from Shiprocket.
 * Requires API user credentials (Settings → API → Create API user), not main account login.
 */
async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    console.log("[Shiprocket] Using cached token");
    return cachedToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error(
      "Shiprocket credentials not set. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to .env",
    );
  }

  try {
    console.log("[Shiprocket] Requesting new authentication token...");
    const res = await axios.post(`${SHIPROCKET_URL}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    if (!res.data.token) {
      cachedToken = null;
      throw new Error("Shiprocket login succeeded but no token in response.");
    }

    cachedToken = res.data.token;
    tokenExpiresAt = now + 8 * 60 * 1000;
    console.log("[Shiprocket] Token obtained successfully");
    return cachedToken;
  } catch (err) {
    cachedToken = null;
    const status = err.response?.status;
    const data = err.response?.data;
    const msg =
      typeof data === "string"
        ? data
        : data?.message ||
        data?.error ||
        data?.msg ||
        data?.errors ||
        (data && JSON.stringify(data));

    const fullMsg = msg || err.message;
    console.error("[Shiprocket] Token request failed:", status, fullMsg);
    if (data)
      console.error(
        "[Shiprocket] Response body:",
        typeof data === "string" ? data : JSON.stringify(data),
      );

    if (status === 403) {
      throw new Error(
        "Shiprocket 403: Use API user, not main login. " +
        "Go to app.shiprocket.in → Settings → API → Create API User, then set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env. " +
        (fullMsg ? ` Details: ${fullMsg}` : ""),
      );
    }
    if (status === 401) {
      throw new Error(
        "Shiprocket 401: Invalid email or password. " +
        (fullMsg ? String(fullMsg) : ""),
      );
    }
    throw new Error("Shiprocket auth failed: " + fullMsg);
  }
}

/** Like reference: getHeaders() for use in API calls. Throws on auth failure so error reaches response. */
async function getHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Assign AWB to a shipment
 */
async function assignAwbToShipment(shipmentId, courierId = null) {
  try {
    const token = await getToken();
    if (!token || !shipmentId) {
      console.error(
        "[Shiprocket] Cannot assign AWB: Missing token or shipmentId",
      );
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
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[Shiprocket] AWB assignment response:", res.data);

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
    console.error("[Shiprocket] AWB assignment failed:", err.message);
    return null;
  }
}

/**
 * Create shipment for order in Shiprocket
 */
exports.createShipmentForOrder = async (order) => {
  const headers = await getHeaders();
  const token = headers.Authorization?.replace("Bearer ", "") || null;
  if (!token) {
    throw new Error(
      "Shiprocket: No token. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD (API user) in .env.",
    );
  }

  try {
    console.log(`[Shiprocket] Creating shipment for order ${order._id}...`);

    const items = order.items.map((item, index) => ({
      name: item.name || item.title || `Item ${index + 1}`,
      sku: String(item.product || ""),
      units: item.qty || item.quantity,
      // Use converted price if international order, otherwise use original
      selling_price: item.price,
    }));

    const shippingInfo = order.shippingInfo || {};
    const dimension = order.dimension || {
      length: 10,
      breadth: 10,
      height: 5,
      weight: 0.5,
    };
    const pincode = (shippingInfo.pincode || order.pincode || "")
      .toString()
      .trim();
    const billingPincode = /^\d{6}$/.test(pincode) ? pincode : "400001";
    const phone =
      (shippingInfo.phone || order.customerPhone || "")
        .toString()
        .replace(/\D/g, "")
        .slice(0, 10) || "9999999999";
    const businessOrderId = "ORD_" + Date.now();

    // ===== USE CONVERTED INR AMOUNTS FOR SHIPROCKET =====
    // If order is international and has been converted to INR, use those amounts
    // Otherwise use original amounts
    const subTotalForShiprocket = Number(order.subTotal || order.total || 0);

    console.log('[Shiprocket] Order amount details:', {
      isInternational: order.isInternational,
      originalCurrency: order.originalCurrency,
      subTotal: order.subTotal,
      shippingCharges: order.shippingCharges,
      total: order.total,
      subTotalForShiprocket,
    });

    const payload = {
      order_id: businessOrderId,
      order_date:
        order.order_date ||
        new Date(order.createdAt || Date.now()).toISOString().split("T")[0],
      pickup_location: process.env.SHIPROCKET_PICKUP || "Primary",
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || "",
      billing_customer_name:
        shippingInfo.firstName || order.customerName || "Customer",
      billing_last_name: shippingInfo.lastName || "",
      billing_address: (shippingInfo.address || order.address || "NA")
        .toString()
        .slice(0, 200),
      billing_city: (shippingInfo.city || "Mumbai").toString().slice(0, 50),
      billing_pincode: billingPincode,
      billing_state: (shippingInfo.state || "Maharashtra")
        .toString()
        .slice(0, 50),
      billing_country: shippingInfo.country || "India",
      billing_email:
        (shippingInfo.email || order.customerEmail || "").toString().trim() ||
        "no-email@placeholder.in",
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items,
      payment_method: order.paymentStatus === "completed" ? "Prepaid" : "COD",
      // Use converted amounts if international, otherwise use original
      sub_total: subTotalForShiprocket,
      length: Number(dimension.length || 10),
      breadth: Number(dimension.breadth || 10),
      height: Number(dimension.height || 5),
      weight: Number(dimension.weight || 0.5),
    };

    const res = await axios.post(
      `${SHIPROCKET_URL}/orders/create/adhoc`,
      payload,
      { headers },
    );

    console.log("[Shiprocket] Order creation response:", res.data);

    const data = res.data?.data || res.data;
    if (data.status_code === 0) {
      const apiMsg =
        data.message || data.status_message || JSON.stringify(data);
      console.error("[Shiprocket] API returned status_code 0:", apiMsg);
      throw new Error(`Shiprocket: ${apiMsg}`);
    }
    const orderId = data.order_id ?? res.data.order_id;
    const shipmentId = data.shipment_id ?? res.data.shipment_id;
    if (!orderId || !shipmentId) {
      const msg =
        "Shiprocket did not return order_id or shipment_id. Check pickup location and address.";
      console.error("[Shiprocket]", msg, res.data);
      throw new Error(msg);
    }

    // Assign AWB
    const awbData = await assignAwbToShipment(shipmentId);

    const shipmentDetail = {
      pickup_location_added:
        data.pickup_location_added || res.data.pickup_location_added || 0,
      order_created: data.order_created ?? res.data.order_created ?? 1,
      awb_generated: awbData
        ? 1
        : (data.awb_generated ?? res.data.awb_generated ?? 0),
      label_generated: data.label_generated ?? res.data.label_generated ?? 0,
      pickup_generated: data.pickup_generated ?? res.data.pickup_generated ?? 0,
      manifest_generated:
        data.manifest_generated ?? res.data.manifest_generated ?? 0,
      pickup_scheduled_date:
        data.pickup_scheduled_date || res.data.pickup_scheduled_date || null,
      pickup_booked_date:
        data.pickup_booked_date || res.data.pickup_booked_date || null,
      order_id: orderId,
      shipment_id: shipmentId,
      awb_code: awbData?.awb_code || data.awb_code || res.data.awb_code || "",
      courier_company_id:
        awbData?.courier_company_id ||
        data.courier_company_id ||
        res.data.courier_company_id ||
        "",
      courier_name:
        awbData?.courier_name ||
        data.courier_name ||
        res.data.courier_name ||
        "",
      assigned_date_time:
        awbData?.assigned_date_time ||
        data.assigned_date_time ||
        res.data.assigned_date_time ||
        "",
      applied_weight:
        data.applied_weight ??
        res.data.applied_weight ??
        dimension.weight ??
        0.5,
      cod: data.cod ?? res.data.cod ?? 0,
      label_url: data.label_url || res.data.label_url || null,
      manifest_url: data.manifest_url || res.data.manifest_url || null,
      awb_assign_error:
        data.awb_assign_error || res.data.awb_assign_error || "",
      order_shipment_id: data.order_shipment_id || shipmentId,
      channel_order_id: String(order._id),
    };

    return {
      shipmentDetail,
      shipmentId,
      orderId,
      awbCode: awbData?.awb_code || data.awb_code || res.data.awb_code || null,
      courierName:
        awbData?.courier_name ||
        data.courier_name ||
        res.data.courier_name ||
        null,
    };
  } catch (err) {
    if (err.response?.data) {
      const d = err.response.data;
      const apiMsg =
        d.message ||
        d.status_message ||
        d.errors ||
        (typeof d === "string" ? d : JSON.stringify(d));
      console.error("[Shiprocket] API error:", err.response.status, apiMsg);
      throw new Error(`Shiprocket: ${apiMsg}`);
    }
    console.error("[Shiprocket] Shipment creation failed:", err.message);
    throw err;
  }
};

/**
 * Calculate shipping charges based on destination and package dimensions/weight.
 * Uses a dummy function for external rate calculation. In a real scenario, this
 * would integrate with a shipping API (like Shiprocket's rate calculator).
 */
exports.calculateShippingCharges = async (orderPayload) => {
  const shippingInfo = orderPayload.shippingInfo || {};
  const destinationPincode = (
    shippingInfo.pincode ||
    orderPayload.pincode ||
    ""
  )
    .toString()
    .trim();
  const destinationCountry = (
    shippingInfo.country ||
    orderPayload.shippingCountry ||
    "India"
  )
    .toString()
    .trim();
  const dimension = orderPayload.dimension || {
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.5,
  };

  // Determine if it's an international order (for simplicity, only India is domestic)
  const isInternational = destinationCountry.toLowerCase() !== "india";

  let shippingCharges = 0;

  // For real implementation, integrate with Shiprocket's rate calculator API here
  // For now, use a dummy function
  shippingCharges = await calculateExternalShippingRate(
    destinationPincode,
    dimension,
    isInternational,
  );

  return { shippingCharges, isInternational };
};

exports.authenticate = getToken;
exports.getHeaders = getHeaders;

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
      },
    );

    return res.data;
  } catch (err) {
    console.error("[Shiprocket] Tracking failed:", err.message);
    return null;
  }
};

/**
 * Get shipment tracking by AWB code from Shiprocket
 * Shiprocket API: /courier/track/awb/{awb}
 */
exports.getAwbTracking = async (awb) => {
  try {
    const token = await getToken();
    if (!token || !awb) return null;

    const awbCode = String(awb).trim();
    if (!awbCode) return null;

    console.log(`[Shiprocket] Fetching tracking for AWB ${awbCode}...`);

    const res = await axios.get(`${SHIPROCKET_URL}/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (err) {
    console.error("[Shiprocket] AWB tracking failed:", err.message);
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
      },
    );

    return res.data;
  } catch (err) {
    console.error("[Shiprocket] Get order failed:", err.message);
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
      order.order_date = new Date(order.createdAt)
        .toISOString()
        .replace("T", " ")
        .split(".")[0];
    }

    return order;
  } catch (err) {
    console.error("[Shiprocket] Update failed:", err.message);
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
      return_reason: returnData.returnReason || "Product defective",
      return_comments: returnData.returnComments || "",
    };

    const res = await axios.post(
      `${SHIPROCKET_URL}/orders/create/return`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const returnOrderDetail = {
      order_id: res.data.order_id,
      channel_order_id: `RET-${orderId}`,
      shipment_id: res.data.shipment_id,
      status: res.data.status || "RETURN PENDING",
      status_code: res.data.status_code || 21,
      company_name: returnData.companyName || "",
      is_qc_check: res.data.is_qc_check || 0,
    };

    return {
      returnOrderDetail,
      returnShipmentId: res.data.shipment_id,
    };
  } catch (err) {
    console.error("[Shiprocket] Return order creation failed:", err.message);
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
    console.error("[Shiprocket] Webhook processing failed:", err);
    return null;
  }
};

module.exports.getToken = getToken;
