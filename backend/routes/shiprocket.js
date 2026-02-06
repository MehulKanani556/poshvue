const express = require('express');
const router = express.Router();
const { Order } = require('../model');
const { getShipmentTracking, updateShipmentStatus } = require('../services/shiprocket');
const { auth, requireRole } = require('../middleware/auth');

/**
 * ====================================
 * SHIPROCKET WEBHOOK HANDLER
 * ====================================
 * Receives webhook updates from Shiprocket about shipment status
 * Public endpoint secured with API key validation
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('[Webhook] Received Shiprocket webhook:', {
      timestamp: new Date().toISOString(),
      body: req.body,
    });

    const { event_type, shipment_id, order_id, status, data } = req.body;

    if (!shipment_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing shipment_id in webhook payload' 
      });
    }

    // Find order with this shipment_id
    const order = await Order.findOne({ shipmentId: shipment_id });

    if (!order) {
      console.warn('[Webhook] Order not found for shipment:', shipment_id);
      // Still return success to Shiprocket so it doesn't retry
      return res.json({ 
        success: true, 
        message: 'Webhook received but order not found locally' 
      });
    }

    // Update order status based on event type
    if (event_type === 'shipment_created') {
      if (!order.shipmentDetail) {
        order.shipmentDetail = {};
      }
      order.shipmentDetail.order_created = 1;
      order.status = 'processing';
    } else if (event_type === 'awb_assigned') {
      if (!order.shipmentDetail) {
        order.shipmentDetail = {};
      }
      order.shipmentDetail.awb_generated = 1;
      order.shipmentDetail.awb_code = data?.awb_code;
      order.shipmentDetail.courier_name = data?.courier_name;
      order.shipmentDetail.assigned_date_time = data?.assigned_date_time || new Date().toISOString();
      order.trackingNumber = data?.awb_code || order.trackingNumber;
    } else if (event_type === 'label_generated') {
      if (!order.shipmentDetail) {
        order.shipmentDetail = {};
      }
      order.shipmentDetail.label_generated = 1;
      order.shipmentDetail.label_url = data?.label_url;
    } else if (event_type === 'shipment_picked_up') {
      order.status = 'shipped';
      if (!order.shipmentDetail) {
        order.shipmentDetail = {};
      }
      order.shipmentDetail.pickup_booked_date = new Date().toISOString();
    } else if (event_type === 'in_transit') {
      order.status = 'shipped';
    } else if (event_type === 'out_for_delivery') {
      order.status = 'out_for_delivery';
    } else if (event_type === 'delivered') {
      order.status = 'delivered';
    } else if (event_type === 'shipment_cancelled') {
      order.status = 'cancelled';
    } else if (event_type === 'return_created') {
      if (!order.returnOrderDetail) {
        order.returnOrderDetail = {};
      }
      order.returnOrderDetail.status = 'RETURN INITIATED';
    } else if (event_type === 'return_picked_up') {
      if (!order.returnOrderDetail) {
        order.returnOrderDetail = {};
      }
      order.returnOrderDetail.status = 'RETURN PICKED UP';
    } else if (event_type === 'return_delivered') {
      if (!order.returnOrderDetail) {
        order.returnOrderDetail = {};
      }
      order.returnOrderDetail.status = 'RETURN DELIVERED';
    }

    // Save updated order
    await order.save();

    console.log('[Webhook] Order updated:', {
      orderId: order._id,
      status: order.status,
      shipmentId,
      eventType: event_type,
    });

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      orderId: order._id,
    });
  } catch (err) {
    console.error('[Webhook] Error processing webhook:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
    });

    res.status(500).json({ 
      success: false, 
      error: 'Failed to process webhook',
      message: err.message,
    });
  }
});

/**
 * ====================================
 * GET SHIPMENT TRACKING (Admin/User)
 * ====================================
 * Get real-time tracking data for a shipment
 */
