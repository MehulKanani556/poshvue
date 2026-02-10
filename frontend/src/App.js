import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./styles/z_style.css";
import "./admin/styles/x_admin.css";
import "./admin/styles/x_table.css";

import { CurrencyProvider } from "./context/CurrencyContext";
import adminClient from "./api/adminClient";
import client from "./api/client";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./admin/components/Layout";

import AdminLogin from "./admin/pages/Auth/Login";
import Dashboard from "./admin/pages/Dashboard";
import Categories from "./admin/pages/Categories/Categories";
import Products from "./admin/pages/Products/Products";
import Orders from "./admin/pages/Orders/Orders";
import TrackOrder from "./admin/pages/Orders/TrackOrder";
import Coupons from "./admin/pages/Coupons/Coupons";
import Users from "./admin/pages/Users/Users";
import Reports from "./admin/pages/Reports/Reports";
import Reviews from "./admin/pages/Reviews/Reviews";
import ProductReviews from "./admin/pages/ProductReviews/ProductReviews";
import Feedback from "./admin/pages/Feedback/Feedback";
import Complaints from "./admin/pages/Complaints/Complaints";
import Contact from "./admin/pages/Contact/Contact";
import ContactUs from "./admin/pages/Contact/ContactUs";
import Subscribe from "./admin/pages/Subscribe/Subscribe";
import Wholesale from "./admin/pages/Wholesale/Wholesale";
import Blog from "./admin/pages/Blog/Blog";
import Story from "./admin/pages/Story/Story";
import StoreLocator from "./admin/pages/StoreLocator/StoreLocator";
import Home from "./admin/pages/Home/Home";
import AboutUs from "./admin/pages/AboutUs/AboutUs";
import Delete from "./admin/components/Delete";
import PrivacyPolicy from "./admin/pages/PrivacyPolicy/PrivacyPolicy";
import ReturnPolicy from "./admin/pages/ReturnPolicy/ReturnPolicy";
import ShippingPolicy from "./admin/pages/ShippingPolicy/ShippingPolicy";
import TermAndConditions from "./admin/pages/TermAndConditions/TermAndConditions";
import Countries from "./admin/pages/Countries/Countries";
import ErrorPage from "./admin/pages/Error/ErrorPage";

import Header from "./user/component/Header";
import Footer from "./user/component/Footer";
import Main from "./user/container/Main";
import Register from "./user/container/Register";
import Cart from "./user/container/Cart";
import Checkout from "./user/container/Checkout";
import Profile from "./user/container/Profile";
import Wishlist from "./user/container/Wishlist";
import Complain from "./user/container/Complain";
import WholesaleUser from "./user/container/Wholesale";
import AboutUsUser from "./user/component/AboutUs";
import ContactUsUser from "./user/component/ContactUs";
import OurStory from "./user/component/OurStory";
import StoreLocatorUser from "./user/component/StoreLocator";
import PrivacyPolicyUser from "./user/component/PrivacyPolicy";
import ReturnPolicyUser from "./user/component/ReturnPolicy";
import TermAndConditionsUser from "./user/component/TermAndConditions";
import ShopPage from "./user/component/ShopPage";
import SalePage from "./user/component/SalePage";
import ProductDetailPage from "./user/component/ProductDetailPage";
import BlogUser from "./user/component/Blog";
import BlogDetail from "./user/component/BlogDetail";
import Review from "./user/component/Review";
import GeneralFeedback from "./user/component/GeneralFeedback";
import ShippingPolicyUser from "./user/component/ShippingPolicy";
import TrackOrderUser from "./user/component/TrackOrder";
import SearchPage from "./user/component/Searchpage";
import CountryRestriction from "./user/component/CountryRestriction";
import Product from "./user/component/Product";
import HeroSlider from "./user/component/HeroSlider";
import HomeSlider from "./user/component/HomeSlider";
import HomePoster from "./user/component/HomePoster";

