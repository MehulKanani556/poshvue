import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import client from "../api/client";

function ProtectedRoute({ isAuthenticated, children }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // Get user info from localStorage first
        const adminInfo = localStorage.getItem("adminInfo");
        if (adminInfo) {
          const user = JSON.parse(adminInfo);
          if (user.role === "admin") {
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }

        // If not in localStorage, verify with backend
        const res = await client.get("/auth/me");
        const user = res?.data?.user;
        if (user && user.role === "admin") {
          setIsAdmin(true);
          localStorage.setItem("adminInfo", JSON.stringify(user));
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [isAuthenticated]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
