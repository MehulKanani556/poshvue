import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import client from "../../api/client";
import Modal from "../../components/Modal";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    status: "Active",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCategories = categories.slice(startIndex, endIndex);

  // Ensure currentPage stays within bounds when categories change
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(categories.length / ITEMS_PER_PAGE));
    if (currentPage > tp) setCurrentPage(tp);
  }, [categories.length]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/catalog/categories", { params: { page: 1, limit: 50 } });
        setCategories(Array.isArray(res.data.items) ? res.data.items : []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load categories";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", image: null, status: "Active" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      if (editingId) {
        const res = await client.put(`/catalog/categories/${editingId}`, formData);
        setCategories((prev) => prev.map((c) => (c._id === editingId ? res.data.item : c)));
      } else {
        const res = await client.post("/catalog/categories", formData);
        setCategories((prev) => [res.data.item, ...prev]);
      }
      resetForm();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save category";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || "",
      description: category.description || "",
      image: category.image || null,
      status: category.active === false ? "Inactive" : "Active",
    });
    setEditingId(category._id);
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
      await client.delete(`/catalog/categories/${deletingId}`);
      setCategories((prev) => prev.filter((c) => c._id !== deletingId));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete category";
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
        alignItems: "center", marginBottom: 20,
        color: '#2b4d6e' 
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Categories</h1>
        </div>
        <button
          className="x_btn x_btn-primary"
          onClick={() => setShowModal(true)}
        >
          <FiPlus size={16} /> New Category
        </button>
      </div>
      {error && <div className="x_alert x_alert-danger" style={{ marginBottom: 12 }}>{error}</div>}



      {/* Modal */}
      <div className={`x_modal-overlay ${showModal ? "x_active" : ""}`}>
        <div className="x_modal-content" style={{ maxWidth: "600px" }}>
          <div className="x_modal-header">
            <h2>{editingId ? "Edit Category" : "New Category"}</h2>
            <button className="x_modal-close" onClick={resetForm}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="x_modal-body">
              <div className="x_form-group">
                <label className="x_form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  className="x_form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Category name"
                  required
                />
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Description</label>
                <textarea
                  name="description"
                  className="x_form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Short description"
                />
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Image URL</label>
                <input
                  type="url"
                  name="image"
                  className="x_form-control"
                  value={formData.image || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Status</label>
                <select
                  name="status"
                  className="x_form-select"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentCategories.map((category) => (
                  <tr key={category._id || category.id}>
                    <td>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, background: "#eee", borderRadius: 6 }} />
                      )}
                    </td>
                    <td>{category.name}</td>
                    <td>{category.description}</td>
                    <td>{category.active === false ? "Inactive" : "Active"}</td>
                    <td style={{ textAlign: "center" }}>
                      {/* <button className="x_btn x_btn-primary x_btn-sm" onClick={() => handleEdit(category)}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="x_btn x_btn-danger x_btn-sm" onClick={() => handleDelete(category._id || category.id)} style={{ marginLeft: 8 }}>
                        <FiTrash2 size={14} />
                      </button> */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "12px",
                        }}
                        className="td_btnrm"
                      >
                        <button
                          onClick={() => handleEdit(category)}
                         className="btn_edit"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category._id || category.id)}
                          className="btn_remove"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>No categories found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Pagination */}
        {categories.length > ITEMS_PER_PAGE && (
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
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Categories;
