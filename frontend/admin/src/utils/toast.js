import { toast } from "react-toastify";

export const toastSuccess = (message) =>
  toast.success(message || "Action completed successfully", {
    position: "top-right",
  });

export const toastError = (message) =>
  toast.error(message || "Something went wrong", {
    position: "top-right",
  });

export const toastInfo = (message) =>
  toast.info(message || "Info", {
    position: "top-right",
  });

export const toastWarning = (message) =>
  toast.warning(message || "Warning", {
    position: "top-right",
  });

