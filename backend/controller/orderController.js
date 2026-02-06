const mongoose = require("mongoose");
const { Order } = require("../model");
const {
  createShipmentForOrder,
  updateOrderWithShipmentData,
  getShipmentTracking,
  getOrderByShiprocketId,
} = require("../services/shiprocket");

/**
 * =====================================
 * GET ORDERS (Admin + User wise)
 * =====================================
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sort = "-createdAt", userId } = req.query;
    const query = {};

    if (req.user?.role !== "admin") query.user = req.user.id;
    if (req.user?.role === "admin" && userId) query.user = userId;
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email phone")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("Order list error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * =====================================
 * GET SINGLE USER ORDERS
 * =====================================
 */
exports.get = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .populate("user", "name email")
      .populate({ path: "items.product", select: "name salePrice" })
      .sort("-createdAt");

    if (!orders.length) return res.status(404).json({ message: "Order not found" });

    const formattedOrders = orders.map((order) => {
      const obj = order.toObject();
      obj.items = obj.items.map((item) => ({
        ...item,
        productName: item.product?.name,
      }));
      return obj;
    });

    res.json({ item: formattedOrders });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * =====================================
 * CREATE ORDER
 * =====================================
 */
exports.create = async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log('Order creation request:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: "Order must have at least one item",
        error: "Invalid items array"
      });
    }

    // Validate each item has required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product) {
        return res.status(400).json({ 
          message: `Item ${i + 1} must have a product ID`,
          error: "Missing product field"
        });
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        return res.status(400).json({ 
          message: `Item ${i + 1} must have a valid price`,
          error: "Invalid price"
        });
      }
      if (!item.quantity && !item.qty) {
        return res.status(400).json({ 
          message: `Item ${i + 1} must have quantity or qty`,
          error: "Missing quantity"
        });
      }
    }

    // Support both new format (items with qty) and old format (items with quantity)
    const normalizedItems = items.map(item => ({
      product: item.product,
      title: item.title || item.name,
      price: item.price,
      quantity: item.quantity || item.qty,
      size: item.size || null,
      color: item.color || null,
      discount: item.discount || 0,
      tax: item.tax || 0,
    }));

    const payload = {
      ...req.body,
      items: normalizedItems,
      user: req.user?.id,
      paymentMethod: req.body.paymentMethod || 'card',
      paymentStatus: req.body.paymentStatus || 'pending',
      status: req.body.status || 'pending',
      // Set order_date in proper format if not provided
      order_date: req.body.order_date || new Date().toISOString().replace('T', ' ').split('.')[0],
    };

    // Calculate totals if not provided
    if (!payload.subTotal) {
      payload.subTotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    if (!payload.total) {
      payload.total = payload.subTotal + (payload.tax || 0) - (payload.discount || 0);
    }

    // Default values for optional but recommended fields
    if (!payload.discount) {
      payload.discount = 0;
    }

    if (!payload.dimension) {
      payload.dimension = {
        length: 10,
        breadth: 10,
        height: 5,
        weight: 0.5,
      };
    }

    console.log('Normalized payload:', JSON.stringify(payload, null, 2));

    const item = await Order.create(payload);
    console.log('[Order] Created order:', item._id);

    // Automatically create Shiprocket shipment if payment is completed
    if (item.paymentStatus === "completed" || item.status === "paid") {
      console.log('[Order] Payment confirmed, initiating Shiprocket shipment creation...');
      try {
        const shipData = await createShipmentForOrder(item);
        if (shipData) {
          console.log('[Order] Shiprocket shipment created:', {
            shipmentId: shipData.shipmentId,
            orderId: shipData.orderId,
            awbCode: shipData.awbCode,
            courierName: shipData.courierName,
          });
          await updateOrderWithShipmentData(item, shipData);
          await item.save();
          console.log('[Order] Order updated with shipment data');
        } else {
          console.warn('[Order] Shiprocket shipment creation returned null');
        }
      } catch (e) {
        console.error("[Order] Shiprocket integration error:", {
          orderId: item._id,
          message: e.message,
          stack: e.stack,
        });
        // Don't fail the order creation if Shiprocket fails
        // The order is still valid, just not yet sent to shiprocket
      }
    } else {
      console.log('[Order] Payment not yet completed, shipment will be created when status changes to paid/shipped');
    }

    res.status(201).json({ item });
  } catch (err) {
    console.error("Order create error details:", {
      message: err.message,
      name: err.name,
      code: err.code,
      errors: err.errors || err.validationErrors,
      stack: err.stack,
    });

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation error",
        errors: messages,
        details: Object.keys(err.errors),
      });
    }

    // Handle Mongoose cast errors
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid ID format",
        field: err.path,
        value: err.value,
      });
    }

    // Generic error response with more details
    res.status(400).json({ 
      message: "Invalid order data",
      error: err.message,
      type: err.name,
    });
  }
};

