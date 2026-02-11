import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Form,  Card, Alert } from 'react-bootstrap';
import { 
  FaSearch, 
  FaBox, 
  FaCheckCircle, 
  FaTruckLoading, 
  FaMapMarkerAlt, 
  FaHandSparkles,
  FaCreditCard,
  FaSpinner,
  FaTruck,
  FaWarehouse,
  FaClipboardList,
  FaCarAlt
} from 'react-icons/fa';
import { trackOrder } from '../../api/client';
import client from '../../api/client';

// Dummy Shiprocket payload (dev fallback when backend tracking is unavailable)
const DUMMY_SHIPROCKET_TRACKING = {
  tracking_data: {
    track_status: 1,
    shipment_status: 7,
    shipment_track: [
      {
        id: 236612717,
        awb_code: "141123221084922",
        courier_company_id: 51,
        shipment_id: 236612717,
        order_id: 237157589,
        pickup_date: "2022-07-18 20:28:00",
        delivered_date: "2022-07-19 11:37:00",
        weight: "0.30",
        packages: 1,
        current_status: "Delivered",
        delivered_to: "Chittoor",
        destination: "Chittoor",
        consignee_name: "",
        origin: "Banglore",
        courier_agent_details: null,
        courier_name: "Xpressbees Surface",
        edd: null,
        pod: "Available",
        pod_status:
          " https://s3-ap-southeast-1.amazonaws.com/kr-shipmultichannel/courier/51/pod/141123221084922.png ",
      },
    ],
    shipment_track_activities: [
      {
        date: "2022-07-19 11:37:00",
        status: "DLVD",
        activity: "Delivered",
        location: "MADANPALLI, Madanapalli, ANDHRA PRADESH",
        "sr-status": "7",
        "sr-status-label": "DELIVERED",
      },
      {
        date: "2022-07-19 08:57:00",
        status: "OFD",
        activity:
          "Out for Delivery Out for delivery: 383439-Nandinayani Reddy Bhaskara Sitics Logistics  (356231) (383439)-PDS22200085719383439-FromMob , MobileNo:- 9963133564",
        location: "MADANPALLI, Madanapalli, ANDHRA PRADESH",
        "sr-status": "17",
        "sr-status-label": "OUT FOR DELIVERY",
      },
      {
        date: "2022-07-19 07:33:00",
        status: "RAD",
        activity: "Reached at Destination Shipment BagOut From Bag : nxbg03894488",
        location: "MADANPALLI, Madanapalli, ANDHRA PRADESH",
        "sr-status": "38",
        "sr-status-label": "REACHED AT DESTINATION HUB",
      },
      {
        date: "2022-07-18 21:02:00",
        status: "IT",
        activity: "InTransit Shipment added in Bag nxbg03894488",
        location: "BLR/FC1, BANGALORE, KARNATAKA",
        "sr-status": "18",
        "sr-status-label": "IN TRANSIT",
      },
      {
        date: "2022-07-18 20:28:00",
        status: "PKD",
        activity: "Picked Shipment InScan from Manifest",
        location: "BLR/FC1, BANGALORE, KARNATAKA",
        "sr-status": "6",
        "sr-status-label": "SHIPPED",
      },
      {
        date: "2022-07-18 13:50:00",
        status: "PUD",
        activity: "PickDone ",
        location: "RTO/CHD, BANGALORE, KARNATAKA",
        "sr-status": "42",
        "sr-status-label": "PICKED UP",
      },
      {
        date: "2022-07-18 10:04:00",
        status: "OFP",
        activity: "Out for Pickup ",
        location: "RTO/CHD, BANGALORE, KARNATAKA",
        "sr-status": "19",
        "sr-status-label": "OUT FOR PICKUP",
      },
      {
        date: "2022-07-18 09:51:00",
        status: "DRC",
        activity: "Pending Manifest Data Received",
        location: "RTO/CHD, BANGALORE, KARNATAKA",
        "sr-status": "NA",
        "sr-status-label": "NA",
      },
    ],
    track_url: " https://shiprocket.co//tracking/141123221084922 ",
    etd: "2022-07-20 19:28:00",
    qc_response: {
      qc_image: "",
      qc_failed_reason: "",
    },
  },
};

