import axios from "axios";
import { toastSuccess, toastError } from "../utils/toast";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

client.interceptors.response.use(
  (res) => {
    // If the request explicitly asks to skip global toast, don't show it
    if (res.config?._skipToast) return res;

    const method = res.config?.method?.toLowerCase();
    const msgFromServer = res.data?.message;
    
    // Only show success toast for mutations
    if (["post", "put", "patch", "delete"].includes(method)) {
      // Only show success toast if the server provides a message
      if (msgFromServer) {
        toastSuccess(msgFromServer);
      }
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userInfo");
    }

    // If the request explicitly asks to skip global toast, don't show it
    if (err.config?._skipToast) return Promise.reject(err);

    let msg = "Something went wrong while calling API";
    if (err.response?.data) {
      const data = err.response.data;
      // Priority: data.message > first validation error > generic message
      msg = data.message || (data.errors && typeof data.errors === 'object' ? Object.values(data.errors)[0] : null) || err.message || msg;
    } else {
      msg = err.message || msg;
    }

    toastError(msg);
    return Promise.reject(err);
  }
);

export const registerUser = (data) => client.post("/auth/register", data);
export const loginUser = (data) => client.post("/auth/login", data);
export const sendOtp = (data) => client.post("/auth/send-otp", data);
export const verifyOtp = (data) => client.post("/auth/verify-otp", data);
export const resetPassword = (data) => client.post("/auth/reset-password", data);
export const logoutUser = async () => {
  try {
    await client.post("/auth/logout");
  } finally {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
  }
};

export const getStory = () => client.get("/story");
export const getHomePoster = () => client.get("/home-poster");
export const getSlider = () => client.get("/slider");
export const getAboutUs = () => client.get("/about-us");
export const getActiveCountries = () => client.get("/country/active");
export const getDefaultCountry = () => client.get("/country/default");

export const getUserOrders = (userId) => client.get(`/commerce/orders/${userId}`);
export const trackOrder = (data) => client.post("/commerce/orders/track", data);
export const getOrder = (orderId) => client.get(`/commerce/orders/${orderId}`);

export const createPaymentIntent = (data) => client.post("/payment/create-intent", data);
export const verifyPayment = (data) => client.post("/payment/verify", data);
// export const createRazorpayOrder = (data) => client.post("/payment/razorpay/order", data);
// export const verifyRazorpaySignature = (data) => client.post("/payment/razorpay/verify", data);
export const validateVpa = (data) => client.post("/payment/razorpay/validate-vpa", data);
export const createUpiCollectPayment = (data) => client.post("/payment/razorpay/collect", data);
// Cashfree UPI
export const createCashfreeOrder = (data) =>
  client.post('/payment/cashfree/order', data);

export const getCashfreeOrder = (orderId) =>
  client.get(`/payment/cashfree/order/${orderId}`);
// export const getRazorpayOrderPayments = (orderId) => client.get(`/payment/razorpay/order/${orderId}/payments`);

export default client;