/**
 * =====================================
 * UPDATE ORDER STATUS
 * =====================================
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    console.log('[Order] Updating order status:', {
      orderId: req.params.id,
      newStatus: status,
    });

    const item = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: "Order not found" });

    console.log('[Order] Order status updated:', {
      orderId: item._id,
      newStatus: item.status,
      hasShipment: !!item.shipmentId,
    });

    // Create Shiprocket shipment if transitioning to shipped
    if ((status === "shipped" || status === "processing") && !item.shipmentId && item.paymentStatus === "completed") {
      console.log('[Order] Creating Shiprocket shipment for status change...');
      try {
        const shipData = await createShipmentForOrder(item);
        if (shipData) {
          console.log('[Order] Shiprocket shipment created on status change:', {
            shipmentId: shipData.shipmentId,
            awbCode: shipData.awbCode,
          });
          await updateOrderWithShipmentData(item, shipData);
          await item.save();
        } else {
          console.warn('[Order] Shiprocket shipment creation returned null');
        }
      } catch (e) {
        console.error("[Order] Shiprocket error on status change:", {
          orderId: item._id,
          message: e.message,
        });
      }
    }

    res.json({ item });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(400).json({ message: "Invalid status" });
  }
};

/**
 * =====================================
 * GET ORDERS BY USER (ADMIN)
 * =====================================
 */
exports.getOrdersByUser = async (req, res) => {
  try {
    const items = await Order.find({ user: req.params.userId })
      .populate("user", "name email")
      .sort("-createdAt");

    res.json({ items });
  } catch (err) {
    console.error("User orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * =====================================
 * TRACK ORDER (SAFE)
 * =====================================
 */
exports.trackOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId) return res.status(400).json({ message: "Order ID required" });

    let order = null;

    // full ObjectId
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId)
        .populate("user", "name email phone")
        .populate({ path: "items.product", select: "title images salePrice price" });
    }

    // partial ID
    if (!order) {
      order = await Order.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: orderId,
            options: "i",
          },
        },
      })
        .populate("user", "name email phone")
        .populate({ path: "items.product", select: "title images salePrice price" });
    }

    if (!order) return res.status(404).json({ message: "Order not found" });

    const customerEmail = order.shippingInfo?.email || order.customerEmail;
    if (email && customerEmail?.toLowerCase() !== email.toLowerCase())
      return res.status(403).json({ message: "Email mismatch" });

    let trackingInfo = null;
    if (order.shipmentId) {
      try {
        trackingInfo = await getShipmentTracking(order.shipmentId);
      } catch (e) {
        console.error("Tracking error:", e.message);
      }
    }

    const statusMap = {
      pending: { step: 0, label: "Order Placed" },
      paid: { step: 1, label: "Payment Confirmed" },
      processing: { step: 2, label: "Processing" },
      shipped: { step: 3, label: "Shipped" },
      out_for_delivery: { step: 4, label: "Out for Delivery" },
      delivered: { step: 5, label: "Delivered" },
      cancelled: { step: -1, label: "Cancelled" },
      cancle: { step: -1, label: "Cancelled" },
    };

    const current = statusMap[order.status] || statusMap.pending;

    res.json({
      order: {
        _id: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        status: order.status,
        statusLabel: current.label,
        currentStep: current.step,
        customerName: order.shippingInfo?.firstName || order.customerName,
        customerEmail,
        customerPhone: order.shippingInfo?.phone || order.customerPhone,
        address: order.shippingInfo?.address || order.address,
        shippingInfo: order.shippingInfo,
        total: order.subTotal || order.total,
        items: order.items,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.shipmentId || order.trackingNumber,
        trackingUrl: order.trackingUrl,
        shipmentDetail: order.shipmentDetail,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      trackingInfo,
    });
  } catch (err) {
    console.error("Track order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