// Extract milestone dates from Shiprocket tracking data
const getShiprocketMilestones = (trackingData) => {
  if (!trackingData) return null;

  const activities =
    trackingData?.tracking_data?.shipment_track_activities ||
    trackingData?.tracking_data?.shipment_track?.[0]?.shipment_track_activities ||
    trackingData?.tracking_data?.[0]?.shipment_track_activities ||
    trackingData?.data?.tracking_data?.shipment_track_activities ||
    [];

  const milestones = {};

  (activities || []).forEach((activity) => {
    const status = String(activity.status || activity.activity || "").toLowerCase();
    const timestamp = activity.date || activity.activity_date;

    if (!timestamp) return;

    try {
      const d = new Date(timestamp);
      if (!isNaN(d)) {
        const date = d.toLocaleDateString();
        const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Match status to milestone
        if ((status.includes("shipped") || status.includes("pkd")) && !milestones.shipped) {
          milestones.shipped = { date, time, activity: activity.activity };
        }
        if ((status.includes("out") || status.includes("ofd")) && !milestones.out_for_delivery) {
          milestones.out_for_delivery = { date, time, activity: activity.activity };
        }
        if ((status.includes("delivered") || status.includes("dlvd")) && !milestones.delivered) {
          milestones.delivered = { date, time, activity: activity.activity };
        }
      }
    } catch (err) {
      // ignore parsing errors
    }
  });

  return Object.keys(milestones).length > 0 ? milestones : null;
};

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showDetailedJourney, setShowDetailedJourney] = useState(false);

  // Status mapping for tracking steps
  // Fetch user orders on component mount
  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo?._id) return;

        setLoadingOrders(true);
        const res = await client.get(`/commerce/orders/${userInfo._id}`);
        const orders = res.data.item || res.data.items || [];
        setUserOrders(orders);
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchUserOrders();
  }, []);

  const statusSteps = {
    pending: { step: 0, label: "Order Placed", icon: <FaCheckCircle />, completed: true },
    paid: { step: 1, label: "Payment Confirmed", icon: <FaCreditCard />, completed: true },
    processing: { step: 2, label: "Processing", icon: <FaHandSparkles />, completed: true },
    shipped: { step: 3, label: "Shipped", icon: <FaTruckLoading />, completed: true },
    out_for_delivery: { step: 4, label: "Out for Delivery", icon: <FaBox />, completed: true },
    delivered: { step: 5, label: "Delivered", icon: <FaMapMarkerAlt />, completed: true },
    cancelled: { step: -1, label: "Cancelled", icon: <FaCheckCircle />, completed: false },
  };

  const handleOrderSelect = (selectedOrderId) => {
    if (selectedOrderId) {
      setOrderId(selectedOrderId);
      // Auto-fill email if available
      const selectedOrder = userOrders.find(o => o._id === selectedOrderId);
      if (selectedOrder?.customerEmail) {
        setEmail(selectedOrder.customerEmail);
      }
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("Please enter an Order ID");
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const res = await trackOrder({
        orderId: orderId.trim(),
        email: email.trim() || undefined,
      });

      setOrderData(res.data);
    } catch (err) {
      console.error("Track order error:", err);
      setError(err.response?.data?.message || "Order not found. Please check your Order ID and Email.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Shiprocket tracking details when we have an order with an AWB/tracking number
  const fetchShiprocketTracking = useCallback(async (trackingNumber) => {
    if (!trackingNumber) return null;
    try {
      // Expect backend route that proxies Shiprocket API:
      // GET /commerce/shiprocket/track/:awb
      const res = await client.get(`/commerce/shiprocket/track/${encodeURIComponent(trackingNumber)}`);
      return res.data;
    } catch (err) {
      console.warn("Failed to fetch Shiprocket tracking:", err);
      // Dev fallback so UI can be built/tested without live backend.
      if (process.env.NODE_ENV !== "production") {
        return DUMMY_SHIPROCKET_TRACKING;
      }
      return null;
    }
  }, []);

  // Helper: check if tracking payload has any activity list
  const trackingHasActivities = (info) => {
    if (!info) return false;
    const activities =
      info?.tracking_data?.shipment_track_activities ||
      info?.tracking_data?.shipment_track?.[0]?.shipment_track_activities ||
      info?.data?.tracking_data?.shipment_track_activities ||
      [];
    return Array.isArray(activities) && activities.length > 0;
  };

  useEffect(() => {
    if (!orderData?.order) return;
    const awb = orderData.order.trackingNumber || orderData.order.awb || orderData.order.tracking_no;
    if (!awb) return;

    // Fetch tracking when missing, or when present but missing shipment_track_activities (AWB endpoint returns full activities)
    const needFetch = !orderData.trackingInfo || !trackingHasActivities(orderData.trackingInfo);
    if (needFetch) {
      (async () => {
        const tracking = await fetchShiprocketTracking(awb);
        if (tracking) {
          setOrderData((prev) => ({ ...prev, trackingInfo: tracking }));
        }
      })();
    }
  }, [orderData, fetchShiprocketTracking]);

  // Normalize Shiprocket tracking data into a flat scans array for rendering
  const getTrackingScans = (data) => {
    if (!data) return [];

    // Shiprocket payloads vary — try several paths (awb/shipments)
    const scans =
      data?.tracking_data?.shipment_track_activities ||
      data?.tracking_data?.shipment_track?.[0]?.shipment_track_activities ||
      data?.tracking_data?.[0]?.shipment_track_activities ||
      data?.data?.tracking_data?.shipment_track_activities ||
      data?.data?.tracking_data?.[0]?.shipment_track_activities ||
      data?.tracking?.tracking_data?.shipment_track_activities ||
      data?.tracking?.shipment_track_activities ||
      data?.scan ||
      data?.tracking_data?.scan ||
      data?.activities ||
      [];

    // Normalize each scan item to have date, time, activity, location
    return (scans || []).map((s) => {
      // Shiprocket sometimes returns timestamp or date/time combined
      const timestamp = s.timestamp || s.date || s.activity_date || s.activity_timestamp;
      let date = "";
      let time = "";
      if (timestamp) {
        const d = new Date(timestamp);
        if (!isNaN(d)) {
          date = d.toLocaleDateString();
          time = d.toLocaleTimeString();
        } else {
          // if string like "2021-08-01 10:00:00"
          const parts = String(timestamp).split(" ");
          date = parts[0] || "";
          time = parts[1] || "";
        }
      }

      return {
        activity: s.activity || s.status || s.description || s.scan_description || s.name || "Update",
        date,
        time,
        location: s.location || s.city || s.scan_location || s.warehouse || "",
        raw: s,
      };
    });
  };

  // derive current status — prefer Shiprocket/current tracking info, fallback to order.status
  const getNormalizedStatusKey = (raw) => {
    if (!raw) return null;
    const s = String(raw).toLowerCase();
    if (s.includes("cancel") || s.includes("canceled") || s.includes("cancelled")) return "cancelled";
    if (s.includes("delivered")) return "delivered";
    if (s.includes("out") && s.includes("delivery")) return "out_for_delivery";
    if (s.includes("out_for_delivery") || s.includes("out_for")) return "out_for_delivery";
    if (s.includes("ship") || s.includes("shipped") || s.includes("in_transit") || s.includes("transit")) return "shipped";
    if (s.includes("process") || s.includes("processing") || s.includes("packed") || s.includes("ready")) return "processing";
    if (s.includes("paid") || s.includes("payment")) return "paid";
    if (s.includes("created") || s.includes("placed") || s.includes("pending") || s.includes("order placed")) return "pending";
    return null;
  };

  const shipStatusRaw = (() => {
    if (!orderData?.trackingInfo) return null;
    const t = orderData.trackingInfo?.tracking_data?.[0] ||
              orderData.trackingInfo?.tracking_data?.shipment_track?.[0] ||
              orderData.trackingInfo?.data ||
              orderData.trackingInfo;
    return t?.current_status || t?.status || orderData.trackingInfo?.status || null;
  })();

  const shipStatusKey = getNormalizedStatusKey(shipStatusRaw);
  const isCancelled = (orderData?.order?.status === "cancelled") || shipStatusKey === "cancelled";

  const currentStatus = isCancelled
    ? statusSteps.cancelled
    : shipStatusKey
    ? statusSteps[shipStatusKey] || null
    : orderData?.order
    ? statusSteps[orderData.order.status]
    : null;
   const allSteps = [
     statusSteps.pending,
     statusSteps.paid,
     statusSteps.processing,
     statusSteps.shipped,
     statusSteps.out_for_delivery,
     statusSteps.delivered,
   ];

  const shipMilestones = useMemo(() => {
    if (!orderData?.trackingInfo) return null;
    return getShiprocketMilestones(orderData.trackingInfo);
  }, [orderData?.trackingInfo]);

  const stepMeta = useMemo(() => {
    const createdAt = orderData?.order?.createdAt ? new Date(orderData.order.createdAt) : null;
    const pendingMeta =
      createdAt && !isNaN(createdAt)
        ? { date: createdAt.toLocaleDateString(), time: createdAt.toLocaleTimeString() }
        : null;

    return {
      pending: pendingMeta,
      paid: null,
      processing: null,
      shipped: shipMilestones?.shipped || null,
      out_for_delivery: shipMilestones?.out_for_delivery || null,
      delivered: shipMilestones?.delivered || null,
    };
  }, [orderData?.order?.createdAt, shipMilestones]);

  // Get appropriate icon for activity
  const getActivityIcon = (activity) => {
    const actStr = String(activity).toLowerCase();
    if (actStr.includes('deliver') || actStr.includes('dlvd')) return <FaCheckCircle />;
    if (actStr.includes('out') || actStr.includes('ofd')) return <FaCarAlt />;
    if (actStr.includes('reach') || actStr.includes('rad') || actStr.includes('hub')) return <FaWarehouse />;
    if (actStr.includes('transit') || actStr.includes('it') || actStr.includes('bag')) return <FaTruck />;
    if (actStr.includes('pick') || actStr.includes('pkd') || actStr.includes('pud')) return <FaClipboardList />;
    return <FaMapMarkerAlt />;
  };
 
   return (
     <div className="d_track_wrapper py-5">
      <Container>
        {/* Header */}
        <Row className="justify-content-center text-center mb-md-4 mb-3">
          <Col md={7}>
            <h2 className="d_track_title mb-3">Track Your Order</h2>
            <p className="text-muted">Enter your order details to track the status of your order.</p>
          </Col>
        </Row>

        {/* Search Bar */}
        <Row className="justify-content-center mb-5">
          <Col md={6}>
            <Card className="d_search_card border-0 shadow-sm p-md-4 p-2 rounded-0">
              <Form onSubmit={handleTrack}>
                {/* Order Selection Dropdown */}
                {userOrders.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-uppercase">Select Your Order</Form.Label>
                    <Form.Select 
                      className="rounded-0 d_input_focus"
                      value={orderId}
                      onChange={(e) => handleOrderSelect(e.target.value)}
                    >  
                      <option value="">-- Select an order to track --</option>
                      {userOrders.map((order) => (
                        <option key={order._id} value={order._id}>
                          Order #{order._id.slice(-6)} - ₹{order.total} - {new Date(order.createdAt).toLocaleDateString()} - {order.status}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Or enter Order ID manually below
                    </Form.Text>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-uppercase">Order ID / Order Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. #ABC12345 or full order ID" 
                    className="rounded-0 d_input_focus"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-uppercase">Email Address (Optional)</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="The email used during checkout" 
                    className="rounded-0 d_input_focus"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Enter email to verify order ownership
                  </Form.Text>
                </Form.Group>
                <button 
                  type="submit" 
                  variant="dark" 
                  className="w-100 rounded-0 d_btn_track py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="me-2 spin" /> Tracking...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-2" /> Track Order
                    </>
                  )}
                </button>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* Error Message */}
        {error && (
          <Row className="justify-content-center mb-4">
            <Col md={6}>
              <Alert variant="danger" className="rounded-0">
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Tracking Results */}
        {orderData && orderData.order && (
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="border-0 shadow-sm rounded-0 d_status_card">
                <Card.Header className="bg-white border-bottom-0 pt-4 px-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div>
                      <h5 className="mb-0 fw-bold">Order #{orderData.order.orderNumber}</h5>
                      <small className="text-muted">
                        Placed on {new Date(orderData.order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </small>
                    </div>
                    <span 
                      className={`badge p-2 mt-2 ${orderData.order.status === 'delivered' ? 'bg-success' : 
                                                      orderData.order.status === 'cancelled' ? 'bg-danger' : 
                                                      'bg-warning'}`}
                    >
                      {orderData.order.statusLabel || orderData.order.status.toUpperCase()}
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className="p-md-4 p-2">
                  {/* Order Details */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Order Details</h6>
                    <Row>
                      <Col md={6} className="mb-2">
                        <strong>Customer:</strong> {orderData.order.customerName}
                      </Col>
                      <Col md={6} className="mb-2">
                        <strong>Email:</strong> {orderData.order.customerEmail}
                      </Col>
                      <Col md={6} className="mb-2">
                        <strong>Phone:</strong> {orderData.order.customerPhone}
                      </Col>
                      <Col md={6} className="mb-2">
                        <strong>Payment Method:</strong> {orderData.order.paymentMethod?.toUpperCase() || 'N/A'}
                      </Col>
                      <Col md={12} className="mb-2">
                        <strong>Delivery Address:</strong> {orderData.order.address || 'N/A'}
                      </Col>
                      {orderData.order.trackingNumber && (
                        <Col md={6} className="mb-2">
                          <strong>AWB / Tracking Number:</strong> {orderData.order.trackingNumber}
                        </Col>
                      )}
                      {orderData.order.trackingUrl && (
                        <Col md={6} className="mb-2">
                          <strong>Track on Shiprocket:</strong>{' '}
                          <a href={orderData.order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-underline">
                            View Live Tracking →
                          </a>
                        </Col>
                      )}
                    </Row>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">Order Items</h6>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderData.order.items?.map((item, index) => (
                          <tr key={index}>
                            <td>
                              {item.name || item.title || item.product?.name || item.product?.title || "Item"}
                              {item.size && ` (Size: ${item.size})`}
                              {item.color && ` (Color: ${item.color})`}
                            </td>
                            <td>{item.qty || item.quantity}</td>
                            <td>₹{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="text-end fw-bold">Total:</td>
                          <td className="fw-bold">₹{orderData.order.total}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Shiprocket Tracking Activities - Detailed Timeline */}
                  {orderData.trackingInfo && (() => {
                    const scans = getTrackingScans(orderData.trackingInfo);
                    const trackSummary =
                      orderData.trackingInfo?.tracking_data?.[0] ||
                      orderData.trackingInfo?.tracking_data?.shipment_track?.[0] ||
                      orderData.trackingInfo?.data ||
                      {};

                    const status = trackSummary?.current_status || trackSummary?.status || orderData.trackingInfo?.status || "";
                    const awbCode = trackSummary?.awb_code || orderData.order?.trackingNumber || "";
                    const courierName = trackSummary?.courier_name || "";
                    const displayedScans = showDetailedJourney ? scans : scans.slice(0, 5);
                    
                    if (scans.length === 0 && !status) return null;
                    
                    return (
                      <div className="mb-4" style={{
                        background: "linear-gradient(135deg, #f8fef8 0%, #f0f9f0 100%)",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "1px solid #d4f0d4",
                        boxShadow: "0 2px 8px rgba(40, 167, 69, 0.1)"
                      }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div>
                            <h5 className="fw-bold mb-1" style={{ color: "#0a2845", fontSize: "18px" }}>📦 Shipment Tracking Details</h5>
                            <small className="text-muted">Real-time updates from Shiprocket</small>
                          </div>
                          {scans.length > 5 && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                background: showDetailedJourney ? "#dc3545" : "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 16px",
                                fontSize: "13px",
                                fontWeight: 600,
                                transition: "all 0.3s"
                              }}
                              onClick={() => setShowDetailedJourney((v) => !v)}
                            >
                              {showDetailedJourney ? `✕ Show Less` : `+ View All (${scans.length})`}
                            </button>
                          )}
                        </div>

                        {status && (
                          <div className="mb-3" style={{
                            padding: "12px 14px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            borderLeft: "4px solid #28a745",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px"
                          }}>
                            <div>
                              <small className="text-muted d-block mb-1">Current Status:</small>
                              <p className="mb-0 fw-bold text-success" style={{ fontSize: "15px" }}>{String(status)}</p>
                            </div>
                            {awbCode && (
                              <div>
                                <small className="text-muted d-block mb-1">AWB Code:</small>
                                <p className="mb-0 fw-bold" style={{ fontSize: "15px", fontFamily: "monospace" }}>{awbCode}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {courierName && (
                          <div className="mt-3" style={{
                            padding: "12px 14px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            borderLeft: "4px solid #0a2845"
                          }}>
                            <small className="text-muted d-block mb-1">Courier Service:</small>
                            <p className="mb-0 fw-bold" style={{ fontSize: "15px", color: "#0a2845" }}>{courierName}</p>
                          </div>
                        )}

                        {scans.length > 0 && (
                          <div className="mt-4">
                            <h6 className="fw-bold mb-3" style={{ color: "#0a2845", fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Activity Timeline</h6>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                              {displayedScans.map((scan, idx, arr) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    gap: "16px",
                                    padding: "16px",
                                    backgroundColor: "white",
                                    borderLeft: "3px solid #28a745",
                                    borderRadius: idx === 0 ? "8px 8px 0 0" : (idx === arr.length - 1 ? "0 0 8px 8px" : "0"),
                                    borderTop: idx === 0 ? "none" : "1px solid #e9ecef"
                                  }}
                                >
                                  <div style={{
                                    width: "40px",
                                    height: "40px",
                                    minWidth: "40px",
                                    backgroundColor: "#28a745",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "18px",
                                    boxShadow: "0 2px 6px rgba(40, 167, 69, 0.25)"
                                  }}>
                                    {getActivityIcon(scan.activity)}
                                  </div>
                                  <div style={{ flex: 1,wordBreak: 'break-word'} }>
                                    <h6 className="mb-1" style={{ fontSize: "14px", fontWeight: 600, color: "#0a2845" }}>
                                      {scan.activity}
                                    </h6>
                                    <small className="text-muted d-block" style={{ fontSize: "12px", marginBottom: "4px" }}>
                                      🕐 {scan.date} {scan.time}
                                    </small>
                                    {scan.location && (
                                      <small className="text-muted d-block" style={{ fontSize: "12px", color: "#6c757d" }}>
                                        📍 {scan.location}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {scans.length > 5 && !showDetailedJourney && (
                              <div className="text-center mt-3">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link" 
                                  onClick={() => setShowDetailedJourney(true)}
                                  style={{ color: "#28a745", fontWeight: 600, textDecoration: "none" }}
                                >
                                  + Show {scans.length - 5} more updates
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {orderData.order.trackingUrl && (
                          <div className="mt-4 text-center">
                            <a
                              href={orderData.order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn"
                              style={{
                                background: "#0a2845",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 16px",
                                fontSize: "13px",
                                fontWeight: 600,
                                transition: "all 0.3s"
                              }}
                              onMouseEnter={(e) => e.target.style.background = "#2b4d6e"}
                              onMouseLeave={(e) => e.target.style.background = "#0a2845"}
                            >
                              🔗 Track Live on Shiprocket
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Visual Stepper */}
                  {isCancelled ? (
                    <div className="d_stepper_container mt-4">
                      <div className="d_step_item cancelled current">
                        <div className="d_step_icon">
                          <FaCheckCircle />
                        </div>
                        <div className="d_step_content">
                          <h6 className="mb-0 fw-bold">Cancelled</h6>
                          <small className="text-danger">Order Cancelled</small>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="d_stepper_container mt-4">
                      {allSteps.map((step, index) => {
                        const isCompleted = currentStatus && step.step <= currentStatus.step;
                        const isCurrent = currentStatus && step.step === currentStatus.step;
                        const key =
                          step === statusSteps.pending
                            ? "pending"
                            : step === statusSteps.paid
                            ? "paid"
                            : step === statusSteps.processing
                            ? "processing"
                            : step === statusSteps.shipped
                            ? "shipped"
                            : step === statusSteps.out_for_delivery
                            ? "out_for_delivery"
                            : step === statusSteps.delivered
                            ? "delivered"
                            : null;

                        const meta = key ? stepMeta?.[key] : null;
                        const metaDate = meta?.date || "";
                        const metaTime = meta?.time || "";
                        const metaActivity = meta?.activity || meta?.raw?.activity || "";
                        const metaLocation = meta?.location || meta?.raw?.location || "";
                        
                        return (
                          <div
                            key={index}
                            className={`d_step_item ${isCompleted ? "active" : ""} ${isCurrent ? "current" : ""}`}
                          >
                            <div className="d_step_icon">{step.icon}</div>
                            <div className="d_step_content">
                              <h6 className="mb-0 fw-bold">{step.label}</h6>
                              {isCurrent && <small className="text-success">Current Status</small>}
                              {(metaDate || metaTime || metaActivity || metaLocation) && (
                                <div style={{ marginTop: 4 }}>
                                  {(metaDate || metaTime) && (
                                    <small className="text-muted d-block">
                                      {metaDate} {metaTime}
                                    </small>
                                  )}
                                  {metaActivity && (
                                    <small className="text-muted d-block">{metaActivity}</small>
                                  )}
                                  {metaLocation && (
                                    <small className="text-muted d-block">
                                      Location: <strong>{metaLocation}</strong>
                                    </small>
                                  )}
                                </div>
                              )}
                            </div>
                            {index !== allSteps.length - 1 && (
                              <div className={`d_step_line ${isCompleted ? "active" : ""}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                 </Card.Body>
               </Card>
             </Col>
           </Row>
         )}
       </Container>
 
       <style>{`
        .d_track_wrapper {
          background-color: #fcfaf8;
        }
        .d_track_title {
          font-weight: 700;
          color: #0a2845;
        }
        .d_input_focus:focus {
          border-color: #0a2845;
          box-shadow: none;
        }
        .d_btn_track {
          background-color: #0a2845;
          border-color: #2b4d6e 1px solid !important;
          color: white;
          letter-spacing: 1px;
          transition: 0.3s;
        }
        .d_btn_track:hover:not(:disabled) {
          background-color: #2b4d6e;
          border-color: #2b4d6e;
        }
        .d_btn_track:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Stepper Styling */
        .d_stepper_container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          margin-top: 30px;
        }
        .d_step_item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          position: relative;
        }
        .d_step_icon {
          width: 40px !important;
          height: 40px !important;
          background: #eee;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          color: #999;
          transition: 0.3s;
        }
        .d_step_item.active .d_step_icon {
          background: #d4af37;
          color: white;
        }
        .d_step_item.current .d_step_icon {
          background: #28a745;
          color: white;
          box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
        }
        /* cancelled styling */
        .d_step_item.cancelled .d_step_icon {
          background: #dc3545;
          color: #fff;
          box-shadow: none;
        }
        .d_step_item.cancelled .d_step_content small {
          color: #dc3545;
        }
        .d_step_line {
          position: absolute;
          left: 19px;
          top: 40px;
          width: 2px;
          height: calc(100% + 20px);
          background: #eee;
          z-index: 1;
        }
        .d_step_line.active {
          background: #d4af37;
        }
        .d_step_content {
        width : 77%;
          padding-top: 5px;
        }

        @media (max-width: 768px) {
          .d_step_icon {
            width: 35px !important;
            height: 35px !important;
          }
          .d_step_line {
            left: 16px;
          }
        }
      `}</style>
     </div>
   );
 };
 
 export default TrackOrder;
