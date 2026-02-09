import React, { useState, useEffect } from "react";
import "./styles/x_admin.css";
import "./styles/x_table.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories/Categories";
import Products from "./pages/Products/Products";
import Orders from "./pages/Orders/Orders";
import TrackOrder from "./pages/Orders/TrackOrder";
import Coupons from "./pages/Coupons/Coupons";
import Users from "./pages/Users/Users";
import Reports from "./pages/Reports/Reports";
import Reviews from "./pages/Reviews/Reviews";
import ProductReviews from "./pages/ProductReviews/ProductReviews";
import Feedback from "./pages/Feedback/Feedback";
import Complaints from "./pages/Complaints/Complaints";
import Contact from "./pages/Contact/Contact";
import ContactUs from "./pages/Contact/ContactUs";
import Subscribe from "./pages/Subscribe/Subscribe";
import Wholesale from "./pages/Wholesale/Wholesale";
import Blog from "./pages/Blog/Blog";
import Story from "./pages/Story/Story";
import StoreLocator from "./pages/StoreLocator/StoreLocator";
import Home from "./pages/Home/Home";
import AboutUs from "./pages/AboutUs/AboutUs";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Delete from "./components/Delete";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy/ShippingPolicy";
import TermAndConditions from "./pages/TermAndConditions/TermAndConditions";
import Countries from "./pages/Countries/Countries";
import ErrorPage from "./pages/Error/ErrorPage";
import client from "./api/client";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("adminToken") ? true : false
  );

  // Verify admin role on mount
  useEffect(() => {
    const verifyAdminRole = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Check admin info from localStorage first
        const adminInfo = localStorage.getItem("adminInfo");
        if (adminInfo) {
          const user = JSON.parse(adminInfo);
          if (user.role === "admin") {
            setIsAuthenticated(true);
            return;
          }
        }

        // Verify with backend
        const res = await client.get("/auth/me");
        const user = res?.data?.user;
        if (user && user.role === "admin") {
          localStorage.setItem("adminInfo", JSON.stringify(user));
          setIsAuthenticated(true);
        } else {
          // Not an admin - clear token and redirect
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminInfo");
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Token invalid or user not admin
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setIsAuthenticated(false);
      }
    };

    verifyAdminRole();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem("adminToken", token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setIsAuthenticated(false);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/error" element={<ErrorPage />} />

        <Route
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />

          <Route path="/layout" element={<Layout />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId/track" element={<TrackOrder />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/product-reviews" element={<ProductReviews />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/story" element={<Story />} />
          <Route path="/store-locator" element={<StoreLocator />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/delete" element={<Delete />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/return" element={<ReturnPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/terms" element={<TermAndConditions />} />
          <Route path="/countries" element={<Countries />} />
        </Route>

        <Route
          path="*"
          element={
            <ErrorPage
              statusCode={404}
              message="The page you were looking for could not be found"
            />
          }
        />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </>
  );
}

export default App;
