import React, { useEffect, useState } from "react";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import wishEmptyImg from "../img/image1.png";
import { toast } from "react-toastify";
import Loader from "../component/Loader";
import { useCurrency } from "../context/CurrencyContext";

function Cart() {
  const navigate = useNavigate();
  const { formatPrice, selectedCountry } = useCurrency();

  // Cart items state
  const [cartItems, setCartItems] = useState([]);
  
  // Listen for country changes and force re-render
  useEffect(() => {
    const handleCountryChange = () => {
      // Force re-render by updating a state or re-fetching cart
      setCartItems((prev) => [...prev]);
    };
    window.addEventListener("countryChanged", handleCountryChange);
    return () =>
      window.removeEventListener("countryChanged", handleCountryChange);
  }, []);
  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        toast.warning("Please login to continue");
        navigate("/register");
        return;
      }
      try {
        console.log("Cart fetched:");
        const res = await axios.get("http://localhost:5000/api/cart",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Cart fetched:", res.data.items);
        setCartItems(res.data.items || []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    fetchCart();
  }, []);

  // Update quantity for a specific variant (product + size + color)
  const updateQty = async ({ productId, size, color }, qty) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      // alert("Please login to continue");
      navigate("/register");
      return;
    }
    try {
      const res = await axios.put(
        "http://localhost:5000/api/cart/update",
        { productId, qty, size: size ?? null, color: color ?? null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Updated quantity response:", res.data.items);
      setCartItems(res.data.items || []);
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const increaseQty = (item) => {
    updateQty(
      { productId: item.product._id, size: item.size, color: item.color },
      item.quantity + 1
    );
  };

  const decreaseQty = (item) => {
    if (item.quantity > 1) {
      updateQty(
        { productId: item.product._id, size: item.size, color: item.color },
        item.quantity - 1
      );
    }
  };

  // Remove item
  const deleteItem = async (item) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      // alert("Please login to continue");
      navigate("/register");
      return;
    }
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/cart/remove/${item.product._id}?size=${encodeURIComponent(
          item.size || ""
        )}&color=${encodeURIComponent(item.color || "")}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Delete response:", res.data.items);
      setCartItems(res.data.items || []);
      toast.success("Item removed from cart");
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error(err.response?.data?.message || "Failed to remove item");
    }
  };
  const getImageUrl = (img) => {
    if (!img) return wishEmptyImg; // fallback
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  // Validate and apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/commerce/coupons/validate",
        {
          code: couponCode.trim(),
          subtotal: subTotal,
        }
      );

      if (res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        setCouponError("");
        toast.success(`Coupon "${res.data.coupon.code}" applied successfully!`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
      toast.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Coupon removed");
  };

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Totals - Fixed: Use salePrice if available, otherwise price
  const subTotal = cartItems.reduce(
    (acc, item) => acc + ((item.product?.salePrice || item.product?.price) || 0) * (item.quantity || 0),
    0
  );
  
  // Discount from coupon (not automatic 10%)
  const discount = appliedCoupon?.discountAmount || 0;
  const deliveryFee = cartItems.length > 0 ? 50 : 0;
  const total = subTotal - discount + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <section className="z_cart_section">
        <div className="a_header_container">
          <h2 className="z_cart_heading">Shopping Cart</h2>
          <div className="z_cart_empty">
            <img src={wishEmptyImg} alt="Empty cart" className="z_cart_empty_img" />
            <h3>Your cart is empty</h3>
            <p>Looks like you haven&apos;t added anything to your cart yet.</p>
            <button
              className="z_cart_empty_btn"
              onClick={() => navigate("/shoppage")}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="z_cart_section">
      <div className="a_header_container mx-2">
        <h2 className="z_cart_heading">Shopping Cart</h2>

        <div className="row z_cart_main">
          {/* LEFT CART TABLE */}
          <div className="col-lg-8 col-md-12">
            <div className="z_cart_table_wrapper mx-2">
              <div className="z_cart_table">
                {/* HEADER */}
                <div className="z_cart_table_head">
                  <span>Product Code</span>
                  <span>Quantity</span>
                  <span>Total</span>
                  <span>Action</span>
                </div>

                {/* ITEMS */}
                {cartItems.map((item) => (
                  <div
                    key={`${item.product._id}-${item.size || "nosize"}-${item.color || "nocolor"}`}
                    className="z_cart_row"
                  >
                    <div className="z_cart_product">
                      <img
                        src={getImageUrl(item.product.images[0])}
                        alt={item.product.title}
                        className="d_product-img"
                        onClick={() => navigate(`/product/${item.product._id}`)}
                      />
                      {/* <img src={item.product.images[0]} alt={item.name} /> */}
                      <div>
                        <h6>{item.product.title}</h6>
                        <p>
                          Size: {item.size || "N/A"} | Color: {item.color || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="z_cart_qty">
                      <button
                        className="qty_btn minus"
                        onClick={() => decreaseQty(item)}
                      >
                        −
                      </button>

                      <span className="qty_value">{item.quantity}</span>

                      <button
                        className="qty_btn plus"
                        onClick={() => increaseQty(item)}
                      >
                        +
                      </button>
                    </div>

                    <div className="z_cart_price">{formatPrice((item.product.salePrice || item.product.price) * item.quantity)}</div>

                    <div>
                    <button
                      className="z_cart_delete"
                      onClick={() => deleteItem(item)}
                    >
                      <RiDeleteBin6Fill
                        size={22}
                        style={{ color: "rgb(218 65 65)" }}
                      />
                    </button>
                    </div>
                  </div>
                ))}

                {/* UPDATE BUTTON */}
                <button className="z_cart_update">Update Cart</button>
              </div>
            </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="col-lg-4 col-md-12">
            <div className="z_cart_summary mx-2">
              <h5>Order Summary</h5>

              <div className="z_cart_coupon">
                {appliedCoupon ? (
                  <div style={{ 
                    padding: "10px", 
                    backgroundColor: "#d4edda", 
                    borderRadius: "4px",
                    marginBottom: "10px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "600", color: "#155724" }}>
                        {appliedCoupon.code} Applied
                        {appliedCoupon.discountType === 'percent' 
                          ? ` - ${appliedCoupon.amount}% OFF`
                          : ` - $${appliedCoupon.amount} OFF`}
                      </span>
                      <button
                        onClick={removeCoupon}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#721c24",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      className="z_cart_coupon_select"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          applyCoupon();
                        }
                      }}
                    />
                    <button 
                      className="z_cart_coupon_btn"
                      onClick={applyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                    >
                      {validatingCoupon ? "Validating..." : "Apply"}
                    </button>
                  </>
                )}
                {couponError && (
                  <small style={{ color: "#d32f2f", display: "block", marginTop: "5px" }}>
                    {couponError}
                  </small>
                )}
              </div>

              <div className="z_cart_summary_row">
                <span>Sub Total</span>
                <span>{formatPrice(subTotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="z_cart_summary_row">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>- ${discount.toFixed(2)} USD</span>
                </div>
              )}

              <div className="z_cart_summary_row">
                <span>Delivery fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>

              <div className="z_cart_summary_row z_cart_grand">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <p className="z_cart_note">
                90 Day Limited Warranty against manufacturer's defects
              </p>

              <button
                className="z_cart_checkout"
                onClick={() =>
                  navigate("/Checkout", {
                    state: {
                      cartItems,
                      subTotal,
                      discount,
                      deliveryFee,
                      total,
                      appliedCoupon,
                    },
                  })
                }
              >
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Cart;
