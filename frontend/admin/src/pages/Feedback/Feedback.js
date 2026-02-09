import React, { useEffect, useState } from "react";
import { FiX, FiEye, FiTrash2 } from "react-icons/fi";
import client from "../../api/client";
import Modal from "../../components/Modal";

function Feedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingData, setViewingData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/support/feedbacks", { params: { page: 1, limit: 50 } });
        setItems(res.data.items || []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load feedback";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const handleView = (item) => {
    setViewingData(item);
    setShowViewModal(true);
  };

  const handleCloseView = () => {
    setViewingData(null);
    setShowViewModal(false);
  };

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await client.delete(`/support/feedbacks/${deletingItem._id}`);
      setItems((prev) => prev.filter((f) => f._id !== deletingItem._id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
    setShowDeleteModal(false);
    setDeletingItem(null);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: '#2b4d6e' }}>Feedback</h1>
        <p style={{ color: "#7f8c8d" }}>Manage customer feedback</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Loading feedback...</div>}

      {/* View Modal */}
      <div className={`x_modal-overlay ${showViewModal ? "x_active" : ""}`}>
        <div className="x_modal-content">
          <div className="x_modal-header">
            <h2>Feedback Details</h2>
            <button className="x_modal-close" onClick={handleCloseView}>
              <FiX />
            </button>
          </div>
          <div className="x_modal-body">
            {viewingData ? (
              <div>
                <div className="x_form-group">
                  <label className="x_form-label">Name</label>
                  <p style={{ padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>{viewingData.name}</p>
                </div>
                <div className="x_form-group">
                  <label className="x_form-label">Email</label>
                  <p style={{ padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>{viewingData.email}</p>
                </div>
                <div className="x_form-group">
                  <label className="x_form-label">Type</label>
                  <p style={{ padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>{viewingData.type}</p>
                </div>
                <div className="x_form-group">
                  <label className="x_form-label">Rating</label>
                  <p style={{ padding: "10px", background: "#f5f5f5", borderRadius: "4px" }}>{viewingData.rating ?? '-'}</p>
                </div>
                <div className="x_form-group">
                  <label className="x_form-label">Message</label>
                  <p style={{ padding: "10px", background: "#f5f5f5", borderRadius: "4px", lineHeight: "1.6" }}>{viewingData.message}</p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="x_modal-footer">
            <button type="button" className="x_btn x_btn-secondary" onClick={handleCloseView}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="x_card">
        <div className="x_card-body">
          <div className="xn_table-wrapper">
            <table className="x_table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Rating</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((fb) => (
                  <tr key={fb._id}>
                    <td>{fb.name}</td>
                    <td>{fb.email}</td>
                    <td>{fb.type}</td>
                    <td>
                      <span style={{ color: "#ffc107", fontWeight: 600 }}>★ {fb.rating ?? '-'}</span>
                    </td>
                    <td style={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fb.message}</td>
                    <td className="td_btnrm">
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                        style={{ backgroundColor: "#d1ecf1", color: "#0c5460" }}
                        className="x_btn x_btn-sm mx-2" title="View" 
                        onClick={() => handleView(fb)}>
                          <FiEye/>
                        </button>
                        <button className="btn_remove" title="Delete" onClick={() => handleDeleteClick(fb)}>
                          <FiTrash2/>
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

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Feedback;
