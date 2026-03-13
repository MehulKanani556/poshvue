import React, { useEffect, useState, createContext, useContext, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlus, FaMinus, FaTrash, FaShoppingBag } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import client from "../../api/client";
import API_BASE_URL, { API_ENDPOINTS } from "../../config/api";
import wishEmptyImg from "../../img/image1.png";
import Loader from "../component/Loader";
import { useCurrency } from "../../context/CurrencyContext";
import { useCart } from "../../context/CartContext";

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

  const { cartItems, updateQty, removeFromCart, loading: cartLoading } = useCart();

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
  const [liveExchangeRate, setLiveExchangeRate] = useState(null);
  console.log(couponCode,"couponCode");
  

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

  // Calculate shipping charges based on package weight and destination
  const calculateShippingCharges = useCallback(async () => {
    if (cartItems.length === 0) return 0;

    try {
      // Calculate total package weight
      const totalWeight = cartItems.reduce((sum, item) => {
        const productWeight = item.product?.weight || 0.5; // Default 0.5kg per item
        return sum + productWeight * item.quantity;
      }, 0);

      // Calculate package dimensions
      const totalLength = cartItems.reduce((sum, item) => {
        const productLength = item.product?.length || 10;
        return sum + productLength * item.quantity;
      }, 0);

      const totalBreadth = cartItems.reduce((sum, item) => {
        const productBreadth = item.product?.breadth || 10;
        return sum + productBreadth * item.quantity;
      }, 0);

      const totalHeight = cartItems.reduce((sum, item) => {
        const productHeight = item.product?.height || 5;
        return sum + productHeight * item.quantity;
      }, 0);

      const dimensions = {
        length: Math.max(10, totalLength),
        breadth: Math.max(10, totalBreadth),
        height: Math.max(5, totalHeight),
        weight: Math.max(0.5, totalWeight),
      };

      // Convert subtotal to INR for shipping calculation
      const subTotalINR =
        selectedCountry?.code === "IN"
          ? subTotal
          : subTotal / (selectedCountry?.exchangeRate || 1);

      const payload = {
        cartItems: cartItems.map((item) => ({
          productId: item.product?._id,
          quantity: item.quantity,
        })),
        address: "Default Address", // Cart doesn't have address, using default
        pincode: "400001", // Default pincode for cart
        country: selectedCountry,
        dimension: dimensions,
        subTotal: subTotalINR, // Send INR value to backend
        shippingInfo: {
          pincode: "400001",
          country: selectedCountry?.name || "India",
          address: "Default Address",
        },
      };

      const res = await client.post("/commerce/calculate-shipping", payload);
      const { charges, international } = res.data;

      // Convert shipping charges back to local currency for display
      const shippingChargesLocal =
        selectedCountry?.code === "IN"
          ? charges
          : charges * (liveExchangeRate || selectedCountry?.exchangeRate || 1);

      return shippingChargesLocal;
    } catch (err) {
      console.error("Failed to calculate shipping:", err);
      // Fallback to same calculation logic as before
      const isInternational = selectedCountry?.code !== "IN";

      // Base shipping rates
      const domesticBaseRate = 50; // INR
      const internationalBaseRate = 1500; // INR

      // Calculate total weight for additional charges
      const totalWeight = cartItems.reduce((sum, item) => {
        const productWeight = item.product?.weight || 0.5; // Default 0.5kg per item
        return sum + productWeight * item.quantity;
      }, 0);

      // Additional weight charges (per kg over 1kg)
      const weightThreshold = 1; // kg
      const weightChargePerKg = isInternational ? 500 : 20; // INR per kg

      let shippingChargesINR = isInternational ? internationalBaseRate : domesticBaseRate;

      if (totalWeight > weightThreshold) {
        const additionalWeight = totalWeight - weightThreshold;
        shippingChargesINR += Math.ceil(additionalWeight) * weightChargePerKg;
      }

      // Convert to local currency if needed
      if (selectedCountry?.code !== "IN") {
        const exchangeRate = liveExchangeRate || selectedCountry?.exchangeRate || 1;
        return shippingChargesINR * exchangeRate;
      }

      return shippingChargesINR;
    }
  }, [cartItems, selectedCountry, subTotal, liveExchangeRate]);

  // Fetch live exchange rate for international countries
  useEffect(() => {
    if (!selectedCountry || selectedCountry.code === "IN") {
      setLiveExchangeRate(null);
      return;
    }

    const symbol = selectedCountry?.currency.toUpperCase();
    const url = `https://api.frankfurter.app/latest?from=INR&to=${symbol}`;

    let mounted = true;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const rateFromApi = data?.rates?.[symbol];
        const fallbackRate = symbol === "SGD" ? 0.0141 : selectedCountry?.exchangeRate || 1;
        const finalRate = rateFromApi || fallbackRate;
        if (mounted) {
          setLiveExchangeRate(finalRate);
        }
      })
      .catch((err) => {
        const fallbackRate = (selectedCountry?.code || "").toUpperCase() === "SGD" ? 0.0141 : selectedCountry?.exchangeRate || 1;
        if (mounted) setLiveExchangeRate(fallbackRate);
      });
    return () => {
      mounted = false;
    };
  }, [selectedCountry]);

  useEffect(() => {
    const calculateTotals = async () => {
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

      const delivery = await calculateShippingCharges();

      const tot = st - disc + delivery;

      setSubTotal(st);
      setDiscount(disc);
      setDeliveryFee(delivery);
      setTotal(tot);
    };

    calculateTotals();
  }, [cartItems, appliedCoupon, selectedCountry, calculateShippingCharges, getConvertedPrice, liveExchangeRate]);



  const increaseQty = (item) => {
    if (!item.product?._id) return;
    updateQty(
      { productId: item.product._id, size: item.size, color: item.color },
      item.quantity + 1,
    );
  };

  const decreaseQty = (item) => {
    if (item.quantity > 1 && item.product?._id) {
      updateQty(
        { productId: item.product._id, size: item.size, color: item.color },
        item.quantity - 1,
      );
    }
  };

  // Remove item
  const deleteItem = async (item) => {
    if (!item.product?._id) return;
    try {
      // pass variant info if available so backend can locate exact entry
      await removeFromCart(item.product._id, item.size, item.color);
      // toast will be handled by the axios interceptor (see api/client.js),
      // avoiding double notifications.
    } catch (err) {
      // interceptor already displays the error toast. we just log for debug.
      console.error("removeFromCart failed", err);
    }
  };
  const getImageUrl = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return wishEmptyImg;
    }

    const imgData = product.images[0];
    const img = typeof imgData === 'string' ? imgData : (imgData?.url || "");

    if (!img) return wishEmptyImg;

    // The backend now provides absolute URLs. If it's already absolute, return it.
    if (img.startsWith("http")) return img;

    // Fallback for relative URLs
    const baseUrl = API_BASE_URL.replace("/api", "");
    const slash = img.startsWith("/") ? "" : "/";
    return `${baseUrl}${slash}${img}`;
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
      console.log(res.data,"coupon validation response");
      

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

  // Fetch available coupons based on selected country
  useEffect(() => {
    (async () => {
      try {
        const countryParam = selectedCountry?.code ? `?country=${selectedCountry.code}` : '';
        const res = await client.get(`/commerce/coupons/active${countryParam}`);
        setAvailableCoupons(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      }
    })();
  }, [selectedCountry]);

 
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
                {cartItems.filter(item => item.product?._id).map((item) => (
                  <div
                    key={`${item.product._id}-${item.size || "nosize"}-${item.color || "nocolor"}`}
                    className="z_cart_row"
                  >
                    <div className="z_cart_product">
                      <img
                        src={getImageUrl(item.product)}
                        alt={item.product?.title || "Product"}
                        className="d_product-img"
                        onClick={() => {
                          if (item.product?._id) {
                            navigate(`/product/${item.product._id}`);
                          }
                        }}
                      />
                      {/* <img src={item.product.images[0]} alt={item.name} /> */}
                      <div>
                        <h6>{item.product?.title || "Product"}</h6>
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
                <button
                  className="z_cart_update"
                  onClick={() => navigate("/ShopPage")}
                >
                  Keep Shopping
                </button>
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
                    {availableCoupons && availableCoupons.length > 0 ? (
                      <select
                        className="z_cart_coupon_select_dropdown"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      >
                        <option value="">Select coupon</option>
                        {availableCoupons.map((c) => (
                          <option key={c._id || c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        className="z_cart_coupon_select_dropdown"
                        disabled
                        style={{ backgroundColor: '#f8f9fa' }}
                      >
                        <option value="">No coupons available</option>
                      </select>
                    )}
                    <div className="z_cart_coupon_input_group">
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
                    </div>
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
                <span>
                  Delivery fee (
                  {selectedCountry?.code !== "IN" ? "International" : "Domestic"})
                </span>
                <span>
                  {selectedCountry?.currencySymbol || "₹"}
                  {Math.round(deliveryFee).toLocaleString("en-IN")}
                </span>
              </div>


              <div className="z_cart_summary_row z_cart_grand">
                <span>Total</span>
                <span>
                  {selectedCountry?.currencySymbol || "₹"}
                  {Math.round(total).toLocaleString("en-IN")}
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
