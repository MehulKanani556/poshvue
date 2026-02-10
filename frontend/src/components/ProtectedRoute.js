import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import adminClient from "../api/adminClient";

/**
 * Protects admin routes. Only users with role "admin" and valid adminToken can access.
 * Users (without admin role) are redirected to /admin/login and cannot access admin files.
 */
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
        const adminInfo = localStorage.getItem("adminInfo");
        if (adminInfo) {
          const user = JSON.parse(adminInfo);
          if (user.role === "admin") {
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }

        const res = await adminClient.get("/auth/me");
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
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
