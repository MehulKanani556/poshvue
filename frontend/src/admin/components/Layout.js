import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiTag,
  FiPackage,
  FiShoppingCart,
  FiPercent,
  FiUsers,
  FiBarChart2,
  FiMenu,
  FiX,
  FiLogOut,
  FiStar,
  FiMessageSquare,
  FiAlertCircle,
  FiMail,
  FiBell,
  FiBriefcase,
  FiBookOpen,
  FiFileText,
  FiGlobe,
} from "react-icons/fi";

function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pagesRoutes = ["/admin/home", "/admin/about-us", "/admin/story"];

  const isPagesActive = () => {
    return pagesRoutes.includes(location.pathname);
  };

  useEffect(() => {
    if (isPagesActive()) {
      setPagesOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
  }, [sidebarOpen]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && window.innerWidth <= 768) {
        const sidebar = document.querySelector('.x_sidebar');
        const toggle = document.querySelector('.x_sidebar-toggle');
        if (sidebar && !sidebar.contains(e.target) && toggle && !toggle.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);


  const handleLogout = () => {
    onLogout();
    navigate("/admin/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: FiHome },
    { path: "/admin/categories", label: "Categories", icon: FiTag },
    { path: "/admin/products", label: "Products", icon: FiPackage },
    { path: "/admin/orders", label: "Orders", icon: FiShoppingCart },
    { path: "/admin/coupons", label: "Coupons", icon: FiPercent },
    { path: "/admin/blog", label: "Blog", icon: FiBookOpen },
    { path: "/admin/wholesale", label: "Wholesale", icon: FiBriefcase },
    { path: "/admin/users", label: "Users", icon: FiUsers },
    { path: "/admin/contact", label: "Contact", icon: FiMail },
    { path: "/admin/complaints", label: "Complaints", icon: FiAlertCircle },
    { path: "/admin/subscribe", label: "Subscribers", icon: FiBell },
    { path: "/admin/feedback", label: "Feedback", icon: FiMessageSquare },
    { path: "/admin/reports", label: "Reports", icon: FiBarChart2 },
    { path: "/admin/product-reviews", label: "Product Reviews", icon: FiStar },
    { path: "/admin/countries", label: "Countries", icon: FiGlobe },
  ];

  return (
    <div className="x_admin-container">
      {/* Header */}
      <header className="x_header">
        <div className="x_header-left">
          <button
            className="x_sidebar-toggle bg-transparent border-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu size={24} />
          </button>
          <h1 className="x_header-title">PoshVue Admin</h1>
        </div>
        <div className="x_header-right">
          <div className="x_user-info">
            <div className="x_user-avatar">A</div>
            <span className="x_user-name">Admin</span>
          </div>
          <button
            className="x_btn x_btn-secondary x_btn-sm"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay - for mobile */}
      {sidebarOpen && (
        <div 
          className="x_sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="x_admin-wrapper">
        {/* Sidebar */}
        <aside className={`x_sidebar ${sidebarOpen ? "x_active" : ""}`}>
          <div className="x_sidebar-header d-flex justify-content-between align-items-center">
            <h2>Menu</h2>
            {/* Close Button (ONLY in sidebar) */}
            <button
              className="x_sidebar-close border-0 bg-transparent text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX size={22} />
            </button>
          </div>
          <nav>
            <ul className="x_nav-menu">


              {/* Pages Dropdown */}
              <li
                className={`x_nav-item x_dropdown 
                ${pagesOpen || isPagesActive() ? "x_active" : ""} 
                ${pagesOpen ? "x_open" : ""}`}
              >
                <button
                  className="x_nav-link x_dropdown-toggle"
                  onClick={() => setPagesOpen(!pagesOpen)}
                >
                  <FiFileText size={18} />
                  Pages
                </button>

                {pagesOpen && (
                  <ul className="x_dropdown-menu">
                    {[
                      { path: "/admin/home", label: "Home" },
                      { path: "/admin/about-us", label: "About Us" },
                      { path: "/admin/story", label: "Our Story" },
                      { path: "/admin/contact-us", label: "Contact Us" },
                      { path: "/admin/store-locator", label: "Store Locator" },
                      { path: "/admin/privacy", label: "Privacy Policy" },
                      { path: "/admin/return", label: "Return Policy" },
                      { path: "/admin/shipping", label: "Shipping Policy" },
                      { path: "/admin/terms", label: "Term and Conditions" },
                    ].map((page) => (
                      <li
                        key={page.path}
                        className={`x_dropdown-item ${isActive(page.path) ? "x_active" : ""
                          }`}
                      >
                        <a
                          href={page.path}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(page.path);
                            setSidebarOpen(false);
                          }}
                        >
                          {page.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>


              {/* Rest Menu Items */}
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li
                    key={item.path}
                    className={`x_nav-item ${isActive(item.path) ? "x_active" : ""}`}
                  >
                    <a
                      href={item.path}
                      className="x_nav-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      <IconComponent size={18} />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>

          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="x_main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
