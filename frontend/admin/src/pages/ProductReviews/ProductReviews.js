import React, { useState, useEffect } from "react";
import { FiStar, FiChevronRight, FiX, FiMessageSquare } from "react-icons/fi";
import client from "../../api/client";

function ProductReviews() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    fetchProductsWithReviews();
  }, []);

  const fetchProductsWithReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await client.get("/content/reviews/products-with-reviews");
      setProducts(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products with reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowReviewsModal(true);
  };

  const closeModal = () => {
    setShowReviewsModal(false);
    setSelectedProduct(null);
  };

  const renderStars = (rating, size = 14) =>
    Array.from({ length: 5 }).map((_, i) => (
      <FiStar
        key={i}
        size={size}
        style={{
          color: i < rating ? "#ffc107" : "#ddd",
          fill: i < rating ? "#ffc107" : "none",
        }}
      />
    ));

  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("http") || img.startsWith("data:image")) return img;
    return `http://localhost:5000${img}`;
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div >
      {/* Responsive CSS Overrides */}
      <style>{`
        .reviews-modal-content {
          width: 95%;
          max-width: 700px;
          background: #f8f9fa;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 600px) {
          .reviews-modal-content {
            width: 100%;
            height: 100%;
            max-height: 100vh;
            border-radius: 0;
          }
          .review-card {
            flex-direction: column;
            gap: 6px !important;
          }
          .review-avatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
        }

        .review-image-hover:hover {
          transform: scale(1.05);
          transition: 0.2s;
        }
      `}</style>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Product Reviews</h1>
      <p style={{ color: "#7f8c8d", marginBottom: 20 }}>Tap a product to manage customer feedback</p>

      {error && (
        <div style={{ padding: 12, background: "#fee", color: "#c33", borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {products.map((product) => {
          const avgRating = product.reviews.length
            ? Math.round(product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length)
            : 0;

          return (
            <div
              key={product._id}
              style={{
                cursor: "pointer",
                background: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #eee",
                transition: "box-shadow 0.2s",
              }}
              onClick={() => handleProductClick(product)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {product.image && (
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  style={{ width: "100%", height: 180, objectFit: "cover" }}
                />
              )}

              <div style={{ padding: 15 }}>
                <h5 style={{ margin: "0 0 8px 0", fontSize: 16 }}>{product.name}</h5>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 3 }}>{renderStars(avgRating)}</div>
                  <span style={{ fontWeight: 700, color: "#2c3e50" }}>
                    ₹{product.salePrice?.toLocaleString("en-IN")}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#7f8c8d", display: "flex", alignItems: "center", gap: 4 }}>
                    <FiMessageSquare size={14} /> {product.reviews.length} Reviews
                  </span>
                  <FiChevronRight color="#bdc3c7" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* REDESIGNED MODAL */}
      {showReviewsModal && selectedProduct && (
        <div className="x_modal-overlay x_active" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="reviews-modal-content">
            {/* Sticky Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "#fff",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedProduct.name}</h2>
                <p style={{ margin: 0, fontSize: 12, color: "#7f8c8d" }}>
                  Customer Reviews ({selectedProduct.reviews.length})
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: "#f1f2f6",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
              {selectedProduct.reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#95a5a6" }}>
                  <FiMessageSquare size={40} style={{ marginBottom: 10, opacity: 0.5 }} />
                  <p>No reviews yet for this product.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {selectedProduct.reviews.map((review) => (
                    <div
                      key={review._id}
                      className="review-card"
                      style={{
                        display: "flex",
                        gap: 16,
                        padding: 16,
                        borderRadius: 12,
                        background: "#fff",
                        border: "1px solid #eceff1",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="review-avatar"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "#34495e",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(review.user?.name || "U")[0].toUpperCase()}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 15, display: "block" }}>
                              {review.user?.name || "Anonymous"}
                            </span>
                            <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                              {renderStars(review.rating || 0, 12)}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontWeight: 700,
                              background: review.status === "approved" ? "#e8f5e9" : "#fff3e0",
                              color: review.status === "approved" ? "#2e7d32" : "#ef6c00",
                            }}
                          >
                            {review.status || "pending"}
                          </span>
                        </div>

                        {review.comment && (
                          <p style={{ color: "#455a64", fontSize: 14, lineHeight: "1.5", margin: "10px 0" }}>
                            {review.comment}
                          </p>
                        )}

                        {/* Image Gallery */}
                        {(review.images?.length > 0 || review.image) && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                            {(review.images || [review.image]).map((img, idx) => (
                              <img
                                key={idx}
                                className="review-image-hover"
                                src={getImageUrl(img)}
                                alt="Review attachment"
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid #eee",
                                  cursor: "zoom-in",
                                }}
                                onClick={() => window.open(getImageUrl(img), "_blank")}
                              />
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 12, fontSize: 11, color: "#b0bec5", textAlign: "right" }}>
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductReviews;