import axios from "axios";
import { toastSuccess, toastError } from "../utils/toast";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const adminClient = axios.create({
  baseURL,
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (res) => {
    // If the request explicitly asks to skip global toast, don't show it
    if (res.config?._skipToast) return res;

    const method = res.config?.method?.toLowerCase();
    const msgFromServer = res.data?.message;
    
    // Only show success toast for mutations
    if (["post", "put", "patch", "delete"].includes(method)) {
      // If server provides a message, use it, otherwise use default
      toastSuccess(msgFromServer || (method === "delete" ? "Deleted successfully" : "Saved successfully"));
    }
    return res;
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
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

export default adminClient;