router.get('/tracking/:shipmentId', auth, async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Verify user owns the order
    const order = await Order.findOne({ shipmentId });
    
    if (!order) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.user?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get tracking from Shiprocket
    const tracking = await getShipmentTracking(shipmentId);

    if (!tracking) {
      return res.status(504).json({ 
        message: 'Could not fetch tracking data from Shiprocket',
        order: {
          _id: order._id,
          shipmentId: order.shipmentId,
          trackingNumber: order.trackingNumber,
          status: order.status,
          shipmentDetail: order.shipmentDetail,
        }
      });
    }

    res.json({ 
      tracking,
      order: {
        _id: order._id,
        status: order.status,
        trackingNumber: order.trackingNumber,
        shipmentDetail: order.shipmentDetail,
      }
    });
  } catch (err) {
    console.error('[Tracking] Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch tracking',
      error: err.message,
    });
  }
});

/**
 * ====================================
 * GET ORDER TRACKING (Anonymous/User)
 * ====================================
 * Track order by order ID and email verification
 */
router.post('/track-order', async (req, res) => {
  try {
    const { orderId, email } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID required' });
    }

    // Find order (try both MongoDB ID and shipment ID)
    let order = await Order.findById(orderId).populate('user', 'email');
    
    if (!order && /^\d+$/.test(orderId)) {
      // Try as shipment ID if it's a number
      order = await Order.findOne({ shipmentId: parseInt(orderId) });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Email verification if provided
    const customerEmail = order.shippingInfo?.email || order.customerEmail;
    if (email && customerEmail?.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: 'Email verification failed' });
    }

    // Get real-time tracking if shiprocket shipment exists
    let tracking = null;
    if (order.shipmentId) {
      tracking = await getShipmentTracking(order.shipmentId);
    }

    const statusMap = {
      pending: { step: 0, label: 'Order Placed' },
      paid: { step: 1, label: 'Payment Confirmed' },
      processing: { step: 2, label: 'Processing' },
      shipped: { step: 3, label: 'Shipped' },
      out_for_delivery: { step: 4, label: 'Out for Delivery' },
      delivered: { step: 5, label: 'Delivered' },
      cancelled: { step: -1, label: 'Cancelled' },
    };

    const currentStatus = statusMap[order.status] || statusMap.pending;

    res.json({
      order: {
        _id: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        status: order.status,
        statusLabel: currentStatus.label,
        currentStep: currentStatus.step,
        customerName: order.shippingInfo?.firstName || order.customerName,
        customerEmail: customerEmail,
        customerPhone: order.shippingInfo?.phone || order.customerPhone,
        address: order.shippingInfo?.address || order.address,
        shippingInfo: order.shippingInfo,
        total: order.total || order.subTotal,
        items: order.items,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber || order.shipmentId,
        trackingUrl: order.trackingUrl,
        shipmentDetail: order.shipmentDetail,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      tracking: tracking || null,
      trackingSource: tracking ? 'shiprocket' : 'local',
    });
  } catch (err) {
    console.error('[Track-Order] Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch order tracking',
      error: err.message,
    });
  }
});

/**
 * ====================================
 * GET SHIPMENT DETAILS (Admin Only)
 * ====================================
 * Get detailed shipment information
 */
router.get('/shipment/:shipmentId', auth, requireRole('admin'), async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const order = await Order.findOne({ shipmentId })
      .populate('user', 'name email phone')
      .populate('items.product', 'title');

    if (!order) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const tracking = await getShipmentTracking(shipmentId);

    res.json({
      order: {
        _id: order._id,
        status: order.status,
        user: order.user,
        items: order.items,
        total: order.total,
        shippingInfo: order.shippingInfo,
        shipmentDetail: order.shipmentDetail,
      },
      tracking: tracking || null,
    });
  } catch (err) {
    console.error('[Shipment] Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch shipment',
      error: err.message,
    });
  }
});

module.exports = router;
