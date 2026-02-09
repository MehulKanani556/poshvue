import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import client from "../../api/client";
import Modal from "../../components/Modal";

function Countries() {
  const [countries, setCountries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    currency: "",
    currencySymbol: "",
    flagUrl: "",
    exchangeRate: 1,
    active: true,
    isDefault: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(countries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCountries = countries.slice(startIndex, endIndex);

  // Ensure currentPage stays within bounds when countries change
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(countries.length / ITEMS_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [countries.length]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/country", { params: { page: 1, limit: 50 } });
        setCountries(Array.isArray(res.data.items) ? res.data.items : []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load countries";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      currency: "",
      currencySymbol: "",
      flagUrl: "",
      exchangeRate: 1,
      active: true,
      isDefault: false,
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      if (editingId) {
        const res = await client.put(`/country/${editingId}`, formData);
        setCountries((prev) => prev.map((c) => (c._id === editingId ? res.data.item : c)));
      } else {
        const res = await client.post("/country", formData);
        setCountries((prev) => [res.data.item, ...prev]);
      }
      resetForm();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save country";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (country) => {
    setFormData({
      name: country.name || "",
      code: country.code || "",
      currency: country.currency || "",
      currencySymbol: country.currencySymbol || "",
      flagUrl: country.flagUrl || "",
      exchangeRate: country.exchangeRate || 1,
      active: country.active !== false,
      isDefault: country.isDefault || false,
    });
    setEditingId(country._id);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setLoading(true);
      setError("");
      await client.delete(`/country/${deletingId}`);
      setCountries((prev) => prev.filter((c) => c._id !== deletingId));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete country";
      setError(msg);
    } finally {
      setLoading(false);
    }
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center", marginBottom: 20
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2b4d6e' }}>Countries</h1>
        </div>
        <button
          className="x_btn x_btn-primary"
          onClick={() => setShowModal(true)}
        >
          <FiPlus size={16} /> New Country
        </button>
      </div>
      {error && <div className="x_alert x_alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Modal */}
      <div className={`x_modal-overlay ${showModal ? "x_active" : ""}`}>
        <div className="x_modal-content" style={{ maxWidth: "700px" }}>
          <div className="x_modal-header">
            <h2>{editingId ? "Edit Country" : "New Country"}</h2>
            <button className="x_modal-close" onClick={resetForm}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="x_modal-body">
              <div className="x_form-group">
                <label className="x_form-label">Country Name *</label>
                <input
                  type="text"
                  name="name"
                  className="x_form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., India"
                  required
                />
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Country Code (ISO) *</label>
                <input
                  type="text"
                  name="code"
                  className="x_form-control"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., IN, US, MY"
                  required
                  maxLength={2}
                  style={{ textTransform: "uppercase" }}
                />
                <small style={{ color: "#7f8c8d" }}>2-letter ISO country code</small>
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Currency Code *</label>
                <input
                  type="text"
                  name="currency"
                  className="x_form-control"
                  value={formData.currency}
                  onChange={handleInputChange}
                  placeholder="e.g., INR, USD, MYR"
                  required
                  maxLength={3}
                  style={{ textTransform: "uppercase" }}
                />
                <small style={{ color: "#7f8c8d" }}>3-letter currency code</small>
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Currency Symbol *</label>
                <input
                  type="text"
                  name="currencySymbol"
                  className="x_form-control"
                  value={formData.currencySymbol}
                  onChange={handleInputChange}
                  placeholder="e.g., ₹, $, RM"
                  required
                />
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Flag URL *</label>
                <input
                  type="url"
                  name="flagUrl"
                  className="x_form-control"
                  value={formData.flagUrl}
                  onChange={handleInputChange}
                  placeholder="https://flagcdn.com/w40/in.png"
                  required
                />
                <small style={{ color: "#7f8c8d" }}>
                  You can use: https://flagcdn.com/w40/{`{code}`}.png (lowercase)
                </small>
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Exchange Rate</label>
                <input
                  type="number"
                  name="exchangeRate"
                  className="x_form-control"
                  value={formData.exchangeRate}
                  onChange={handleInputChange}
                  placeholder="1"
                  step="0.01"
                  min="0"
                />
                <small style={{ color: "#7f8c8d" }}>
                  Exchange rate relative to base currency (e.g., INR = 1)
                </small>
              </div>

              <div className="x_form-group">
                <label className="x_form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>

              <div className="x_form-group">
                <label className="x_form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                  />
                  Set as Default Country
                </label>
                <small style={{ color: "#7f8c8d" }}>
                  Only one country can be default. Setting this will unset others.
                </small>
              </div>
            </div>

            <div className="x_modal-footer">
              <button type="button" className="x_btn x_btn-secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="x_btn x_btn-primary">{editingId ? "Update" : "Create"}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="x_card">
        <div className="x_card-body">
          <div className="x_table-wrapper">
            <table className="x_data-table">
              <thead>
                <tr>
                  <th>Flag</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Currency</th>
                  <th>Symbol</th>
                  <th>Exchange Rate</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && countries.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>Loading...</td>
                  </tr>
                ) : currentCountries.map((country) => (
                  <tr key={country._id || country.id}>
                    <td>
                      {country.flagUrl ? (
                        <img
                          src={country.flagUrl}
                          alt={country.name}
                          style={{ width: 30, height: 20, objectFit: "cover", borderRadius: 4 }}
                        />
                      ) : (
                        <div style={{ width: 30, height: 20, background: "#eee", borderRadius: 4 }} />
                      )}
                    </td>
                    <td>{country.name}</td>
                    <td><strong>{country.code}</strong></td>
                    <td>{country.currency}</td>
                    <td><strong>{country.currencySymbol}</strong></td>
                    <td>{country.exchangeRate}</td>
                    <td>{country.active === false ? "Inactive" : "Active"}</td>
                    <td>{country.isDefault ? "✓ Default" : "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "12px",
                        }}
                        className="td_btnrm"
                      >
                        <button
                          onClick={() => handleEdit(country)}
                          className="btn_edit"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(country._id || country.id)}
                          className="btn_remove"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && countries.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>No countries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {countries.length > ITEMS_PER_PAGE && (
          <div className="x_pagination">
            <button
              className={`x_pagination-item ${currentPage === 1 ? "x_active" : ""}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>

            {currentPage > 3 && (
              <span className="x_pagination-dots">...</span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page !== 1 &&
                  page !== totalPages &&
                  page >= currentPage - 1 &&
                  page <= currentPage + 1
              )
              .map((page) => (
                <button
                  key={page}
                  className={`x_pagination-item ${currentPage === page ? "x_active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

            {currentPage < totalPages - 2 && (
              <span className="x_pagination-dots">...</span>
            )}

            {totalPages > 1 && (
              <button
                className={`x_pagination-item ${currentPage === totalPages ? "x_active" : ""}`}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            )}
          </div>
        )}

      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Country"
        message="Are you sure you want to delete this country?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Countries;
