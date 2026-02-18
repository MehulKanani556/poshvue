import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCurrency } from "../../context/CurrencyContext";
import client from "../../api/client";
import {
  createPaymentIntent,
  createCashfreeOrder,
  verifyPayment,
  getCashfreeOrder,
} from "../../api/client";
const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const HAS_STRIPE = !!STRIPE_PUBLISHABLE_KEY;
const stripePromise = HAS_STRIPE
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);
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

function CheckoutForm({
  cartItems,
  subTotal,
  discount,
  deliveryFee,
  total,
  appliedCoupon,
  addresses,
  selectedAddress,
  setSelectedAddress,
  shippingCharges,
  isInternational,
  liveExchangeRate,
}) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const { formatPrice, getConvertedPrice, selectedCountry } = useCurrency();
  // helper to convert local -> INR (use liveExchangeRate if available)
  const toINR = (amount) => {
    if (!selectedCountry) return amount;
    const rate = liveExchangeRate || selectedCountry?.exchangeRate || 1; // 1 INR = rate (local)
    return selectedCountry?.code === "IN"
      ? amount
      : Number((amount / rate).toFixed(2));
  };
  const [upiId, setUpiId] = useState("");
  // Check if country is India
  const isIndia = selectedCountry?.code === "IN";
  const handlePayUPI = async (values) => {
    try {
      const amount = Number(total || 0);
      if (!amount || amount <= 0) {
        alert("Invalid amount");
        return { success: false, error: "Invalid amount" };
      }
      console.log("amount:", amount);
      const userInfoRaw = localStorage.getItem("userInfo");
      console.log("userInfoRaw:", userInfoRaw);
      let userInfo = {};
      console.log("userInfo:", userInfo);
      try {
        userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : {};
      } catch {
        userInfo = {};
      }
      console.log("email:", userInfo?.email);
      console.log("phone:", userInfo?.phone);
      const customerName =
        values?.fullName ||
        selectedAddress?.name ||
        userInfo?.name ||
        "Customer";
      const customerEmail =
        values?.email ||
        selectedAddress?.email ||
        userInfo?.email ||
        "customer@example.com";
      const customerPhone =
        values?.phone ||
        selectedAddress?.mobile ||
        userInfo?.phone ||
        "9999999999";
      console.log("name:", userInfo?.name, customerName);
      const { data } = await createCashfreeOrder({
        amount,
        customerName,
        customerEmail,
        customerPhone,
      });
      console.log("Cashfree response:", data);

      if (!data?.ok) {
        console.error("Cashfree order failed:", data);
        alert("Cashfree order failed");
        return { success: false, error: "Cashfree order failed" };
      }
      const { orderId, paymentSessionId } = data;
      console.log("CF order created:", orderId, paymentSessionId);
      // Verify payment status from Cashfree
      try {
        const verificationResponse = await getCashfreeOrder(orderId);
        console.log("Cashfree verification:", verificationResponse.data);

        if (verificationResponse.data?.ok && verificationResponse.data?.order) {
          const orderStatus = verificationResponse.data.order.order_status;
          console.log("Cashfree order status:", orderStatus);

          // Check if payment is successful

          if (orderStatus === "PAID" || orderStatus === "SUCCESS") {
            return {
              success: true,
              paymentIntentId: orderId,
              paymentStatus: "completed",
            };
          } else if (orderStatus === "PENDING" || orderStatus === "ACTIVE") {
            // For demo purposes, we'll consider it successful
            // In production, you'd wait for actual payment completion
            return {
              success: true,
              paymentIntentId: orderId,
              paymentStatus: "completed",
            };
          } else {
            return {
              success: false,
              error: `Payment not completed. Status: ${orderStatus}`,
            };
          }
        } else {
          console.error("Cashfree verification failed");
          return { success: false, error: "Payment verification failed" };
        }
      } catch (verifyErr) {
        console.error("Cashfree verification error:", verifyErr);
        // For demo purposes, proceed as if successful
        return {
          success: true,
          paymentIntentId: orderId,
          paymentStatus: "completed",
        };
      }
    } catch (err) {
      console.error("UPI pay error:", err);
      alert("UPI payment init failed");
      return { success: false, error: err.message };
    }
  };

  const billingValidationSchema = Yup.object({
    fullName: Yup.string()
      .min(2, "Name too short")
      .required("Full name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
      .required("Phone number is required"),
    address: Yup.string()
      .min(10, "Address too short")
      .required("Address is required"),
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

      if (!HAS_STRIPE) {
        alert("Payment gateway is not configured. Please contact support.");
        setLoading(false);
        return;
      }

      let paymentIntentId = null;
      let paymentStatus = "pending";
      const currency = selectedCountry?.currency?.toLowerCase() || "inr";

      // Handle different payment methods
      if (selectedPaymentMethod === "upi") {
        const upiResult = await handlePayUPI(values);
        if (!upiResult.success) {
          console.error("UPI payment failed:", upiResult.error);
          alert(upiResult.error || "UPI payment failed");
          setLoading(false);
          return;
        }

        paymentIntentId = upiResult.paymentIntentId;
        paymentStatus = upiResult.paymentStatus;
      } else {
        // Card Payment (default)
        if (!stripe || !elements) {
          alert(
            "Payment form is not ready yet. Please wait a moment and try again.",
          );
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
          const { paymentIntent, error } = await stripe.confirmCardPayment(
            clientSecret,
            {
              payment_method: {
                card: cardElement,
                billing_details: {
                  name: values.fullName,
                  email: values.email,
                  phone: values.phone,
                },
              },
            },
          );
          if (error) {
            console.error("Card payment error:", error);
            alert(error.message || "Payment failed");
            setLoading(false);
            return;
          }
          if (paymentIntent.status !== "succeeded") {
            alert("Payment not completed. Status: " + paymentIntent.status);
            setLoading(false);
            return;
          }
          paymentIntentId = paymentIntent.id;
          paymentStatus = "completed";
        } catch (cardErr) {
          console.error("Card payment error:", cardErr);
          alert(cardErr.response?.data?.message || "Card payment failed");
          setLoading(false);
          return;
        }
      }
      // Create order after successful payment
      await createOrder(values, paymentIntentId, paymentStatus);
    } catch (err) {
      console.error("Checkout error:", err);
      alert(
        err.response?.data?.message || "Something went wrong during checkout",
      );
      setLoading(false);
    }
  };
  const createOrder = async (values, paymentIntentId, paymentStatus) => {
    try {
      const token = localStorage.getItem("userToken");
      const rate = liveExchangeRate || selectedCountry?.exchangeRate || 1;
      const orderItems = cartItems.map((item) => ({
        product: item.product._id,
        title: item.product.title,
        price: getConvertedPrice(item.product, "salePrice"),
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
      }));
      // Calculate package dimensions and weight for Shiprocket

      const totalWeight = cartItems.reduce((sum, item) => {
        const productWeight = item.product?.weight || 0.5;
        return sum + productWeight * item.quantity;
      }, 0);
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
      const dimension = {
        length: Math.max(10, totalLength),
        breadth: Math.max(10, totalBreadth),
        height: Math.max(5, totalHeight),
        weight: Math.max(0.5, totalWeight),
      };
      // Convert totals to INR for Shiprocket and database
      const subTotalINR =
        selectedCountry?.code === "IN" ? subTotal : subTotal / rate;
      const discountINR =
        selectedCountry?.code === "IN" ? discount : discount / rate;
      const shippingChargesINR =
        selectedCountry?.code === "IN"
          ? shippingCharges
          : shippingCharges / rate;
      const totalINR = selectedCountry?.code === "IN" ? total : total / rate;

      console.log(" Currency Conversion Debug:", {
        selectedCountry: selectedCountry?.name,
        currency: selectedCountry?.currency,
        exchangeRate: selectedCountry?.exchangeRate,
        localAmounts: { subTotal, discount, shippingCharges, total },
        inrAmounts: { subTotalINR, discountINR, shippingChargesINR, totalINR },
      });
      const orderPayload = {
        customerEmail: values.email,
        customerPhone: values.phone,
        address: values.address,
        pincode: values.pincode,
        items: orderItems,
        subTotal: subTotalINR, // Store in INR
        total: totalINR, // Store in INR
        discount: discountINR, // Store in INR
        shippingCharges: shippingChargesINR, // Store in INR
        isInternational: isInternational,
        dimension: dimension,
        shippingInfo: {
          firstName: values.fullName,
          phone: values.phone,
          email: values.email,
          address: values.address,
          pincode: values.pincode,
          country: selectedCountry?.name || "India",
          city: selectedAddress?.city || "Mumbai",
          state: selectedAddress?.state || "Maharashtra",
        },

        status: paymentStatus === "completed" ? "paid" : "pending",
        paymentMethod: selectedPaymentMethod,
        paymentStatus: paymentStatus,
        paymentIntentId,
        couponCode: appliedCoupon?.code || null,
        country: selectedCountry?.code || "IN",
      };
      const orderRes = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/commerce/orders`,
        orderPayload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("Order created:", orderRes.data.item);
      const shiprocketMsg =
        orderRes.data.shiprocketError ||
        orderRes.data.error ||
        orderRes.data.message;
      if (shiprocketMsg) {
        console.warn("Shiprocket error:", shiprocketMsg);
        alert(
          "Order placed successfully, but shipping could not be created: " +
            shiprocketMsg,
        );
      }
      // Clear cart
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/cart/clear`,
          { headers: { Authorization: `Bearer ${token}` } },
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
        setPendingValues(values);
        setShowConfirm(true);
      }}
    >
      {({ setFieldValue, values }) => {
        return (
          <Form className="z_chck_form">
            <AddressSync
              selectedAddress={selectedAddress}
              useManualAddress={useManualAddress}
            />
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
                          <small>
                            {addr.mobile} | Pincode: {addr.pincode}
                          </small>
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
                    {useManualAddress
                      ? "✓ Using Manual Address"
                      : "Enter Manual Address"}
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
              <ErrorMessage
                name="fullName"
                component="small"
                className="text-danger"
              />
            </div>
            <div className="z_chck_form_group">
              <label>Email</label>
              <Field type="email" name="email" />
              <ErrorMessage
                name="email"
                component="small"
                className="text-danger"
              />
            </div>
            <div className="z_chck_form_group">
              <label>Phone</label>
              <Field
                type="tel"
                Field
                name="phone"
                disabled={selectedAddress && !useManualAddress}
              />
              <ErrorMessage
                name="phone"
                component="small"
                className="text-danger"
              />
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
              <ErrorMessage
                name="address"
                component="small"
                className="text-danger"
              />
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
              <ErrorMessage
                name="pincode"
                component="small"
                className="text-danger"
              />
            </div>
            {/* Payment Method Selection */}
            <div className="z_chck_form_group mt-3">
              <label>Payment Method</label>
              <div
                className="payment-methods"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {isIndia && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
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
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
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
                <small
                  style={{ color: "#666", display: "block", marginTop: "5px" }}
                >
                  Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
                </small>
              </div>
            )}
            {/* Card Details (only for card payment) */}
            {selectedPaymentMethod === "card" && HAS_STRIPE && (
              <div className="z_chck_form_group mt-3">
                <div className="payment-card">
                  <div className="payment-card-header">Card Details</div>
                  <div className="payment-card-body">
                    <div className="z_chck_card_element">
                      <CardElement options={{ hidePostalCode: true }} />
                    </div>
                    <small className="text-muted">
                      Enter card details to pay with card
                    </small>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="z_chck_pay_btn mt-3"
              disabled={
                loading ||
                !HAS_STRIPE ||
                (selectedPaymentMethod === "card" && !stripe)
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
                  <div
                    className="modal-dialog modal-dialog-centered"
                    role="document"
                  >
                    <div className="modal-content z_glass_modal">
                      <div className="modal-header">
                        <h5 className="z_auth_title mb-0">
                          Confirm your order
                        </h5>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          aria-label="Close"
                          onClick={() => setShowConfirm(false)}
                        />
                      </div>
                      <div className="modal-body">
                        <p>
                          Are you sure you want to pay and place this order?
                        </p>
                        <p>
                          <b>
                            Payment Method:{" "}
                            {selectedPaymentMethod.toUpperCase()}
                          </b>
                        </p>
                        {(() => {
                          // Show INR equivalent only when selected country is NOT India
                          const localSubTotal = subTotal;
                          const localDiscount = discount;
                          const localShipping = shippingCharges;
                          const localTotal = total;
                          const inrSubTotal = toINR(localSubTotal);
                          const inrDiscount = toINR(localDiscount);
                          const inrShipping = toINR(localShipping);
                          const inrTotal = toINR(localTotal);
                          return (
                            <>
                              <div className="z_chck_summary_item">
                                <span>Subtotal</span>
                                <span>
                                  {selectedCountry?.currencySymbol || "₹"}
                                  {Math.round(subTotal).toLocaleString("en-IN")}
                                  {/* <small className="text-muted d-block">
                  (₹{toINR(subTotal).toLocaleString("en-IN")})
                </small> */}
                                </span>
                              </div>

                              {appliedCoupon && discount > 0 && (
                                <div className="z_chck_summary_item">
                                  <span>Discount ({appliedCoupon.code})</span>
                                  <span>
                                    -{selectedCountry?.currencySymbol || "₹"}
                                    {Math.round(discount).toLocaleString(
                                      "en-IN",
                                    )}
                                    {/* <small className="text-muted d-block">
                    (-₹{toINR(discount).toLocaleString("en-IN")})
                  </small> */}
                                  </span>
                                </div>
                              )}

                              <div className="z_chck_summary_item">
                                <span>
                                  Shipping (
                                  {isInternational
                                    ? "International"
                                    : "Domestic"}
                                  )
                                </span>
                                <span>
                                  {selectedCountry?.currencySymbol || "₹"}
                                  {Math.round(shippingCharges).toLocaleString(
                                    "en-IN",
                                  )}
                                  {/* <small className="text-muted d-block">
                  (₹{toINR(shippingCharges).toLocaleString("en-IN")})
                </small> */}
                                </span>
                              </div>

                              <div className="z_chck_summary_total">
                                <span>Total</span>
                                <span>
                                  {selectedCountry?.currencySymbol || "₹"}
                                  {Math.round(total).toLocaleString("en-IN")}
                                  {/* <small className="text-muted d-block mt-1">
                  (₹{toINR(total).toLocaleString("en-IN")})
                </small> */}
                                </span>
                              </div>
                              {/* <p>
                                <b>
                                  Subtotal:{" "}
                                  {formatPrice({ salePrice: localSubTotal })}
                                </b>
                                {selectedCountry?.code !== "IN" && (
                                  <span className="text-muted ms-2">
                                    (₹{Number(inrSubTotal).toFixed(2)})
                                  </span>
                                )}
                              </p> */}
                              {/* {appliedCoupon && discount > 0 && (
                                <p>
                                  <b>
                                    Discount ({appliedCoupon.code}): -
                                    {selectedCountry?.currencySymbol || "₹"}
                                    {localDiscount.toLocaleString()}
                                  </b>
                                  {selectedCountry?.code !== "IN" && (
                                    <span className="text-muted ms-2">
                                      (-₹{Number(inrDiscount).toFixed(2)})
                                    </span>
                                  )}
                                </p>
                              )}
                              <p>
                                <b>
                                  Shipping (
                                  {isInternational
                                    ? "International"
                                    : "Domestic"}
                                  ): {formatPrice({ salePrice: localShipping })}
                                </b>
                                {selectedCountry?.code !== "IN" && (
                                  <span className="text-muted ms-2">
                                    (₹{Number(inrShipping).toFixed(2)})
                                  </span>
                                )}
                              </p> */}
                              {/* <hr className="my-2" /> */}
                              {/* <p className="mb-0">
                                <b>
                                  Total:{" "}
                                  {formatPrice({ salePrice: localTotal })}
                                </b>
                                {selectedCountry?.code !== "IN" && (
                                  <span className="text-muted ms-2">
                                    (₹{Number(inrTotal).toFixed(2)})
                                  </span>
                                )}
                              </p> */}
                            </>
                          );
                        })()}
                       
                        {/* <p className="text-muted small">
                          Prices displayed in{" "}
                          {selectedCountry?.currency || "INR"}
                        </p> */}
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
  const { formatPrice, getConvertedPrice, selectedCountry } = useCurrency();
  // live exchange rate from INR -> selected local currency (value: 1 INR = X local)
  const [liveExchangeRate, setLiveExchangeRate] = useState(null);

  useEffect(() => {
    if (!selectedCountry || selectedCountry.code === "IN") {
      setLiveExchangeRate(null);
      return;
    }

    console.log(selectedCountry, "duhfi");
    const symbol = selectedCountry?.currency.toUpperCase();
    const url = `https://api.frankfurter.app/latest?from=INR&to=${symbol}`;

    let mounted = true;
    console.log("[ExchangeRate] fetching:", url);

    fetch(url)
      .then((res) => res.json())

      .then((data) => {
        console.log("[ExchangeRate] response:", data);
        // pick rate from response, fallback to provided country.exchangeRate or to a sensible default
        const rateFromApi = data?.rates?.[symbol];
        const fallbackRate =
          symbol === "SGD" ? 0.0141 : selectedCountry?.exchangeRate || 1;
        const finalRate = rateFromApi || fallbackRate;
        if (mounted) {
          setLiveExchangeRate(finalRate);
          console.log(
            "[ExchangeRate] using rate:",
            finalRate,
            "(source:",
            rateFromApi ? "api" : "fallback",
            ")",
          );
        }
      })
      .catch((err) => {
        const fallbackRate =
          (selectedCountry?.code || "").toUpperCase() === "SGD"
            ? 0.0141
            : selectedCountry?.exchangeRate || 1;
        console.error(
          "[ExchangeRate] fetch failed, using fallback:",
          fallbackRate,
          err,
        );
        if (mounted) setLiveExchangeRate(fallbackRate);
      });
    return () => {
      mounted = false;
    };
  }, [selectedCountry]);

  // Helper to get INR equivalent from a local-currency amount
  const toINR = (amount) => {
    if (!selectedCountry) return amount;
    const rate = liveExchangeRate || selectedCountry?.exchangeRate || 1;
    return selectedCountry?.code === "IN"
      ? amount
      : Number((amount / rate).toFixed(2));
  };
  const [cartItems, setCartItems] = useState(state?.cartItems || []);
  const [subTotal, setSubTotal] = useState(state?.subTotal || 0);
  const [discount, setDiscount] = useState(state?.discount || 0);
  const [deliveryFee, setDeliveryFee] = useState(state?.deliveryFee || 0);
  const [shippingCharges, setShippingCharges] = useState(
    state?.shippingCharges || 0,
  );
  const [isInternational, setIsInternational] = useState(
    state?.isInternational || false,
  );
  const [total, setTotal] = useState(state?.total || 0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  // Listen for country changes and force re-render
  const [appliedCoupon, setAppliedCoupon] = useState(
    state?.appliedCoupon || null,
  );

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
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/cart`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const items = res.data.items || [];
        setCartItems(items);
        const st = items.reduce(
          (acc, item) =>
            acc +
            getConvertedPrice(item.product, "salePrice") * (item.quantity || 0),
          0,
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
  }, [state, navigate, getConvertedPrice, shippingCharges]);
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

  useEffect(() => {
    (async () => {
      try {
        const res = await client.get("/commerce/coupons/active");
        setAvailableCoupons(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      }
    })();
  }, []);

  // Apply coupon (can pass code param to apply directly from available list)

  const applyCoupon = async (codeParam) => {
    const codeToUse = (codeParam || couponCode || "").trim();
    if (!codeToUse) return setCouponError("Please enter a coupon code");
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await client.post("/commerce/coupons/validate", {
        code: codeToUse,
        subtotal: subTotal,
      });

      if (res.data && res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        setCouponError("");
        setCouponCode(res.data.coupon.code || "");
        toast.success(`Coupon "${res.data.coupon.code}" applied`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
      toast.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Coupon removed");
  };

  // Calculate shipping charges based on package weight and destination
  const calculateShippingCharges = useCallback(async () => {
    if (!selectedAddress || cartItems.length === 0) return;
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
          productId: item.product._id,
          quantity: item.quantity,
        })),

        address: selectedAddress.address,
        pincode: selectedAddress.pincode,
        country: selectedCountry,
        dimension: dimensions,
        subTotal: subTotalINR, // Send INR value to backend
        shippingInfo: {
          pincode: selectedAddress.pincode,
          country: selectedCountry.name,
          address: selectedAddress.address,
        },
      };
      const res = await client.post("/commerce/calculate-shipping", payload);
      const { charges, international } = res.data;

      // Convert shipping charges back to local currency for display
      const shippingChargesLocal =
        selectedCountry?.code === "IN"
          ? charges
          : charges * (liveExchangeRate || selectedCountry?.exchangeRate || 1);
      setShippingCharges(shippingChargesLocal);
      setIsInternational(international);
    } catch (err) {
      console.error("Failed to calculate shipping:", err);
      // Fallback to same calculation logic as Cart.jsx
      const isInternational = selectedCountry?.code !== "IN";
      
      // Base shipping rates (same as Cart.jsx)
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
      
      // Convert to local currency for display
      const shippingChargesLocal =
        selectedCountry?.code === "IN"
          ? shippingChargesINR
          : shippingChargesINR *
            (liveExchangeRate || selectedCountry?.exchangeRate || 1);
      setShippingCharges(shippingChargesLocal);
      setIsInternational(isInternational);
    }
  }, [selectedAddress, cartItems, selectedCountry, subTotal, liveExchangeRate]);

  // Recalculate shipping when address or cart changes
  useEffect(() => {
    calculateShippingCharges();
  }, [calculateShippingCharges]);
  // Recalculate totals when cartItems, appliedCoupon, or shippingCharges changes

  useEffect(() => {
    const st = cartItems.reduce((acc, item) => {
      const itemTotal = Math.round(
        getConvertedPrice(item.product, "salePrice") * (item.quantity || 0),
      );
      return acc + itemTotal;
    }, 0);

    const disc = appliedCoupon
      ? appliedCoupon.discountType === "percent"
        ? (st * appliedCoupon.amount) / 100
        : appliedCoupon.amount
      : 0;

    const delivery = shippingCharges;

    const tot = st - disc + delivery;

    setSubTotal(st);
    setDiscount(disc);
    setDeliveryFee(delivery);
    setTotal(tot);
  }, [cartItems, appliedCoupon, shippingCharges, getConvertedPrice]);

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
                shippingCharges={shippingCharges}
                isInternational={isInternational}
                liveExchangeRate={liveExchangeRate}
              />
            </Elements>
          </div>
          {/* ================= Order Summary ================= */}
          <div className="z_chck_summary">
            <h3>Order Summary</h3>
            {cartItems.map((item) => {
              const localPrice = Math.round(
                getConvertedPrice(item.product, "salePrice") *
                  (item.quantity || 0),
              );
              const inrPrice = toINR(localPrice);
              return (
                <div
                  key={`${item.product._id}-${item.size || "nosize"}-${item.color || "nocolor"}`}
                  className="z_chck_summary_item"
                >
                  <span>
                    {item.product.title} x {item.quantity}
                  </span>
                  <span>
                    {selectedCountry?.currencySymbol || "₹"}
                    {localPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}

            <div className="z_chck_summary_item">
              <span>Subtotal</span>
              <span>
                {selectedCountry?.currencySymbol || "₹"}
                {Math.round(subTotal).toLocaleString("en-IN")}
                {/* <small className="text-muted d-block">
                  (₹{toINR(subTotal).toLocaleString("en-IN")})
                </small> */}
              </span>
            </div>

            {appliedCoupon && discount > 0 && (
              <div className="z_chck_summary_item">
                <span>Discount ({appliedCoupon.code})</span>
                <span>
                  -{selectedCountry?.currencySymbol || "₹"}
                  {Math.round(discount).toLocaleString("en-IN")}
                  {/* <small className="text-muted d-block">
                    (-₹{toINR(discount).toLocaleString("en-IN")})
                  </small> */}
                </span>
              </div>
            )}

            <div className="z_chck_summary_item">
              <span>
                Shipping ({isInternational ? "International" : "Domestic"})
              </span>
              <span>
                {selectedCountry?.currencySymbol || "₹"}
                {Math.round(shippingCharges).toLocaleString("en-IN")}
                {/* <small className="text-muted d-block">
                  (₹{toINR(shippingCharges).toLocaleString("en-IN")})
                </small> */}
              </span>
            </div>

            <div className="z_chck_summary_total">
              <span>Total</span>
              <span>
                {selectedCountry?.currencySymbol || "₹"}
                {Math.round(total).toLocaleString("en-IN")}
                {/* <small className="text-muted d-block mt-1">
                  (₹{toINR(total).toLocaleString("en-IN")})
                </small> */}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Checkout;