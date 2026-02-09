import React, { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import client from "../../api/client";
import Modal from "../../components/Modal";

/*
  This component:
   - Detects the working coupons endpoint by trying common paths
   - Uses that path for list/create/update/delete
   - Maps form values simply and relies on backend mapAdminToCoupon to normalize
*/

const CANDIDATE_PATHS = ["/commerce/coupons"];

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [apiBase, setApiBase] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({

    code: "",
    type: "percent",
    discount: "",
    maxUses: "",
    expiryDate: "",
    status: "Active",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const base = await detectCouponsPath();
        setApiBase(base);
        await load(base);
      } catch (err) {
        setError(err.message || "Failed to detect coupons endpoint");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...existing code...
  async function detectCouponsPath() {
    for (const p of CANDIDATE_PATHS) {
      try {
        const res = await client.get(p);
        console.log("Coupons endpoint ok:", p, res);
        return p;
      } catch (err) {
        console.warn(
          "Coupons probe failed for",
          p,
          err && err.message ? err.message : err
        );
      }
    }
    throw new Error(
      "Coupons endpoint not found. Check backend routes and REACT_APP_API_URL."
    );
  }
  // ...existing code...

  async function load(path) {
    try {
      setError("");
      const res = await client.get(path);
      const items = res.data?.items ?? res.data ?? [];
      setCoupons(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || "Failed to load coupons");
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!apiBase) return setError("Coupons API not available");
    try {
      setError("");
      const payload = { ...formData };
      if (payload.discount !== undefined)
        payload.discount = Number(payload.discount);
      if (payload.maxUses !== undefined)
        payload.maxUses = Number(payload.maxUses);
      // send to backend; backend mapAdminToCoupon will convert fields
      let res;
      if (editingId) {
        res = await client.put(`${apiBase}/${editingId}`, payload);
      } else {
        res = await client.post(apiBase, payload);
      }
      const item = res.data?.item ?? res.data;
      if (item) {
        if (editingId)
          setCoupons((prev) =>
            prev.map((c) =>
              String(c._id || c.id) === String(editingId) ? item : c
            )
          );
        else setCoupons((prev) => [item, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err.message || "Save failed");
    }
  }

  function handleEdit(coupon) {
    setFormData({
      id: coupon._id || coupon.id || null,
      code: coupon.code || "",
      type: coupon.discountType === "percent" ? "percent" : "fixed",
      discount: coupon.amount ?? "",
      maxUses: coupon.maxUses ?? "",
      expiryDate: coupon.endDate
        ? new Date(coupon.endDate).toISOString().slice(0, 10)
        : "",
      status: coupon.active ? "Active" : "Inactive",
    });

    setEditingId(coupon._id || coupon.id);
    setShowModal(true);
  }


  async function handleDeleteClick(id) {
    setDeletingId(id);
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingId || !apiBase) return;
    try {
      await client.delete(`${apiBase}/${deletingId}`);
      setCoupons((prev) =>
        prev.filter((c) => String(c._id || c.id) !== String(deletingId))
      );
    } catch (err) {
      setError(err.message || "Delete failed");
    }
    setShowDeleteModal(false);
    setDeletingId(null);
  }

  function resetForm() {
    setFormData({

      code: "",
      type: "percent",
      discount: "",
      maxUses: "",
      expiryDate: "",
      status: "Active",
    });
    setEditingId(null);
    setShowModal(false);
    setError("");
  }

  return (

    <>

      <style>
        {`
          .x_card_coupon {
            background: white;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
            word-wrap: break-word;
          }
        `}
      </style>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: '#2b4d6e' }}>
            Coupons & Discounts
          </h1>
          <button
            className="x_btn x_btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <FiPlus size={16} /> Create Coupon
          </button>
        </div>

        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

        {/* Modal */}
        <div className={`x_modal-overlay ${showModal ? "x_active" : ""}`}>
          <div className="x_modal-content">
            <div className="x_modal-header">
              <h2>{editingId ? "Edit Coupon" : "Create New Coupon"}</h2>
              <button className="x_modal-close" onClick={resetForm}>
                ×
              </button>
            </div>
            <form onSubmit={onSubmit}>
              <div className="x_modal-body">
                <div className="x_form-group">
                  <label className="x_form-label">Coupon Code</label>
                  <input
                    type="text"
                    name="code"
                    className="x_form-control"
                    value={formData.code}
                    onChange={onChange}
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Discount Type</label>
                  <select
                    name="type"
                    className="x_form-select"
                    value={formData.type}
                    onChange={onChange}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Discount Value</label>
                  <input
                    type="number"
                    name="discount"
                    className="x_form-control"
                    value={formData.discount}
                    onChange={onChange}
                    required
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Maximum Uses</label>
                  <input
                    type="number"
                    name="maxUses"
                    className="x_form-control"
                    value={formData.maxUses}
                    onChange={onChange}
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="x_form-control"
                    value={formData.expiryDate}
                    onChange={onChange}
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Status</label>
                  <select
                    name="status"
                    className="x_form-select"
                    value={formData.status}
                    onChange={onChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="x_modal-footer">
                <button
                  type="button"
                  className="x_btn x_btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="x_btn x_btn-primary">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Coupons Grid */}
        <div className="x_grid x_grid-4">
          {coupons.map((coupon) => (
            <div className="x_card_coupon" key={coupon._id || coupon.id}>
              <div
                className="x_card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "18px", margin: "0 0 5px 0" }}>
                    {coupon.code}
                  </h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#7f8c8d" }}>
                    {coupon.discountType === "percent" ||
                      coupon.discountType === "percent"
                      ? `${coupon.amount}%`
                      : `$${coupon.amount}`}
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: coupon.active ? "#d4edda" : "#f8d7da",
                    color: coupon.active ? "#155724" : "#721c24",
                    whiteSpace: "nowrap",
                  }}
                >
                  {coupon.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="x_card-body" style={{ padding: "20px" }}>
                <div style={{ marginBottom: "15px" }}>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "12px",
                      color: "#7f8c8d",
                    }}
                  >
                    Usage
                  </p>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#ecf0f1",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${coupon.maxUses
                            ? Math.round(
                              ((coupon.used || 0) / coupon.maxUses) * 100
                            )
                            : 0
                          }%`,
                        backgroundColor: "#0a2845",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      margin: "5px 0 0 0",
                      fontSize: "12px",
                      color: "#7f8c8d",
                    }}
                  >
                    {coupon.used || 0} / {coupon.maxUses || 0} used
                  </p>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "12px",
                      color: "#7f8c8d",
                    }}
                  >
                    Expires on
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>
                    {coupon.endDate
                      ? new Date(coupon.endDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }} className="td_btnrm">
                  <button
                    className="x_btn btn_edit x_btn-sm"
                    onClick={() => handleEdit(coupon)}
                    title="Edit"
                    style={{ flex: 1 }}
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    className="x_btn btn_remove x_btn-sm"
                    onClick={() => handleDeleteClick(coupon._id || coupon.id)}
                    title="Delete"
                    style={{ flex: 1 }}
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Coupon"
          message="Are you sure you want to delete this coupon?"
          confirmText="Yes, Delete"
          cancelText="Cancel"
        />
      </div>


    </>
  );
}

export default Coupons;
