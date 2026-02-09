import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import client from "../api/client";
import "../styles/h_style.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!phone) {
      setError("Phone number is required");
      return;
    }

    try {
      setLoading(true);
      const response = await client.post("/auth/forgot-password", {
        phone,
      });

      let messageText = response.data.message;
      // Show OTP in development mode if provided
      if (response.data.debug_otp) {
        messageText += ` (OTP: ${response.data.debug_otp})`;
      }
      if (response.data.hint) {
        messageText += ` - ${response.data.hint}`;
      }

      setMessage(messageText);
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to send OTP";
      const errorDetails = err.response?.data?.error || err.response?.data?.hint || "";
      setError(errorMsg + (errorDetails ? ` - ${errorDetails}` : ""));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!phone) {
      setError("Phone number is required");
      return;
    }

    try {
      setLoading(true);
      const response = await client.post("/auth/verify-otp", {
        phone,
        otp,
      });

      setResetToken(response.data.resetToken);
      setMessage(response.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const response = await client.post("/auth/reset-password", {
        resetToken,
        newPassword,
        confirmPassword,
      });

      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#7fb0df1f", padding: "40px 20px" }}>
      <div style={{
        maxWidth: "400px",
        margin: "0 auto",
        background: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#2b4d6e" }}>
          Reset Password
        </h2>

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Phone Number <span style={{ color: "#d32f2f" }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <small style={{ color: "#efeefe", marginTop: "4px", display: "block" }}>
                Enter 10 digits (e.g., 9876543210) or with country code (e.g., +919876543210)
              </small>
            </div>

            {error && <p style={{ color: "#d32f2f", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}
            {message && <p style={{ color: "#388e3c", marginBottom: "15px", fontSize: "14px" }}>{message}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0a2845",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                color: "#0a2845",
                border: "1px solid #0a2845",
                borderRadius: "4px",
                marginTop: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <p style={{ color: "#666", textAlign: "center", marginBottom: "20px" }}>
              Enter the 6-digit OTP sent to your phone
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "18px",
                  textAlign: "center",
                  letterSpacing: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && <p style={{ color: "#d32f2f", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}
            {message && <p style={{ color: "#388e3c", marginBottom: "15px", fontSize: "14px" }}>{message}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0a2845",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError("");
                setMessage("");
                setOtp("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                color: "#0a2845",
                border: "1px solid #0a2845",
                borderRadius: "4px",
                marginTop: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                New Password
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  onClick={() => setShowNewPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </span>
              </div>
            </div>

            {error && <p style={{ color: "#d32f2f", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}
            {message && <p style={{ color: "#388e3c", marginBottom: "15px", fontSize: "14px" }}>{message}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0a2845",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
