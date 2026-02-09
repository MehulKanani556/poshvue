import React, { useState, useEffect } from "react";
import { FiTrendingUp, FiBox, FiDollarSign, FiUsers } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import client from "../api/client";

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: "₹0",
    totalProducts: 0,
    totalUsers: 0,
    orderChange: 0,
    revenueChange: 0,
    productChange: 0,
    userChange: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
    fetchTopProducts();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await client.get("/dashboard/stats");
      console.log("Dashboard stats response:", response.data);
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err.response?.data || err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await client.get("/dashboard/recent-orders", { params: { limit: 5 } });
      console.log("Recent orders response:", response.data);
      setRecentOrders(response.data.items || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err.response?.data || err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await client.get("/dashboard/top-products", { params: { limit: 5 } });
      console.log("Top products response:", response.data);
      setTopProducts(response.data.items || []);
    } catch (err) {
      console.error("Failed to fetch top products:", err.response?.data || err.message);
    } finally {
      setLoadingProducts(false);
    }
  };


  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    const colors = {
      delivered: { bg: "#d4edda", text: "#155724" },
      paid: { bg: "#d4edda", text: "#155724" },
      shipped: { bg: "#d1ecf1", text: "#0c5460" },
      pending: { bg: "#f8d7da", text: "#721c24" },
      cancelled: { bg: "#f5c6cb", text: "#721c24" },
    };
    return colors[statusLower] || { bg: "#e2e3e5", text: "#383d41" };
  };

  return (
    <div>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 20px 0",  color: '#2b4d6e' }}>
          Dashboard
        </h1>
      </div>

      {/* Stats Cards (Bootstrap Grid) */}
      <div className="row g-4 mb-4">
        {/* Total Orders */}
        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className="x_stat-card h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="x_stat-label">Total Orders</div>
                <div className="x_stat-value">{stats.totalOrders}</div>
                <div className="x_stat-change">
                  ↑ {stats.orderChange}% from last month
                </div>
              </div>
              <FiShoppingCart size={32} style={{ color: "#0a2845", opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className="x_stat-card h-100" style={{ borderLeftColor: "#27ae60" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="x_stat-label">Total Revenue</div>
                <div className="x_stat-value" style={{ color: "#27ae60" }}>
                  {stats.totalRevenue}
                </div>
                <div className="x_stat-change">
                  ↑ {stats.revenueChange}% from last month
                </div>
              </div>
              <FiDollarSign size={32} style={{ color: "#27ae60", opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className="x_stat-card h-100" style={{ borderLeftColor: "#f39c12" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="x_stat-label">Total Products</div>
                <div className="x_stat-value" style={{ color: "#f39c12" }}>
                  {stats.totalProducts}
                </div>
                <div className="x_stat-change">
                  ↑ {stats.productChange}% from last month
                </div>
              </div>
              <FiBox size={32} style={{ color: "#f39c12", opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className="x_stat-card h-100" style={{ borderLeftColor: "#e74c3c" }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="x_stat-label">Total Users</div>
                <div className="x_stat-value" style={{ color: "#e74c3c" }}>
                  {stats.totalUsers}
                </div>
                <div className="x_stat-change">
                  ↑ {stats.userChange}% from last month
                </div>
              </div>
              <FiUsers size={32} style={{ color: "#e74c3c", opacity: 0.3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <section>
        {/* Table Section */}
        <div className="x_card ">
          <div className="x_card-header">
            <h2>Recent Orders</h2>
          </div>
          <div className="x_card-body">
            {loadingOrders && <p style={{ textAlign: "center", color: "#666" }}>Loading orders...</p>}
            
            {!loadingOrders && recentOrders.length === 0 && (
              <p style={{ textAlign: "center", color: "#666" }}>No orders found</p>
            )}
            
            {!loadingOrders && recentOrders.length > 0 && (
              <div className="x_table-wrapper">
                <table className="x_data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const statusColor = getStatusColor(order.status);
                      const orderDate = new Date(order.createdAt).toLocaleDateString();
                      return (
                        <tr key={order._id}>
                          <td>{order._id.substring(0, 8)}...</td>
                          <td>{order.customerName || order.shippingInfo?.firstName || 'N/A'}</td>
                          <td>₹{order.total || order.subTotal || 0}</td>
                          <td>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "500",
                                background: statusColor.bg,
                                color: statusColor.text,
                                textTransform: "capitalize"
                              }}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>{orderDate}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="x_card ">
          <div className="x_card-header">
            <h2>Top Products</h2>
          </div>
          <div className="x_card-body">
            {loadingProducts && <p style={{ textAlign: "center", color: "#666" }}>Loading products...</p>}
            
            {!loadingProducts && topProducts.length === 0 && (
              <p style={{ textAlign: "center", color: "#666" }}>No products found</p>
            )}
            
            {!loadingProducts && topProducts.length > 0 && (
              <div className="x_table-wrapper">
                <table className="x_data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Total Orders</th>
                      <th>Color</th>
                      {/* <th>Size</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, idx) => (
                      console.log(product,"prd"),
                      <tr key={idx}>
                        <td>{product.title}</td>
                        <td>₹{product.price}</td>
                        <td>{product.quantity}</td>
                        <td>{product.color || "N/A"}</td>
                        {/* <td>{product.size || "N/A"}</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


export default Dashboard;
