import React, { useState, useEffect } from "react";
import { FiEdit2, FiEye, FiSave, FiPlus, FiTrash2, FiMapPin, FiPhone, FiMail, FiClock, FiHome, FiTarget, FiStar, FiHeart, FiGift, FiAward, FiTrendingUp, FiMessageCircle, FiCheckCircle, FiBriefcase, FiCompass } from "react-icons/fi";
import { FaCrown, FaPhone as FaPhoneIcon, FaEnvelope, FaClock as FaClockIcon, FaHome as FaHomeIcon, FaAward as FaAwardIcon, FaStar as FaStarIcon, FaHeart as FaHeartIcon, FaGift as FaGiftIcon, FaTrophy, FaChartLine, FaComment, FaCheckCircle as FaCheckCircleIcon, FaBriefcase as FaBriefcaseIcon, FaCompass as FaCompassIcon, FaMapMarkerAlt, FaHandshake, FaSmile, FaThumbsUp, FaLightbulb, FaRocket, FaFire, FaLeaf, FaWater } from "react-icons/fa";
import { Facebook, Instagram, Youtube, Send } from 'lucide-react';
import client from "../../api/client";

function ContactUs() {
    const [pageData, setPageData] = useState(null);
    const [pageLoading, setPageLoading] = useState(false);
    const [savingPage, setSavingPage] = useState(false);
    const [mode, setMode] = useState('edit');

    // Icon mapping for preview
    const iconMap = {
        // Lucide React Icons
        MapPin: <FiMapPin size={24} />,
        Phone: <FiPhone size={24} />,
        Mail: <FiMail size={24} />,
        Clock: <FiClock size={24} />,
        Home: <FiHome size={24} />,
        Target: <FiTarget size={24} />,
        Star: <FiStar size={24} />,
        Heart: <FiHeart size={24} />,
        Gift: <FiGift size={24} />,
        Award: <FiAward size={24} />,
        TrendingUp: <FiTrendingUp size={24} />,
        MessageCircle: <FiMessageCircle size={24} />,
        CheckCircle: <FiCheckCircle size={24} />,
        Briefcase: <FiBriefcase size={24} />,
        Compass: <FiCompass size={24} />,

        // FontAwesome Icons
        FaCrown: <FaCrown size={24} />,
        FaPhone: <FaPhoneIcon size={24} />,
        FaEnvelope: <FaEnvelope size={24} />,
        FaClock: <FaClockIcon size={24} />,
        FaHome: <FaHomeIcon size={24} />,
        FaAward: <FaAwardIcon size={24} />,
        FaStar: <FaStarIcon size={24} />,
        FaHeart: <FaHeartIcon size={24} />,
        FaGift: <FaGiftIcon size={24} />,
        FaTrophy: <FaTrophy size={24} />,
        FaChartLine: <FaChartLine size={24} />,
        FaComment: <FaComment size={24} />,
        FaCheckCircle: <FaCheckCircleIcon size={24} />,
        FaBriefcase: <FaBriefcaseIcon size={24} />,
        FaCompass: <FaCompassIcon size={24} />,
        FaMapMarkerAlt: <FaMapMarkerAlt size={24} />,
        FaHandshake: <FaHandshake size={24} />,
        FaSmile: <FaSmile size={24} />,
        FaThumbsUp: <FaThumbsUp size={24} />,
        FaLightbulb: <FaLightbulb size={24} />,
        FaRocket: <FaRocket size={24} />,
        FaFire: <FaFire size={24} />,
        FaLeaf: <FaLeaf size={24} />,
        FaWater: <FaWater size={24} />,
    };

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setPageLoading(true);
                const res = await client.get('/contact-page');
                setPageData(res.data || null);
            } catch (err) {
                setPageData(null);
            } finally {
                setPageLoading(false);
            }
        };
        fetchPage();
    }, []);

    const handlePageChange = (field, value) => {
        setPageData(prev => ({ ...(prev || {}), [field]: value }));
    };

    const handleCardChange = (index, field, value) => {
        const cards = (pageData?.infoCards || []).slice();
        cards[index] = { ...(cards[index] || {}), [field]: value };
        setPageData(prev => ({ ...(prev || {}), infoCards: cards }));
    };

    const addCard = () => {
        setPageData(prev => ({ ...(prev || {}), infoCards: [...(prev?.infoCards || []), { icon: '', title: '', text: '' }] }));
    };

    const removeCard = (index) => {
        const cards = (pageData?.infoCards || []).filter((_, i) => i !== index);
        setPageData(prev => ({ ...(prev || {}), infoCards: cards }));
    };

    const savePage = async () => {
        try {
            setSavingPage(true);
            await client.put('/contact-page', pageData || {});
            alert('Contact page saved');
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to save page');
        } finally {
            setSavingPage(false);
        }
    };

    return (
        <div className="x_page">
            <style>{`
        .admin_edit_form { margin: 0 auto;  }
        .x_card { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px; overflow: hidden; border: 1px solid #eee; }
        .x_card_header { background: #f8f9fa; padding: 15px 25px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .x_card_header h3 { margin: 0; font-size: 1.1rem; color: #0a2845c2; font-weight: 600; }
        .x_card_body { padding: 25px; }
        .grid_2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .x_form_group { margin-bottom: 20px; }
        .x_form_group label { display: block; margin-bottom: 8px; font-weight: 500; color: #555; font-size: 0.9rem; }
        .x_form_group input, .x_form_group textarea { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95rem; transition: border-color 0.3s; }
        .x_form_group input:focus, .x_form_group textarea:focus { outline: none; border-color: #b08d57; }
        .array_item_card { background: #fcfcfc; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 15px; position: relative; }
        .btn_remove { position: absolute; top: 10px; right: 10px; background: #fff1f1; color: #dc3545; border: 1px solid #fdcccc; padding: 5px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; }
        .btn_remove:hover { background: #dc3545; color: #fff; }
        .btn_add { background: #fff; color: #b08d57; border: 1px dashed #b08d57; padding: 10px 20px; border-radius: 6px; width: 100%; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s; }
        .btn_add:hover { background: #fdf8f3; }
        .x_page_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;  }
        .x_page_header h3{margin-bottom:9px;   color: #2b4d6e}
        .x_btn { padding: 10px 20px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .x_btn-primary { background: #0a2845; color: #fff; }
        .x_btn-secondary { background: #f0f0f0; color: #2b4d6e; }
        @media (max-width: 768px) { .grid_2 { grid-template-columns: 1fr; } .x_page_header{ flex-direction: column;} .x_card_body{padding:6px 0px;} .x_form_group{ margin-bottom:15px;} }
        @media (max-width: 425px) { .x_header_btn{ flex-direction: column;width:100%;} .x_page_header h1{font-size:23px;} }
      `}</style>

            <div className="x_page_header">
                <h3 style={{color: '#2b4d6e'}}>Contact Us Management</h3>
                <div style={{ display: 'flex', gap: '10px' }} className="x_header_btn">
                    <button className="x_btn x_btn-secondary" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
                        <FiEye /> {mode === 'edit' ? 'Switch to Preview' : 'Back to Edit'}
                    </button>
                    {mode === 'edit' && (
                        <button className="x_btn x_btn-primary" onClick={savePage} disabled={savingPage}>
                            <FiSave /> {savingPage ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>

            <div className="container">
                <div className="x_card">
                    <div className="x_card_header">
                        <h3>Contact Page Content</h3>
                    </div>
                    <div className="x_card_body">
                        {pageLoading ? <div>Loading page...</div> : (
                            mode === 'edit' ? (
                                <div className="admin_edit_form">
                                    <div className="grid_2">
                                        <div className="x_form_group">
                                            <label>Title</label>
                                            <input value={pageData?.title || ''} onChange={(e) => handlePageChange('title', e.target.value)} />
                                        </div>
                                        <div className="x_form_group">
                                            <label>Breadcrumb</label>
                                            <input value={pageData?.breadcrumb || ''} onChange={(e) => handlePageChange('breadcrumb', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="x_form_group">
                                        <label>Banner Image URL</label>
                                        <input value={pageData?.bannerImage || ''} onChange={(e) => handlePageChange('bannerImage', e.target.value)} />
                                    </div>
                                    <div className="x_form_group">
                                        <label>Form Intro Text</label>
                                        <textarea rows={3} value={pageData?.formIntro || ''} onChange={(e) => handlePageChange('formIntro', e.target.value)} />
                                    </div>
                                    <div className="x_form_group">
                                        <label>Info Cards</label>
                                        {(pageData?.infoCards || []).map((card, idx) => (
                                            <div key={idx} className="array_item_card">
                                                <button type="button" className="btn_remove" onClick={() => removeCard(idx)}><FiTrash2 /></button>
                                                <div className="x_form_group">
                                                    <label>Icon Name (e.g., FaCrown, FaPhone, MapPin)</label>
                                                    <input
                                                        type="text"
                                                        value={card.icon || ''}
                                                        onChange={(e) => handleCardChange(idx, 'icon', e.target.value)}
                                                        placeholder="Enter icon name"
                                                    />
                                                </div>
                                                <div className="x_form_group"><label>Title</label><input value={card.title || ''} onChange={(e) => handleCardChange(idx, 'title', e.target.value)} /></div>
                                                <div className="x_form_group"><label>Text</label><input value={card.text || ''} onChange={(e) => handleCardChange(idx, 'text', e.target.value)} /></div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn_add" onClick={addCard}><FiPlus /> Add Card</button>
                                    </div>
                                    <div className="x_form_group">
                                        <label>Map Embed Src</label>
                                        <input value={pageData?.mapSrc || ''} onChange={(e) => handlePageChange('mapSrc', e.target.value)} />
                                    </div>
                                    <div className="grid_2">
                                        <div className="x_form_group">
                                            <label>Facebook Link</label>
                                            <input value={pageData?.followLinks?.facebook || ''} onChange={(e) => handlePageChange('followLinks', { ...(pageData?.followLinks || {}), facebook: e.target.value })} />
                                        </div>
                                        <div className="x_form_group">
                                            <label>Instagram Link</label>
                                            <input value={pageData?.followLinks?.instagram || ''} onChange={(e) => handlePageChange('followLinks', { ...(pageData?.followLinks || {}), instagram: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="x_form_group">
                                        <label>Youtube Link</label>
                                        <input value={pageData?.followLinks?.youtube || ''} onChange={(e) => handlePageChange('followLinks', { ...(pageData?.followLinks || {}), youtube: e.target.value })} />
                                    </div>
                                    <div className="grid_2">
                                        <div className="x_form_group"><label>Contact Phone</label><input value={pageData?.contactPhone || ''} onChange={(e) => handlePageChange('contactPhone', e.target.value)} /></div>
                                        <div className="x_form_group"><label>Contact Email</label><input value={pageData?.contactEmail || ''} onChange={(e) => handlePageChange('contactEmail', e.target.value)} /></div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: '#fff' }}>
                                    <style>{`
                                    .preview_d_contact-wrapper { color: #2b4d6e; background-color: #fff; }
                                    .preview_d_contact-header { background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${pageData?.bannerImage || 'https://via.placeholder.com/1200x400'}'); background-size: cover; background-position: center; padding: 80px 0; text-align: center; color: #fff; }
                                    .preview_d_page-title { font-size: 36px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
                                    .preview_d_breadcrumb { font-size: 14px; color: #ddd; text-transform: uppercase; letter-spacing: 1px; }
                                    .preview_d_info-card { padding: 25px; background: #fff; border: 1px solid #eee; text-align: center; transition: 0.3s; height: 100%; }
                                    .preview_d_info-card:hover { border-color: #c5a059; transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                                    .preview_d_icon-circle { width: 50px; height: 50px; background: #fdf8f3; color: #c5a059; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto 15px auto; font-size: 22px; }
                                    .preview_d_form-card { background: #fff; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); border-radius: 12px; }
                                    .preview_d_input-field { border: 1px solid #eee; background: #fcfcfc; padding: 12px; font-size: 14px; border-radius: 6px; width: 100%; margin-bottom: 15px; outline: none; }
                                    .preview_d_submit-btn { background: #2b4d6e; color: #fff; border: none; padding: 12px 25px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; width: 100%; border-radius: 6px; cursor: pointer; }
                                    .preview_d_map-container { height: 350px; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
                                    .d_form-card {
          background: #fff;
          padding: clamp(20px, 5vw, 40px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          border-radius: 12px;          
        }
          .d_input-field {
          border: 1px solid #eee;
          background: #fcfcfc;
          padding: 14px;
          font-size: 14px;
          border-radius: 6px;
          width: 100%;
          margin-bottom: 20px;
          outline: none;
          transition: 0.3s;
        }

        .d_input-field:focus {
          border-color: #c5a059;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.1);
        }

        .d_submit-btn {
          background: #2b4d6e;
          color: #fff;
          border: none;
          padding: 14px 30px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 1px;
          transition: 0.3s;
          width: 100%;
          border-radius: 6px;
        }

        .d_submit-btn:hover {
          background: #0a2845;
          transform: translateY(-2px);
        }

        .d_map-container {
          height: 400px;
          border-radius: 12px;
          overflow: hidden;
        }
          .d_map-wrapper {
  width: 100%;
}

.d_map-container {
  width: 100%;
  height: 350px;
  border-radius: 12px;
  overflow: hidden;
}

.d_map-container iframe {
  width: 100% !important;
  height: 100% !important;
  border: 0;
}

.custom-gutter {
  --bs-gutter-x: 1.5rem !important;
}

        @media (max-width: 992px) {
          .preview_d_contact-header { padding: 70px 15px; }
          .preview_d_page-title { font-size: 2rem; }
          .d_form-card { padding: 30px; }
          .preview_d_map-container { height: 350px; }
          section > div[style*="grid"] { grid-template-columns: 1fr !important; gap: 30px !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .preview_d_contact-header { padding: 60px 15px; }
          .preview_d_page-title { font-size: 1.6rem; }
          .d_form-card { padding: 20px; }
          .d_input-field { margin-bottom: 15px; padding: 10px 12px; }
          .d_submit-btn { padding: 12px 20px; font-size: 0.9rem; }
          .preview_d_map-container { height: 300px; }
          .preview_d_info-card { padding: 20px 15px; margin-bottom: 10px; }
          .preview_d_icon-circle { width: 50px; height: 50px; }
          section > div[style*="grid"] { grid-template-columns: 1fr !important; gap: 20px !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 480px) {
          .preview_d_contact-header { padding: 50px 12px; }
          .preview_d_page-title { font-size: 1.3rem; }
          .preview_d_breadcrumb { font-size: 12px; }
          .d_form-card { padding: 15px; }
          .d_form-card h3 { font-size: 1.3rem; }
          .d_form-card .text-muted { font-size: 0.85rem; }
          .d_input-field { padding: 9px 10px; font-size: 14px; margin-bottom: 12px; }
          .d_submit-btn { padding: 10px 15px; font-size: 0.8rem; }
          .preview_d_map-container { height: 250px; }
          .preview_d_info-card { padding: 15px 10px; }
          .preview_d_icon-circle { width: 45px; height: 45px; font-size: 0.8rem; }
          section > div[style*="grid"] { grid-template-columns: 1fr !important; gap: 15px !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
                                `}</style>

                                    {/* Header Banner */}
                                    <section className="preview_d_contact-header">
                                        <h1 className="preview_d_page-title">{pageData?.title || 'Connect With Us'}</h1>
                                        <div className="preview_d_breadcrumb">{pageData?.breadcrumb || 'Home | Contact Us'}</div>
                                    </section>

                                    {/* Info Cards */}
                                    <section style={{ maxWidth: '100%', overflow: 'hidden', marginTop: '-40px', marginBottom: '50px', padding: '0 15px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', maxWidth: '100%', overflow: 'hidden' }}>
                                            {(pageData?.infoCards || []).map((card, idx) => (
                                                <div key={idx}>
                                                    <div className="preview_d_info-card shadow-sm">
                                                        <div className="preview_d_icon-circle">
                                                            {iconMap[card.icon] || <FiMapPin size={24} />}
                                                        </div>
                                                        <h6 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '12px', marginBottom: '10px', margin: 0, wordWrap: 'break-word' }}>{card.title}</h6>
                                                        <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.5', wordWrap: 'break-word' }}>{card.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Form & Map Section */}
                                    <section className="d_contact-form-container container">
                                        <div className="row g-5 align-items-center">
                                            <div className="col-xl-6 px-xl-3  p-2">
                                                <div className="d_form-card">
                                                    <div className="mb-4">
                                                        <h3 className="fw-bold mb-2">Get In Touch</h3>
                                                        <p className="text-muted small">Have questions about our bridal collection? We'd love to hear from you.</p>
                                                    </div>
                                                   
                                                    <form>
                                                        <div className="row custom-gutter" >
                                                            <div className="col-md-6">
                                                                <input
                                                                    type="text" name="name" placeholder="Full Name"
                                                                    className="d_input-field" required
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <input
                                                                    type="email" name="email" placeholder="Email Address"
                                                                    className="d_input-field" required
                                                                />
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="text" name="subject" placeholder="Subject"
                                                            className="d_input-field"
                                                        />
                                                        <textarea
                                                            name="message" placeholder="Message"
                                                            className="d_input-field" rows="4" required
                                                        ></textarea>

                                                        <button type="submit" className="d_submit-btn">
                                                           Send Message <Send size={16} className="ms-2" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>

                                            <div className="col-xl-6 px-xl-3  p-2">
                                                <div className="d_map-wrapper">
                                                    <div className="d_map-container shadow-sm border mb-4">
                                                        {pageData?.mapSrc ? (
                                                            <div
                                                                dangerouslySetInnerHTML={{ __html: pageData.mapSrc }}
                                                                style={{ height: "100%", width: "100%" }}
                                                            />
                                                        ) : (
                                                            <div className="d_map-fallback">
                                                                Map not configured
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">Follow Us</h6>
                                                            <div className="d-flex gap-3">
                                                                <a href={pageData?.followLinks?.facebook || "#"} className="text-dark"><Facebook size={18} /></a>
                                                                <a href={pageData?.followLinks?.instagram || "#"} className="text-dark"><Instagram size={18} /></a>
                                                                <a href={pageData?.followLinks?.youtube || "#"} className="text-dark"><Youtube size={18} /></a>
                                                            </div>
                                                        </div>

                                                        <div className="text-end">
                                                            <p className="small text-muted mb-0">Need urgent help?</p>
                                                            <h6 className="fw-bold">{pageData?.contactPhone || "+91 81601 81706"}</h6>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </section>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

export default ContactUs;
