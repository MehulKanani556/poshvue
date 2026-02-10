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
    const method = res.config?.method?.toLowerCase();
    const msgFromServer = res.data?.message;
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
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
    }
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Something went wrong while calling API";
    toastError(msg);
    return Promise.reject(err);
  }
);

export default adminClient;
