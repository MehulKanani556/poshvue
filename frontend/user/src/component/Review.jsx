import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { Star, Camera, X } from "lucide-react";
import client from "../api/client";
import { useNavigate } from "react-router-dom";

const Review = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [reviewComment, setReviewComment] = useState("");
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch reviewable products on component mount
  useEffect(() => {
    const fetchReviewableProducts = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          navigate("/Register");
          return;
        }

        setLoading(true);
        const res = await client.get("/content/reviews/reviewable-products");
        const products = res.data.items || [];
        
        // Format products for display
        const formattedProducts = products.map((product) => ({
          id: product.id,
          name: product.name,
          image: product.image?.startsWith("http")
            ? product.image
            : product.image
            ? `http://localhost:5000${product.image}`
            : "https://via.placeholder.com/100",
        }));
        
        setPurchasedItems(formattedProducts);
      } catch (err) {
        console.error("Error fetching reviewable products:", err);
        if (err.response?.status === 401) {
          navigate("/Register");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviewableProducts();
  }, [navigate]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Limit to 4 images total
      const remainingSlots = 4 - selectedImages.length;
      const filesToAdd = files.slice(0, remainingSlots);
      
      if (filesToAdd.length === 0) {
        alert("You can only upload up to 4 images");
        return;
      }
      
      const previewUrls = filesToAdd.map((file) => URL.createObjectURL(file));
      setSelectedImages((prev) => [...prev, ...previewUrls]);
      setImageFiles((prev) => [...prev, ...filesToAdd]);
      
      if (files.length > remainingSlots) {
        alert(`Only ${remainingSlots} image(s) added. Maximum 4 images allowed.`);
      }
    }
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // Revoke object URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newImages;
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!selectedProduct) {
      setShowModal(false);
      return;
    }
    
    if (userRating === 0) {
      alert("Please select a rating");
      return;
    }

    if (!reviewComment.trim()) {
      alert("Please write a review");
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append('product', selectedProduct.id);
      formData.append('rating', userRating);
      formData.append('comment', reviewComment);
      
      // Append all image files (max 4)
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const res = await client.post("/content/reviews", formData);
      
      // Remove the reviewed product from the list
      setPurchasedItems((prev) =>
        prev.filter((item) => item.id !== selectedProduct.id)
      );

      // Reset form
      setShowModal(false);
      setUserRating(0);
      setReviewComment("");
      setSelectedImages([]);
      setImageFiles([]);
      setSelectedProduct(null);

      // Show success message
      alert("Review submitted successfully!");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="d_review_page">
        <Container>
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="d_review_page">
      <Container>
        <div className="text-center mb-4">
          <h2 className="d_title">Your Purchases</h2>
          <p className="text-muted small">
            Rate & share your experience with photos
          </p>
        </div>

        <Row className="justify-content-center">
          <Col lg={7}>
            {purchasedItems.length === 0 ? (
              <Card className="d_review-card text-center py-5">
                <p className="text-muted mb-0">
                  No products available for review. You can only review products
                  you have purchased with completed payment.
                </p>
              </Card>
            ) : (
              purchasedItems.map((item) => (
                <Card key={item.id} className="d_review-card">
                  <div className="d-flex align-items-center gap-3">
                    <img src={item.image} alt={item.name} />
                    <div className="flex-grow-1">
                      <h6>{item.name}</h6>
                      <small>Product ID: {item.id}</small>
                    </div>
                    <Button
                      size="sm"
                      className="d_review-btn"
                      onClick={() => {
                        setSelectedProduct(item);
                        setSelectedImages([]);
                        setImageFiles([]);
                        setUserRating(0);
                        setReviewComment("");
                        setShowModal(true);
                      }}
                    >
                      Write Review
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </Col>
        </Row>
      </Container>

      {/* MODAL */}
      <Modal
        show={showModal && selectedProduct}
        onHide={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        centered
        size="md"
      >
        <Modal.Header closeButton className="border-0 pb-1">
          <Modal.Title className="fw-bold fs-6">
            Review {selectedProduct?.name || "Product"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-0">
          {selectedProduct ? (
            <Form>
              {/* RATING */}
              <div className="d_rating-box">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={26}
                    onClick={() => setUserRating(star)}
                    fill={star <= userRating ? "#c59d5f" : "none"}
                    stroke={star <= userRating ? "#c59d5f" : "#ccc"}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Your Review</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Fitting, fabric quality, comfort..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </Form.Group>

              {/* IMAGE UPLOAD */}
              <div className="d_upload-grid mb-4">
                {selectedImages.map((img, i) => (
                  <div key={i} className="d_img-box">
                    <img src={img} alt="preview" />
                    <span onClick={() => removeImage(i)}>
                      <X size={12} />
                    </span>
                  </div>
                ))}

                {selectedImages.length < 4 && (
                  <label className="d_img-upload">
                    <Camera size={22} />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              {selectedImages.length > 0 && (
                <p className="small text-muted mb-3">
                  {selectedImages.length} of 4 images selected
                </p>
              )}

              <Button
                className="d_submit-review w-100"
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </Form>
          ) : (
            <div className="text-center py-3">
              <p className="text-muted">No product selected</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* STYLES */}
      <style>{`
        .d_review_page {
          background:#fafafa;
          padding:50px 0;
        }
        .d_title {
          font-weight:700;
        }

        /* PRODUCT CARD */
        .d_review-card {
          border:0;
          padding:14px 16px;
          margin-bottom:12px;
          border-radius:14px;
          box-shadow:0 6px 20px rgba(0,0,0,0.04);
        }
        .d_review-card img {
          width:56px;
          height:56px;
          border-radius:10px;
          object-fit:cover;
        }
        .d_review-card h6 {
          margin:0;
          font-weight:600;
        }
        .d_review-card small {
          color:#777;
        }
        .d_review-btn {
          background:#0a2845;
          border:none;
          border-radius:20px;
          padding:6px 14px;
          text-wrap: nowrap;
        }
        .d_review-btn:hover {
          background:#c59d5f;
        }

        /* RATING */
        .d_rating-box {
          display:flex;
          justify-content:center;
          gap:10px;
          padding:16px;
          background:#f6f6f6;
          border-radius:14px;
          margin-bottom:18px;
        }

        /* UPLOAD */
        .d_upload-grid {
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }
        .d_img-box {
          position:relative;
        }
        .d_img-box img {
          width:72px;
          height:72px;
          border-radius:10px;
          object-fit:cover;
        }
        .d_img-box span {
          position:absolute;
          top:-6px;
          right:-6px;
          background:#0a2845;
          color:#fff;
          border-radius:50%;
          width:18px;
          height:18px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }
        .d_img-upload {
          width:72px;
          height:72px;
          border:2px dashed #ccc;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          color:#777;
        }
        .d_img-upload:hover {
          border-color:#c59d5f;
          color:#c59d5f;
        }

        /* SUBMIT */
        .d_submit-review {
          background:#0a2845;
          border:none;
          padding:12px;
          border-radius:10px;
          font-weight:600;
        }
        .d_submit-review:hover {
          background:#c59d5f;
        }

        @media(max-width:576px){
          .d_review-card { padding:12px; }
          .d_img-box img,
          .d_img-upload {
            width:64px;
            height:64px;
          }
            .d_review-btn {
            font-size: 12px;
            padding: 6px 10px;
          }
          /* Buttons */
button:focus,
button:active,
.btn:focus,
.btn:active,
.btn-primary:focus,
.btn-primary:active {
  outline: none !important;
  box-shadow: none !important;
}

/* Custom review button */
.d_review-btn:focus,
.d_review-btn:active,
.d_submit-review:focus,
.d_submit-review:active {
  outline: none !important;
  box-shadow: none !important;
}

/* Modal close (X) button */
.btn-close:focus,
.btn-close:active {
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}
  :not(.btn-check)+.btn:active{
         background-color: #9c7d4fff !important;
  }

/* Remove blue highlight on click (mobile tap) */
button {
  -webkit-tap-highlight-color: transparent;
}
      `}</style>
    </section>
  );
};

export default Review;
