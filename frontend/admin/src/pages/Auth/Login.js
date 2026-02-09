import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../../styles/x_admin.css";
import client from "../../api/client";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await client.post("/auth/login", { 
        email, 
        password,
        role: "admin" // Admin panel login requires admin role
      });
      const { token, user } = res?.data || {};
      
      if (token && user) {
        // Verify user is actually an admin
        if (user.role !== "admin") {
          setError("Access denied. Admin access required.");
          return;
        }
        
        // Store admin token and user info
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminInfo", JSON.stringify(user));
        onLogin(token);
        navigate("/");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="x_login-container">
      <div className="x_login-card">
        <div className="x_login-header">
          <h1>Admin Panel</h1>
          <p>PoshVue Admin</p>
        </div>

        {error && <div className="x_alert x_alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="x_form-group">
            <label htmlFor="email" className="x_form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="x_form-control"
              placeholder="admin@poshvue.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="x_form-group">
            <label htmlFor="password" className="x_form-label">
              Password
            </label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="x_form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="x_btn x_btn-primary x_btn-block"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* <div className="x_login-footer">
          <p>Demo Credentials:</p>
          <p style={{ fontSize: "12px", color: "#7f8c8d" }}>
            Email: admin@poshvue.com
          </p>
          <p style={{ fontSize: "12px", color: "#7f8c8d" }}>
            Password: admin123
          </p>
        </div> */}
      </div>

      <style>{`
        .x_login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .x_login-card {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .x_login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .x_login-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 5px 0;
          color: #0a2845;
        }

        .x_login-header p {
          font-size: 14px;
          color: #7f8c8d;
          margin: 0;
        }

        .x_login-footer {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
          text-align: center;
        }

        .x_login-footer p {
          margin: 5px 0;
          font-size: 12px;
        }

        @media (max-width: 576px) {
          .x_login-card {
            padding: 25px;
          }

          .x_login-header h1 {
            font-size: 22px;
          }
        }

        @media (max-width: 375px) {
          .x_login-card {
            padding: 15px;
          }

          .x_login-header h1 {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
