import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import adminClient from "../../../api/adminClient";
import Modal from "../../components/Modal";
import CustomDropdown from "../../components/CustomDropdown";

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    excerpt: "",
    category: "trends",
    introduction: "",
    quote: "",
    sections: [{ heading: "", body: "" }],
    tips: [""],
    images: [],
  });

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await adminClient.get("/content/blogs", { params: { page: 1, limit: 20 } });
        setBlogs(Array.isArray(res.data.items) ? res.data.items : []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load blogs";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFormData((prev) => ({ ...prev, sections: newSections }));
    // Clear section error as user types
    if (fieldErrors.sections?.[index]?.[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        const newSectionErrors = [...(prev.sections || [])];
        if (newSectionErrors[index]) {
          const newS = { ...newSectionErrors[index] };
          delete newS[field];
          newSectionErrors[index] = Object.keys(newS).length > 0 ? newS : null;
        }
        newErrors.sections = newSectionErrors;
        return newErrors;
      });
    }
  };

  const handleTipsChange = (index, value) => {
    const newTips = [...formData.tips];
    newTips[index] = value;
    setFormData((prev) => ({ ...prev, tips: newTips }));
    // Clear tip error as user types
    if (fieldErrors.tips?.[index]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        const newTipErrors = [...(prev.tips || [])];
        newTipErrors[index] = null;
        newErrors.tips = newTipErrors;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.author.trim()) errors.author = "Author is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.excerpt.trim()) errors.excerpt = "Excerpt is required";
    if (!formData.introduction.trim()) errors.introduction = "Introduction is required";
    
    if (formData.images.length === 0) {
      errors.images = "At least one image is required";
    }

    const sectionErrors = formData.sections.map((s) => {
      const sErr = {};
      if (!s.heading.trim()) sErr.heading = "Heading is required";
      if (!s.body.trim()) sErr.body = "Body is required";
      return Object.keys(sErr).length > 0 ? sErr : null;
    });

    if (sectionErrors.some(e => e !== null)) {
      errors.sections = sectionErrors;
    }

    const tipErrors = formData.tips.map((t) => {
      if (!t.trim()) return "Tip is required";
      return null;
    });

    if (tipErrors.some(e => e !== null)) {
      errors.tips = tipErrors;
    }

    setFieldErrors(errors);
    
    // If there are errors, set a general error message
    if (Object.keys(errors).length > 0) {
      setError("Please fix the errors in the form before submitting.");
      return false;
    }
    
    return true;
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, { heading: "", body: "" }],
    }));
  };

  const removeSection = (index) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const addTip = () => {
    setFormData((prev) => ({
      ...prev,
      tips: [...prev.tips, ""],
    }));
  };

  const removeTip = (index) => {
    setFormData((prev) => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError("");
      setFieldErrors({});
      if (editingId) {
        const res = await adminClient.put(`/content/blogs/${editingId}`, formData);
        setBlogs((prev) => prev.map((b) => (b._id === editingId ? res.data.item : b)));
      } else {
        const res = await adminClient.post("/content/blogs", formData);
        setBlogs((prev) => [res.data.item, ...prev]);
      }
      resetForm();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save blog";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      excerpt: "",
      category: "trends",
      introduction: "",
      quote: "",
      sections: [{ heading: "", body: "" }],
      tips: [""],
      images: [],
    });
    setEditingId(null);
    setShowModal(false);
    setFieldErrors({});
    setError("");
  };

  const handleEdit = (blog) => {
    setFormData({
      title: blog.title || "",
      author: blog.author || "",
      excerpt: blog.excerpt || "",
      category: blog.category || "trends",
      introduction: blog.introduction || "",
      quote: blog.quote || "",
      sections: Array.isArray(blog.sections) && blog.sections.length ? blog.sections : [{ heading: "", body: "" }],
      tips: Array.isArray(blog.tips) && blog.tips.length ? blog.tips : [""],
      images: Array.isArray(blog.images) ? blog.images : [],
    });
    setEditingId(blog._id);
    setShowModal(true);
    setFieldErrors({});
    setError("");
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
      await adminClient.delete(`/content/blogs/${deletingId}`);
      setBlogs((prev) => prev.filter((b) => b._id !== deletingId));
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete blog";
      setError(msg);
    } finally {
      setLoading(false);
    }
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: '#2b4d6e' }}>Blog</h1>
          <p style={{ color: "#7f8c8d" }}>Create and manage blog posts</p>
        </div>
        <button
          className="x_btn x_btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FiPlus size={16} /> Create Blog
        </button>
      </div>


      {/* Modal */}
      <div className={`x_modal-overlay ${showModal ? "x_active" : ""}`}>
        <div className="x_modal-content" style={{ maxWidth: "700px" }}>
          <div className="x_modal-header">
            <h2>{editingId ? "Edit Blog Post" : "New Blog Post"}</h2>
            <button className="x_modal-close" onClick={resetForm}>
              <FiX />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="x_modal-body" style={{ maxHeight: "600px", overflowY: "auto" }}>
              {error && <div className="x_alert x_alert-danger" style={{ marginBottom: 15 }}>{error}</div>}
              
              <div className="x_form-group">
                <label className="x_form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className={`x_form-control ${fieldErrors.title ? "is-invalid" : ""}`}
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Blog post title"
                />
                {fieldErrors.title && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.title}</div>}
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Author</label>
                <input
                  type="text"
                  name="author"
                  className={`x_form-control ${fieldErrors.author ? "is-invalid" : ""}`}
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                />
                {fieldErrors.author && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.author}</div>}
              </div>

              <div className="x_form-group">
                <CustomDropdown
                  label="Category"
                  options={[
                    { label: "Trends", value: "trends" },
                    { label: "Styling", value: "styling" },
                    { label: "Heritage", value: "heritage" },
                    { label: "Other", value: "other" }
                  ]}
                  value={formData.category}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, category: val }));
                    if (fieldErrors.category) {
                      setFieldErrors(prev => {
                        const newE = { ...prev };
                        delete newE.category;
                        return newE;
                      });
                    }
                  }}
                />
                {fieldErrors.category && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.category}</div>}
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Excerpt</label>
                <textarea
                  name="excerpt"
                  className={`x_form-control ${fieldErrors.excerpt ? "is-invalid" : ""}`}
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Short summary"
                />
                {fieldErrors.excerpt && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.excerpt}</div>}
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Introduction</label>
                <textarea
                  name="introduction"
                  className={`x_form-control ${fieldErrors.introduction ? "is-invalid" : ""}`}
                  value={formData.introduction}
                  onChange={handleInputChange}
                  placeholder="Blog introduction"
                />
                {fieldErrors.introduction && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.introduction}</div>}
              </div>

              <div className="x_form-group">
                <label className="x_form-label">Quote</label>
                <textarea
                  name="quote"
                  className="x_form-control"
                  value={formData.quote}
                  onChange={handleInputChange}
                  placeholder="Inspirational quote"
                />
              </div>

              {/* Images */}
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #dee2e6" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>
                  Images
                </h3>
                <div className="x_form-group">
                  <label className="x_form-label">Upload Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className={`x_form-control ${fieldErrors.images ? "is-invalid" : ""}`}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setFormData((prev) => ({
                            ...prev,
                            images: [...prev.images, event.target.result],
                          }));
                        };
                        reader.readAsDataURL(file);
                      });
                      // Clear image error
                      if (fieldErrors.images) {
                        setFieldErrors(prev => {
                          const newE = { ...prev };
                          delete newE.images;
                          return newE;
                        });
                      }
                    }}
                  />
                  {fieldErrors.images && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.images}</div>}
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div style={{ marginTop: "15px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#495057", marginBottom: "10px", display: "block" }}>
                      Selected Images ({formData.images.length})
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px" }}>
                      {formData.images.map((image, index) => (
                        <div
                          key={index}
                          style={{
                            position: "relative",
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "80px",
                              objectFit: "cover",
                            }}
                          />
                          <button
                            type="button"
                            className="x_btn x_btn-danger"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index),
                              }));
                            }}
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              padding: "2px 6px",
                              minWidth: "auto",
                            }}
                            title="Delete"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sections */}
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #dee2e6" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>
                  Sections
                </h3>
                {formData.sections.map((section, index) => (
                  <div key={index} style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", border: fieldErrors.sections?.[index] ? "1px solid #e74c3c" : "none" }}>
                    <div className="x_form-group">
                      <label className="x_form-label">Heading</label>
                      <input
                        type="text"
                        className={`x_form-control ${fieldErrors.sections?.[index]?.heading ? "is-invalid" : ""}`}
                        value={section.heading}
                        onChange={(e) => handleSectionChange(index, "heading", e.target.value)}
                        placeholder="Section heading"
                      />
                      {fieldErrors.sections?.[index]?.heading && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.sections[index].heading}</div>}
                    </div>
                    <div className="x_form-group">
                      <label className="x_form-label">Body</label>
                      <textarea
                        className={`x_form-control ${fieldErrors.sections?.[index]?.body ? "is-invalid" : ""}`}
                        value={section.body}
                        onChange={(e) => handleSectionChange(index, "body", e.target.value)}
                        placeholder="Section content"
                      />
                      {fieldErrors.sections?.[index]?.body && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.sections[index].body}</div>}
                    </div>
                    {formData.sections.length > 1 && (
                      <button
                        type="button"
                        className="x_btn x_btn-danger x_btn-sm"
                        onClick={() => removeSection(index)}
                      >
                        <FiX size={14} /> Remove Section
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="x_btn x_btn-secondary x_btn-sm"
                  onClick={addSection}
                  style={{ marginTop: "10px" }}
                >
                  <FiPlus size={14} /> Add Section
                </button>
              </div>

              {/* Tips */}
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #dee2e6" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>
                  Tips
                </h3>
                {formData.tips.map((tip, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="text"
                        className={`x_form-control ${fieldErrors.tips?.[index] ? "is-invalid" : ""}`}
                        value={tip}
                        onChange={(e) => handleTipsChange(index, e.target.value)}
                        placeholder={`Tip ${index + 1}`}
                      />
                      {formData.tips.length > 1 && (
                        <button
                          type="button"
                          className="x_btn x_btn-danger x_btn-sm"
                          onClick={() => removeTip(index)}
                          style={{ minWidth: "45px" }}
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                    {fieldErrors.tips?.[index] && <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "4px" }}>{fieldErrors.tips[index]}</div>}
                  </div>
                ))}
                <button
                  type="button"
                  className="x_btn x_btn-secondary x_btn-sm"
                  onClick={addTip}
                  style={{ marginTop: "10px" }}
                >
                  <FiPlus size={14} /> Add Tip
                </button>
              </div>
            </div>

            <div className="x_modal-footer">
              <button type="button" className="x_btn x_btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="x_btn x_btn-primary">
                {editingId ? "Update" : "Publish"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Blog Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {blogs.map((blog) => (
          <div key={blog._id || blog.id} className="x_blog-card">
            <div className="x_blog-header">
              <span className="x_blog-category">{blog.category}</span>
              <div className="x_blog-actions td_btnrm">
                <button
                  className="btn_edit"
                  onClick={() => handleEdit(blog)}
                  title="Edit"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  className="btn_remove"
                  onClick={() => handleDeleteClick(blog._id || blog.id)}
                  title="Delete"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>

            <h3 className="x_blog-title">{blog.title}</h3>

            {blog.images?.[0] && (
              <img
                src={blog.images[0]}
                alt={blog.title}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              />
            )}

            <div className="x_blog-meta">
              <span>By {blog.author}</span>
            </div>

            <p className="x_blog-excerpt">{blog.excerpt}</p>

            {blog.quote && (
              <div className="x_blog-quote">
                "{blog.quote}"
              </div>
            )}

            <div className="x_blog-tips">
              <strong style={{ fontSize: "12px" }}>Tips:</strong>
              <ul style={{ margin: "5px 0 0 15px", fontSize: "12px" }}>
                {(Array.isArray(blog.tips) ? blog.tips : []).slice(0, 2).map((tip, idx) => (
                  tip && <li key={idx}>{tip}</li>
                ))}
                {(Array.isArray(blog.tips) ? blog.tips : []).filter(t => t).length > 2 && (
                  <li>+{(Array.isArray(blog.tips) ? blog.tips : []).filter(t => t).length - 2} more</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Blog"
        message="Are you sure you want to delete this blog post?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Blog;
