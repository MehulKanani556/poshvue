import React from "react";
import { Spinner } from "react-bootstrap";

const Loader = ({ size = "md", variant = "dark", fullScreen = false, text = "Loading..." }) => {
  const spinnerSize = size === "sm" ? "sm" : size === "lg" ? "lg" : undefined;

  if (fullScreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <div className="d-flex">
          <div className="loader"></div>
        

        </div>
        {/* {text && <p className="mt-3 text-muted">{text}</p>} */}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div className="d-flex">
        <div className="loader"></div>
      

      </div>
      {/* {text && <p className="mt-2 text-muted small">{text}</p>} */}
    </div>
  );
};

export default Loader;