function App() {
  const [adminAuthenticated, setAdminAuthenticated] = useState(
    !!localStorage.getItem("adminToken")
  );

  // User token validation (for storefront header/profile)
  useEffect(() => {
    const validateUser = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      try {
        const res = await client.get("/auth/me");
        const user = res?.data?.user;
        if (user) localStorage.setItem("userInfo", JSON.stringify(user));
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("userToken");
          localStorage.removeItem("userInfo");
        }
      }
    };
    validateUser();
  }, []);

  useEffect(() => {
    const verifyAdminRole = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setAdminAuthenticated(false);
        return;
      }
      try {
        const adminInfo = localStorage.getItem("adminInfo");
        if (adminInfo) {
          const user = JSON.parse(adminInfo);
          if (user.role === "admin") {
            setAdminAuthenticated(true);
            return;
          }
        }
        const res = await adminClient.get("/auth/me");
        const user = res?.data?.user;
        if (user && user.role === "admin") {
          localStorage.setItem("adminInfo", JSON.stringify(user));
          setAdminAuthenticated(true);
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminInfo");
          setAdminAuthenticated(false);
        }
      } catch (err) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setAdminAuthenticated(false);
      }
    };
    verifyAdminRole();
  }, []);

  const handleAdminLogin = (token) => {
    localStorage.setItem("adminToken", token);
    setAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdminAuthenticated(false);
  };

  return (
    <>
      <Routes>
        {/* ========== ADMIN ROUTES (only admin role can access) ========== */}
        <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
        <Route path="/admin/error" element={<ErrorPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={adminAuthenticated}>
              <Layout onLogout={handleAdminLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId/track" element={<TrackOrder />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="product-reviews" element={<ProductReviews />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="contact" element={<Contact />} />
          <Route path="contact-us" element={<ContactUs />} />
          <Route path="subscribe" element={<Subscribe />} />
          <Route path="wholesale" element={<Wholesale />} />
          <Route path="blog" element={<Blog />} />
          <Route path="story" element={<Story />} />
          <Route path="store-locator" element={<StoreLocator />} />
          <Route path="home" element={<Home />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="delete" element={<Delete />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="return" element={<ReturnPolicy />} />
          <Route path="shipping" element={<ShippingPolicy />} />
          <Route path="terms" element={<TermAndConditions />} />
          <Route path="countries" element={<Countries />} />
          <Route path="*" element={<ErrorPage statusCode={404} message="The page you were looking for could not be found" />} />
        </Route>

        {/* ========== USER ROUTES (storefront – users cannot access /admin/*) ========== */}
        <Route
          path="*"
          element={
            <CurrencyProvider>
              <CountryRestriction>
                <div>
                  <Header />
                  <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/Register" element={<Register />} />
                    <Route path="/heroslider" element={<HeroSlider />} />
                    <Route path="/ShopPage" element={<ShopPage />} />
                    <Route path="/SalePage" element={<SalePage />} />
                    <Route path="/HomeSlider" element={<HomeSlider />} />
                    <Route path="/HomePoster" element={<HomePoster />} />
                    <Route path="/TermAndConditions" element={<TermAndConditionsUser />} />
                    <Route path="/Cart" element={<Cart />} />
                    <Route path="/Checkout" element={<Checkout />} />
                    <Route path="/AboutUs" element={<AboutUsUser />} />
                    <Route path="/ContactUs" element={<ContactUsUser />} />
                    <Route path="/OurStory" element={<OurStory />} />
                    <Route path="/StoreLocator" element={<StoreLocatorUser />} />
                    <Route path="/PrivacyPolicy" element={<PrivacyPolicyUser />} />
                    <Route path="/ReturnPolicy" element={<ReturnPolicyUser />} />
                    <Route path="/Wishlist" element={<Wishlist />} />
                    <Route path="/Profile" element={<Profile />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/pro" element={<Product />} />
                    <Route path="/Blog" element={<BlogUser />} />
                    <Route path="/blog" element={<BlogUser />} />
                    <Route path="/blog/:slug" element={<BlogDetail />} />
                    <Route path="/Review" element={<Review />} />
                    <Route path="/GeneralFeedback" element={<GeneralFeedback />} />
                    <Route path="/ShippingPolicy" element={<ShippingPolicyUser />} />
                    <Route path="/TrackOrder" element={<TrackOrderUser />} />
                    <Route path="/Complain" element={<Complain />} />
                    <Route path="/wholesale" element={<WholesaleUser />} />
                    <Route path="/search" element={<SearchPage />} />
                  </Routes>
                  <Footer />
                </div>
              </CountryRestriction>
            </CurrencyProvider>
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
