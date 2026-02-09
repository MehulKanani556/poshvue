import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form,  Card, Alert } from 'react-bootstrap';
import { 
  FaSearch, 
  FaBox, 
  FaCheckCircle, 
  FaTruckLoading, 
  FaMapMarkerAlt, 
  FaHandSparkles,
  FaCreditCard,
  FaSpinner
} from 'react-icons/fa';
import { trackOrder } from '../api/client';
import client from '../api/client';


const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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
      return null;
    }
  }, []);

  useEffect(() => {
    if (!orderData?.order) return;
    const awb = orderData.order.trackingNumber || orderData.order.awb || orderData.order.tracking_no;
    if (!awb) return;

    // only fetch if trackingInfo is not already present
    if (!orderData.trackingInfo) {
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
    // Shiprocket payloads vary — try several paths
    const track =
      data?.tracking_data?.shipment_track?.[0] ||
      data?.tracking_data?.[0] ||
      data?.data?.tracking_data?.[0] ||
      data?.tracking || data;

    // shipment_track_activities or scan arrays
    const scans =
      track?.tracking_data?.shipment_track_activities ||
      track?.scan ||
      track?.tracking_data?.scan ||
      track?.activities ||
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
            <Card className="d_search_card border-0 shadow-sm p-4 rounded-0">
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
                <Card.Body className="p-4">
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

                  {/* Shiprocket Tracking Scans */}
                  {orderData.trackingInfo && (() => {
                    const scans = getTrackingScans(orderData.trackingInfo);
                    const trackSummary =
                      orderData.trackingInfo?.tracking_data?.[0] ||
                      orderData.trackingInfo?.tracking_data?.shipment_track?.[0] ||
                      orderData.trackingInfo?.data ||
                      {};

                    const status = trackSummary?.current_status || trackSummary?.status || orderData.trackingInfo?.status || "";
                    if (scans.length === 0 && !status) return null;
                    return (
                      <div className="mb-4">
                        <h6 className="fw-bold mb-3">Shiprocket Tracking</h6>
                        {status && (
                          <p className="mb-2"><strong>Current Status:</strong> {String(status)}</p>
                        )}
                        {scans.length > 0 && (
                          <div className="d_stepper_container">
                            {scans.map((scan, idx) => (
                              <div key={idx} className="d_step_item active">
                                <div className="d_step_icon"><FaMapMarkerAlt /></div>
                                <div className="d_step_content">
                                  <h6 className="mb-0">{scan.activity}</h6>
                                  <small className="text-muted">
                                    {scan.date} {scan.time}
                                    {scan.location && ` • ${scan.location}`}
                                  </small>
                                  {/* optional raw payload for debugging */}
                                  {/* <pre style={{fontSize:12, marginTop:6}}>{JSON.stringify(scan.raw, null, 2)}</pre> */}
                                </div>
                                {idx !== scans.length - 1 && <div className="d_step_line active" />}
                              </div>
                            ))}
                          </div>
                        )}
                        {orderData.order.trackingUrl && (
                          <a href={`https://shiprocket.co/tracking/order/${orderId}?company_id=1105857`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary mt-2">
                            Track on Shiprocket
                          </a>
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
                        
                        return (
                          <div
                            key={index}
                            className={`d_step_item ${isCompleted ? "active" : ""} ${isCurrent ? "current" : ""}`}
                          >
                            <div className="d_step_icon">{step.icon}</div>
                            <div className="d_step_content">
                              <h6 className="mb-0 fw-bold">{step.label}</h6>
                              {isCurrent && <small className="text-success">Current Status</small>}
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
          width: 40px;
          height: 40px;
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
          padding-top: 5px;
        }

        @media (max-width: 768px) {
          .d_step_icon {
            width: 35px;
            height: 35px;
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
