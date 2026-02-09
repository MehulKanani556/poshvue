import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useCurrency } from "../context/CurrencyContext";
import client from "../api/client";
import { createPaymentIntent, verifyPayment, createRazorpayOrder, validateVpa, createUpiCollectPayment, getRazorpayOrderPayments } from "../api/client";

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const HAS_STRIPE = !!STRIPE_PUBLISHABLE_KEY;
const stripePromise = HAS_STRIPE ? loadStripe(STRIPE_PUBLISHABLE_KEY) : Promise.resolve(null);

// Helper component to sync address selection with form
function AddressSync({ selectedAddress, useManualAddress }) {
  const { setFieldValue } = useFormikContext();
  
  useEffect(() => {
    if (selectedAddress && !useManualAddress) {
      setFieldValue("fullName", selectedAddress.name);
      setFieldValue("phone", selectedAddress.mobile);
      setFieldValue("address", selectedAddress.address);
      setFieldValue("pincode", selectedAddress.pincode);
    }
  }, [selectedAddress, useManualAddress, setFieldValue]);

  return null;
}

function CheckoutForm({ cartItems, subTotal,selectedCountry, discount, deliveryFee, total, appliedCoupon, addresses, selectedAddress, setSelectedAddress }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [upiId, setUpiId] = useState("");
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  // Clear shown payment error when switching method or editing UPI
  useEffect(() => {
    setPaymentError("");
  }, [selectedPaymentMethod, upiId]);

  // Helper: load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  // Check if country is India
  const isIndia = selectedCountry?.code === "IN";

  // Enforce country-based payment rules: Only UPI + Card for India, Card-only otherwise
  useEffect(() => {
    if (!isIndia && selectedPaymentMethod !== "card") {
      setSelectedPaymentMethod("card");
    }
  }, [isIndia, selectedPaymentMethod]);

  const billingValidationSchema = Yup.object({
    fullName: Yup.string().min(2, "Name too short").required("Full name is required"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
      .required("Phone number is required"),
    address: Yup.string().min(10, "Address too short").required("Address is required"),
    pincode: Yup.string()
      .matches(/^[0-9]{6}$/, "Pincode must be 6 digits")
      .required("Pincode is required"),
  });

  const actuallySubmitPayment = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        setLoading(false);
        return;
      }

      let paymentIntentId = null;
      let paymentStatus = "pending";
      const currency = selectedCountry?.currency?.toLowerCase() || "inr";

      // Handle different payment methods
      if (selectedPaymentMethod === "upi") {
        // UPI via Razorpay (server-side collect) - no modal
        try {
          if (!upiId) {
            setPaymentError("Please enter a UPI ID (e.g., yourname@bank)");
            setLoading(false);
            return;
          }

          // Create Razorpay order on backend
          const orderRes = await createRazorpayOrder({ amount: total, currency: "INR" });
          const { orderId } = orderRes.data;

          // Validate VPA on server
          try {
            console.log('[Frontend] Validating VPA:', upiId);
            const vpaRes = await validateVpa({ vpa: upiId });
            console.log('[Frontend] VPA validation response:', vpaRes.data);
          } catch (vErr) {
            console.error('VPA validation error:', vErr);
            const msg = vErr.response?.data?.message || vErr.message || 'Invalid UPI ID';
            setPaymentError(msg);
            setLoading(false);
            return;
          }

          // Create UPI collect payment (S2S) - sends collect request to customer's UPI app
          console.log('[Frontend] Initiating UPI collect for order:', orderId);
          await createUpiCollectPayment({
            orderId,
            amount: total,
            vpa: upiId,
            email: values.email,
            contact: values.phone,
            description: 'Order Payment',
            notes: { purpose: 'Checkout UPI payment' },
          });

          // Start polling for payment status
          const start = Date.now();
          const timeoutMs = 120000; // 2 minutes
          const pollIntervalMs = 3000;

          const poll = async () => {
            try {
              const paymentsRes = await getRazorpayOrderPayments(orderId);
              const items = paymentsRes.data?.items || paymentsRes.data || [];
              const latest = Array.isArray(items) ? items[0] : null;

              if (latest && (latest.status === "captured" || latest.status === "authorized")) {
                paymentStatus = "completed";
                paymentIntentId = latest.id || latest.razorpay_payment_id;
                await createOrder(values, paymentIntentId, paymentStatus);
                setLoading(false);
                return true;
              }

              if (latest && (latest.status === "failed" || latest.status === "declined" || latest.status === "cancelled")) {
                setPaymentError("Payment failed or cancelled. Please try again.");
                setLoading(false);
                return true;
              }

              if (Date.now() - start >= timeoutMs) {
                setPaymentError("Payment timed out. Please check your UPI app and try again.");
                setLoading(false);
                return true;
              }

              return false;
            } catch (pollErr) {
              console.error("Polling error:", pollErr);
              if (Date.now() - start >= timeoutMs) {
                setPaymentError("Unable to confirm payment. Please try again.");
                setLoading(false);
                return true;
              }
              return false;
            }
          };

          const schedule = async () => {
            const done = await poll();
            if (!done) setTimeout(schedule, pollIntervalMs);
          };

          // Inform user to approve the collect request in their UPI app
          setPaymentError("A UPI collect request has been sent to your UPI app. Please approve it to complete the payment.");
          schedule();
          return; // exit, order will be created upon successful capture
        } catch (upiErr) {
          console.error("UPI collect error:", upiErr);
          setPaymentError(upiErr.response?.data?.message || "UPI payment failed");
          setLoading(false);
          return;
        }
      } else if (selectedPaymentMethod === "netbanking") {
        // NetBanking is not available per country rules
        alert("NetBanking is not available. Please select Card.");
        setLoading(false);
        return;
      } else {
        // Card Payment (Stripe)
        if (!HAS_STRIPE) {
          alert("Card payment gateway is not configured. Please contact support.");
          setLoading(false);
          return;
        }
        if (!stripe || !elements) {
          alert("Payment form is not ready yet. Please wait a moment and try again.");
          setLoading(false);
          return;
        }

        try {
          const piRes = await createPaymentIntent({
            amount: total,
            currency: currency,
            paymentMethod: "card",
          });

          const clientSecret = piRes.data.clientSecret;
          const cardElement = elements.getElement(CardElement);

          if (!cardElement) {
            alert("Card details are required");
            setLoading(false);
            return;
          }

          const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: values.fullName,
                email: values.email,
                phone: values.phone,
              },
            },
          });

          if (error) {
            console.error("Card payment error:", error);
            alert(error.message || "Payment failed");
            setLoading(false);
            return;
          }

          if (paymentIntent?.status === "succeeded") {
            paymentStatus = "completed";
            paymentIntentId = paymentIntent.id;
            await createOrder(values, paymentIntentId, paymentStatus);
            setLoading(false);
          } else {
            alert("Payment did not succeed. Please try again.");
            setLoading(false);
            return;
          }
        } catch (cardErr) {
          console.error("Card payment error:", cardErr);
          alert(cardErr.message || "Payment failed");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setLoading(false);
      return;
    }
  };

  const createOrder = async (values, paymentIntentId, paymentStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      
      const orderItems = cartItems.map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: item.product.salePrice || item.product.price,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
      }));

      const orderRes = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/commerce/orders`,
        {
          customerName: values.fullName,
          customerEmail: values.email,
          customerPhone: values.phone,
          address: values.address,
          pincode: values.pincode,
          items: orderItems,
          total,
          status: paymentStatus === "completed" ? "paid" : "pending",
          paymentMethod: selectedPaymentMethod,
          paymentStatus: paymentStatus,
          paymentIntentId,
          couponCode: appliedCoupon?.code || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Order created:", orderRes.data.item);

      const shiprocketMsg = orderRes.data.shiprocketError || orderRes.data.error || orderRes.data.message;
      if (shiprocketMsg) {
        console.warn("Shiprocket error:", shiprocketMsg);
        alert("Order placed successfully, but shipping could not be created: " + shiprocketMsg);
      }

      // Clear cart
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/cart/clear`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (clearErr) {
        console.error("Error clearing cart after order:", clearErr);
      }

      navigate("/TrackOrder");
    } catch (orderErr) {
      console.error("Order creation error:", orderErr);
      alert(orderErr.response?.data?.message || "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <Formik
      initialValues={{
        fullName: selectedAddress?.name || "",
        email: "",
        phone: selectedAddress?.mobile || "",
        address: selectedAddress?.address || "",
        pincode: selectedAddress?.pincode || "",
      }}
      enableReinitialize={true}
      validationSchema={billingValidationSchema}
      onSubmit={(values) => {
        // Block flow until payment details are filled
        if (selectedPaymentMethod === "card") {
          if (!isCardComplete) {
            alert("Please enter complete card details");
            return;
          }
        }
        setPendingValues(values);
        setShowConfirm(true);
      }}
    >
      {({ setFieldValue, values }) => {
        return (
          <Form className="z_chck_form">
            <AddressSync selectedAddress={selectedAddress} useManualAddress={useManualAddress} />
            {/* Address Selection Section */}
            {addresses && addresses.length > 0 && (
              <div className="z_chck_form_group">
                <label className="mb-3">Select Delivery Address</label>
                <div className="z_address_selection">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`z_address_card ${selectedAddress?._id === addr._id ? "z_address_selected" : ""}`}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setUseManualAddress(false);
                        // Update form fields directly
                        setFieldValue("fullName", addr.name);
                        setFieldValue("phone", addr.mobile);
                        setFieldValue("address", addr.address);
                        setFieldValue("pincode", addr.pincode);
                      }}
                    >
                      <div className="z_address_card_header">
                        <strong>{addr.type}</strong>
                        {selectedAddress?._id === addr._id && (
                          <span className="z_address_check">✓</span>
                        )}
                      </div>
                      <div className="z_address_card_body">
                        <p className="mb-1">{addr.name}</p>
                        <p className="mb-1">{addr.address}</p>
                        <p className="mb-0">
                          <small>{addr.mobile} | Pincode: {addr.pincode}</small>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    className="z_manual_address_btn"
                    onClick={() => {
                      setUseManualAddress(true);
                      setSelectedAddress(null);
                      setFieldValue("fullName", "");
                      setFieldValue("phone", "");
                      setFieldValue("address", "");
                      setFieldValue("pincode", "");
                    }}
                  >
                    {useManualAddress ? "✓ Using Manual Address" : "Enter Manual Address"}
                  </button>
                </div>
              </div>
            )}

            <div className="z_chck_form_group">
              <label>Full Name</label>
              <Field 
                type="text" 
                name="fullName" 
                disabled={selectedAddress && !useManualAddress}
              />
              <ErrorMessage name="fullName" component="small" className="text-danger" />
            </div>

            <div className="z_chck_form_group">
              <label>Email</label>
              <Field type="email" name="email" />
              <ErrorMessage name="email" component="small" className="text-danger" />
            </div>

            <div className="z_chck_form_group">
              <label>Phone</label>
              <Field 
                type="tel" 
                name="phone" 
                disabled={selectedAddress && !useManualAddress}
              />
              <ErrorMessage name="phone" component="small" className="text-danger" />
            </div>

            <div className="z_chck_form_group">
              <label>Address</label>
              <Field 
                type="text" 
                name="address" 
                as="textarea"
                rows={3}
                disabled={selectedAddress && !useManualAddress}
              />
              <ErrorMessage name="address" component="small" className="text-danger" />
            </div>

            <div className="z_chck_form_group">
              <label>Pincode</label>
              <Field 
                type="text" 
                name="pincode" 
                placeholder="Enter 6 digit pincode"
                maxLength={6}
                disabled={selectedAddress && !useManualAddress}
              />
              <ErrorMessage name="pincode" component="small" className="text-danger" />
            </div>

          {/* Payment Method Selection */}
          <div className="z_chck_form_group mt-3">
            <label>Payment Method</label>
            <div className="payment-methods" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {isIndia && (
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={selectedPaymentMethod === "upi"}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    style={{ marginRight: "8px" }}
                  />
                  <span>UPI</span>
                </label>
              )}
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={selectedPaymentMethod === "card"}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  style={{ marginRight: "8px" }}
                />
                <span>Card (Credit/Debit)</span>
              </label>
            </div>
          </div>

          {/* UPI ID Input */}
          {selectedPaymentMethod === "upi" && (
            <div className="z_chck_form_group">
              <label>UPI ID</label>
              <input
                type="text"
                placeholder="yourname@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "5px" }}
              />
              <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
              </small>
              {paymentError && (
                <div className="text-danger small mt-2">{paymentError}</div>
              )}
            </div>
          )}

          {/* Card Details (only for card payment) */}
          {selectedPaymentMethod === "card" && HAS_STRIPE && (
            <div className="z_chck_form_group mt-3">
              <label>Card Details</label>
              <div className="z_chck_card_element">
                <CardElement options={{ hidePostalCode: true }} onChange={(e) => setIsCardComplete(!!e.complete)} />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="z_chck_pay_btn mt-3" 
            disabled={
              loading ||
              (selectedPaymentMethod === "card" && (!HAS_STRIPE || !stripe || !isCardComplete))
            }
          >
            {loading ? "Processing..." : "Pay & Place Order"}
          </button>

          {showConfirm && (
            <>
              <div
                className="modal fade show d-block z_chck_glass_modal_wrapper"
                tabIndex="-1"
                role="dialog"
              >
                <div className="modal-dialog modal-dialog-centered" role="document">
                  <div className="modal-content z_glass_modal">
                    <div className="modal-header">
                      <h5 className="z_auth_title mb-0">Confirm your order</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        aria-label="Close"
                        onClick={() => setShowConfirm(false)}
                      />
                    </div>
                    <div className="modal-body">
                      <p>Are you sure you want to pay and place this order?</p>
                      <p><b>Payment Method: {selectedPaymentMethod.toUpperCase()}</b></p>
                      <p><b>Total: {formatPrice(total)}</b></p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setShowConfirm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-dark"
                        onClick={async () => {
                          if (pendingValues) {
                            setShowConfirm(false);
                            await actuallySubmitPayment(pendingValues);
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Confirm & Pay"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" />
            </>
          )}
        </Form>
      );
      }}
    </Formik>
  );
}

function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { formatPrice, selectedCountry } = useCurrency();

  const [cartItems, setCartItems] = useState(state?.cartItems || []);
  const [subTotal, setSubTotal] = useState(state?.subTotal || 0);
  const [discount, setDiscount] = useState(state?.discount || 0);
  const [deliveryFee, setDeliveryFee] = useState(state?.deliveryFee || 0);
  const [shippingCharges, setShippingCharges] = useState(state?.shippingCharges || 0);
  const [isInternational, setIsInternational] = useState(state?.isInternational || false);
  const [total, setTotal] = useState(state?.total || 0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Listen for country changes and force re-render
  useEffect(() => {
    const handleCountryChange = () => {
      if (cartItems.length > 0) {
        const st = cartItems.reduce(
          (acc, item) => acc + ((item.product?.salePrice || item.product?.price) || 0) * (item.quantity || 0),
          0
        );
        const disc = appliedCoupon ? (appliedCoupon.discountType === 'percent' 
          ? (st * appliedCoupon.amount / 100) 
          : appliedCoupon.amount) : 0;
        const delivery = 50;
        const tot = st - disc + delivery + shippingCharges;
        setSubTotal(st);
        setDiscount(disc);
        setDeliveryFee(delivery);
        setTotal(tot);
      }
    };
    window.addEventListener("countryChanged", handleCountryChange);
    return () =>
      window.removeEventListener("countryChanged", handleCountryChange);
  }, [cartItems]);
  
  const [appliedCoupon, setAppliedCoupon] = useState(state?.appliedCoupon || null);

  // Ensure product data is always available, even if user refreshes /Checkout
  useEffect(() => {
    if (state?.cartItems && state.cartItems.length > 0) return;

    const fetchCart = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = res.data.items || [];
        setCartItems(items);

        const st = items.reduce(
          (acc, item) => acc + ((item.product?.salePrice || item.product?.price) || 0) * (item.quantity || 0),
          0
        );
        const delivery = 50;
      const tot = st + delivery + shippingCharges;

      setSubTotal(st);
      setDiscount(0);
      setDeliveryFee(delivery);
      setTotal(tot);
      } catch (err) {
        console.error("Error fetching cart for checkout:", err);
        navigate("/Cart");
      }
    };

    fetchCart();
  }, [state, navigate]);

  // Fetch addresses for checkout
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        
        const res = await client.get("/address");
        setAddresses(res.data || []);
        // Auto-select first address if available
        if (res.data && res.data.length > 0) {
          setSelectedAddress(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      }
    };

    fetchAddresses();
  }, []);

  return (
    <section className="z_chck_section">
      <div className="z_chck_container">
        <h2 className="z_chck_heading">Checkout</h2>

        <div className="z_chck_main">
          {/* ================= Billing Details ================= */}
          <div className="z_chck_billing">
            <h3>Billing & Payment</h3>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                cartItems={cartItems}
                subTotal={subTotal}
                discount={discount}
                deliveryFee={shippingCharges}
                total={total}
                appliedCoupon={appliedCoupon}
                addresses={addresses}
                selectedAddress={selectedAddress}
                setSelectedAddress={setSelectedAddress}
                selectedCountry={selectedCountry}
                shippingCharges={shippingCharges}
                isInternational={isInternational}
              />
            </Elements>
          </div>

          {/* ================= Order Summary ================= */}
          <div className="z_chck_summary">
            <h3>Order Summary</h3>

            {cartItems.map((item) => (
              <div
                key={`${item.product._id}-${item.size || "nosize"}-${item.color || "nocolor"}`}
                className="z_chck_summary_item"
              >
                <span>
                  {item.product.title} x {item.quantity}
                </span>
                <span>{formatPrice(((item.product.salePrice || item.product.price) * item.quantity))}</span>
              </div>
            ))}

            <div className="z_chck_summary_item">
              <span>Subtotal</span>
              <span>{formatPrice(subTotal)}</span>
            </div>

            {appliedCoupon && discount > 0 && (
              <div className="z_chck_summary_item">
                <span>Discount ({appliedCoupon.code})</span>
                <span>- {formatPrice(discount)}</span>
              </div>
            )}

            <div className="z_chck_summary_item">
              <span>Shipping ({isInternational ? "International" : "Domestic"})</span>
              <span>{formatPrice(shippingCharges)}</span>
            </div>

            <div className="z_chck_summary_total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Checkout;
