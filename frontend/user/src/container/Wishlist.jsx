import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Heart, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import wishEmptyImg from "../img/image.png";
import axios from "axios";
import { useCurrency } from "../context/CurrencyContext";

function Wishlist(props) {
  const navigate = useNavigate();
  const { formatPrice, selectedCountry } = useCurrency();
  const [wishlistItems, setWishlistItems] = useState([]);
  { console.log(wishlistItems, "wishlistItems") }
  const [loading, setLoading] = useState(true);
  
  // Listen for country changes and force re-render
  useEffect(() => {
    const handleCountryChange = () => {
      // Force re-render when country changes
      setWishlistItems((prev) => [...prev]);
    };
    window.addEventListener("countryChanged", handleCountryChange);
    return () =>
      window.removeEventListener("countryChanged", handleCountryChange);
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const getImageUrl = (img) => {
    if (!img) return wishEmptyImg; // fallback
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/wishlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res.data.items, "res");


      setWishlistItems(res.data.items);
    } catch (error) {
      console.error("Wishlist fetch error", error.response?.data || error.message);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        console.log("User not logged in");
        return;
      }

      // Call API to remove item
      await axios.delete(`http://localhost:5000/api/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state to remove item from UI
      setWishlistItems((prev) =>
        prev.filter((i) => i.product._id !== productId)
      );

      console.log("Item removed from wishlist");
    } catch (err) {
      console.error("Error removing item", err.response?.data || err.message);
    }
  };

  return (
    <>
      <section className="z_wish_section py-5">
        <Container>
          {wishlistItems.length === 0 ? (
            /* EMPTY STATE */
            <Row className="justify-content-center">
              <Col lg={6}>
                <div className="z_wish_empty_wrap text-center py-5">
                  <img src={wishEmptyImg} alt="Empty Wishlist" className="empty-img-style mb-4" />
                  <h3>Your wishlist is empty</h3>
                  <p className="text-muted mb-4">
                    Save your favorite items by tapping the heart icon.
                  </p>
                  <button onClick={() => navigate("/")} className="z_cart_empty_btn">
                    Explore Collection <ArrowRight size={18} />
                  </button>
                </div>
              </Col>
            </Row>
          ) : (

            <>
              {console.log("wish")}

              {/* HEADER */}
              <div className="d-flex justify-content-between align-items-end mb-4 pb-2 border-bottom">
                <div>
                  <h2 className="fw-bold mb-1">My Wishlist</h2>
                  <p className="text-muted small mb-0">
                    {wishlistItems.length} Items saved
                  </p>
                </div>
                <Button variant="link" onClick={() => navigate("/ShopPage")} className="text-dark text-decoration-none">
                  Continue Shopping
                </Button>
              </div>

              {/* ITEMS */}
              <Row className="g-3 g-md-4">

                {wishlistItems.map((item) => {
                  console.log(item, "item");
                  console.log("item");
                  const p = item.product; // 🔥 populated product

                  return (
                    <Col key={p._id} lg={3} md={4} sm={6} xs={6}>
                      <div className="d_product-card">
                        <div className="d_img-container">
                          <button
                            className="d_remove-btn"
                            onClick={() => removeFromWishlist(p._id)}
                          >
                            <X size={18} />
                          </button>

                          <img
                            src={getImageUrl(p.images[0])}
                            alt={p.name}
                            className="d_product-img"
                            onClick={() => navigate(`/product/${p._id}`)}
                          />
                        </div>

                        <div className="d_product-info">
                          <h6 className="d_product-name">{p.title}</h6>
                          <p className="d_product-price">{formatPrice(p.salePrice || p.price)}</p>

                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </Container>
      </section>

      <style>{`
        .z_wish_section { background-color: #fdfdfd; min-height: 80vh; }
        
        /* Empty State */
        .empty-img-style { height: 120px; width: 120px; object-fit: contain; opacity: 0.8; }
        .z_wish_heading { font-weight: 700; letter-spacing: -0.5px; }
        .z_wish_text { font-size: 15px; line-height: 1.6; }

        /* Card Styles */
        .d_product-card { 
          background: #fff; 
          border: 1px solid #eee;
          overflow: hidden; 
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .d_product-card:hover { 
          border-color: #ddd;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
          transform: translateY(-5px);
        }

        .d_img-container { 
          position: relative; 
          width: 100%; 
          aspect-ratio: 3/4; 
          background: #f8f8f8; 
          overflow: hidden;
        }

        .d_product-img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          cursor: pointer;
          transition: transform 0.6s ease;
          display: block;
        }

        .d_product-card:hover .d_product-img { transform: scale(1.08); }

        /* Remove Button */
        .d_remove-btn { 
          position: absolute; 
          top: 8px; 
          right: 8px; 
          background: rgba(255, 255, 255, 0.9); 
          color: #0a2845;
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: none; 
          z-index: 10;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .d_remove-btn:hover { background: #ff4d4d; color: #fff; }

        /* Overlay - Hidden on mobile for better UX */
        .d_product-overlay { 
          position: absolute; 
          bottom: 0; 
          left: 0; 
          width: 100%; 
          padding: 15px; 
          background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
          opacity: 0; 
          transition: all 0.3s ease; 
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 40%;
        }
        .d_product-card:hover .d_product-overlay { opacity: 1; }

        .d_quick-view-btn { 
          background: #fff; 
          color: #0a2845; 
          border: none; 
          padding: 8px 18px; 
          font-size: 12px; 
          font-weight: 600; 
          border-radius: 2px;
          text-transform: uppercase;
        }

        /* Product Info */
        .d_product-info { padding: 12px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .d_product-name { 
          font-size: 14px; 
          color: #444; 
          font-weight: 500; 
          margin-bottom: 4px; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
        }
        .d_product-price { 
          font-weight: 700; 
          color: #0a2845; 
          font-size: 15px; 
          margin-bottom: 0;
        }

        .add-bag-btn {
          font-size: 13px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        /* Responsive Adjustments */
        @media (max-width: 576px) {
          .d_product-info { padding: 10px; }
          .d_product-name { font-size: 12px; }
          .d_product-price { font-size: 13px; }
          .btn-text { font-size: 11px; }
          .bag-icon { width: 14px; height: 14px; }
          .d_img-container { aspect-ratio: 2/3; } /* Slightly taller on mobile */
          .d_remove-btn { width: 24px; height: 24px; top: 5px; right: 5px; }
          .d_remove-btn svg { width: 14px; height: 14px; }
        }
      `}</style>
    </>
  );

}

export default Wishlist;