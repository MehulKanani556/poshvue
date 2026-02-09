import axios from "axios";
import { toastSuccess, toastError } from "../utils/toast";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove Content-Type header for FormData - let axios set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

/* ================= RESPONSE INTERCEPTOR ================= */
client.interceptors.response.use(
  (res) => {
    const method = res.config?.method?.toLowerCase();
    const msgFromServer = res.data?.message;

    if (method === "post") {
      // toastSuccess(msgFromServer || "Operation successful");
      toastSuccess(msgFromServer);
    } else if (method === "put" || method === "patch") {
      toastSuccess(msgFromServer || "Updated successfully");
    } else if (method === "delete") {
      toastSuccess(msgFromServer || "Deleted successfully");
    }

    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userInfo");
    }

    const msg =
      err.response?.data?.message ||
      err.message ||
      "Something went wrong while calling API";
    toastError(msg);

    return Promise.reject(err);
  }
);

/* ================= AUTH APIs ================= */

// Register
export const registerUser = (data) =>
  client.post("/auth/register", data);

// Login
export const loginUser = (data) =>
  client.post("/auth/login", data);

// Send OTP (Forgot Password)
export const sendOtp = (data) =>
  client.post("/auth/send-otp", data);

// Verify OTP
export const verifyOtp = (data) =>
  client.post("/auth/verify-otp", data);

// Reset Password
export const resetPassword = (data) =>
  client.post("/auth/reset-password", data);

// Logout
export const logoutUser = async () => {
  try {
    await client.post("/auth/logout");
  } finally {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
  }
};

/* ================= OTHER APIs ================= */

// Story API
export const getStory = () => client.get("/story");

// Home Poster API
export const getHomePoster = () => client.get("/home-poster");

// Slider API
export const getSlider = () => client.get("/slider");

// About Us API
export const getAboutUs = () => client.get("/about-us");

// Country APIs
export const getActiveCountries = () => client.get("/country/active");

export const getDefaultCountry = () => client.get("/country/default");
/* ================= ORDER APIs ================= */

// Get user orders
export const getUserOrders = (userId) => client.get(`/commerce/orders/${userId}`);

// Track order by ID and email
export const trackOrder = (data) => client.post("/commerce/orders/track", data);

// Get single order
export const getOrder = (orderId) => client.get(`/commerce/orders/${orderId}`);

/* ================= PAYMENT APIs ================= */

// Create payment intent
export const createPaymentIntent = (data) => client.post("/payment/create-intent", data);

// Verify payment
export const verifyPayment = (data) => client.post("/payment/verify", data);

// Razorpay: create order
export const createRazorpayOrder = (data) => client.post("/payment/razorpay/order", data);

// Razorpay: verify signature
export const verifyRazorpaySignature = (data) => client.post("/payment/razorpay/verify", data);

// Razorpay: validate VPA
export const validateVpa = (data) => client.post("/payment/razorpay/validate-vpa", data);

// Razorpay: create UPI collect payment (S2S)
export const createUpiCollectPayment = (data) => client.post("/payment/razorpay/collect", data);

// Razorpay: fetch payments for an order
export const getRazorpayOrderPayments = (orderId) => client.get(`/payment/razorpay/order/${orderId}/payments`);

export default client;