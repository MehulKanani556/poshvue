import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiCircle } from "react-icons/fi";

function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Mock orders data (used to determine status when navigating without state)
  const ordersMock = [
    { id: "ORD-001", status: "Delivered" },
    { id: "ORD-002", status: "Processing" },
    { id: "ORD-003", status: "Pending" },
    { id: "ORD-004", status: "Delivered" },
    { id: "ORD-005", status: "Shipped" },
    { id: "ORD-006", status: "Processing" },
    { id: "ORD-007", status: "Delivered" },
    { id: "ORD-008", status: "Pending" },
    { id: "ORD-009", status: "Shipped" },
    { id: "ORD-010", status: "Delivered" },
    { id: "ORD-011", status: "Processing" },
  ];

  // Determine current order status (fallback to Pending)
  const currentOrder = ordersMock.find((o) => o.id === orderId);
  const currentStatus = currentOrder?.status || "Pending";

  // Timeline steps
  const baseSteps = ["Order Confirmed", "Processing", "Shipped", "Delivered"];

  // Map status to number of completed steps
  const completedCount = useMemo(() => {
    switch (currentStatus) {
      case "Delivered":
        return 4;
      case "Shipped":
        return 3;
      case "Processing":
        return 2;
      case "Pending":
      default:
        return 1;
    }
  }, [currentStatus]);

  // Helper: interpolate between two hex colors
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
  };
  const rgbToHex = (r,g,b) => {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const interpHex = (a, b, t) => {
    const ra = hexToRgb(a), rb = hexToRgb(b);
    const r = ra[0] + (rb[0]-ra[0]) * t;
    const g = ra[1] + (rb[1]-ra[1]) * t;
    const bl = ra[2] + (rb[2]-ra[2]) * t;
    return rgbToHex(r,g,bl);
  };

  // Colors: light -> dark green
  const lightGreen = '#dff7e8';
  const darkGreen = '#27ae60';

  const trackingSteps = baseSteps.map((s, i) => {
    const completed = i < completedCount;
    let color = '#ecf0f1';
    if (completed) {
      // distribute shades from light to dark across completed steps
      const t = completedCount > 1 ? (i / (completedCount - 1)) : 1; // 0..1
      color = interpHex(lightGreen, darkGreen, t);
    }
    return {
      step: s,
      date: completed ? '2024-01-01' : '',
      time: completed ? (i === 0 ? '10:30 AM' : i === 1 ? '2:15 PM' : i === 2 ? '8:00 AM' : '5:30 PM') : '',
      completed,
      color,
    };
  });

  const orderDetails = {
    orderId: orderId,
    customer: "John Doe",
    email: "john@example.com",
    phone: "+1-234-567-8900",
    amount: "$150.00",
    items: [
      { name: "Wireless Headphones", quantity: 1, price: "$89.99" },
      { name: "Phone Case", quantity: 2, price: "$19.99 each" },
    ],
    shippingAddress: "123 Main Street, New York, NY 10001",
    trackingNumber: "TRK-2024-001234567",
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
        @media (max-width: 900px){
          .track-layout{ grid-template-columns: 1fr; }
          .right-grid{ grid-template-columns: 1fr; }
          .timeline-card{ min-height: 300px; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <button
          className="x_btn x_btn-secondary"
          onClick={() => navigate("/orders")}
          title="Back to Orders"
        >
          <FiArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 0 15px" }}>
          Order Tracking - {orderId}
        </h1>
      </div>

      <div className="track-layout" style={{ gap: "20px" }}>
        {/* Tracking Timeline */}
        <div className="x_card timeline-card">
          <div className="x_card-header">
            <h2>Tracking Timeline</h2>
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
                  {orderDetails.trackingNumber}
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
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ecf0f1" }}>
                <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                  <strong>Total Amount:</strong> {orderDetails.amount}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    
    </div>
  );
}

export default TrackOrder;
