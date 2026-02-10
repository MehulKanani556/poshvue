import React, { useState } from "react";
import { Trash2 } from "lucide-react";

function Delete({ onConfirm }) {
  const [open, setOpen] = useState(false);

  const styles = {
    deleteBtn: {
      background: "#ef4444",
      color: "#fff",
      border: "none",
      padding: "8px 18px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },

    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },

    modal: {
      background: "#fff",
      width: "300px",
      padding: "30px 20px",
      borderRadius: "24px",
      textAlign: "center",
      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },

    iconWrapper: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "14px",
    },

    stars: {
      color: "#ef4444",
      fontSize: "10px",
      marginBottom: "10px",
      letterSpacing: "6px",
    },

    text: {
      fontSize: "14px",
      fontWeight: 500,
      color: "#2b4d6e",
      lineHeight: "1.5",
      marginBottom: "22px",
      margin: "0 0 22px 0",
    },

    confirmBtn: {
      background: "#ef4444",
      color: "#fff",
      border: "none",
      padding: "11px 0",
      borderRadius: "30px",
      fontSize: "14px",
      cursor: "pointer",
      width: "100%",
      marginBottom: "12px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },

    cancelBtn: {
      background: "transparent",
      border: "none",
      color: "#ef4444",
      fontSize: "13px",
      cursor: "pointer",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  };

  return (
    <>
      {/* Trigger */}
      <button style={styles.deleteBtn} onClick={() => setOpen(true)}>
        Delete
      </button>

      {/* Modal */}
      {open && (
        <div style={styles.overlay} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Decorative */}
            <div style={styles.stars}>✕ ✕ ✕</div>

            {/* Icon */}
            <div style={styles.iconWrapper}>
              <Trash2 size={42} color="#ef4444" />
            </div>

            {/* Text */}
            <p style={styles.text}>
              Are you sure you want to <br />
              delete your account?
            </p>

            {/* Actions */}
            <button
              style={styles.confirmBtn}
              onClick={() => {
                onConfirm && onConfirm();
                setOpen(false);
              }}
            >
              Yes, Delete
            </button>

            <button
              style={styles.cancelBtn}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Delete;