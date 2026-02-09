import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ErrorPage(props) {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};

  const statusCode = props.statusCode || state.statusCode || 404;
  const message =
    props.message ||
    state.message ||
    "The page you were looking for could not be found";

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          {statusCode}
        </div>
        <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "16px" }}>
          {message}
        </p>
        <button
          onClick={handleBackHome}
          style={{
            padding: "10px 22px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#111827",
            color: "#ffffff",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Back to home page
        </button>
      </div>
    </div>
  );
}

export default ErrorPage;

