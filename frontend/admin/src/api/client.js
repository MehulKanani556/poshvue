import axios from "axios";
import { toastSuccess, toastError } from "../utils/toast";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => {
    const method = res.config?.method?.toLowerCase();
    const msgFromServer = res.data?.message;

    // Only show toast for write operations (add / edit / delete)
    if (method === "post") {
      toastSuccess(msgFromServer || "Added successfully");
    } else if (method === "put" || method === "patch") {
      toastSuccess(msgFromServer || "Updated successfully");
    } else if (method === "delete") {
      toastSuccess(msgFromServer || "Deleted successfully");
    }

    return res;
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      // Unauthorized → clear token and optionally redirect
      localStorage.removeItem("adminToken");
      // window.location.href = '/login'; // avoid hard redirect in library file
    }

    const msg =
      err.response?.data?.message ||
      err.message ||
      "Something went wrong while calling API";
    toastError(msg);

    return Promise.reject(err);
  }
);

export default client;