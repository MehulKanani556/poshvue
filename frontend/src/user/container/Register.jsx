import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FiEye, FiEyeOff } from "react-icons/fi";
import client from "../../api/client";

/* =======================
   Yup Validation Schemas
======================= */
const loginSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
});

const registerSchema = Yup.object({
  name: Yup.string()
    .min(3, "Min 3 characters")
    .required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^[+]?[0-9]{1,3}[0-9]{7,14}$/, "Invalid phone number"),
  password: Yup.string().min(6).required("Password is required"),
});

const forgotPasswordSchema = Yup.object({
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^[+]?[0-9]{1,3}[0-9]{7,14}$/, "Invalid phone number"),
});

const otpSchema = Yup.object({
  otp: Yup.string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});
const resetSchema = Yup.object({
  newPassword: Yup.string().min(6).required("New password required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password required"),
});

function Register() {
  const [mode, setMode] = useState("login");
  const [resetToken, setResetToken] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRef = useRef([]);
  const modalRef = useRef(null);

  /* =======================
     Bootstrap Modal Init
  ======================= */
  useEffect(() => {
    if (window.bootstrap) {
      const modal = new window.bootstrap.Modal(modalRef.current);
      modal.show();

      modalRef.current.addEventListener("hidden.bs.modal", () => {
        window.location.href = "/";
      });
    }
  }, []);

  const handleOtpChange = (value, index, setFieldValue, values) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...(values.otp || "").split("")];
    newOtp[index] = value;
    const otpString = newOtp.join("");
    setFieldValue("otp", otpString);
    if (value && index < 5) otpRef.current[index + 1]?.focus();
  };

  const handleOtpBack = (e, index, setFieldValue, values) => {
    if (e.key === "Backspace") {
      const newOtp = [...(values.otp || "").split("")];
      newOtp[index] = "";
      setFieldValue("otp", newOtp.join(""));
      if (index > 0) otpRef.current[index - 1]?.focus();
    }
  };

  /* =======================
     Dynamic Validation
  ======================= */
  const getSchema = () => {
    if (mode === "login") return loginSchema;
    if (mode === "register") return registerSchema;
    if (mode === "forgot") return forgotPasswordSchema;
    if (mode === "otp") return otpSchema;
    if (mode === "reset") return resetSchema;
    return null;
  };

  return (
    <div
      className="modal fade"
      id="zAuthModal"
      tabIndex="-1"
      ref={modalRef}
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content z_glass_modal">
          <button
            className="z_modal_close"
            onClick={() => (window.location.href = "/")}
          >
            ✕
          </button>

          <h4 className="z_auth_title">
            {mode === "login" && "Login"}
            {mode === "register" && "Create Account"}
            {mode === "forgot" && "Forgot Password"}
            {mode === "otp" && "Verify OTP"}
            {mode === "reset" && "Create New Password"}
          </h4>

          {apiError && (
            <div style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "14px"
            }}>
              {apiError}
            </div>
          )}

          <Formik
            initialValues={{
              name: "",
              email: "",
              phone: "",
              password: "",
              otp: "",
              newPassword: "",
              confirmPassword: "",
            }}
            validationSchema={getSchema()}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                setApiError("");
                setLoading(true);

                if (mode === "register") {
                  const res = await client.post("/auth/register", {
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    password: values.password,
                    role: "user",
                  });
                  const { token, user } = res.data || {};
                  if (token && user) {
                    if (user.role === "admin") {
                      setApiError("Admin accounts cannot be registered from this page.");
                      return;
                    }
                    localStorage.setItem("userToken", token);
                    localStorage.setItem("userInfo", JSON.stringify(user));
                    window.location.href = "/";
                    return;
                  }
                } else if (mode === "login") {
                  const res = await client.post("/auth/login", {
                    email: values.email,
                    password: values.password,
                    role: "user",
                  });
                  const { token, user } = res.data || {};
                  if (token && user) {
                    if (user.role === "admin") {
                      setApiError("Admin accounts should login from the admin panel.");
                      return;
                    }
                    localStorage.setItem("userToken", token);
                    localStorage.setItem("userInfo", JSON.stringify(user));
                    window.location.href = "/";
                    return;
                  }
                } else if (mode === "forgot") {
                  // Request OTP
                  const res = await client.post("/auth/forgot-password", {
                    phone: values.phone,
                  });
                  setApiError("");
                  setMode("otp");
                } else if (mode === "otp") {
                  // Verify OTP
                  const res = await client.post("/auth/verify-otp", {
                    phone: values.phone,
                    otp: values.otp,
                  });
                  setResetToken(res.data.resetToken);
                  setApiError("");
                  setMode("reset");
                } else if (mode === "reset") {
                  // Reset Password
                  const res = await client.post("/auth/reset-password", {
                    resetToken: resetToken,
                    newPassword: values.newPassword,
                    confirmPassword: values.confirmPassword,
                  });
                  setApiError("");
                  setMode("login");
                  // alert("Password reset successfully! Please login with your new password.");
                }
              } catch (err) {
                const msg = err?.response?.data?.message || "Something went wrong";
                setApiError(msg);
              } finally {
                setLoading(false);
                setSubmitting(false);
              }
            }}
          >
            {({ values, setFieldValue }) => {
            return (
            <Form className="z_auth_form">
              {mode === "register" && (
                <>
                  <Field
                    name="name"
                    placeholder="Full Name"
                    className="z_auth_input"
                  />
                  <ErrorMessage
                    name="name"
                    component="div"
                    className="z_error"
                  />
                </>
              )}

              {mode === "register" && (
                <>
                  <Field
                    type="tel"
                    name="phone"
                    placeholder="Phone Number (10 digits or +country code)"
                    className="z_auth_input"
                  />
                  <ErrorMessage
                    name="phone"
                    component="div"
                    className="z_error"
                  />
                  {/* <p style={{ fontSize: "12px", color: "#fff", marginTop: "5px" }}>
                    Example: 8160506549 or +918160506549
                  </p> */}
                </>
              )}

              {(mode === "login" ||
                mode === "register") && (
                <>
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="z_auth_input"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="z_error"
                  />
                </>
              )}

              {mode === "forgot" && (
                <>
                  <Field
                    type="tel"
                    name="phone"
                    placeholder="Phone Number (10 digits or +country code)"
                    className="z_auth_input"
                  />
                  <ErrorMessage
                    name="phone"
                    component="div"
                    className="z_error"
                  />
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                    Example: 8160506549 or +918160506549
                  </p>
                </>
              )}

              {(mode === "login" || mode === "register") && (
                <>
                  <div style={{ position: "relative", width: "100%" }}>
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="z_auth_input"
                      style={{ paddingRight: "36px", width: "100%", boxSizing: "border-box" }}
                    />
                    <span
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </span>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="z_error"
                  />
                </>
              )}

              {mode === "otp" && (
                <>
                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ textAlign: "center", marginBottom: "10px", color: "#666" }}>
                      Enter the 6-digit OTP sent to your phone
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "center",
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          maxLength="1"
                          type="text"
                          inputMode="numeric"
                          value={(() => {
                            const otpString = (values?.otp || "").toString();
                            return otpString[index] || "";
                          })()}
                          ref={(el) => (otpRef.current[index] = el)}
                          style={{
                            width: "40px",
                            height: "45px",
                            fontSize: "20px",
                            textAlign: "center",
                            border: "2px solid #ddd",
                            borderRadius: "8px",
                            fontWeight: "bold",
                          }}
                          onChange={(e) => handleOtpChange(e.target.value, index, setFieldValue, values)}
                          onKeyDown={(e) => handleOtpBack(e, index, setFieldValue, values)}
                        />
                      ))}
                    </div>
                  </div>
                  <ErrorMessage
                    name="otp"
                    component="div"
                    className="z_error"
                  />
                </>
              )}

              {mode === "reset" && (
                <>
                  <div style={{ position: "relative", width: "100%" }}>
                    <Field
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="New Password"
                      className="z_auth_input"
                      style={{ paddingRight: "36px", width: "100%", boxSizing: "border-box" }}
                    />
                    <span
                      onClick={() => setShowNewPassword((p) => !p)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </span>
                  </div>
                  <ErrorMessage
                    name="newPassword"
                    component="div"
                    className="z_error"
                  />

                  <div style={{ position: "relative", width: "100%" }}>
                    <Field
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      className="z_auth_input"
                      style={{ paddingRight: "36px", width: "100%", boxSizing: "border-box" }}
                    />
                    <span
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </span>
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="z_error"
                  />
                </>
              )}

              {mode === "login" && (
                <div className="z_auth_options">
                  <label>
                    <input type="checkbox" /> Remember me
                  </label>
                  <span
                    onClick={() => setMode("forgot")}
                    style={{ cursor: "pointer", color: "#007bff" }}
                  >
                    Forgot password?
                  </span>
                </div>
              )}

              <button type="submit" className="z_auth_submit">
                {mode === "login" && "Login"}
                {mode === "register" && "Create Account"}
                {mode === "forgot" && "Send OTP"}
                {mode === "otp" && "Verify OTP"}
                {mode === "reset" && "Update Password"}
              </button>

              <p className="z_auth_switch">
                {mode === "login" && (
                  <>
                    Don't have an account?{" "}
                    <span onClick={() => setMode("register")}>Register</span>
                  </>
                )}
                {mode === "register" && (
                  <>
                    Already have an account?{" "}
                    <span onClick={() => setMode("login")}>Login</span>
                  </>
                )}
                {mode === "forgot" && (
                  <>
                    Remember password?{" "}
                    <span onClick={() => setMode("login")}>Back to Login</span>
                  </>
                )}
                {mode === "otp" && (
                  <>
                    Didn't receive OTP?{" "}
                    <span onClick={() => setMode("forgot")}>Resend</span>
                  </>
                )}
                {mode === "reset" && (
                  <>
                    <span onClick={() => setMode("login")}>Back to Login</span>
                  </>
                )}
              </p>
            </Form>
            );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default Register;
