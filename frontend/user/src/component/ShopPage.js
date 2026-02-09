import React, { useState, useEffect, useMemo } from "react";
import {
  Heart,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import client from "../api/client";
import { useCurrency } from "../context/CurrencyContext";
import { toast } from "react-toastify";
import Loader from "./Loader";
import { Link, NavLink } from "react-router-dom";

const ShopPage = () => {
  // Logic updated: Max 2 categories open at once
  const [searchParams, setSearchParams] = useSearchParams();
  const [openCategories, setOpenCategories] = useState(["Price", "Colour"]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedSort, setSelectedSort] = useState("NEWEST");
  const navigate = useNavigate();
  const { formatPrice, selectedCountry } = useCurrency(); // Add selectedCountry to trigger re-render
  const [wishlistIds, setWishlistIds] = useState([]);
  const [cartLoadingId, setCartLoadingId] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // dynamic price bounds
  const [minPrice, setMinPrice] = useState(2000);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [priceRange, setPriceRange] = useState(100000);

  // dynamic filter options from backend products
  const [filterOptions, setFilterOptions] = useState({
    Colour: [],
    Fabric: [],
    Occasion: [],
    Work: [],
    Style: [],
    Discount: [],
  });

  // Fetch wishlist (with auth header if available)
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when country changes
  const token = localStorage.getItem("userToken");

  // Listen for country changes and force re-render
  useEffect(() => {
    const handleCountryChange = () => {
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener("countryChanged", handleCountryChange);
    return () =>
      window.removeEventListener("countryChanged", handleCountryChange);
  }, []);

  // Handle offcanvas backdrop clicks and cleanup
  useEffect(() => {
    const filterOffcanvas = document.getElementById('offcanvasFilters');
    const sortOffcanvas = document.getElementById('offcanvasSort');

    const cleanupBackdrops = () => {
      // Remove any duplicate backdrops
      const backdrops = document.querySelectorAll('.offcanvas-backdrop');
      if (backdrops.length > 1) {
        backdrops.forEach((backdrop, index) => {
          if (index > 0) backdrop.remove();
        });
      }
    };

    const handleBackdropClick = (event) => {
      // Check if click is on backdrop
      if (event.target.classList.contains('offcanvas-backdrop')) {
        cleanupBackdrops();
        // Close the offcanvas
        if (filterOffcanvas) {
          const filterInstance = window.bootstrap?.Offcanvas?.getInstance(filterOffcanvas);
          if (filterInstance) {
            filterInstance.hide();
          }
        }
        if (sortOffcanvas) {
          const sortInstance = window.bootstrap?.Offcanvas?.getInstance(sortOffcanvas);
          if (sortInstance) {
            sortInstance.hide();
          }
        }
      }
    };

    // Cleanup on offcanvas hide
    const handleHide = () => {
      setTimeout(() => {
        cleanupBackdrops();
      }, 100);
    };

    if (filterOffcanvas) {
      filterOffcanvas.addEventListener('hidden.bs.offcanvas', handleHide);
    }
    if (sortOffcanvas) {
      sortOffcanvas.addEventListener('hidden.bs.offcanvas', handleHide);
    }

    document.addEventListener('click', handleBackdropClick);
    
    return () => {
      document.removeEventListener('click', handleBackdropClick);
      if (filterOffcanvas) {
        filterOffcanvas.removeEventListener('hidden.bs.offcanvas', handleHide);
      }
      if (sortOffcanvas) {
        sortOffcanvas.removeEventListener('hidden.bs.offcanvas', handleHide);
      }
    };
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await client.get("/wishlist", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const ids = res.data?.items?.map((i) => i.product._id) || [];
        setWishlistIds(ids);
      } catch (err) {
        // user not logged in or empty wishlist
      }
    };

    fetchWishlist();
  }, [token]);

  const toggleWishlist = async (productId) => {
    try {
      await client.post(
        "/wishlist/toggle",
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const isInWishlist = wishlistIds.includes(productId);
      setWishlistIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId],
      );

      if (isInWishlist) {
        toast.success("Removed from wishlist");
      } else {
        toast.success("Added to wishlist");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.warning("Please login to use wishlist");
        navigate("/login");
      } else {
        toast.error(err?.response?.data?.message || "Something went wrong");
      }
    }
  };

  const addToCart = async (productId) => {
    try {
      setCartLoadingId(productId);
      await client.post(
        "/cart/add",
        { productId, qty: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      toast.success("Added to cart");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.warning("Please login to add items to cart");
        navigate("/login");
      } else {
        toast.error(err?.response?.data?.message || "Something went wrong");
      }
    } finally {
      setCartLoadingId(null);
    }
  };

  const sortOptions = [
    { label: "NEWEST", value: "NEWEST" },
    { label: "PRICE: LOW TO HIGH", value: "PRICE_LOW_HIGH" },
    { label: "PRICE: HIGH TO LOW", value: "PRICE_HIGH_LOW" },
    { label: "DISCOUNT", value: "DISCOUNT" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/catalog/products", {
          params: { page: 1, limit: 1000 },
        });
        const items = Array.isArray(res.data.items) ? res.data.items : [];
        setAllProducts(items);
        setProducts(items);

        const prices = items.map((p) =>
          typeof p.salePrice === "number" ? p.salePrice : p.price || 0,
        );
        const min = prices.length ? Math.min(...prices) : 2000;
        const max = prices.length ? Math.max(...prices) : 100000;
        setMinPrice(min);
        setMaxPrice(max);
        setPriceRange(max);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load products";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Build dynamic filter options whenever allProducts changes
  useEffect(() => {
    if (!allProducts.length) return;

    const uniqueColors = new Map();
    allProducts.forEach((p) => {
      if (Array.isArray(p.colors)) {
        p.colors.forEach((c) => {
          if (!c || !c.name) return;
          if (!uniqueColors.has(c.name))
            uniqueColors.set(c.name, c.hex || "#cccccc");
        });
      }
    });

    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

    const fabrics = uniq(allProducts.map((p) => p.fabric));
    const occasions = uniq(allProducts.map((p) => p.occasion));
    const works = uniq(allProducts.map((p) => p.work));
    const styles = uniq(allProducts.map((p) => p.productType));

    const discountsRaw = uniq(allProducts.map((p) => p.discountPercent)).filter(
      (n) => typeof n === "number" && n > 0,
    );
    const bucketsSet = new Set(
      discountsRaw.map((n) => `${Math.floor(n / 10) * 10}%`),
    );
    const bucketOrder = ["10%", "20%", "30%", "40%", "50%"];
    const discounts = bucketOrder.filter((b) => bucketsSet.has(b));

    setFilterOptions({
      Colour: Array.from(uniqueColors.entries()).map(([name, hex]) => ({
        name,
        hex,
      })),
      Fabric: fabrics,
      Occasion: occasions,
      Work: works,
      Style: styles,
      Discount: discounts,
    });
  }, [allProducts]);

  // State to track category filter from URL
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Apply style filter from URL parameter
  useEffect(() => {
    const styleParam = searchParams.get("style");
    if (styleParam && allProducts.length > 0) {
      // Decode the parameter
      const decodedStyle = decodeURIComponent(styleParam);

      // First, try to match as Style (productType)
      if (filterOptions.Style && filterOptions.Style.length > 0) {
        const styleExists = filterOptions.Style.some(
          (s) =>
            s && s.toLowerCase().trim() === decodedStyle.toLowerCase().trim(),
        );

        if (styleExists) {
          // Find the exact style name (preserving case)
          const exactStyle = filterOptions.Style.find(
            (s) =>
              s && s.toLowerCase().trim() === decodedStyle.toLowerCase().trim(),
          );

          if (exactStyle) {
            setSelectedFilters((prev) => {
              // Only update if not already set
              if (prev.Style?.includes(exactStyle)) {
                return prev;
              }
              return {
                ...prev,
                Style: [exactStyle],
              };
            });

            // Open Style category if not already open
            setOpenCategories((prev) => {
              if (prev.includes("Style")) {
                return prev;
              }
              if (prev.length >= 2) {
                return [prev[prev.length - 1], "Style"];
              }
              return [...prev, "Style"];
            });

            // Clear category filter if style matched
            setCategoryFilter(null);
            return;
          }
        }
      }

      // If style doesn't match, try to filter by category name
      // Check if any product has this category
      const categoryExists = allProducts.some((p) => {
        if (Array.isArray(p.categories)) {
          return p.categories.some(
            (cat) =>
              cat &&
              (cat.name || cat) &&
              String(cat.name || cat)
                .toLowerCase()
                .trim() === decodedStyle.toLowerCase().trim(),
          );
        }
        return false;
      });

      if (categoryExists) {
        setCategoryFilter(decodedStyle);
        // Clear style filter if category matched
        setSelectedFilters((prev) => {
          const { Style, ...rest } = prev;
          return rest;
        });
      } else {
        setCategoryFilter(null);
      }
    } else {
      setCategoryFilter(null);
    }
  }, [searchParams, filterOptions.Style, allProducts]);

  const filterCategories = [
    "Price",
    "Colour",
    "Fabric",
    "Occasion",
    "Work",
    "Style",
    "Discount",
  ];

  // UPDATED LOGIC: Maintain only 2 open categories
  const toggleCategory = (catName) => {
    setOpenCategories((prev) => {
      if (prev.includes(catName)) {
        // If it's already open, just close it
        return prev.filter((item) => item !== catName);
      } else {
        // If it's closed and we have 2 or more open, remove the oldest one
        if (prev.length >= 2) {
          return [prev[prev.length - 1], catName];
        }
        // Otherwise just add it
        return [...prev, catName];
      }
    });
  };

  const handleFilterClick = (category, value) => {
    setSelectedFilters((prev) => {
      const currentCat = prev[category] || [];
      return currentCat.includes(value)
        ? { ...prev, [category]: currentCat.filter((v) => v !== value) }
        : { ...prev, [category]: [...currentCat, value] };
    });
  };

  const removeFilter = (category, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].filter((v) => v !== value),
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setPriceRange(maxPrice);
    setCategoryFilter(null);
    // Clear URL parameter
    setSearchParams({});
  };

  // Apply filters and sorting on client side
  useEffect(() => {
    let list = [...allProducts];

    list = list.filter((p) => {
      const price =
        typeof p.salePrice === "number" ? p.salePrice : p.price || 0;
      return price <= Number(priceRange || 0);
    });

    const hasSel = (key) =>
      Array.isArray(selectedFilters[key]) && selectedFilters[key].length > 0;

    if (hasSel("Colour")) {
      const setSel = new Set(selectedFilters["Colour"]);
      list = list.filter(
        (p) =>
          Array.isArray(p.colors) && p.colors.some((c) => setSel.has(c?.name)),
      );
    }

    if (hasSel("Fabric")) {
      const setSel = new Set(selectedFilters["Fabric"]);
      list = list.filter((p) => p.fabric && setSel.has(p.fabric));
    }

    if (hasSel("Occasion")) {
      const setSel = new Set(selectedFilters["Occasion"]);
      list = list.filter((p) => p.occasion && setSel.has(p.occasion));
    }

    if (hasSel("Work")) {
      const setSel = new Set(selectedFilters["Work"]);
      list = list.filter((p) => p.work && setSel.has(p.work));
    }

    if (hasSel("Style")) {
      const setSel = new Set(selectedFilters["Style"]);
      list = list.filter((p) => p.productType && setSel.has(p.productType));
    }

    if (hasSel("Discount")) {
      const thresholds = selectedFilters["Discount"]
        .map((s) => parseInt(String(s).replace("%", ""), 10))
        .filter((n) => !isNaN(n));
      const minThreshold = thresholds.length ? Math.min(...thresholds) : null;
      if (minThreshold !== null) {
        list = list.filter((p) => (p.discountPercent || 0) >= minThreshold);
      }
    }

    // Filter by category name if categoryFilter is set
    if (categoryFilter) {
      list = list.filter((p) => {
        if (Array.isArray(p.categories)) {
          return p.categories.some((cat) => {
            const catName = cat?.name || cat;
            return (
              catName &&
              String(catName).toLowerCase().trim() ===
                categoryFilter.toLowerCase().trim()
            );
          });
        }
        return false;
      });
    }

    const sortKey = selectedSort;
    list.sort((a, b) => {
      const priceA =
        typeof a.salePrice === "number" ? a.salePrice : a.price || 0;
      const priceB =
        typeof b.salePrice === "number" ? b.salePrice : b.price || 0;
      switch (sortKey) {
        case "PRICE_LOW_HIGH":
          return priceA - priceB;
        case "PRICE_HIGH_LOW":
          return priceB - priceA;
        case "DISCOUNT":
          return (b.discountPercent || 0) - (a.discountPercent || 0);
        case "NEWEST":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    setProducts(list);
  }, [allProducts, selectedFilters, priceRange, selectedSort, categoryFilter]);

  const FilterContent = () => (
    <div className="p-3 p-lg-0">
      <div className="d_filter-title d-flex justify-content-between align-items-center">
        <span>All Filters</span>
        <button
          className="btn btn-link btn-sm text-danger fw-bold p-0 text-decoration-none"
          onClick={clearAllFilters}
        >
          CLEAR ALL
        </button>
      </div>

      {filterCategories.map((cat) => {
        const isOpen = openCategories.includes(cat);
        return (
          <div key={cat} className="d_filter-group">
            <div
              className="d_filter-header"
              onClick={() => toggleCategory(cat)}
            >
              {cat}
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
              <div className="d_filter-options pt-3">
                {cat === "Price" ? (
                  <div className="px-2 pb-2">
                    <input
                      type="range"
                      className="d_price-slider w-100"
                      min={minPrice}
                      max={maxPrice}
                      value={priceRange}
                      onChange={(e) => setPriceRange(Number(e.target.value))}
                    />
                    <div className="d_price-inputs d-flex justify-content-between mt-2">
                      <div className="d_price-box small">
                        {formatPrice(2000)}
                      </div>
                      <div className="d_price-box small">
                        {formatPrice(priceRange)}
                      </div>
                    </div>
                  </div>
                ) : cat === "Colour" ? (
                  <div className="row g-2 px-1">
                    {filterOptions.Colour.map((col) => (
                      <div key={col.name} className="col-12 col-xl-6">
                        <label className="d_checkbox-item">
                          <input
                            type="checkbox"
                            checked={
                              selectedFilters[cat]?.includes(col.name) || false
                            }
                            onChange={() => handleFilterClick(cat, col.name)}
                          />
                          <span
                            className="d_color-swatch"
                            style={{ background: col.hex || "#cccccc" }}
                          ></span>
                          <span className="ms-1 text-truncate">{col.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="d_scroll-options"
                    style={{ maxHeight: "180px", overflowY: "auto" }}
                  >
                    {filterOptions[cat]?.map((item) => (
                      <label key={item} className="d_checkbox-item">
                        <input
                          type="checkbox"
                          checked={
                            selectedFilters[cat]?.includes(item) || false
                          }
                          onChange={() => handleFilterClick(cat, item)}
                        />
                        {item} {cat === "Discount" && " & Above"}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="d_shop-wrapper container-fluid p-0">
      <style>{`
        .d_shop-wrapper { background: #fff; }
        .shop-hero-banner {
            height: 300px;
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.prismic.io/milanmagic/2f153233-cb33-4a1b-b095-98fbd5b0dee8_Untitled%20design%20(29).png?auto=compress,format&rect=0,0,1200,600&w=1200&h=600');
            background-size: cover;
            background-position:center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            text-align: center;
            margin-bottom: 40px;
        }
        .shop-hero-banner h1 { font-size: 3rem; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .breadcrumb-text { font-size: 14px; opacity: 0.9; margin-top: 10px; letter-spacing: 1px; }
        .d_filter-sidebar { border-right: 1px solid #eee; position: sticky; top: 20px; height: calc(100vh - 40px); overflow-y: auto; padding-right: 8px;}
        .d_filter-title { font-weight: 700; font-size: 13px; letter-spacing: 0.5px; border-bottom: 2px solid #eee; padding-bottom: 12px; }
        .d_filter-group { border-bottom: 1px solid #f8f8f8; padding: 12px 0; }
        .d_filter-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; cursor: pointer; text-transform: uppercase; color: #0a2845 !important; }
        .d_checkbox-item { display: flex; gap: 8px; font-size: 12px; margin-bottom: 8px; cursor: pointer; align-items: center; }
        .d_color-swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid #ddd; display: inline-block; }
        .d_price-box { border: 1px solid #eee; padding: 4px 8px; border-radius: 4px; background: #fafafa; }
        .d_price-slider { accent-color: #0a2845; }
        .d_applied-filter-tag { background: #f0f0f0; padding: 6px 14px; border-radius: 20px; font-size: 11px; display: flex; align-items: center; gap: 8px; font-weight: 600; text-transform: uppercase; }
        .d_product-card { position: relative; border: none; overflow: hidden; cursor: pointer; }
        .d_img-container { position: relative; width: 100%; overflow: hidden; }
        .d_product-img { width: 100%; height: 450px; object-fit: cover; transition: transform 0.5s ease; }
        .d_wishlist-btn { position: absolute; top: 15px; right: 15px; background: #fff; width: 35px; height: 35px; border-radius: 50% !important; display: flex; align-items: center; justify-content: center; z-index: 5; border: none; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .d_wishlist-btn:hover { background: #0a2845; }
        .d_wishlist-btn:hover svg { stroke: #fff; }
        .d_product-overlay { position: absolute; bottom: -50px; left: 0; width: 100%; background: rgb(0 0 0 / 30%); padding: 12px; text-align: center; transition: all 0.3s ease; opacity: 0; }
        .d_product-card:hover .d_product-overlay { bottom: 0; opacity: 1; }
        .d_product-card:hover .d_product-img { transform: scale(1.05); }
        .d_view-detail-btn { background: #0a2845; color: #fff; border: none; font-size: 11px; font-weight: 700; padding: 8px 20px; text-transform: uppercase; letter-spacing: 1px; }
        .d_product-info { padding: 15px 0; text-align: center; }
        .d_product-name { font-size: 13px; color: #555; margin-bottom: 5px; }
        .d_product-price { font-weight: 700; color: #0a2845; font-size: 14px; }
        .d_cart-btn { position: absolute; top: 60px; right: 15px; background: #fff; width: 35px; height: 35px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; z-index: 5; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .d_cart-btn:hover { background: #0a2845; }
        .d_cart-btn:hover svg { stroke: #fff; }
        .d_cart-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .form-select { color: #0a2845; }

        @media (max-width: 1200px) {
          .shop-hero-banner { height: 200px; }
          .shop-hero-banner h1 { font-size: 2rem; }
          .d_filter-sidebar { display: none; }
          .d_product-img { height: 320px; }
          .mobile-filter-bar { background: #fff; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-bottom: 20px; position: sticky; top: 0; z-index: 100; }
          .mobile-filter-btn { flex: 1; text-align: center; padding: 12px; font-size: 12px; font-weight: 700; border-right: 1px solid #eee;border-left: 1px solid #eee; cursor: pointer; text-transform: uppercase; display: flex; align-items: center; justify-content: center; }
        }
          .breadcrumb-link {
  color: #fff;
  text-decoration: none;
  opacity: 0.8;
  cursor: pointer;
}

.breadcrumb-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.breadcrumb-link.active {
  font-weight: 700;
  opacity: 1;
  pointer-events: none; /* SHOP already active */
}

      `}</style>

      <section className="shop-hero-banner">
        <h1>Our Collection</h1>
        <div className="breadcrumb-text">
          <Link to="/" className="breadcrumb-link">
            HOME
          </Link>
          {" | "}
          <NavLink to="/shop" className="breadcrumb-link active">
            SHOP
          </NavLink>
        </div>
      </section>

      <div className="container-fluid px-lg-5">
        <div className="d-xl-none d-flex mobile-filter-bar">
          <div
            className="mobile-filter-btn"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasFilters"
          >
            <Filter size={14} className="me-2" /> Filter
          </div>
          <div
            className="mobile-filter-btn"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasSort"
          >
            <ArrowUpDown size={14} className="me-2" /> Sort
          </div>
        </div>

        <div className="offcanvas offcanvas-start" tabIndex="-1" id="offcanvasFilters" data-bs-backdrop="true" aria-controls="offcanvasScrolling">
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title fw-bold small">FILTERS</h5>
            <button
              type="button"
              className="btn-close text-reset shadow-none"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <FilterContent />
          </div>
          <div className="p-3 border-top">
            <button
              className="btn btn-dark w-100 py-2 fw-bold"
              data-bs-dismiss="offcanvas"
            >
              APPLY FILTERS
            </button>
          </div>
        </div>

        <div className="offcanvas offcanvas-bottom" tabIndex="-1" id="offcanvasSort" data-bs-backdrop="true" style={{ height: "auto" }}>
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title fw-bold small text-uppercase">
              Sort By
            </h5>
            <button
              type="button"
              className="btn-close text-reset shadow-none"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body p-0">
            {[
              { label: "NEWEST", value: "NEWEST" },
              { label: "PRICE: LOW TO HIGH", value: "PRICE_LOW_HIGH" },
              { label: "PRICE: HIGH TO LOW", value: "PRICE_HIGH_LOW" },
              { label: "DISCOUNT", value: "DISCOUNT" },
            ].map((opt) => (
              <div
                key={opt.value}
                className={`sort-option-item p-3 border-bottom d-flex justify-content-between align-items-center ${
                  selectedSort === opt.value ? "bg-light fw-bold" : ""
                }`}
                onClick={() => {
                  setSelectedSort(opt.value);
                  const offcanvasElement = document.getElementById('offcanvasSort');
                  if (offcanvasElement) {
                    const offcanvasInstance = window.bootstrap?.Offcanvas?.getInstance(offcanvasElement);
                    if (offcanvasInstance) {
                      offcanvasInstance.hide();
                    }
                  }
                }}
              >
                {opt.label}
                {selectedSort === opt.value && (
                  <Check size={16} className="text-success" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="row">
          <aside className="col-xl-2 d-none d-xl-block d_filter-sidebar">
            <FilterContent />
          </aside>

          <main className="col-xl-10 ps-lg-4">
            <div className="d_applied-filters mb-3 d-flex flex-wrap gap-2 align-items-center">
              {Object.entries(selectedFilters).map(([category, values]) =>
                values.map((val) => (
                  <div
                    key={`${category}-${val}`}
                    className="d_applied-filter-tag"
                  >
                    {val}{" "}
                    <X
                      size={14}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeFilter(category, val)}
                    />
                  </div>
                )),
              )}
              {categoryFilter && (
                <div className="d_applied-filter-tag">
                  {categoryFilter}{" "}
                  <X
                    size={14}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setCategoryFilter(null);
                      setSearchParams({});
                    }}
                  />
                </div>
              )}
              {(Object.values(selectedFilters).flat().length > 0 ||
                categoryFilter) && (
                <button
                  className="btn btn-link btn-sm text-dark fw-bold small text-decoration-none"
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
              <div
                className="text-muted small fw-bold"
                style={{ letterSpacing: "1px" }}
              >
                {products.length} PRODUCTS FOUND
              </div>
              <select
                className="form-select form-select-sm w-auto border-0 fw-bold cursor-pointer shadow-none d-none d-lg-block"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
              >
                {[
                  { label: "NEWEST", value: "NEWEST" },
                  { label: "PRICE: LOW TO HIGH", value: "PRICE_LOW_HIGH" },
                  { label: "PRICE: HIGH TO LOW", value: "PRICE_HIGH_LOW" },
                  { label: "DISCOUNT", value: "DISCOUNT" },
                ].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    SORT: {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {loading && <Loader text="Loading products..." />}
            <div className="row g-3 g-md-4 mb-5">
              {products.map((product) => (
                <div key={product._id} className="col-6 col-md-4 col-xl-3">
                  <div className="d_product-card">
                    <div className="d_img-container">
                      <button
                        className="d_wishlist-btn"
                        onClick={() => toggleWishlist(product._id)}
                      >
                        <Heart
                          size={18}
                          fill={
                            wishlistIds.includes(product._id) ? "black" : "none"
                          }
                          stroke="black"
                        />
                      </button>
                      <img
                        src={
                          Array.isArray(product.images)
                            ? product.images[0]
                            : product.image
                        }
                        alt={product.title}
                        className="d_product-img"
                      />
                      <div className="d_product-overlay">
                        <button
                          className="d_view-detail-btn"
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          View Detail
                        </button>
                      </div>
                    </div>
                    <div className="d_product-info">
                      <div className="d_product-name text-truncate px-2">
                        {product.title}
                      </div>
                      <div className="d_product-price">
                        {/* ₹ {
                          (typeof product.salePrice === "number" ? product.salePrice : product.price)?.toLocaleString?.() ||
                          product.price
                        } */}
                        {formatPrice(product.salePrice || product.price)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
