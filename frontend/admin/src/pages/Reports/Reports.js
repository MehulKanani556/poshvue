import React, { useState, useEffect } from "react";
import { FiBox, FiDollarSign, FiDownloadCloud, FiShoppingCart, FiUsers } from "react-icons/fi";
import client from "../../api/client";

function Reports() {
  const [reportData, setReportData] = useState({
    daily: [],
    categoryWise: [],
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    TotalSales: "₹0",
    Category: "N/A",
    NewUsers: 0
  });

  const [selectedReport, setSelectedReport] = useState("daily");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);

  useEffect(() => {    
    // Always load all data once so switching tabs is instant
    fetchStats();
    fetchDailySales();
    fetchCategoryWise();
  }, []);

  useEffect(() => {
    if (selectedReport === "daily") {
      fetchDailySales();
    } else if (selectedReport === "category") {
      fetchCategoryWise();
    }
  }, [selectedReport]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await client.get("/reports/stats");
      console.log("Reports stats response:", response.data);
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch reports stats:", err.response?.data || err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchDailySales = async () => {
    try {
      setLoadingDaily(true);
      const response = await client.get("/reports/daily-sales", { params: { days: 5 } });
      console.log("Daily sales response:", response.data);
      const dailyData = response.data?.items || response.data || [];
      setReportData(prev => ({ ...prev, daily: Array.isArray(dailyData) ? dailyData : [] }));
    } catch (err) {
      console.error("Failed to fetch daily sales:", err.response?.data || err.message);
      setReportData(prev => ({ ...prev, daily: [] }));
    } finally {
      setLoadingDaily(false);
    }
  };

  const normalizeNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const cleaned = String(value).replace(/[₹,$\s]/g, "").replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const fetchCategoryWise = async () => {
    try {
      setLoadingCategory(true);
      const response = await client.get("/reports/category-wise");
      console.log("Category-wise sales response:", response.data);
      const categoryData = response.data?.items || response.data || [];

      const categories = Array.isArray(categoryData) ? categoryData : [];
      const totalRevenue = categories.reduce((sum, cat) => sum + normalizeNumber(cat.revenue), 0);

      const withPercent = categories.map(cat => {
        const revenueNum = normalizeNumber(cat.revenue);
        const percentage = totalRevenue > 0 ? Number(((revenueNum / totalRevenue) * 100).toFixed(2)) : 0;
        return { ...cat, revenueNum, percentage };
      });

      setReportData(prev => ({ ...prev, categoryWise: withPercent }));
    } catch (err) {
      console.error("Failed to fetch category-wise sales:", err.response?.data || err.message);
      setReportData(prev => ({ ...prev, categoryWise: [] }));
    } finally {
      setLoadingCategory(false);
    }
  };

  const downloadReport = (format) => {
    alert(`Downloading ${selectedReport} report in ${format} format...`);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 10px 0", color: '#2b4d6e' }}>Reports</h1>
        <p style={{ color: "#7f8c8d", margin: 0 }}>View and analyze sales and business metrics</p>
      </div>
      <div className="row g-4 mb-4">

        {/* Total Orders */}
        <div className="col-xl-3 col-lg-6 col-md-6 col-sm-12">
          <div className="x_stat-card h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="x_stat-label">Total Orders</div>
                <div className="x_stat-value">{stats.totalOrders}</div>               
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
                  {stats.TotalSales}
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
                <div className="x_stat-label">New Users</div>
                <div className="x_stat-value" style={{ color: "#f39c12" }}>
                 {stats.NewUsers}
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
                <div className="x_stat-label">Top Category</div>
                <div className="x_stat-value" style={{ color: "#e74c3c" }}>
                  {stats.Category}
                </div>
              </div>
              <FiUsers size={32} style={{ color: "#e74c3c", opacity: 0.3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Report Selection */}
      <div className="x_card" style={{ marginBottom: "20px" }}>
        <div className="x_card-body" >
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap"}}>
            <button
              className={`x_btn ${selectedReport === "daily" ? "x_btn-primary" : "x_btn-secondary"}`}
              onClick={() => setSelectedReport("daily")}
            >
              Daily Sales
            </button>
            <button
              className={`x_btn ${selectedReport === "category" ? "x_btn-primary" : "x_btn-secondary"}`}
              onClick={() => setSelectedReport("category")}
            >
              Category Wise
            </button>
          </div>

        </div>
      </div>

      {/* Daily Sales Report */}
      {selectedReport === "daily" && (
        <div className="x_card">
          <div className="x_card-header">
            <h2>Daily Sales Report</h2>
          </div>
          <div className="x_card-body">
            {loadingDaily && <p style={{ textAlign: "center", color: "#666" }}>Loading daily sales...</p>}
            
            {!loadingDaily && reportData.daily.length === 0 && (
              <p style={{ textAlign: "center", color: "#666" }}>No daily sales data found</p>
            )}
            
            {!loadingDaily && reportData.daily.length > 0 && (
              <div className="x_table-wrapper">
                <table className="x_data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Products Sold</th>
                      <th>New Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.daily.map((item, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{item.date}</td>
                        <td>{item.orders}</td>
                        <td style={{ fontWeight: 600, color: "#27ae60" }}>{item.revenue}</td>
                        <td>{item.products}</td>
                        <td>{item.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            {/* <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #ecf0f1",
              }}
            >
              <div className="x_grid x_grid-4">
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    Total Orders
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>618</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    Total Revenue
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#27ae60" }}>
                    $21,390
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    Avg Revenue / Order
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>$34.60</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    New Users
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>129</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      )}

      {/* Category Wise Report */}
      {selectedReport === "category" && (
        <div className="x_card">
          <div className="x_card-header">
            <h2>Category Wise Sales Report</h2>
          </div>
              <div className="x_card-body">
            {loadingCategory && <p style={{ textAlign: "center", color: "#666" }}>Loading category-wise sales...</p>}
            
            {!loadingCategory && reportData.categoryWise.length === 0 && (
              <p style={{ textAlign: "center", color: "#666" }}>No category-wise sales data found</p>
            )}
            
            {!loadingCategory && reportData.categoryWise.length > 0 && (
              <div className="x_table-wrapper">
                <table className="x_data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Sales</th>
                      <th>Revenue</th>
                      <th>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.categoryWise.map((item, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>{item.category}</td>
                        <td>{item.sales}</td>
                        <td style={{ fontWeight: 600, color: "#27ae60" }}>{item.revenue}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                flex: 1,
                                height: "6px",
                                backgroundColor: "#ecf0f1",
                                borderRadius: "3px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${item.percentage || 0}%`,
                                  backgroundColor: "#0a2845",
                                }}
                              />
                            </div>
                            <span style={{ minWidth: "30px", fontSize: "12px", fontWeight: 600 }}>
                              {(item.percentage || 0).toFixed ? item.percentage.toFixed(2) : item.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary */}
            {/* <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #ecf0f1",
              }}
            >
              <div className="x_grid x_grid-3">
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    Total Sales
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>1,370</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    Total Revenue
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#27ae60" }}>
                    $44,000
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#7f8c8d" }}>
                    Top Category
                  </p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Electronics</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
