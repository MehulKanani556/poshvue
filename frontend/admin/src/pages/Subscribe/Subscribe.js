import React, { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import client from "../../api/client";
import Modal from "../../components/Modal";

function Subscribe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/support/subscriptions", { params: { page: 1, limit: 100 } });
        setItems(res.data.items || []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load subscriptions";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await client.delete(`/support/subscriptions/${deletingItem._id}`);
      setItems((prev) => prev.filter((s) => s._id !== deletingItem._id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
    setShowDeleteModal(false);
    setDeletingItem(null);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 , color: '#2b4d6e'}}>Newsletter Subscribers</h1>
        <p style={{ color: "#7f8c8d" }}>Manage email subscriptions</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="alert alert-info">Loading subscribers...</div>}

      <div className="x_card">
        <div className="x_card-body">
          <div className="xn_table-wrapper">
            <table className="x_table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Subscribed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sub) => (
                  <tr key={sub._id}>
                    <td style={{ fontWeight: 600 }}>{sub.email}</td>
                    <td>{sub.source || 'frontend'}</td>
                    <td>{new Date(sub.createdAt).toLocaleString()}</td>
                    <td className="td_btnrm">
                      <button className="btn_remove" title="Delete" onClick={() => handleDeleteClick(sub)}>
                        <FiTrash2 />
                      </button>
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
        title="Delete Subscriber"
        message="Are you sure you want to delete this subscriber?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Subscribe;
