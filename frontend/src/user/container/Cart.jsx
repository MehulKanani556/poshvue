import React, { useEffect, useState, createContext, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaMinus, FaTrash, FaShoppingBag } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import client from "../../api/client";
import { API_ENDPOINTS } from "../../config/api";
import wishEmptyImg from "../../img/image1.png";
import Loader from "../component/Loader";
import { useCurrency } from "../../context/CurrencyContext";

function Cart() {
  const navigate = useNavigate();
  const { formatPrice, getConvertedPrice, selectedCountry } = useCurrency();

  // Helper function to format numeric values with current currency
  const formatCurrency = (amount) => {
    if (!selectedCountry || amount === null || amount === undefined) return "—";
    const n = Number(amount);
    if (!Number.isFinite(n)) return String(amount);
    const formatted = n.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${selectedCountry.currencySymbol}${formatted}`;
  };

  // Cart items state
  const [cartItems, setCartItems] = useState([]);

  // Coupon state - initialize early to avoid initialization issues
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [total, setTotal] = useState(0);

  // Listen for country changes and force re-render
  // useEffect(() => {
  //   const handleCountryChange = () => {
  //     // Force re-render by updating a state or re-fetching cart
  //     setCartItems((prev) => [...prev]);
  //   };
  //   window.addEventListener("countryChanged", handleCountryChange);
  //   return () =>
  //     window.removeEventListener("countryChanged", handleCountryChange);
  // }, []);

  useEffect(() => {
    const st = cartItems.reduce(
      (acc, item) => {
        const itemTotal = Math.round(
          getConvertedPrice(item.product, "salePrice") *
          (item.quantity || 0)
        );
        return acc + itemTotal;
      },
      0
    );


    const disc = appliedCoupon
      ? appliedCoupon.discountType === "percent"
        ? (st * appliedCoupon.amount) / 100
        : appliedCoupon.amount
      : 0;

    const delivery = 50;

    const tot = st - disc + delivery;

    setSubTotal(st);
    setDiscount(disc);
    setDeliveryFee(delivery);
    setTotal(tot);
  }, [cartItems, appliedCoupon, selectedCountry]);

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
        const res = await axios.get(API_ENDPOINTS.CART, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Cart fetched:", res.data.items);
        setCartItems(res.data.items || []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    fetchCart();

    // fetch active coupons for dropdown (filtered by selected country)
    (async () => {
      try {
        const params = selectedCountry?.code ? { countryCode: selectedCountry.code } : {};
        const res = await client.get("/commerce/coupons/active", { params });
        setAvailableCoupons(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch coupons for cart:", err);
      }
    })();
  }, [selectedCountry?.code]);

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
        API_ENDPOINTS.CART_UPDATE,
        { productId, qty, size: size ?? null, color: color ?? null },
        { headers: { Authorization: `Bearer ${token}` } },
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
      item.quantity + 1,
    );
  };

  const decreaseQty = (item) => {
    if (item.quantity > 1) {
      updateQty(
        { productId: item.product._id, size: item.size, color: item.color },
        item.quantity - 1,
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
        `${API_ENDPOINTS.CART}/remove/${item.product._id}?size=${encodeURIComponent(
          item.size || "",
        )}&color=${encodeURIComponent(item.color || "")}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
      const res = await client.post("/commerce/coupons/validate", {
        code: couponCode.trim(),
        subtotal: subTotal,
        countryCode: selectedCountry?.code || undefined,
      });

      if (res.data && res.data.valid) {
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

  // Totals - Use getConvertedPrice for location-based pricing
  // const subTotal = cartItems.reduce(
  //   (acc, item) =>
  //     acc + getConvertedPrice(item.product, "salePrice") * (item.quantity || 0),
  //   0,
  // );

  // // Discount from coupon (not automatic 10%)
  // const discount = appliedCoupon?.discountAmount || 0;
  // const deliveryFee = cartItems.length > 0 ? 50 : 0;
  // const total = subTotal - discount + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <section className="z_cart_section">
        <div className="a_header_container">
          <h2 className="z_cart_heading">Shopping Cart</h2>
          <div className="z_cart_empty">
            <img
              src={wishEmptyImg}
              alt="Empty cart"
              className="z_cart_empty_img"
            />
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
                          Size: {item.size || "N/A"} | Color:{" "}
                          {item.color || "N/A"}
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

                    <div className="z_cart_price">
                      {selectedCountry?.currencySymbol || "₹"}
                      {Math.round(
                        getConvertedPrice(item.product, "salePrice") *
                        (item.quantity || 0)
                      ).toLocaleString("en-IN")}
                    </div>

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
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#d4edda",
                      borderRadius: "4px",
                      marginBottom: "10px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#155724" }}>
                        {appliedCoupon.code} Applied
                        {appliedCoupon.discountType === "percent"
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
                          fontWeight: "600",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {availableCoupons && availableCoupons.length > 0 && (
                      <select
                        className="z_cart_coupon_select_dropdown"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{ width: "100%", marginBottom: 8, padding: 8 }}
                      >
                        <option value="">Select coupon</option>
                        {availableCoupons.map((c) => (
                          <option key={c._id || c.code} value={c.code}>
                            {c.code}
                            {/* {c.conditions ? ` — ${c.conditions}` : ""} */}
                          </option>
                        ))}
                      </select>
                    )}
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
                  <small
                    style={{
                      color: "#d32f2f",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {couponError}
                  </small>
                )}
              </div>

              <div className="z_cart_summary_row">
                <span>Sub Total</span>
                <span>
                  {selectedCountry?.currencySymbol || "₹"}
                  {subTotal.toLocaleString("en-IN")}
                </span>

              </div>

              {appliedCoupon && (
                <div className="z_cart_summary_row">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>
                    -{selectedCountry?.currencySymbol || "₹"}
                    {discount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="z_cart_summary_row">
                <span>Delivery fee</span>
                <span>
                  {selectedCountry?.currencySymbol || "₹"}
                  {deliveryFee.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="z_cart_summary_row z_cart_grand">
                <span>Total</span>
                <span>
                  {selectedCountry?.currencySymbol || "₹"}
                  {total.toLocaleString("en-IN")}
                </span>
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
