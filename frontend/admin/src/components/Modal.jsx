import React, { useState } from "react";
import { RiDeleteBinFill } from "react-icons/ri";

function Modal({ isOpen, onClose, onConfirm, title, message, confirmText = "Yes", cancelText = "No", icon }) {
  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },

    modal: {
      background: "#fff",
      width: 320,
      padding: "28px 22px",
      borderRadius: 22,
      textAlign: "center",
      boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
    },

    iconWrap: {
      width: 70,
      height: 70,
      margin: "0 auto 16px",
      borderRadius: "50%",
      background: "#ffeaea",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    icon: {
      fontSize: 34,
      color: "#e74c3c",
    },

    title: {
      fontSize: 18,
      fontWeight: 600,
      color: "#2b4d6e",
      marginBottom: 8,
    },

    text: {
      fontSize: 15,
      fontWeight: 500,
      color: "#2b4d6e",
      marginBottom: 22,
      lineHeight: "1.4",
    },

    confirmBtn: {
      background: "#e74c3c",
      color: "#fff",
      border: "none",
      padding: "10px 22px",
      borderRadius: 30,
      fontSize: 14,
      cursor: "pointer",
      width: "100%",
      marginBottom: 14,
    },

    cancelBtn: {
      background: "transparent",
      border: "none",
      color: "#888",
      fontSize: 13,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        {icon && (
          <div style={styles.iconWrap}>
            <span style={styles.icon}>
              {icon}
            </span>
          </div>
        )}

        {/* Title */}
        {title && <h3 style={styles.title}>{title}</h3>}

        {/* Message */}
        <p style={styles.text}>
          {message}
        </p>

        {/* Actions */}
        <button
          style={styles.confirmBtn}
          onClick={() => {
            onConfirm && onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>

        <button style={styles.cancelBtn} onClick={onClose}>
          {cancelText}
        </button>
      </div>
    </div>
  );
}

export default Modal;