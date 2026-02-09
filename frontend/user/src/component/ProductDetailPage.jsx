import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Accordion,
  Modal,
  Tabs,
  Tab,
  Table,
} from "react-bootstrap";
import {
  FaHeart,
  FaShoppingBag,
  FaTruck,
  FaUndo,
  FaGlobe,
  FaRulerHorizontal,
  FaCheckCircle,
  FaChevronRight,
  FaWhatsapp,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaInfoCircle,
} from "react-icons/fa";
import SimiliarPro from "./SimiliarPro";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import Loader from "./Loader";

function ProductDetailPageComponent() {}

const ProductDetailPage = () => {
  const { id } = useParams(); // product id from route
  const navigate = useNavigate();
  const { formatPrice: formatPriceWithCurrency, selectedCountry } = useCurrency(); // Add selectedCountry to trigger re-render
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [justAdded, setJustAdded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when country changes
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const token = localStorage.getItem("userToken");
  
  // Listen for country changes and force re-render
  useEffect(() => {
    const handleCountryChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('countryChanged', handleCountryChange);
    return () => window.removeEventListener('countryChanged', handleCountryChange);
  }, []);

  // moved hooks: ensure hooks run in same order on every render
  const [selectedSize, setSelectedSize] = useState("40");
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  // Size Guide modal state
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const handleCloseSizeGuide = () => setShowSizeGuide(false);
  const handleShowSizeGuide = () => setShowSizeGuide(true);

  // default fallback (kept from original file for graceful fallback)
  const defaultProduct = {
    name: "Off White Silk Palazzo Suit",
    subtitle: "Resham Embellished Festive Collection",
    sku: "AS3545707",
    price: 10800,
    originalPrice: 13500,
    discount: "20% OFF",
    images: [
      "https://i.pinimg.com/1200x/88/69/9d/88699d2875d327baaf58c43dba07c8e7.jpg",
      "https://i.pinimg.com/1200x/a3/98/80/a3988042bc2db166bffa94c4ff8edee1.jpg",
      "https://i.pinimg.com/1200x/cc/99/d9/cc99d9dd2b1eb9006a6d7007784c73b1.jpg",
    ],
    sizes: ["36", "38", "40", "42", "44"],
    description:
      "Experience elegance with this Off White Silk Palazzo Suit. The rich silk fabric is adorned with delicate Resham embroidery, offering a perfect blend of tradition and modernity for any celebratory occasion.",
    specifications: [
      { label: "Fabric", value: "Pure Silk" },
      { label: "Work", value: "Handcrafted Resham" },
      { label: "Occasion", value: "Festive, Wedding" },
      { label: "Set Includes", value: "Kurta, Palazzo & Dupatta" },
    ],
  };

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      if (!id) {
        setProduct(defaultProduct);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await client.get(`/catalog/products/${id}`);
        const data = res.data?.item ?? res.data;
        if (!mounted) return;

        // normalize and set defaults for size/color
        const prod = data || defaultProduct;
        setProduct(prod);

        const availableSizes =
          Array.isArray(prod.sizes) && prod.sizes.length
            ? prod.sizes
            : defaultProduct.sizes;
        if (availableSizes.length) {
          setSelectedSize(availableSizes[0]);
        }

        const availableColors =
          Array.isArray(prod.colors) && prod.colors.length ? prod.colors : [];
        if (availableColors.length === 1) {
          setSelectedColor(availableColors[0]);
        } else {
          setSelectedColor(null);
        }

        // new product load -> reset local added flag
        setJustAdded(false);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Failed to load product");
        setProduct(defaultProduct);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  // fetch cart to check if current selection already added
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("userToken");
    if (!token) {
      setCartItems([]);
      return;
    }
    (async () => {
      try {
        const res = await client.get("/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        // Handle both response formats: { items: [] } or direct array
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setCartItems(items);
      } catch (err) {
        console.error("Cart fetch error:", err);
        if (mounted) setCartItems([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]); // Re-fetch when product ID changes

  // Fetch wishlist
  useEffect(() => {
    let mounted = true;
    if (!token) {
      setWishlistIds([]);
      return;
    }
    (async () => {
      try {
        const res = await client.get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        const ids = res.data?.items?.map((i) => i.product._id || i.product) || [];
        setWishlistIds(ids);
      } catch (err) {
        // user not logged in or empty wishlist
        if (mounted) setWishlistIds([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, token]);

  // Toggle wishlist
  const toggleWishlist = async () => {
    if (!token) {
      toast.warning("Please login to add items to wishlist");
      navigate("/register");
      return;
    }

    const productId = product?._id || product?.id || id;
    if (!productId) return;

    try {
      setWishlistLoading(true);
      await client.post(
        "/wishlist/toggle",
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const isInWishlist = wishlistIds.includes(productId);
      setWishlistIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );

      if (isInWishlist) {
        toast.success("Removed from wishlist");
      } else {
        toast.success("Added to wishlist");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Please login to use wishlist");
        navigate("/register");
      } else {
        toast.error(err?.response?.data?.message || "Something went wrong");
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  // Normalize color to string for comparison (case-insensitive)
  const colorKey = (c) => {
    if (!c) return "";
    if (typeof c === "string") return c.trim().toLowerCase();
    // If object, prefer name over hex (since backend stores name)
    return (c?.name || c?.hex || "").trim().toLowerCase();
  };

  // Re-check cart when size/color changes
  const isAlreadyInCart = useMemo(() => {
    if (!product || !cartItems || cartItems.length === 0) {
      return false;
    }
  
    const currentProductId = String(product._id || product.id || id);
    const currentSize = String(selectedSize || "").trim();
    const currentColorKey = colorKey(selectedColor);
  
    return cartItems.some((item) => {
      // Handle product: could be ObjectId string or populated object
      let itemProductId = "";
      if (typeof item.product === "string") {
        itemProductId = item.product.trim();
      } else if (item.product?._id) {
        itemProductId = String(item.product._id);
      } else if (item.product?.id) {
        itemProductId = String(item.product.id);
      } else if (item.product) {
        itemProductId = String(item.product);
      }
      
      const itemSize = String(item.size || "").trim();
      const itemColorKey = colorKey(item.color); // cart color is string like "Red"
  
      // All three must match: product ID, size, and color
      const productMatch = itemProductId === currentProductId;
      const sizeMatch = itemSize === currentSize;
      const colorMatch = itemColorKey === currentColorKey && itemColorKey !== ""; // Empty colors don't match
      
      // Special case: if no color in product and no color in cart, consider it a match
      const noColorMatch = !currentColorKey && !itemColorKey;
  
      return productMatch && sizeMatch && (colorMatch || noColorMatch);
    });
  }, [product, cartItems, selectedSize, selectedColor, id]);
  
  const isCurrentSelectionInCart = isAlreadyInCart || justAdded;

  const handleAddToBag = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      toast.warning("Please login to add items to cart");
      navigate("/register");
      return;
    }

    if (!selectedSize) {
      toast.warning("Please select a size");
      return;
    }

    const hasColors =
      Array.isArray(product?.colors) && product.colors.length > 0;
    if (hasColors && !selectedColor) {
      toast.warning("Please select a color");
      return;
    }

    const colorToSend = hasColors ? colorKey(selectedColor) : "";

    try {
      setAddingToCart(true);
      await client.post(
        "/cart/add",
        {
          productId: product?._id || product?.id || id,
          qty: 1,
          size: selectedSize,
          color: colorToSend,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // સફળતાપૂર્વક એડ થયા પછી:
      setJustAdded(true);

      // લેટેસ્ટ કાર્ટ ડેટા ફેચ કરો જેથી બટન તરત 'Already in Cart' થઈ જાય
      try {
        const res = await client.get("/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setCartItems(items);
      } catch (fetchErr) {
        console.error("Failed to refresh cart:", fetchErr);
      }

      // alert("Added to cart");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading product..." />;
  }

  const sizeChart = [
    {
      size: "36",
      bust: 88,
      waist: 70,
      hip: 94,
      kurtaLength: 92,
      palazzoLength: 100,
    },
    {
      size: "38",
      bust: 92,
      waist: 74,
      hip: 98,
      kurtaLength: 93,
      palazzoLength: 101,
    },
    {
      size: "40",
      bust: 96,
      waist: 78,
      hip: 102,
      kurtaLength: 94,
      palazzoLength: 102,
    },
    {
      size: "42",
      bust: 100,
      waist: 82,
      hip: 106,
      kurtaLength: 95,
      palazzoLength: 103,
    },
    {
      size: "44",
      bust: 104,
      waist: 86,
      hip: 110,
      kurtaLength: 96,
      palazzoLength: 104,
    },
  ];

  // --- added: normalize image list and safe helpers to avoid runtime errors ---
  const images =
    product?.images && product.images.length
      ? product.images
      : product?.image
      ? [product.image]
      : defaultProduct.images;

  // Use currency context for formatting prices
  const formatPrice = formatPriceWithCurrency;
  // --- end additions ---

  // --- map dynamic backend fields into a unified display object ---
  const displayProduct = (() => {
    const name = product?.title || product?.name || defaultProduct.name;

    const subtitle =
      (product?.productType &&
        `${product.productType}${
          product?.manufacturer ? ` • ${product.manufacturer}` : ""
        }`) ||
      product?.subtitle ||
      defaultProduct.subtitle;

    const priceNow =
      product?.salePrice ?? product?.price ?? defaultProduct.price;

    const priceWas = (() => {
      // if discountPercent present, assume original price is price and sale is salePrice
      if (product?.discountPercent && (product?.price || product?.salePrice)) {
        return product.price ?? product.salePrice;
      }
      if (product?.originalPrice) return product.originalPrice;
      return defaultProduct.originalPrice;
    })();

    const discountLabel =
      (product?.discountPercent
        ? `${product.discountPercent}% OFF`
        : product?.discount) || defaultProduct.discount;

    const description = product?.description || defaultProduct.description;

    const specs = (() => {
      const s = [];
      if (product?.fabric) s.push({ label: "Fabric", value: product.fabric });
      if (product?.work) s.push({ label: "Work", value: product.work });
      if (product?.occasion)
        s.push({ label: "Occasion", value: product.occasion });
      if (product?.productType)
        s.push({ label: "Product Type", value: product.productType });
      if (product?.manufacturer)
        s.push({ label: "Manufacturer", value: product.manufacturer });
      if (product?.washCare)
        s.push({ label: "Wash Care", value: product.washCare });
      if (product?.categories?.length) {
        const catText = product.categories
          .map((c) => c?.name || c?.title || c)
          .join(", ");
        s.push({ label: "Categories", value: catText });
      }
      return s.length
        ? s
        : product?.specifications || defaultProduct.specifications;
    })();

    // simple breadcrumb pieces: Category > ProductType > Title
    const primaryCategory =
      product?.categories?.[0]?.name ||
      product?.categories?.[0]?.title ||
      product?.categoryName ||
      product?.category ||
      "Collection";

    return {
      name,
      subtitle,
      priceNow,
      priceWas,
      discountLabel,
      description,
      specifications: specs,
      primaryCategory,
    };
  })();
  // --- end dynamic mapping ---

  return (
    <div className="g3-pdp-wrapper">
      <Container className="g3-main-content py-lg-5 py-3">
        {/* BREADCRUMB */}
        <nav className="g3-breadcrumb mb-lg-4 mb-3">
          <span 
            className="g3-breadcrumb-link" 
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Home
          </span>{" "}
          <FaChevronRight size={7} />{" "}
          <span 
            className="g3-breadcrumb-link" 
            onClick={() => {
              // Use productType if available (for Style filter), otherwise use primaryCategory
              const filterValue = product?.productType || displayProduct.primaryCategory;
              navigate(`/ShopPage?style=${encodeURIComponent(filterValue)}`);
            }}
            style={{ cursor: "pointer" }}
          >
            {displayProduct.primaryCategory}
          </span>{" "}
          <FaChevronRight size={7} /> <span>{displayProduct.name}</span>
        </nav>

        <Row className="gx-lg-5 gy-4">
          {/* LEFT: IMAGE SECTION */}
          <Col lg={7} md={12} className="pe-lg-3">
            <div className="g3-sticky-image-container">
              <Row className="gx-3">
                <Col md={2} className="d-none d-md-block pe-2">
                  <div className="g3-thumb-stack">
                    {images.map((img, i) => (
                      <div
                        key={i}
                        className={`g3-thumb-wrapper ${
                          activeImg === i ? "active" : ""
                        }`}
                        onMouseEnter={() => setActiveImg(i)}
                      >
                        <img src={img} alt={`view-${i}`} />
                      </div>
                    ))}
                  </div>
                </Col>

                <Col md={10} xs={12}>
                  <div className="g3-main-viewport">
                    <img
                      src={images[activeImg] || images[0]}
                      alt={product?.name || "product"}
                      className="g3-featured-img"
                    />
                    <div className="g3-mobile-dots d-md-none">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`dot ${activeImg === i ? "active" : ""}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="g3-mobile-thumbs d-flex d-md-none overflow-auto mt-3 gap-2 pb-2">
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        className={`g3-m-thumb ${
                          activeImg === i ? "active" : ""
                        }`}
                        onClick={() => setActiveImg(i)}
                        alt="thumb"
                      />
                    ))}
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          {/* RIGHT: DETAILS SECTION */}
          <Col lg={5} md={12}>
            <div className="g3-details-sidebar">
              <header className="mb-4">
                <h1 className="g3-product-name">{displayProduct.name}</h1>
                <p className="g3-product-subtitle">{displayProduct.subtitle}</p>
                <div className="g3-price-container mt-3">
                  <span className="g3-price-now">
                    {formatPrice(displayProduct.priceNow)}
                  </span>
                  <span className="g3-price-was ms-3">
                    {formatPrice(displayProduct.priceWas)}
                  </span>
                  <span className="g3-discount-pill ms-2">
                    {displayProduct.discountLabel || ""}
                  </span>
                </div>
              </header>

              <hr className="my-4" />

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold small tracking-wider">
                    SELECT SIZE
                  </span>
                  <button
                    className="g3-link-btn small border-0 bg-transparent text-decoration-underline"
                    onClick={handleShowSizeGuide}
                  >
                    <FaRulerHorizontal className="me-1" /> SIZE CHART
                  </button>
                </div>
                <div className="g3-size-grid">
                  {(
                    (Array.isArray(product?.sizes) && product.sizes.length
                      ? product.sizes
                      : defaultProduct.sizes) || []
                  ).map((size) => (
                    <button
                    key={size}
                    className={`g3-size-pill ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSize(size);
                      setJustAdded(false); // અહિયાં રીસેટ થશે એટલે બટન પાછું "Add to Bag" થઈ જશે જો નવી સાઈઝ કાર્ટમાં ન હોય તો
                    }}
                  >
                    {size}
                  </button>
                  
                
                  ))}
                </div>
              </div>

              {/* COLOR SELECT (if any colors available) */}
              {Array.isArray(product?.colors) && product.colors.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold small tracking-wider">
                      SELECT COLOR
                    </span>
                  </div>
                  <div className="g3-color-grid d-flex flex-wrap gap-2">
                    {product.colors.map((c, idx) => {
                      const isActive =
                        selectedColor &&
                        selectedColor.hex === c.hex &&
                        selectedColor.name === c.name;
                      return (
                        <button  
                          key={idx}
                          className={`g3-color-pill ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() => {
                            setSelectedColor(c);
                            setJustAdded(false);
                          }}
                        >
                          <span
                            className="g3-color-dot"
                            style={{ backgroundColor: c.hex || "#0a2845" }}
                          />
                          <span className="ms-1">{c.name || "Color"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="g3-cta-row mb-4">
                <Button
                  className="g3-btn-cart"
                  disabled={addingToCart || isCurrentSelectionInCart}
                  onClick={handleAddToBag}
                >
                  <FaShoppingBag className="me-2" />{" "}
                  {isCurrentSelectionInCart
                    ? "ALREADY IN BAG"
                    : addingToCart
                    ? "ADDING..."
                    : "ADD TO BAG"}
                </Button>
                <Button 
                  variant="outline-dark" 
                  className="g3-btn-wish"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                >
                  <FaHeart 
                    style={{ 
                      color: wishlistIds.includes(product?._id || product?.id || id) ? "#d9534f" : "inherit",
                      fill: wishlistIds.includes(product?._id || product?.id || id) ? "#d9534f" : "#0e0e0e"
                    }} 
                  />
                </Button>
              </div>

              <div className="g3-perks-box p-3 mb-4">
                <Row className="g-0 text-center align-items-center">
                  <Col>
                    <FaUndo className="mb-1 d-block mx-auto text-muted" />
                    <small className="d-block">Easy Returns</small>
                  </Col>
                  <Col className="border-start border-end">
                    <FaGlobe className="mb-1 d-block mx-auto text-muted" />
                    <small className="d-block">World Wide Shipping</small>
                  </Col>
                  <Col>
                    <FaCheckCircle className="mb-1 d-block mx-auto text-muted" />
                    <small className="d-block">Made in India</small>
                  </Col>
                </Row>
              </div>

              <div className="g3-shipping-info mb-4">
                <h6 className="fw-bold small mb-3">
                  Shipping and Delivery Details
                </h6>
                <div className="d-flex align-items-start mb-2 small text-muted">
                  <FaClock className="me-2 mt-1 flex-shrink-0" />
                  <span>
                    Additional 5 - 6 business days is required for delivery.
                  </span>
                </div>
                <div className="d-flex align-items-start small text-muted">
                  <FaTruck className="me-2 mt-1 flex-shrink-0" />
                  <span>
                    Plus Size Extra 5 - 10 business days is required for
                    delivery.
                  </span>
                </div>
              </div>

              <div className="g3-promo-banner p-4 text-center mb-4">
                <p className="mb-1 tracking-widest small">
                  WANT TO <strong>SHOP</strong>
                </p>
                <h4 className="fw-bold mb-2" style={{color:"#0a2845"}}>PREMIUM STORE COLLECTION?</h4>
                <p className="mb-3 small">SHIP IN 48H</p>
                <button
                  className="rounded-0 px-4 py-2 small fw-bold z_poster_btn"
                  onClick={() =>
                    window.open(
                      `https://wa.me/918200986329?text=${encodeURIComponent(
                        `Hi Poshvue, I would like to book a live video call to shop the premium collection. Product: "${displayProduct.name}"`
                      )}`,
                      "_blank"
                    )
                  }
                >
                  BOOK A LIVE VIDEO CALL
                </button>
              </div>

              <div className="g3-support-section mb-4">
                <h6 className="fw-bold small mb-3">Customer Support</h6>
                <Row className="g-2">
                  <Col xs={4}>
                    <button
                      className="g3-support-btn w-100"
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://wa.me/919974820227?text=${encodeURIComponent(
                            `Hi Poshvue, I have a query about "${displayProduct.name}".`
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <FaWhatsapp className="text-success me-1" /> Chat
                    </button>
                  </Col>
                  <Col xs={4}>
                    <button
                      className="g3-support-btn w-100"
                      type="button"
                      onClick={() =>
                        (window.location.href = "tel:+919974820227")
                      }
                    >
                      <FaPhoneAlt className="text-muted me-1" /> Call us
                    </button>
                  </Col>
                  <Col xs={4}>
                    <button
                      className="g3-support-btn w-100"
                      type="button"
                      onClick={() =>
                        (window.location.href =
                          "mailto:poshvuefashion@gmail.com?subject=Product%20Enquiry&body=" +
                          encodeURIComponent(
                            `Hello Poshvue,%0D%0A%0D%0AI have a question about "${displayProduct.name}".`
                          ))
                      }
                    >
                      <FaEnvelope className="text-danger me-1" /> Mail Us
                    </button>
                  </Col>
                </Row>
              </div>

              <Accordion flush className="g3-pdp-accordion border-top">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Product Description</Accordion.Header>
                  <Accordion.Body className="text-muted small lh-lg">
                    {displayProduct.description}
                    <div className="mt-3">
                      {displayProduct.specifications.map((spec, i) => (
                        <div
                          key={i}
                          className="d-flex justify-content-between border-bottom py-2"
                        >
                          <span className="text-muted">{spec.label}</span>
                          <span className="fw-bold">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Return/ Exchange Policy</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    Our policy lasts 7 days. If 7 days have gone by since your
                    delivery, unfortunately, we can’t offer you a refund or
                    exchange.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Shipping</Accordion.Header>
                  <Accordion.Body className="small text-muted">
                    We ship worldwide. Standard delivery takes 5-7 business
                    days.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          </Col>
        </Row>
      </Container>

      {/* SIZE GUIDE MODAL - DESIGN MODIFIED */}
      <Modal
        show={showSizeGuide}
        onHide={handleCloseSizeGuide}
        size="lg"
        centered
        className="g3-size-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-4">Size Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Tabs
            defaultActiveKey="chart"
            id="size-guide-tabs"
            className="g3-custom-tabs mb-4 flex-nowrap"
          >
            <Tab eventKey="chart" title="Size Chart">
              <div className="g3-alert-info d-flex align-items-center p-3 mb-4">
                <FaInfoCircle className="me-2" />
                <span>
                  All measurements are in <strong>centimeters (cm)</strong>.
                  Measure your body for the best fit.
                </span>
              </div>

              <div className="table-responsive g3-chart-container">
                <Table className="g3-refined-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Bust</th>
                      <th>Waist</th>
                      <th>Hip</th>
                      <th>Kurta</th>
                      <th>Palazzo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          selectedSize === row.size ? "g3-row-selected" : ""
                        }
                      >
                        <td className="fw-bold">{row.size}</td>
                        <td>{row.bust}</td>
                        <td>{row.waist}</td>
                        <td>{row.hip}</td>
                        <td>{row.kurtaLength}</td>
                        <td>{row.palazzoLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="mt-4 p-3 bg-light rounded border-start border-dark border-4">
                <h6 className="fw-bold mb-1">Choosing the right size?</h6>
                <p className="small text-muted mb-0">
                  If you fall between two sizes, we recommend going for the
                  larger size for a relaxed festive fit.
                </p>
              </div>
            </Tab>

            <Tab eventKey="measurements" title="How to Measure">
              <p className="small text-muted mb-4">
                Follow these steps to ensure you select the perfect size for
                your body type.
              </p>

              <Row className="gx-3">
                <Col md={6} className="mb-3">
                  <div className="g3-measure-card p-3 h-100">
                    <div className="g3-measure-img-placeholder mb-3">
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted"
                      >
                        <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8z" />
                        <path d="M12 2v16" />
                        <path d="M4 10h16" />
                      </svg>
                    </div>
                    <h6 className="fw-bold mb-1 text-uppercase small">
                      Bust Measurement
                    </h6>
                    <p className="text-muted small mb-0">
                      Measure around the fullest part of your chest while
                      keeping the tape horizontal.
                    </p>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="g3-measure-card p-3 h-100">
                    <div className="g3-measure-img-placeholder mb-3">
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                        <path d="M12 7v10" />
                      </svg>
                    </div>
                    <h6 className="fw-bold mb-1 text-uppercase small">
                      Waist Measurement
                    </h6>
                    <p className="text-muted small mb-0">
                      Measure at your natural waistline, typically the narrowest
                      part of your torso.
                    </p>
                  </div>
                </Col>
              </Row>

              <Table borderless size="sm" className="mt-3 g3-how-to-table">
                <thead>
                  <tr className="border-bottom">
                    <th className="pb-2">Part</th>
                    <th className="pb-2">Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold py-2">Hips</td>
                    <td className="text-muted py-2">
                      Measure around the fullest part of your hips/bottom.
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold py-2">Length</td>
                    <td className="text-muted py-2">
                      Measure from the high point of your shoulder to the hem.
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="dark"
            className="w-100 rounded-0 py-3 fw-bold"
            onClick={handleCloseSizeGuide}
          >
            GOT IT
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:wght@600&display=swap');

        .g3-pdp-wrapper { color: #0a2845; background: #fff; }
        .g3-main-content { max-width: 1400px; margin: 0 auto; }

        .g3-sticky-image-container { position: sticky; top: 20px; }
        .g3-thumb-stack { display: flex; flex-direction: column; gap: 10px; }
        .g3-thumb-wrapper { aspect-ratio: 3/4; width: 100%; overflow: hidden; cursor: pointer; border: 1.5px solid transparent; transition: 0.2s ease; background: #f4f4f4; }
        .g3-thumb-wrapper img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
        .g3-thumb-wrapper.active { border-color: #0a2845; }
        .g3-thumb-wrapper.active img { opacity: 1; }
        .g3-main-viewport { position: relative; aspect-ratio: 3/4.2; overflow: hidden; background: #f9f9f9; }
        .g3-featured-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s; }
        .g3-main-viewport:hover .g3-featured-img { transform: scale(1.04); }

        .g3-breadcrumb { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #999; }
        .g3-breadcrumb span { color: #0a2845; font-weight: 700; }
        .g3-breadcrumb-link { color: #999; transition: color 0.2s ease; }
        .g3-breadcrumb-link:hover { color: #0a2845; text-decoration: underline; }
        .g3-product-name {  font-size: 2rem; font-weight: 600; color: #0a2845; }
        .g3-price-now { font-size: 1.8rem; font-weight: 400; color: #0a2845;}
        .g3-price-was { text-decoration: line-through; color: #adb5bd; font-size: 1.2rem; }
        .g3-discount-pill { background: #fff1f1; color: #d9534f; padding: 4px 10px; font-size: 0.8rem; font-weight: 700; }

        .g3-size-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(55px, 1fr)); gap: 10px; }
        .g3-size-pill { height: 50px; border: 1px solid #ddd; background: #fff; font-weight: 600; transition: 0.2s; }
        .g3-size-pill.active { background: #0a2845; color: #fff; border-color: #0a2845; }
        .g3-color-grid { gap: 8px; }
        .g3-color-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid #ddd;
          background: #fff;
          font-size: 12px;
        }
        .g3-color-pill.active {
          border-color: #0a2845;
          background: #0a2845;
          color: #fff;
        }
        .g3-color-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid #ccc;
          display: inline-block;
        }
        .g3-cta-row { display: flex; gap: 12px; }
        .g3-btn-cart { flex: 1; height: 56px; background: #0a2845; border: none; border-radius: 0; font-weight: 700; }
        .g3-btn-wish { width: 56px; border-radius: 0; border-color: #ddd; transition: all 0.3s ease; }
        .g3-btn-wish:hover { background: #f8f8f8; }
        .g3-btn-wish:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .g3-perks-box { background: #fff; border-top: 1px solid #eee; border-bottom: 1px solid #eee; font-size: 10px; text-transform: uppercase; font-weight: 600; }
        .g3-promo-banner { background: #fde2b9; border-radius: 4px; border: 1px solid #f9d5a2; }
        .g3-support-btn { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 10px; font-size: 12px; font-weight: 600; }

        /* ACCORDION DESIGN IMPROVEMENTS */
        .g3-pdp-accordion { margin-top: 12px; }
        .g3-pdp-accordion .accordion-item { border: none; margin-bottom: 12px; }
        .g3-pdp-accordion .accordion-button {
          background: #fff;
          border: 1px solid #eef0f2;
          border-radius: 10px;
          padding: 14px 16px;
          box-shadow: 0 1px 2px rgba(20,20,20,0.03);
          color: #2b4d6e;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .g3-pdp-accordion .accordion-button:focus {
          box-shadow: 0 6px 18px rgba(0,0,0,0.06);
          outline: none;
        }
        /* When expanded */
        .g3-pdp-accordion .accordion-button:not(.collapsed) {
          background: linear-gradient(180deg,#ffffff,#fbfbfb);
          border-color: #e6e9eb;
          box-shadow: 0 6px 20px rgba(0,0,0,0.04);
        }
        /* rotate bootstrap chevron for clear state */
        .g3-pdp-accordion .accordion-button::after {
          transition: transform .25s ease;
          width: 16px;
          height: 16px;
        }
        .g3-pdp-accordion .accordion-button.collapsed::after {
          transform: rotate(0deg);
        }
        .g3-pdp-accordion .accordion-button:not(.collapsed)::after {
          transform: rotate(90deg);
        }
        .g3-pdp-accordion .accordion-body {
          background: #fff;
          border: 1px solid #f1f3f4;
          border-top: none;
          margin-top: 8px;
          padding: 16px;
          border-radius: 0 0 10px 10px;
          color: #616161;
          line-height: 1.6;
        }
        .g3-pdp-accordion .accordion-body .border-bottom.py-2 {
          border-color: #f1f2f3 !important;
        }

        .g3-pdp-accordion .accordion-button svg {
          flex-shrink: 0;
        }

        .g3-pdp-accordion .accordion-item:first-of-type .accordion-button {
          margin-top: 0;
        }

        .g3-pdp-accordion .accordion-button + .accordion-collapse {
          margin-top: 0;
        }

        .g3-pdp-accordion .accordion-body small,
        .g3-pdp-accordion .accordion-body p {
          font-size: 13px;
          color: #6b6b6b;
        }
/* ADD TO CART BUTTON – FIX BLUE HOVER / FOCUS ISSUE */
.g3-btn-cart {
  background: #0a2845 !important;
  color: #fff !important;
  border: none !important;
}

/* Hover */
.g3-btn-cart:hover {
  background: #0a2845 !important;
  color: #fff !important;
}

/* Focus */
.g3-btn-cart:focus,
.g3-btn-cart:focus-visible {
  background: #0a2845 !important;
  color: #fff !important;
  box-shadow: none !important;
  outline: none !important;
}

/* Active (click time) */
.g3-btn-cart:active,
.g3-btn-cart.active {
  background: #0a2845 !important;
  color: #fff !important;
  box-shadow: none !important;
}

/* Disabled state */
.g3-btn-cart:disabled {
  background: #555 !important;
  color: #ddd !important;
  opacity: 0.7;
  cursor: not-allowed;
}
  .tracking-wider{
  color:#0a2845;
  }

        /* MODIFIED SIZE MODAL STYLES (existing) */
        .g3-custom-tabs .nav-link { border: none; color: #999; font-weight: 600; border-bottom: 2px solid transparent; padding: 10px 20px; }
        .g3-custom-tabs .nav-link.active { color: #0a2845; border-bottom-color: #0a2845; background: transparent; }
        .g3-alert-info { background: #7fb0df1f; border-radius: 8px; font-size: 13px; }
        .g3-refined-table { margin-bottom: 0; }
        .g3-refined-table thead th { background: #fdfdfd; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-top: 0; padding: 15px; }
        .g3-refined-table tbody td { padding: 15px; font-size: 14px; vertical-align: middle; }
        .g3-row-selected { background-color: #0a2845 !important; color: #fff; }
        .g3-measure-card { background: #f9f9f9; border-radius: 8px; transition: 0.3s; border: 1px solid #eee; }
        .g3-measure-img-placeholder { background: #fff; height: 100px; display: flex; align-items: center; justify-content: center; border-radius: 4px; border: 1px dashed #ddd; }
        .g3-how-to-table td { font-size: 13px; }

        @media (max-width: 767px) {
          .g3-main-viewport { aspect-ratio: 3/4; margin: 0 -15px; }
     
          .g3-mobile-dots { position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
          .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(0,0,0,0.2); }
          .dot.active { background: #0a2845; width: 18px; border-radius: 4px; }
          .g3-m-thumb { aspect-ratio: 3/4; width: 80px; flex-shrink: 0; overflow: hidden; border: 1.5px solid transparent; background: #f4f4f4; }
          .g3-m-thumb.active { border-color: #0a2845; }
        }
        @media (max-width: 576px) {
          .g3-product-name { font-size: 1.5rem;} 
          .g3-discount-pill { display: block; width: fit-content; margin-left: 0 !important;}
        }
      `}</style>

      <Container className="g3-main-content pb-lg-3 pb-3">
        <SimiliarPro
          productId={product._id || product.id}
          category={product.category || product.categoryName || ""}
        />
      </Container>
    </div>
  );
};

export default ProductDetailPage;
