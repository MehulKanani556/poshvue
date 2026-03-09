import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import adminClient from "../../../api/adminClient";
import Modal from "../../components/Modal";
import CustomDropdown from "../../components/CustomDropdown";
import { toast } from "react-toastify";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryPrices, setCountryPrices] = useState({}); // { [countryId]: { price, discountPercent, salePrice } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    images: [],
    colors: [],
    sizes: [],
    category: "",
    rating: "",
    description: "",
    fabric: "",
    manufacturer: "",
    occasion: "",
    washCare: "",
    productType: "",
    work: "",
    stock: "",
    status: "Active",
    length: "",
    breadth: "",
    height: "",
    weight: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorHex, setSelectedColorHex] = useState("#0a2845000");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPriceCountryId, setSelectedPriceCountryId] = useState("");
  const ITEMS_PER_PAGE = 10;

  // Validation state for per-field errors (used by handleSubmit and input handlers)
  const [invalidFields, setInvalidFields] = useState({});

  // Helper to apply error style to inputs
  const getInputErrorStyle = (key) => {
    if (!invalidFields || !invalidFields[key]) return {};
    return {
      borderColor: "#d93025",
      boxShadow: "0 0 0 3px rgba(217,48,37,0.06)",
    };
  };

  // Small helper to render field error under inputs
  const renderFieldError = (key) => {
    if (!invalidFields || !invalidFields[key]) return null;
    return (
      <div style={{ color: "#d93025", fontSize: 12, marginTop: 6 }}>
        {invalidFields[key]}
      </div>
    );
  };

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  console.log(products, 'rrsxd');

  const predefinedColors = [
    { name: "Red", hex: "#FF0000" },
    { name: "Blue", hex: "#0a28450FF" },
    { name: "Green", hex: "#00AA00" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Black", hex: "#0a2845000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Purple", hex: "#800080" },
    { name: "Gray", hex: "#808080" },
  ];

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        setLoading(true);
        setError("");
        const [prodRes, catRes, countryRes] = await Promise.all([
          adminClient.get("/catalog/products", { params: { all: "true" } }),
          adminClient.get("/catalog/categories"),
          adminClient.get("/country/active"),
        ]);
        if (!mounted) return;
        // client returns { data } shape
        const prodData = prodRes.data?.items ?? prodRes.data ?? [];
        const catData = catRes.data?.items ?? catRes.data ?? [];
        const countryData = countryRes.data?.items ?? countryRes.data ?? [];

        // ensure arrays and normalize images/colors
        let normalizedProducts = (Array.isArray(prodData) ? prodData : []).map((p) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
          colors: Array.isArray(p.colors) ? p.colors : [],
        }));

        // sort latest first and keep only the most recently added 12 products
        // normalizedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // normalizedProducts = normalizedProducts.slice(0, 12);

        setProducts(normalizedProducts);
        setCategories(Array.isArray(catData) ? catData : []);
        const countryList = Array.isArray(countryData) ? countryData : [];
        setCountries(countryList);
        // Default selected price country: isDefault one or first active
        setSelectedPriceCountryId((prev) => {
          if (prev) return prev;
          const defaultCountry = countryList.find((c) => c.isDefault) || countryList[0];
          return defaultCountry ? String(defaultCountry._id) : "";
        });
      } catch (err) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      // convert to objects with preview for client-side preview
      const newImages = Array.from(files).map((f) => ({ 
        file: f, 
        preview: URL.createObjectURL(f),
        color: "" // Default empty color
      }));
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newImages],
      }));
      return;
    }

    if (name === "sizes") {
      // allow only digits and commas; remove any other characters immediately
      const cleaned = String(value).replace(/[^0-9,]/g, "");
      // collapse consecutive commas, trim leading/trailing commas
      const normalized = cleaned.replace(/,+/g, ",").replace(/^,|,$/g, "");
      const parts = normalized
        ? normalized.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      setFormData((prev) => ({ ...prev, sizes: parts }));
      // clear sizes validation error when user types
      if (invalidFields.sizes) setInvalidFields((prev) => { const copy = { ...prev }; delete copy.sizes; return copy; });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addColor = (color) => {
    if (!formData.colors.some((c) => c.hex === color.hex)) {
      setFormData((prev) => ({ ...prev, colors: [...prev.colors, color] }));
    }
    setShowColorPicker(false);
  };

  const removeColor = (colorHex) => {
    setFormData((prev) => ({ ...prev, colors: prev.colors.filter((c) => c.hex !== colorHex) }));
  };

  const removeImage = (index) => {
    const item = formData.images[index];
    if (item && item.preview && item.file) {
      URL.revokeObjectURL(item.preview);
    }
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleImageColorChange = (index, color) => {
    setFormData((prev) => {
      const updated = [...prev.images];
      updated[index] = { ...updated[index], color: typeof color === 'string' ? color : color.name };
      return { ...prev, images: updated };
    });
  };

  const handleCountryPriceChange = (countryId, field, value) => {
    setCountryPrices((prev) => {
      const prevEntry = prev[countryId] || { price: "", discountPercent: 0, salePrice: "" };
      let priceVal = parseFloat(prevEntry.price || 0);
      let discountVal = parseFloat(prevEntry.discountPercent || 0);
      let saleVal = prevEntry.salePrice === "" ? "" : parseFloat(prevEntry.salePrice);

      if (field === "price") {
        priceVal = parseFloat(value || 0);
      } else if (field === "discountPercent") {
        discountVal = parseFloat(value || 0);
      } else if (field === "salePrice") {
        saleVal = parseFloat(value || 0);
      }

      const computedSale = Number.isFinite(priceVal)
        ? Number((priceVal - priceVal * (discountVal / 100)).toFixed(2))
        : "";

      return {
        ...prev,
        [countryId]: {
          ...prevEntry,
          price: priceVal,
          discountPercent: discountVal,
          salePrice: field === "salePrice" ? saleVal : computedSale,
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setInvalidFields({});
      // Client-side validation
      const clientErrors = {};
      if (!formData.name || !String(formData.name).trim()) {
        clientErrors["name"] = "Product name is required";
      }
      const stockVal = Number(formData.stock);
      if (!Number.isFinite(stockVal) || stockVal < 0 || formData.stock === "") {
        clientErrors["stock"] = "Enter valid stock quantity (>= 0)";
      }
      // Validate country prices: require at least one price > 0 when countries exist
      const priceEntries = Object.entries(countryPrices || {});
      const hasValidPrice = priceEntries.some(([cid, row]) => Number.isFinite(Number(row.price)) && Number(row.price) > 0);
      if (countries.length > 0 && !hasValidPrice) {
        clientErrors["pricesByCountry"] = "Provide price for at least one country";
      }

      // Validate sizes: each entry must be numeric
      if (Array.isArray(formData.sizes) && formData.sizes.length) {
        const invalidSizes = formData.sizes.filter((s) => !/^\d+$/.test(String(s)));
        if (invalidSizes.length) {
          clientErrors["sizes"] = "Sizes must be numbers separated by commas (e.g., 36,38)";
        }
      }

      if (Object.keys(clientErrors).length) {
        setInvalidFields(clientErrors);
        const msg = Object.values(clientErrors).join(". ");
        toast.error(msg);
        setLoading(false);
        return;
      }

      const payload = { ...formData };

      // Handle images: upload files to AWS S3 first
      const existingItems = (payload.images || []).filter((i) => 
        typeof i === "string" || (i && typeof i === "object" && !i.file)
      );
      const fileItems = (payload.images || []).filter((i) => 
        i && typeof i === "object" && i.file
      );

      // Final images array for payload
      const finalImages = [];

      // Add existing images
      existingItems.forEach(item => {
        if (typeof item === "string") {
          finalImages.push({ url: item, color: "" });
        } else {
          finalImages.push({ url: item.url || item.preview, color: item.color || "" });
        }
      });

      // Upload new images to AWS S3
      for (const fileObj of fileItems) {
        try {
          const formDataForUpload = new FormData();
          formDataForUpload.append('images', fileObj.file);

          const uploadRes = await adminClient.post('/upload/product-images', formDataForUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (uploadRes.data.urls && uploadRes.data.urls.length > 0) {
            // Associated the color from fileObj
            uploadRes.data.urls.forEach(url => {
              finalImages.push({ url, color: fileObj.color || "" });
            });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      }

      payload.images = finalImages;

      // send category as name (backend resolveCategory will convert)
      if (!payload.name && payload.title) payload.name = payload.title;

      // Country-wise pricing payload
      const pricesPayload = Object.entries(countryPrices)
        .map(([cid, val]) => ({
          country: cid,
          price: Number(val.price || 0),
          discountPercent: Number(val.discountPercent || 0),
          salePrice: Number.isFinite(Number(val.salePrice))
            ? Number(val.salePrice)
            : Number(
              (Number(val.price || 0) -
                Number(val.price || 0) * (Number(val.discountPercent || 0) / 100)).toFixed(2)
            ),
        }))
        .filter((row) => row.country && Number.isFinite(row.price));
      payload.pricesByCountry = pricesPayload;

      const path = editingId ? `/catalog/products/${editingId}` : `/catalog/products`;
      const res = editingId ? await adminClient.put(path, payload) : await adminClient.post(path, payload);
      const item = res.data?.item ?? res.data;
      if (item) {
        if (editingId) setProducts((prev) => prev.map((p) => (String(p._id) === String(editingId) ? item : p)));
        else setProducts((prev) => [item, ...prev]);
        setInvalidFields({});
      }
      resetForm();
    } catch (err) {
      // adminClient interceptor already handles error toasts.
      // We only update local error state for UI display if needed.
      const resp = err?.response?.data;
      setError(resp?.message || err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    const editing = {
      id: product._id || null,
      name: product.title || product.name || "",
      images: Array.isArray(product.images) ? product.images.map(img => {
        // If image is already a string URL, wrap it
        if (typeof img === 'string') {
          return { url: img, color: "" };
        }
        // If image is an object { url, color }
        if (img && img.url) {
          return { url: img.url, color: img.color || "" };
        }
        // If image is an object with file property (from a previous edit attempt)
        if (img && img.file) {
          return {
            file: img.file,
            preview: URL.createObjectURL(img.file),
            color: img.color || ""
          };
        }
        return null;
      }).filter(Boolean) : [],
      colors: Array.isArray(product.colors) ? product.colors.slice() : [],
      sizes: Array.isArray(product.sizes) ? product.sizes.slice() : [],
      category: "",
      rating: product.rating ?? "",
      description: product.description ?? "",
      fabric: product.fabric ?? "",
      manufacturer: product.manufacturer ?? "",
      occasion: product.occasion ?? "",
      washCare: product.washCare ?? "",
      productType: product.productType ?? "",
      work: product.work ?? "",
      stock: product.stock ?? "",
      status: product.active === false ? "Inactive" : "Active",
      length: product.length ?? "",
      breadth: product.breadth ?? "",
      height: product.height ?? "",
      weight: product.weight ?? "",
    };

    // determine readable category name for the select (handles populated objects or ids)
    if (Array.isArray(product.categories) && product.categories.length) {
      const first = product.categories[0];
      // if populated object with name
      if (first && typeof first === "object") {
        editing.category = first.name || first.title || "";
      } else {
        // primitive id -> lookup in fetched categories
        const found = categories.find((c) => String(c._id) === String(first));
        if (found) editing.category = found.name;
      }
    } else if (product.category) {
      // fallback when backend returns `category` field
      editing.category = typeof product.category === "object" ? (product.category.name || product.category.title || "") : product.category;
    }

    // Prefill country-wise pricing
    const initialCountryPrices = {};
    if (Array.isArray(product.pricesByCountry)) {
      product.pricesByCountry.forEach((row) => {
        const cid = (row.country && (row.country._id || row.country)) || null;
        if (cid) {
          initialCountryPrices[String(cid)] = {
            price: row.price ?? "",
            discountPercent: row.discountPercent ?? 0,
            salePrice: row.salePrice ?? "",
          };
        }
      });
    }
    setCountryPrices(initialCountryPrices);

    setFormData(editing);
    setEditingId(product._id || product.id);
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
      await adminClient.delete(`/catalog/products/${deletingId}`);
      setProducts((prev) => prev.filter((prod) => String(prod._id) !== String(deletingId)));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('productDeleted', {
        detail: { deletedProductId: deletingId }
      }));

    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const resetForm = () => {
    (formData.images || []).forEach((i) => { if (i && i.preview && i.file) URL.revokeObjectURL(i.preview); });
    setFormData({
      id: null,
      name: "",
      images: [],
      colors: [],
      sizes: [],
      category: "",
      rating: "",
      description: "",
      fabric: "",
      manufacturer: "",
      occasion: "",
      washCare: "",
      productType: "",
      work: "",
      stock: "",
      status: "Active",
      length: "",
      breadth: "",
      height: "",
      weight: "",
    });
    setEditingId(null);
    setShowModal(false);
    setShowColorPicker(false);
  };

  function getCategoryName(product) {
    // if product.categories is populated with objects
    if (Array.isArray(product.categories) && product.categories.length) {
      const first = product.categories[0];
      if (first && typeof first === "object") {
        return first.name || first.title || first.slug || String(first._id) || "";
      }
      // primitive id value
      const id = String(first);
      const found = categories.find((c) => String(c._id) === id);
      return found ? found.name : id;
    }

    // product.category might be an object or a string
    if (product.category && typeof product.category === "object") {
      return product.category.name || product.category.title || "";
    }

    return product.category || "";
  }

  /** Get price for a product in the selected country from pricesByCountry */
  function getPriceForCountry(product, countryId) {
    if (!countryId || !product.pricesByCountry || !Array.isArray(product.pricesByCountry)) return null;
    const id = String(countryId);
    const entry = product.pricesByCountry.find((p) => {
      const c = p.country;
      const cid = c && (typeof c === "object" ? c._id : c);
      return cid && String(cid) === id;
    });
    return entry ? { price: entry.price, salePrice: entry.salePrice } : null;
  }

  const selectedCountry = countries.find((c) => String(c._id) === selectedPriceCountryId);
  const selectedCurrencySymbol = selectedCountry ? selectedCountry.currencySymbol : "";

  return (
    <div>
      {/* Loading / Error state */}
      {loading && (
        <div style={{ marginBottom: "10px", color: "#555" }}>Loading…</div>
      )}
      {error && (
        <div style={{ marginBottom: "10px", color: "#d93025" }}>{error}</div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: '#2b4d6e' }}>
          Products
        </h1>
        <button
          className="x_btn x_btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Modal */}
      <div className={`x_modal-overlay ${showModal ? "x_active" : ""}`} style={{ overflowY: "auto" }}>
        <div className="x_modal-content" style={{ maxWidth: "700px" }}>
          <div className="x_modal-header">
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <button className="x_modal-close" onClick={resetForm}>
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="x_modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Images Section */}
              <div className="x_form-group">
                <label className="x_form-label">
                  Product Images (Multi-Select)
                </label>
                <input
                  type="file"
                  name="images"
                  className="x_form-control"
                  onChange={handleInputChange}
                  accept="image/*"
                  multiple
                />
                {formData.images && formData.images.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "15px",
                      marginTop: "10px",
                    }}
                  >
                    {formData.images.map((img, idx) => {
                      const imgUrl = img.preview || img.url || (typeof img === 'string' ? img : "");
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            padding: "8px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            backgroundColor: "#fcfcfc",
                            width: "120px"
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              height: "100px",
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={`product-img-${idx}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                backgroundColor: "#ff4444",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "22px",
                                height: "22px",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px"
                              }}
                            >
                              ×
                            </button>
                          </div>
                          
                          {/* Color Selection for this Image */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <label style={{ fontSize: "10px", fontWeight: 600, color: "#666" }}>IMAGE COLOR</label>
                            <select
                              className="x_form-control"
                              style={{ 
                                fontSize: "11px", 
                                padding: "4px", 
                                height: "auto",
                                borderColor: img.color ? "#2b4d6e" : "#ddd"
                              }}
                              value={img.color || ""}
                              onChange={(e) => handleImageColorChange(idx, e.target.value)}
                            >
                              <option value="">No Color</option>
                              {formData.colors && formData.colors.map((c) => (
                                <option key={c.hex} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Colors Section */}
              <div className="x_form-group">
                <label className="x_form-label">
                  Colors (Multi-Select with Color Picker)
                </label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <button
                    type="button"
                    className="x_btn x_btn-primary"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    style={{ padding: "8px 12px", fontSize: "14px" }}
                  >
                    Add Color
                  </button>
                </div>

                {showColorPicker && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <div style={{ marginBottom: "10px" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          display: "block",
                          marginBottom: "5px",
                        }}
                      >
                        Select Color:
                      </label>
                      <input
                        type="color"
                        value={selectedColorHex}
                        onChange={(e) => setSelectedColorHex(e.target.value)}
                        style={{
                          width: "50px",
                          height: "40px",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {predefinedColors.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => addColor(color)}
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: color.hex,
                            border: "2px solid #ccc",
                            borderRadius: "4px",
                            cursor: "pointer",
                            title: color.name,
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="x_btn x_btn-primary"
                      onClick={() =>
                        addColor({ name: "Custom", hex: selectedColorHex })
                      }
                      style={{
                        marginTop: "10px",
                        padding: "6px 10px",
                        fontSize: "12px",
                      }}
                    >
                      Add Custom Color
                    </button>
                  </div>
                )}

                {formData.colors && formData.colors.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginTop: "10px",
                      alignItems: "center",
                    }}
                  >
                    {formData.colors.map((color) => (
                      <div
                        key={color.hex}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 10px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "4px",
                          border: `3px solid ${color.hex}`,
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: color.hex,
                            borderRadius: "3px",
                            border: "1px solid #999",
                          }}
                        />
                        <span style={{ fontSize: "13px" }}>{color.name}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(color.hex)}
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#ff0000",
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes Section */}
              <div className="x_form-group">
                <label className="x_form-label">
                  Sizes (comma separated, e.g. 36,38,40)
                </label>
                <input
                  type="text"
                  name="sizes"
                  className="x_form-control"
                  value={Array.isArray(formData.sizes) ? formData.sizes.join(",") : ""}
                  onChange={handleInputChange}
                  style={getInputErrorStyle("sizes")}
                  placeholder="Enter available sizes like 36,38,40"
                />
                {renderFieldError("sizes")}
              </div>

              {/* Basic Product Info */}
              <div className="x_form-group">
                <label className="x_form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  className="x_form-control"
                  value={formData.name}
                  onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); if (invalidFields.name) setInvalidFields(prev => { const copy = { ...prev }; delete copy.name; return copy; }); }}
                  style={getInputErrorStyle("name")}
                  placeholder="Enter product name"
                  required
                />
                {renderFieldError("name")}
              </div>

              <div className="x_form-group">
                <CustomDropdown
                  padding="10px 12px"
                  label="Category"
                  options={categories.map(cat => ({ label: cat.name, value: cat.name }))}
                  value={formData.category}
                  onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  placeholder="Select category"
                  searchable
                />
              </div>

              {/* Pricing Section */}
              <div
                style={{
                  borderTop: "1px solid #ddd",
                  paddingTop: "15px",
                  marginTop: "15px",
                }}
              >
                <h4 style={{ marginBottom: "12px" }}>Pricing & Offers</h4>

              </div>

              {/* Country-wise Pricing & Offers */}
              <div className="x_form-group">
                <label className="x_form-label">Country-wise Pricing & Offers</label>
                {countries.length === 0 && (
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    No active countries found. Please add countries in Countries page.
                  </div>
                )}
                {countries.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {countries.map((c) => {
                      const cid = String(c._id);
                      const row = countryPrices[cid] || { price: "", discountPercent: 0, salePrice: "" };
                      return (
                        <div key={cid} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr", gap: "10px", alignItems: "center" }}>
                          <div style={{ fontWeight: 600, color: "#2b4d6e" }}>
                            {c.name} ({c.currencySymbol})
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            className="x_form-control"
                            value={row.price}
                            onChange={(e) => handleCountryPriceChange(cid, "price", e.target.value)}
                            style={getInputErrorStyle(`price_${cid}`)}
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Discount %"
                            className="x_form-control"
                            value={row.discountPercent === 0 ? "" : row.discountPercent}
                            onChange={(e) =>
                              handleCountryPriceChange(
                                cid,
                                "discountPercent",
                                e.target.value
                              )
                            }
                            style={getInputErrorStyle(`discountPercent_${cid}`)}
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Sale Price"
                            className="x_form-control"
                            value={row.salePrice}
                            onChange={(e) => handleCountryPriceChange(cid, "salePrice", e.target.value)}
                            style={getInputErrorStyle(`salePrice_${cid}`)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stock & Status */}
              <div
                style={{
                  borderTop: "1px solid #ddd",
                  paddingTop: "15px",
                  marginTop: "15px",
                }}
              >
                <h4 style={{ marginBottom: "12px" }}>Stock & Status</h4>

                <div className="x_form-group">
                  <label className="x_form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    className="x_form-control"
                    value={formData.stock}
                    onChange={(e) => { setFormData(prev => ({ ...prev, stock: e.target.value })); if (invalidFields.stock) setInvalidFields(prev => { const copy = { ...prev }; delete copy.stock; return copy; }); }}
                    style={getInputErrorStyle("stock")}
                    placeholder="Enter stock quantity"
                    required
                  />
                  {renderFieldError("stock")}
                </div>

                <div className="x_form-group">
                  <CustomDropdown
                    padding="10px 12px"
                    label="Status"
                    options={[
                      { label: "Active", value: "Active" },
                      { label: "Inactive", value: "Inactive" },
                      { label: "Out of Stock", value: "Out of Stock" }
                    ]}
                    value={formData.status}
                    onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                  />
                </div>
              </div>

              {/* Product Information */}
              <div
                style={{
                  borderTop: "1px solid #ddd",
                  paddingTop: "15px",
                  marginTop: "15px",
                }}
              >
                <h4 style={{ marginBottom: "12px" }}>Product Information</h4>

                <div className="x_form-group">
                  <label className="x_form-label">Product Description</label>
                  <textarea
                    name="description"
                    className="x_form-control"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter detailed product description"
                    rows="3"
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Fabric</label>
                  <input
                    type="text"
                    name="fabric"
                    className="x_form-control"
                    value={formData.fabric}
                    onChange={handleInputChange}
                    placeholder="e.g., Cotton, Polyester, Silk"
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Manufacturer Name</label>
                  <input
                    type="text"
                    name="manufacturer"
                    className="x_form-control"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="Enter manufacturer name"
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Occasion</label>
                  <input
                    type="text"
                    name="occasion"
                    className="x_form-control"
                    value={formData.occasion}
                    onChange={handleInputChange}
                    placeholder="e.g., Daily Wear, Formal, Casual"
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Wash Care</label>
                  <textarea
                    name="washCare"
                    className="x_form-control"
                    value={formData.washCare}
                    onChange={handleInputChange}
                    placeholder="Enter care instructions"
                    rows="2"
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Product Type</label>
                  <input
                    type="text"
                    name="productType"
                    className="x_form-control"
                    value={formData.productType}
                    onChange={handleInputChange}
                    placeholder="e.g., T-Shirt, Jeans, Dress"
                  />
                </div>

                <div className="x_form-group">
                  <label className="x_form-label">Work/Design Details</label>
                  <input
                    type="text"
                    name="work"
                    className="x_form-control"
                    value={formData.work}
                    onChange={handleInputChange}
                    placeholder="e.g., Embroidered, Printed, Solid"
                  />
                </div>

                {/* Package Dimensions for Shipping */}
                <div
                  style={{
                    borderTop: "1px solid #ddd",
                    paddingTop: "15px",
                    marginTop: "15px",
                  }}
                >
                  <h4 style={{ marginBottom: "12px" }}>Package Dimensions (for Shipping)</h4>

                  <div className="x_form-group">
                    <label className="x_form-label">Length (cm)</label>
                    <input
                      type="number"
                      name="length"
                      className="x_form-control"
                      value={formData.length}
                      onChange={handleInputChange}
                      placeholder="e.g., 10"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="x_form-group">
                    <label className="x_form-label">Breadth (cm)</label>
                    <input
                      type="number"
                      name="breadth"
                      className="x_form-control"
                      value={formData.breadth}
                      onChange={handleInputChange}
                      placeholder="e.g., 10"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="x_form-group">
                    <label className="x_form-label">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      className="x_form-control"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="e.g., 5"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="x_form-group">
                    <label className="x_form-label">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      className="x_form-control"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.5"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
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

      {/* Table */}
      {/* Table Section */}

      <style>
        {`
       .x_table-wrapper {
           max-width: 89vw;
           overflow-x: auto; 
           background: #ffffff;
           box-shadow: 0 2px 10px rgba(0,0,0,0.08);
           border: 1px solid #e0e0e0;
       }
       
       
       .x_table-wrapper::-webkit-scrollbar {
           height: 6px;
       }
       .x_table-wrapper::-webkit-scrollbar-track {
           background: #f1f1f1;
       }
       .x_table-wrapper::-webkit-scrollbar-thumb {
           background: #ccc;
           border-radius: 10px;
       }
       .x_table-wrapper::-webkit-scrollbar-thumb:hover {
           background: #aaa;
       }
      
       .x_data-table {
           width: 100%;
           min-width: 1000px; 
           border-collapse: collapse;
           text-align: left;
       }
       
       .x_data-table th {
           background-color: #f8f9fa;
           padding: 15px 12px;
           font-weight: 600;
           color: #2b4d6e;
           border-bottom: 2px solid #dee2e6;
           white-space: nowrap;
       }
       
       .x_data-table td {
           padding: 12px;
           border-bottom: 1px solid #eee;
           vertical-align: middle;
           color: #444;
       }
       .x_data-table tbody tr:hover {
           background-color: #fcfcfc;
       }

       @media (max-width: 1350px) and (min-width: 769px) {
           .x_table-wrapper {
           max-width: calc(100vw - 360px); 
          }
          }
       `}
      </style>
      {/* Table Section */}
      <div className="x_card ">
        <div className="x_card-body">
          <div className="x_table-wrapper">
            <table className="x_data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ whiteSpace: "nowrap" }}>Price</span>
                      <div style={{ minWidth: "auto" }}>
                        <CustomDropdown
                          options={countries.map((c) => ({ label: `${c.name} (${c.currencySymbol})`, value: String(c._id) }))}
                          value={selectedPriceCountryId}
                          onChange={(val) => setSelectedPriceCountryId(val)}
                          placeholder="Select country"
                          searchable
                          padding="4px 10px"
                        />
                      </div>
                    </div>
                  </th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Colors</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product) =>
                (<tr key={product._id}>
                  {/* Product Image & Name */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? typeof product.images[0] === 'string'
                              ? product.images[0]
                              : product.images[0].preview || product.images[0].url || "https://via.placeholder.com/45"
                            : "https://via.placeholder.com/45"
                        }
                        alt={product.title || "Product"}
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid #eee",
                        }}
                        onError={(e) => {
                          console.log('Image load error:', product.images[0]);
                          e.target.src = "https://via.placeholder.com/45";
                        }}
                      />
                      <span style={{ fontWeight: "500" }}>{product.title || product.name || "Unnamed"}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td>{getCategoryName(product)}</td>

                  {/* Price */}
                  <td>
                    <div style={{ lineHeight: "1.2" }}>
                      {(() => {
                        const priceInfo = getPriceForCountry(product, selectedPriceCountryId);
                        if (!priceInfo) {
                          return (
                            <div style={{ fontWeight: "500", color: "#888" }}>—</div>
                          );
                        }
                        const displayPrice = priceInfo.salePrice != null ? priceInfo.salePrice : priceInfo.price;
                        return (
                          <div style={{ fontWeight: "700", color: "#2b4d6e", textAlign: "center" }}>
                            {selectedCurrencySymbol}{typeof displayPrice === "number" ? displayPrice.toFixed(2) : displayPrice}
                          </div>
                        );
                      })()}
                    </div>
                  </td>

                  {/* Stock */}
                  <td style={{ fontWeight: "500" }}>{product.stock}</td>

                  {/* Status */}
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: product.active ? "#e6f4ea" : "#feeaee",
                        color: product.active ? "#1e7e34" : "#d93025",
                      }}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Colors */}
                  <td>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {product.colors.map((c, i) => (
                        <div
                          key={i}
                          title={c.name}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: c.hex,
                            border: "1px solid #ddd",
                            boxShadow: "inset 0 0 2px rgba(0,0,0,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "center" }}>
                    <div
                      className="td_btnrm"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "12px",
                      }}
                    >
                      <button
                        onClick={() => handleEdit(product)}
                        className="btn_edit"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product._id)}
                        className="btn_remove"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {products.length > ITEMS_PER_PAGE && (
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
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default Products;
