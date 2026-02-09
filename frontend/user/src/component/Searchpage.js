import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import client from "../api/client";
import Loader from "./Loader";

const SearchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const searchTerm = queryParams.get('q') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        if (searchTerm) {
            fetchProducts();
        }
    }, [searchTerm, page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await client.get(
                `/catalog/products?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`
            );
            setProducts(response.data.items || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "20px" }}>
                Search Results for "{searchTerm}"
                {total > 0 && <span style={{ fontSize: "16px", color: "#666", marginLeft: "10px" }}>
                    ({total} products found)
                </span>}
            </h1>

            {loading ? (
               <Loader fullScreen  text="Loading Data..." />
            ) : products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    No products found for "{searchTerm}"
                </div>
            ) : (
                <>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "20px"
                    }}>
                        {products.map((product) => (
                            <div
                                key={product._id}
                                style={{
                                    border: "1px solid #eee",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    cursor: "pointer",
                                    transition: "transform 0.2s, box-shadow 0.2s"
                                }}
                                onClick={() => handleProductClick(product._id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {product.images && product.images[0] && (
                                    <img
                                        src={product.images[0]}
                                        alt={product.title}
                                        style={{
                                            width: "100%",
                                            height: "200px",
                                            objectFit: "cover",
                                            borderRadius: "4px",
                                            marginBottom: "12px"
                                        }}
                                        onError={(e) => {
                                            e.target.src = "https://via.placeholder.com/250x200?text=No+Image";
                                        }}
                                    />
                                )}
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
                                    {product.title}
                                </h3>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {product.salePrice ? (
                                        <>
                                            <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "18px" }}>
                                                ₹{product.salePrice}
                                            </span>
                                            {product.price && product.price > product.salePrice && (
                                                <span style={{ textDecoration: "line-through", color: "#999" }}>
                                                    ₹{product.price}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        product.price && (
                                            <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                                                ₹{product.price}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {total > limit && (
                        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px", gap: "8px" }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #ddd",
                                    background: page === 1 ? "#7fb0df1f" : "#fff",
                                    cursor: page === 1 ? "not-allowed" : "pointer"
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ padding: "8px 16px", alignSelf: "center" }}>
                                Page {page} of {Math.ceil(total / limit)}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(total / limit)}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #ddd",
                                    background: page >= Math.ceil(total / limit) ? "#7fb0df1f" : "#fff",
                                    cursor: page >= Math.ceil(total / limit) ? "not-allowed" : "pointer"
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchPage;