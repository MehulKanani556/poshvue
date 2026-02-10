import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiCircle, FiLoader } from "react-icons/fi";
import client from "../../../api/client";

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

function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order tracking data from backend
  useEffect(() => {
    const fetchOrderTracking = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await client.post("/commerce/orders/track", {
          orderId: orderId,
        });
        setOrderData(response.data);
      } catch (err) {
        console.error("Failed to fetch order tracking:", err);
        setError(err.response?.data?.message || "Failed to load order tracking data");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderTracking();
    }
  }, [orderId]);

  // Get tracking scans from Shiprocket data
  const getTrackingScans = (trackingData) => {
    if (!trackingData) return [];

    // Shiprocket returns activities under tracking_data.shipment_track_activities
    const activities =
      trackingData?.tracking_data?.shipment_track_activities ||
      trackingData?.shipment_track_activities ||
      trackingData?.activities ||
      [];

    return (activities || []).map((activity) => {
      const timestamp = activity.date || activity.activity_date;
      let date = "";
      let time = "";

      if (timestamp) {
        try {
          const d = new Date(timestamp);
          if (!isNaN(d)) {
            date = d.toLocaleDateString();
            time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          } else {
            const parts = String(timestamp).split(" ");
            date = parts[0] || "";
            time = parts[1] || "";
          }
        } catch (e) {
          // fallback
          date = String(timestamp).substring(0, 10);
          time = String(timestamp).substring(11, 19);
        }
      }

      return {
        activity: activity.activity || activity.status || "Update",
        date,
        time,
        location: activity.location || "",
        raw: activity,
      };
    });
  };

  const currentStatus = orderData?.order?.status || "pending";
  const completedCount = useMemo(() => {
    switch (currentStatus) {
      case "delivered":
        return 4;
      case "shipped":
      case "out_for_delivery":
        return 3;
      case "processing":
        return 2;
      case "pending":
      case "paid":
      default:
        return 1;
    }
  }, [currentStatus]);

  // Helper: interpolate between two hex colors
  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };
  const rgbToHex = (r, g, b) => {
    const toHex = (n) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const interpHex = (a, b, t) => {
    const ra = hexToRgb(a),
      rb = hexToRgb(b);
    const r = ra[0] + (rb[0] - ra[0]) * t;
    const g = ra[1] + (rb[1] - ra[1]) * t;
    const bl = ra[2] + (rb[2] - ra[2]) * t;
    return rgbToHex(r, g, bl);
  };

  // Colors: light -> dark green
  const lightGreen = "#dff7e8";
  const darkGreen = "#27ae60";

  const baseSteps = [
    "Order Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const trackingSteps = baseSteps.map((s, i) => {
    const completed = i < completedCount;
    let color = "#ecf0f1";
    if (completed) {
      // distribute shades from light to dark across completed steps
      const t = completedCount > 1 ? i / (completedCount - 1) : 1; // 0..1
      color = interpHex(lightGreen, darkGreen, t);
    }
    return {
      step: s,
      date: "",
      time: "",
      completed,
      color,
    };
  });

  const resolvedTrackingInfo =
    orderData?.trackingInfo ||
    (process.env.NODE_ENV !== "production" ? DUMMY_SHIPROCKET_TRACKING : null);

  const shiprocketScans = resolvedTrackingInfo ? getTrackingScans(resolvedTrackingInfo) : [];

  const shipSummary = resolvedTrackingInfo?.tracking_data?.shipment_track?.[0] || null;
  const shipEtdRaw = resolvedTrackingInfo?.tracking_data?.etd || null;
  const shipCurrentStatus =
    shipSummary?.current_status ||
    resolvedTrackingInfo?.tracking_data?.shipment_track?.[0]?.current_status ||
    "";
  const shipCarrier = shipSummary?.courier_name || "";
  const shipAwb = shipSummary?.awb_code || orderDetails?.trackingNumber || "";
  const shipUpdatedOnRaw = shiprocketScans?.[0]?.raw?.date || shiprocketScans?.[0]?.raw?.activity_date || "";

  const formatDateTime = (value) => {
    if (!value) return "";
    const s = String(value).trim();
    const d = new Date(s);
    if (!isNaN(d)) return d.toLocaleString();
    return s;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <FiLoader size={40} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: "10px" }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <button
          className="x_btn x_btn-secondary"
          onClick={() => navigate("/admin/orders")}
          title="Back to Orders"
        >
          <FiArrowLeft size={16} /> Back
        </button>
        <div
          style={{
            backgroundColor: "#fee",
            border: "1px solid #f99",
            borderRadius: "4px",
            padding: "15px",
            marginTop: "20px",
          }}
        >
          <h3 style={{ color: "#c33", margin: 0 }}>Error</h3>
          <p style={{ margin: "10px 0 0 0" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!orderData?.order) {
    return (
      <div style={{ padding: "20px" }}>
        <button
          className="x_btn x_btn-secondary"
          onClick={() => navigate("/admin/orders")}
          title="Back to Orders"
        >
          <FiArrowLeft size={16} /> Back
        </button>
        <div style={{ marginTop: "20px" }}>
          <p>Order not found</p>
        </div>
      </div>
    );
  }

  const orderDetails = {
    orderId: orderData.order._id,
    customer:
      orderData.order.shippingInfo?.firstName ||
      orderData.order.customerName ||
      "N/A",
    email: orderData.order.customerEmail,
    phone: orderData.order.customerPhone,
    amount: `₹${orderData.order.total}`,
    items: orderData.order.items || [],
    shippingAddress: orderData.order.address || "N/A",
    trackingNumber: orderData.order.trackingNumber,
  };

  return (
    <div>
      <style>{`
        .track-layout{
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          align-items: start;
        }
        .right-grid{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .right-grid .full{
          grid-column: 1 / -1;
        }
        .timeline-card{
          height: 100%;
          min-height: 480px;
        }
        .shiprocket-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .shiprocket-item {
          display: flex;
          gap: 15px;
          padding: 15px;
          border-left: 3px solid #ecf0f1;
          position: relative;
        }
        .shiprocket-item.active {
          border-left-color: #27ae60;
          background-color: #f8fef8;
        }
        .shiprocket-item:first-child {
          border-top-left-radius: 4px;
        }
        .shiprocket-item:last-child {
          border-bottom-left-radius: 4px;
        }
        .shiprocket-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #ecf0f1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .shiprocket-item.active .shiprocket-dot {
          background-color: #27ae60;
          box-shadow: 0 0 0 4px #dff7e8;
        }
        .shiprocket-content h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .shiprocket-content p {
          margin: 0;
          font-size: 12px;
          color: #7f8c8d;
        }
        @media (max-width: 900px){
          .track-layout{ grid-template-columns: 1fr; }
          .right-grid{ grid-template-columns: 1fr; }
          .timeline-card{ min-height: 300px; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <button
          className="x_btn x_btn-secondary"
          onClick={() => navigate("/admin/orders")}
          title="Back to Orders"
        >
          <FiArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 0 15px" }}>
          Order Tracking - {orderData.order.orderNumber}
        </h1>
      </div>

      <div className="track-layout" style={{ gap: "20px" }}>
        {/* Tracking Timeline */}
        <div className="x_card timeline-card">
          <div className="x_card-header">
            <h2>Order Timeline</h2>
          </div>
          <div className="x_card-body" style={{ padding: "20px" }}>
            <div style={{ position: "relative" }}>
              {trackingSteps.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    marginBottom: index < trackingSteps.length - 1 ? "30px" : "0",
                    position: "relative",
                  }}
                >
                  {/* Timeline Line */}
                  {index < trackingSteps.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "20px",
                        top: "40px",
                        bottom: "-30px",
                        width: "2px",
                        backgroundColor:
                          index < completedCount - 1
                            ? trackingSteps[index + 1].color
                            : item.completed
                            ? item.color
                            : "#ecf0f1",
                      }}
                    />
                  )}

                  {/* Timeline Dot */}
                  <div style={{ marginRight: "20px", position: "relative", zIndex: 1 }}>
                    {item.completed ? (
                      <FiCheckCircle size={40} style={{ color: item.color }} />
                    ) : (
                      <FiCircle size={40} style={{ color: "#bdc3c7" }} />
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div style={{ flex: 1, paddingTop: "5px" }}>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "16px", fontWeight: 600 }}>
                      {item.step}
                    </h3>
                    <p style={{ margin: "0 0 3px 0", fontSize: "13px", color: "#7f8c8d" }}>
                      {item.date}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#95a5a6" }}>
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details (right column) */}
        <div className="right-grid">
          {/* Shiprocket Summary (like Shiprocket UI) */}
          {resolvedTrackingInfo?.tracking_data && (
            <div className="x_card full">
              <div className="x_card-header">
                <h2>Shipment Status</h2>
              </div>
              <div className="x_card-body" style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 260px",
                    gap: "20px",
                    alignItems: "start",
                  }}
                >
                  <div>
                    {shipEtdRaw && (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: 6 }}>
                          Estimated Delivery
                        </div>
                        <div
                          style={{
                            background: "#f3fbf6",
                            border: "1px solid #e7f6ec",
                            padding: "14px",
                            borderRadius: "6px",
                            fontSize: "26px",
                            fontWeight: 700,
                          }}
                        >
                          {formatDateTime(shipEtdRaw)}
                        </div>
                      </div>
                    )}

                    {shipCurrentStatus && (
                      <div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: 6 }}>
                          Current Status
                        </div>
                        <div style={{ fontSize: "28px", fontWeight: 800 }}>
                          {shipCurrentStatus}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      borderLeft: "1px solid #ecf0f1",
                      paddingLeft: "16px",
                      fontSize: "13px",
                      lineHeight: 1.7,
                    }}
                  >
                    <div><strong>Carrier</strong><br />{shipCarrier || "N/A"}</div>
                    <div style={{ marginTop: 10 }}>
                      <strong>Tracking ID</strong><br />{shipAwb || "N/A"}
                    </div>
                    {shipUpdatedOnRaw && (
                      <div style={{ marginTop: 10 }}>
                        <strong>Updated On</strong><br />{formatDateTime(shipUpdatedOnRaw)}
                      </div>
                    )}
                    {shipSummary?.order_id && (
                      <div style={{ marginTop: 10 }}>
                        <strong>Order ID</strong><br />{shipSummary.order_id}
                      </div>
                    )}
                    {shipSummary?.pickup_date && (
                      <div style={{ marginTop: 10 }}>
                        <strong>Order Date</strong><br />{formatDateTime(shipSummary.pickup_date)}
                      </div>
                    )}
                    <div style={{ marginTop: 10 }}>
                      <strong>Order Type</strong><br />
                      {(orderData.order.paymentStatus || "").toLowerCase() === "completed"
                        ? "PREPAID"
                        : "COD"}
                    </div>
                  </div>
                </div>

                {resolvedTrackingInfo?.tracking_data?.track_url && (
                  <div style={{ marginTop: 12 }}>
                    <a
                      href={String(resolvedTrackingInfo.tracking_data.track_url).trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="x_btn x_btn-secondary"
                      style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
                    >
                      Open Shiprocket Tracking
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking Number */}
          <div className="x_card">
            <div className="x_card-header">
              <h2>Tracking Information</h2>
            </div>
            <div className="x_card-body" style={{ padding: "20px" }}>
              <div className="x_form-group">
                <label className="x_form-label">Tracking Number</label>
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #ecf0f1",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {orderDetails.trackingNumber || shipAwb || "N/A"}
                </div>
              </div>
              <p style={{ margin: 0 }}>
                <strong>Address :</strong> {orderDetails.shippingAddress}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="x_card">
            <div className="x_card-header">
              <h2>Customer Information</h2>
            </div>
            <div className="x_card-body" style={{ padding: "20px" }}>
              <p style={{ margin: "0 0 10px 0" }}>
                <strong>Name :</strong> {orderDetails.customer}
              </p>
              <p style={{ margin: "0 0 10px 0" }}>
                <strong>Email :</strong> {orderDetails.email}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Phone :</strong> {orderDetails.phone}
              </p>
            </div>
          </div>

          {/* Order Items (span full width of right column) */}
          <div className="x_card full">
            <div className="x_card-header">
              <h2>Order Items</h2>
            </div>
            <div className="x_card-body">
              <div className="xn_table-wrapper">
                <table className="x_table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.name ||
                            item.title ||
                            item.product?.name ||
                            "Item"}
                        </td>
                        <td>{item.qty || item.quantity}</td>
                        <td>₹{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: "1px solid #ecf0f1",
                }}
              >
                <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                  <strong>Total Amount:</strong> {orderDetails.amount}
                </p>
              </div>
            </div>
          </div>

          {/* Shiprocket Tracking Activities */}
          {shiprocketScans.length > 0 && (
            <div className="x_card full">
              <div className="x_card-header">
                <h2>Shiprocket Tracking Activities</h2>
              </div>
              <div className="x_card-body" style={{ padding: "0" }}>
                <div className="shiprocket-timeline">
                  {shiprocketScans.map((scan, index) => (
                    <div
                      key={index}
                      className="shiprocket-item active"
                    >
                      <div className="shiprocket-dot" />
                      <div className="shiprocket-content" style={{ flex: 1 }}>
                        <h4>{scan.activity}</h4>
                        <p>
                          {scan.date} {scan.time}
                          {scan.location && ` • ${scan.location}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackOrder;
