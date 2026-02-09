import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useCurrency } from "../context/CurrencyContext";
import { FaWhatsapp } from "react-icons/fa";
import { IoMailUnreadOutline } from "react-icons/io5";
import Loader from './Loader';
import logo from '../img/logo.png';

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("userToken"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { selectedCountry, countries, selectCountry, formatPrice } = useCurrency();

  /* ================= MENU ITEMS ================= */
  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/ShopPage" },
    { name: "About", path: "/AboutUs" },
    { name: "Contact", path: "/ContactUs" },
    { name: "Sale", path: "/SalePage" },
  ];

  /* ================= COUNTRY ================= */
  // const states = ["India", "US", "Malaysia", "Singapore"];

  // const stateFlags = {
  //   India: "https://flagcdn.com/w40/in.png",
  //   US: "https://flagpedia.net/data/flags/w580/us.webp",
  //   Malaysia: "https://flagpedia.net/data/flags/h80/my.webp",
  //   Singapore: "https://flagpedia.net/data/flags/w580/sg.webp",
  // };

  /* ================= Search Products ================= */
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await client.get(
        `/catalog/products?q=${encodeURIComponent(query)}&limit=5`,
      );
      setSearchResults(response.data.items || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    // const handleClickOutside = (e) => {
    //   if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
    //     console.log("🖱️ Clicked outside, closing dropdown");
    //     setShowStateDropdown(false);
    //   }
    // };
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ================= Handle Outside Click ================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setShowStateDropdown(false);
      }

      // For search results
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= Sticky Header ================= */
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(!!localStorage.getItem("userToken"));
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  /* ================= Handlers ================= */
  const handleLogout = async () => {
    try {
      await client.post("/auth/logout");
    } catch (err) {
      // ignore errors
    }
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    setIsLoggedIn(false);
    setOpen(false);
    navigate("/Register");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* ================= Styles ================= */}
      <style>{`
        body {  
          margin: 0; 
        }

        .d_top-bar {
          background: #0a2845;
          color: #fff;
          padding: 8px 15px;
          font-size: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          z-index: 1001;
        }

        .d_top-text { padding: 0px 40px 0px 0px; max-width: 70%; }

        .d_state-selector-wrapper {
          position: absolute;
          right: 15px;
        }

        .d_state-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .d_main_header_logo {
          height: 50px;
        }

        .z_user_dropdown {
          position: relative;
          display: inline-block;
        }

        .z_user_dropdown_menu {
          position: absolute;
          top: 40px;
          right: 0;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.15);
          min-width: 140px;
          z-index: 1100;
          animation: z_dropdown_fade 0.3s ease-in-out;
        }

        .z_user_dropdown_menu ul {
          list-style: none;
          margin: 0;
          padding: 10px 0;
        }

        .z_user_dropdown_menu li {
          padding: 10px 20px;
          cursor: pointer;
          transition: 0.2s;
          font-size: 14px;
        }

        .z_user_dropdown_menu li:hover {
          background: #7fb0df1f;
        }

        @keyframes z_dropdown_fade {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .d_state-selector:hover {
          background: rgba(255,255,255,0.1);
        }

        .d_dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: #fff;
          color: #0a2845;
          min-width: 140px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 4px;
          margin-top: 6px;
          list-style: none;
          padding: 6px 0;
          display: none;
          z-index: 1100;
        }

        .d_dropdown-menu.d_show { 
          display: block; 
          pointer-events: auto;
        }

        .d_dropdown-item {
          padding: 8px 14px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .d_dropdown-item:hover { background: #7fb0df1f; }

        .d_main-header {
          background: #fff;
          padding: 5px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #eee;
          transition: 0.3s;
          z-index: 1000;
          position: relative;
        }

        .d_main-header.d_sticky {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }

        .d_left-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .d_nav {
          display: flex;
          gap: 35px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .d_nav-link {
          color: #0a2845;
          text-decoration: none;
          font-size: 14px;
          cursor: pointer;
          letter-spacing: 2px;
          font-weight: 500;
        }

        .d_search-container {
          flex: 1;
          max-width: 300px;
          margin: 0 15px;
          position: relative;
        }

        .d_search-form {
          position: relative;
          width: 100%;
        }

        .d_search-input {
          width: 100%;
          padding: 8px 10px 8px 34px;
          border: 1px solid #ccc;
          border-radius: 4px;
          outline: none;
          transition: border-color 0.3s;
        }

        .d_search-input:focus {
          border-color: #888;
        }

        .d_search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
        }

        .d_search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #eee;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-height: 400px;
          overflow-y: auto;
          z-index: 1100;
          margin-top: 4px;
        }

        .d_search-result-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #7fb0df1f;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .d_search-result-item:hover {
          background-color: #f9f9f9;
        }

        .d_search-result-image {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 12px;
        }

        .d_search-result-info {
          flex: 1;
        }

        .d_search-result-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #2b4d6e;
        }

        .d_search-result-price {
          font-size: 13px;
          color: #888;
        }

        .d_search-result-sale {
          color: #e53935;
          font-weight: 500;
        }

        .d_search-loading {
          padding: 20px;
          text-align: center;
          color: #888;
          font-size: 14px;
        }

        .d_search-empty {
          padding: 20px;
          text-align: center;
          color: #888;
          font-size: 14px;
        }

        .d_search-view-all {
          padding: 12px;
          text-align: center;
          border-top: 1px solid #7fb0df1f;
          cursor: pointer;
          color: #2196f3;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .d_search-view-all:hover {
          background-color: #7fb0df1f;
        }

        .d_icon-group {
          display: flex;
          gap: 12px;
        }
        .d_header_icon {
          height: 20px;
          width: 20px;
        }

        .d_icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0a2845;
        }

        .d_mobile-toggle { display: none; }

        .d_mobile-sidebar {
          position: fixed;
          top: 0;
          left: -100%;
          width: 280px;
          height: 100%;
          background: #fff;
          padding: 20px;
          transition: 0.3s;
          z-index: 2000;
        }

        .d_mobile-sidebar.d_active { left: 0; }

        .d_mobile-sidebar li, strong{
         color: #0a2845;
        }
        .d_overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: none;
          z-index: 1999;
        }

        .d_overlay.d_active { display: block; }

        @media (max-width: 1100px) {
          .d_nav { display: none; }
          .d_mobile-toggle { display: block; }
        }

        @media (max-width: 768px) {
          .d_search-container { display: none; }
        }
        
        @media (max-width: 576px) {
           .d_top-bar { justify-content: left; }
        }

        @media (max-width: 425px) {
          .d_top-text{
            width: 100%;
          }
          .d_icon-group {
            gap: 0px;
          }            
        }
        @media (max-width: 385px) {
          .d_left-section {
            gap: 2px;
          }
          .d_main-header {
            padding: 10px 15px;
          }
        }
        @media (max-width: 375px) {
          .d_header_icon {
            height: 18px;
            width: 18px;
          }
          .d_main-header {
            padding: 10px;
          }
          .d_main_header_logo {
            height: 42px;
          }
          .d_left-section {
            gap: 4px;
          }
        }

      `}</style>

      {/* ================= TOP BAR ================= */}
      <div className="d_top-bar">
        <div className="d_top-text">
          Register & Unlock EXTRA 10% Off on Your First Purchase
        </div>

        <div className="d_state-selector-wrapper" ref={dropdownRef}>
          {selectedCountry ? (
            <>
              <div
                className="d_state-selector"
                onClick={() => {
                  console.log("🖱️ State selector clicked");
                  setShowStateDropdown(!showStateDropdown);
                }}
              >
                <img
                  src={selectedCountry.flagUrl}
                  width="16"
                  alt={selectedCountry.name}
                />
                <span>{selectedCountry.name}</span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: showStateDropdown
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                />
              </div>

              <ul
                className={`d_dropdown-menu ${showStateDropdown ? "d_show" : ""
                  }`}
                style={{ display: showStateDropdown ? "block" : "none" }}
              >
                {countries
                  .filter((c) => c.active !== false)
                  .map((country) => (
                    <li
                      key={country._id || country.code}
                      className="d_dropdown-item"
                      onClick={async (e) => {
                        // User country selection - sets as default in backend and updates local state
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("🖱️ Country clicked:", country);
                        console.log(
                          "🖱️ About to call selectCountry with country:",
                          country,
                        );
                        try {
                          await selectCountry(country);
                          console.log(
                            "✅ selectCountry completed successfully",
                          );
                          setShowStateDropdown(false);
                        } catch (error) {
                          console.error("❌ Error in onClick handler:", error);
                          setShowStateDropdown(false);
                        }
                      }}
                    >
                      <img
                        src={country.flagUrl}
                        width="16"
                        alt={country.name}
                      />
                      {country.name} ({country.currencySymbol})
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <Loader fullScreen text="Loading Data..." />
          )}
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <header className={`d_main-header ${isSticky ? "d_sticky" : ""}`}>
        <div className="d_left-section">
          <button
            className="d_mobile-toggle border-0 bg-transparent"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu size={20} />
          </button>
          {/* <strong style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            LOGO
          </strong> */}
          <img
            src={logo}
            alt="Logo"
            style={{ cursor: "pointer", height: "46px" }}
            onClick={() => navigate("/")}
          />
        </div>

        {/* ===== Desktop Menu ===== */}
        <ul className="d_nav">
          {menuItems.map((item) => (
            <li key={item.name}>
              <span
                className="d_nav-link"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(item.path)}
              >
                {item.name}
              </span>
            </li>
          ))}
        </ul>

        {/* ===== Search Bar with Results ===== */}
        <div className="d_search-container" ref={searchRef}>
          <form className="d_search-form" onSubmit={handleSearchSubmit}>
            <Search className="d_search-icon" size={16} />
            <input
              className="d_search-input"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
            />

            {showSearchResults && (
              <div className="d_search-results">
                {loading ? (
                  <Loader fullScreen text="Searching..." />
                ) : searchResults.length === 0 ? (
                  <div className="d_search-empty">No products found</div>
                ) : (
                  <>
                    {searchResults.map((product) => (
                      <div
                        key={product._id}
                        className="d_search-result-item"
                        onClick={() => handleProductClick(product._id)}
                      >
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="d_search-result-image"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/40x40?text=No+Image";
                            }}
                          />
                        )}
                        <div className="d_search-result-info">
                          <div className="d_search-result-title">
                            {product.title}
                          </div>
                          <div className="d_search-result-price">
                            {product.salePrice ? (
                              <>
                                <span className="d_search-result-sale">
                                  {formatPrice(product.salePrice)}
                                </span>
                                {product.price &&
                                  product.price > product.salePrice && (
                                    <span
                                      style={{
                                        textDecoration: "line-through",
                                        marginLeft: "8px",
                                        color: "#999",
                                      }}
                                    >
                                      {formatPrice(product.price)}
                                    </span>
                                  )}
                              </>
                            ) : (
                              product.price && formatPrice(product.price)
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {searchQuery.trim() && (
                      <div
                        className="d_search-view-all"
                        onClick={() => {
                          navigate(
                            `/search?q=${encodeURIComponent(searchQuery)}`,
                          );
                          setShowSearchResults(false);
                          setSearchQuery("");
                        }}
                      >
                        View all results for "{searchQuery}"
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="d_icon-group">
          <button
            className="d_icon-btn"
            onClick={() =>
              window.open("https://wa.me/919974820227?text=hey!!", "_blank")
            }
          >
            <FaWhatsapp className="d_header_icon" />
          </button>

          <button
            className="d_icon-btn"
            onClick={() => (window.location.href = "mailto:test@gmail.com")}
          >
            <IoMailUnreadOutline className="d_header_icon" />
          </button>
          <div className="z_user_dropdown" ref={userDropdownRef}>
            <button
              className="d_icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((prev) => !prev);
              }}
            >
              <User className="d_header_icon" />
            </button>

            {open && (
              <div
                className="z_user_dropdown_menu"
                onClick={(e) => e.stopPropagation()}
              >
                <ul>
                  {!isLoggedIn && (
                    <li
                      onMouseDown={() => {
                        navigate("/Register");
                        setOpen(false);
                      }}
                    >
                      Register
                    </li>
                  )}

                  {isLoggedIn && (
                    <>
                      <li
                        onMouseDown={() => {
                          navigate("/Profile");
                          setOpen(false);
                        }}
                      >
                        Profile
                      </li>

                      <li
                        onMouseDown={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                      >
                        Logout
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
          <button className="d_icon-btn" onClick={() => navigate("/wishlist")}>
            <Heart className="d_header_icon" />
          </button>
          <button className="d_icon-btn" onClick={() => navigate("/cart")}>
            <ShoppingBag className="d_header_icon" />
          </button>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`d_overlay ${showMobileMenu ? "d_active" : ""}`}
        onClick={() => setShowMobileMenu(false)}
      />

      <div className={`d_mobile-sidebar ${showMobileMenu ? "d_active" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>MENU</strong>
          <X size={24} onClick={() => setShowMobileMenu(false)} style={{color:"#0a2845"}} />
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
          {menuItems.map((item) => (
            <li
              key={item.name}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
              onClick={() => {
                navigate(item.path);
                setShowMobileMenu(false);
              }}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>

      {isSticky && <div style={{ height: 70 }} />}
    </>
  );
};

export default Header;
