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
    const method = res.config?.method?.toLowerCase();
    const msgFromServer = res.data?.message;
    if (method === "post") {
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
