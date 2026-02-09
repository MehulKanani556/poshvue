import React, { useState, useEffect } from "react";
import { FiMapPin, FiPhone, FiMail, FiClock } from "react-icons/fi";
import client from "../api/client";
import Loader from "./Loader";

function StoreLocator() {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const res = await client.get('/store-locator');
                setPageData(res.data);
            } catch (err) {
                console.log('Error fetching store locator:', err);
                setPageData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, []);

    if (loading) {
        return <Loader fullScreen  text="Loading Data..." />;
    }
    const openMap = (iframeString) => {
        if (!iframeString) return;

        const match = iframeString.match(/src="([^"]+)"/);
        if (match && match[1]) {
            window.open(match[1], "_blank");
        } else {
            console.error("Invalid iframe string format");
        }
    };
    return (
        <div style={{ background: '#fff' }}>
            <style>{`
                .sl_header {
                    background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${pageData?.bannerImage || 'https://via.placeholder.com/1200x400'}');
                    background-size: cover;
                    background-position: center;
                    padding: 80px 0;
                    text-align: center;
                    color: #fff;
                }
                .sl_title {
                    font-size: 36px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 10px;
                }
                .sl_subtitle {
                    font-size: 16px;
                    color: #ddd;
                }
                .sl_stores_section {
                    padding: 60px 0;
                }
                .sl_store_card {
                   display: flex;
                    background: #fff;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    overflow: hidden;
                    transition: 0.3s;
                    height: 100%;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .sl_store_card:hover {
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    transform: translateY(-5px);
                }
                .sl_store_image {
                    object-fit: cover;
                }
                .sl_store_body {
                    padding: 20px;
                }
                .sl_store_name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #2b4d6e;
                    margin-bottom: 15px;
                }
                .sl_info_item {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    gap: 10px;
                }
                .sl_info_icon {
                    color: #b08d57;
                    font-size: 18px;
                    margin-top: 2px;
                    flex-shrink: 0;
                }
                .sl_info_text {
                    font-size: 13px;
                    color: #666;
                    line-height: 1.4;
                }
                .sl_map_container {
                    width: 100%;
                    height: 250px;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-top: 15px;
                    border: 1px solid #eee;
                }
                .sl_map_container iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .sl_directions_btn {
                    background: #b08d57;
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 15px;
                    width: 100%;
                    text-transform: uppercase;
                    transition: 0.3s;
                }
                .sl_directions_btn:hover {
                    background: #9d7645;
                }
                .sl_directions_btn a {
                    color: #fff;
                    text-decoration: none;
                    display: block;
                }
                .store_directions_btn { background: #b08d57; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 15px; width: 100%; text-transform: uppercase; transition: 0.3s; }
                .store_directions_btn:hover { background: #9d7645; }
                /* ===== MOBILE VIEW ===== */
@media (max-width: 576px) {
  .sl_header {
    padding: 50px 15px;
  }

  .sl_title {
    font-size: 24px;
    letter-spacing: 1px;
  }

  .sl_subtitle {
    font-size: 14px;
  }

  .sl_store_card {
    flex-direction: column; /* image upar, content niche */
  }

  .sl_store_image {
    height: 200px;
    width: 100%;
  }

  .sl_store_body {
    padding: 15px;
  }

  .sl_store_name {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .sl_info_text {
    font-size: 12px;
  }

  .store_directions_btn {
    font-size: 12px;
    padding: 10px;
  }
}

/* ===== TABLET VIEW ===== */
@media (max-width: 768px) {
  .sl_title {
    font-size: 28px;
  }

  .sl_store_card {
    flex-direction: column;
  }

  .sl_store_image {
    height: 220px;
  }
}

            `}</style>

            {/* Header Banner */}
            {pageData && (
                <section className="sl_header">
                    <div className="container">
                        <h1 className="sl_title">{pageData.title || 'Find Our Stores'}</h1>
                        <p className="sl_subtitle">{pageData.subtitle || 'Visit our beautiful locations'}</p>
                    </div>
                </section>
            )}

            {/* Stores Grid */}
            {pageData && pageData.stores && pageData.stores.length > 0 && (
                <section className="sl_stores_section">
                    <div className="container">
                        <div className="row">
                            {pageData.stores.map((store, idx) => (
                                <div key={idx} className="col-xl-6 col-lg-12 col-md-6 col-sm-12 px-2 mb-4">
                                    <div className="sl_store_card">
                                        {store.image && (
                                            <img src={store.image} alt={store.name} className="sl_store_image" />
                                        )}
                                        <div className="sl_store_body">
                                            <h4 className="sl_store_name">{store.name}</h4>

                                            {store.address && (
                                                <div className="sl_info_item">
                                                    <FiMapPin className="sl_info_icon" />
                                                    <div className="sl_info_text">{store.address}</div>
                                                </div>
                                            )}

                                            {store.phone && (
                                                <div className="sl_info_item">
                                                    <FiPhone className="sl_info_icon" />
                                                    <div className="sl_info_text">
                                                        <a href={`tel:${store.phone}`} style={{ color: '#b08d57', textDecoration: 'none' }}>
                                                            {store.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {store.email && (
                                                <div className="sl_info_item">
                                                    <FiMail className="sl_info_icon" />
                                                    <div className="sl_info_text">
                                                        <a href={`mailto:${store.email}`} style={{ color: '#b08d57', textDecoration: 'none' }}>
                                                            {store.email}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {store.hours && (
                                                <div className="sl_info_item">
                                                    <FiClock className="sl_info_icon" />
                                                    <div className="sl_info_text">{store.hours}</div>
                                                </div>
                                            )}

                                            {store.mapUrl && (
                                                <button className="store_directions_btn" onClick={() => openMap(store.mapUrl)}>
                                                    Get Directions
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default StoreLocator;
