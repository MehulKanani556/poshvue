import { toast } from "react-toastify";

export const toastSuccess = (message, options = {}) => {
  const text = message;
  const id = options.toastId || `success:${text}`;
  if (toast.isActive(id)) return; // avoid duplicate success toast
  toast.success(text, {
    position: "top-right",
    toastId: id,
    ...options,
  });
};

export const toastError = (message, options = {}) => {
  const text = message || "Something went wrong";
  const id = options.toastId || `error:${text}`;
  if (toast.isActive(id)) return; // avoid duplicate error toast
  toast.error(text, {
    position: "top-right",
    toastId: id,
    ...options,
  });
};

export const toastInfo = (message, options = {}) => {
  const text = message || "Info";
  const id = options.toastId || `info:${text}`;
  if (toast.isActive(id)) return; // avoid duplicate info toast
  toast.info(text, {
    position: "top-right",
    toastId: id,
    ...options,
  });
};

export const toastWarning = (message, options = {}) => {
  const text = message || "Warning";
  const id = options.toastId || `warning:${text}`;
  if (toast.isActive(id)) return; // avoid duplicate warning toast
  toast.warning(text, {
    position: "top-right",
    toastId: id,
    ...options,
  });
};
