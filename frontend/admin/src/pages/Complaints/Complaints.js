import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiEye } from "react-icons/fi";
import client from "../../api/client";

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingData, setViewingData] = useState(null);


  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/support/complaints", {
          params: { page: 1, limit: 50 },
        });
        console.log(res.data, "res");
        setComplaints(res.data.items || []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load complaints";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const handleView = (item) => {
    setViewingData(item);
    setShowViewModal(true);
  };

  const handleCloseView = () => {
    setViewingData(null);
    setShowViewModal(false);
  };

  const toggleStatus = async (item) => {
    try {
      const nextStatus = item.status === "resolved" ? "open" : "resolved";
      const res = await client.put(`/support/complaints/${item._id}/status`, {
        status: nextStatus,
      });
      const updated = res.data.item;
      setComplaints((prev) =>
        prev.map((c) => (c._id === item._id ? updated : c))
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: '#2b4d6e'  }}>Complaints</h1>
        <p style={{ color: "#7f8c8d" }}>
          Manage customer complaints and issues
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Loading complaints...</div>}

      {/* View Modal */}
      <div className={`x_modal-overlay ${showViewModal ? "x_active" : ""}`}>
        <div className="x_modal-content">
          <div className="x_modal-header">
            <h2>View Complaint</h2>
            <button className="x_modal-close" onClick={handleCloseView}>
              <FiX />
            </button>
          </div>
          <div className="x_modal-body">
            {viewingData && (
              console.log(viewingData, "viewingData"),

              <>
                <p>
                  <strong>Name:</strong> {viewingData.name}
                </p>
                <p>
                  <strong>Email:</strong> {viewingData.email}
                </p>
                <p>
                  <strong>Mobile:</strong> {viewingData.mobile}
                </p>
                <p>
                  <strong>Order No:</strong>{" "}
                  {typeof viewingData.orderNumber === "object"
                    ? viewingData.orderNumber.orderNumber || viewingData.orderNumber._id
                    : viewingData.orderNumber}
                </p>

                <p>
                  <strong>Complaint Type:</strong> {viewingData.complaintType}
                </p>
                <p>
                  <strong>Subject:</strong> {viewingData.subject}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span
                    style={{
                      color:
                        viewingData.status === "resolved" ? "green" : "orange",
                      fontWeight: 600,
                    }}
                  >
                    {viewingData.status}
                  </span>
                </p>

                <p>
                  <strong>Message:</strong>
                </p>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {viewingData.message}
                </pre>

                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(viewingData.createdAt).toLocaleString()}
                </p>
              </>
            )}
          </div>
          <div className="x_modal-footer">
            <button
              type="button"
              className="x_btn x_btn-secondary"
              onClick={handleCloseView}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="x_card">
        <div className="x_card-body">
          <div className="xn_table-wrapper">
            <table className="x_table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Order No</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td>{complaint.name}</td>
                    <td>
                      {complaint.orderNumber?.orderNumber ||
                        complaint.orderNumber?._id}
                    </td>
                    <td>{complaint.complaintType}</td>
                    <td>
                      <span
                        style={{
                          color:
                            complaint.status === "resolved"
                              ? "green"
                              : "orange",
                          fontWeight: 600,
                        }}
                      >
                        {complaint.status}
                      </span>
                    </td>
                    <td
                      style={{
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {complaint.message}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="x_btn x_btn-sm mx-2"
                          title="View"
                          onClick={() => handleView(complaint)}
                          style={{ backgroundColor: "#d1ecf1", color: "#0c5460" }}
                        >
                          <FiEye />
                        </button>

                        <button
                          className="x_btn x_btn-primary py-1"
                          style={{ fontSize: "14px" }}
                          onClick={() => toggleStatus(complaint)}
                        >
                          {complaint.status === "resolved"
                            ? "Reopen"
                            : "Resolve"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Complaints;
