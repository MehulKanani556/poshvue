import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { FiStar } from "react-icons/fi";
import client from "../../api/client";

function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        product: "",
        user: "",
        star: 5,
        msg: "",
        img: "",
        status: "pending",
    });

    // Fetch reviews from API
    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await client.get("/content/reviews");
            const items = res.data?.items || [];
            setReviews(items);
        } catch (err) {
            setError(err.message || "Failed to load reviews");
            console.error("Error loading reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "star" ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("");
            const payload = { ...formData };
            
            // Map form fields to API format
            if (payload.star) {
                payload.rating = payload.star;
                delete payload.star;
            }
            if (payload.msg) {
                payload.comment = payload.msg;
                delete payload.msg;
            }
            if (payload.img) {
                payload.image = payload.img;
                delete payload.img;
            }

            if (editingId) {
                // Update review status only (admin can change status)
                await client.put(`/content/reviews/${editingId}/status`, {
                    status: payload.status
                });
            } else {
                // Create new review
                await client.post("/content/reviews", payload);
            }
            
            await loadReviews();
            resetForm();
        } catch (err) {
            setError(err.message || "Failed to save review");
            console.error("Error saving review:", err);
        }
    };

    const resetForm = () => {
        setFormData({ product: "", user: "", star: 5, msg: "", img: "", status: "pending" });
        setEditingId(null);
        setShowModal(false);
    };

    const handleEdit = (review) => {
        setFormData({
            product: review.product?._id || review.product || "",
            user: review.user?._id || review.user || "",
            star: review.rating || 5,
            msg: review.comment || "",
            img: review.image || "",
            status: review.status || "pending",
        });
        setEditingId(review._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            try {
                await client.delete(`/content/reviews/${id}`);
                await loadReviews();
            } catch (err) {
                setError(err.message || "Failed to delete review");
                console.error("Error deleting review:", err);
            }
        }
    };

    const renderStars = (count) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <FiStar
                key={i}
                size={14}
                style={{ color: i < count ? "#ffc107" : "#ddd", fill: i < count ? "#ffc107" : "none" }}
            />
        ));
    };

    const getImageUrl = (img) => {
        if (!img) return "";
        if (img.startsWith("http")) return img;
        if (img.startsWith("data:image")) return img;
        return `http://localhost:5000${img}`;
    };

    if (loading) {
        return (
            <div>
                <div style={{ marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Reviews</h1>
                    <p style={{ color: "#7f8c8d" }}>Manage product reviews and ratings</p>
                </div>
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <p>Loading reviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: "20px" }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Reviews</h1>
                    <p style={{ color: "#7f8c8d" }}>Manage product reviews and ratings</p>
            </div>

            {error && (
                <div style={{ 
                    padding: "10px", 
                    marginBottom: "20px", 
                    background: "#fee", 
                    color: "#c33", 
                    borderRadius: "4px" 
                }}>
                    {error}
                </div>
            )}


            {/* Modal */}
            <div className={`x_modal-overlay ${showModal ? "x_active" : ""}`}>
                <div className="x_modal-content">
                    <div className="x_modal-header">
                        <h2>{editingId ? "Edit Review" : "Add Review"}</h2>
                        <button className="x_modal-close" onClick={resetForm}>
                            <FiX />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="x_modal-body">
                            {editingId ? (
                                <>
                                    <div className="x_form-group">
                                        <label className="x_form-label">Status</label>
                                        <select
                                            name="status"
                                            className="x_form-select"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                        </select>
                                    </div>
                                    <p style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "10px" }}>
                                        Note: You can only change the status. Product and user cannot be changed.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="x_form-group">
                                        <label className="x_form-label">Product ID</label>
                                        <input
                                            type="text"
                                            name="product"
                                            className="x_form-control"
                                            value={formData.product}
                                            onChange={handleInputChange}
                                            placeholder="Product MongoDB ID"
                                            required
                                        />
                                    </div>

                                    <div className="x_form-group">
                                        <label className="x_form-label">User ID</label>
                                        <input
                                            type="text"
                                            name="user"
                                            className="x_form-control"
                                            value={formData.user}
                                            onChange={handleInputChange}
                                            placeholder="User MongoDB ID"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div className="x_form-group">
                                <label className="x_form-label">Rating (1-5)</label>
                                <select
                                    name="star"
                                    className="x_form-select"
                                    value={formData.star}
                                    onChange={handleInputChange}
                                >
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <option key={s} value={s}>
                                            {s} Star{s > 1 ? "s" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="x_form-group">
                                <label className="x_form-label">Image URL</label>
                                <input
                                    type="url"
                                    name="img"
                                    className="x_form-control"
                                    value={formData.img}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="x_form-group">
                                <label className="x_form-label">Review Message</label>
                                <textarea
                                    name="msg"
                                    className="x_form-control"
                                    value={formData.msg}
                                    onChange={handleInputChange}
                                    placeholder="Write your review..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="x_modal-footer">
                            <button type="button" className="x_btn x_btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button type="submit" className="x_btn x_btn-primary">
                                {editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Reviews Grid */}
            {reviews.length === 0 ? (
                <div className="x_card" style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "#7f8c8d" }}>No reviews found</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                    {reviews.map((review) => (
                        <div key={review._id} className="x_card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                                <div style={{ display: "flex", gap: "5px" }}>{renderStars(review.rating || 0)}</div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => handleEdit(review)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#007bff" }}
                                        title="Edit Status"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(review._id)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc3545" }}
                                        title="Delete"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {review.image && (
                                <img
                                    src={getImageUrl(review.image)}
                                    alt="Review"
                                    style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px", marginBottom: "10px" }}
                                    onError={(e) => { e.target.style.display = "none"; }}
                                />
                            )}

                            <div style={{ marginBottom: "10px" }}>
                                <span style={{ 
                                    fontSize: "11px", 
                                    padding: "4px 8px", 
                                    borderRadius: "4px",
                                    background: review.status === "approved" ? "#d4edda" : "#fff3cd",
                                    color: review.status === "approved" ? "#155724" : "#856404"
                                }}>
                                    {review.status || "pending"}
                                </span>
                            </div>

                            <p style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "5px" }}>
                                <strong>Product:</strong> {review.product?.name || review.product?._id || "N/A"}
                            </p>
                            <p style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "10px" }}>
                                <strong>User:</strong> {review.user?.name || review.user?.email || review.user?._id || "N/A"}
                            </p>
                            <p style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "5px" }}>
                                {review.comment || "No comment"}
                            </p>
                            <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>
                                {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Reviews;
