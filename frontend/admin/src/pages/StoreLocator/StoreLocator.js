import React, { useState, useEffect } from "react";
import { FiEdit2, FiEye, FiSave, FiPlus, FiTrash2, FiMapPin, FiPhone, FiMail, FiClock } from "react-icons/fi";
import client from "../../api/client";

function StoreLocator() {
    const [pageData, setPageData] = useState(null);
    const [pageLoading, setPageLoading] = useState(false);
    const [savingPage, setSavingPage] = useState(false);
    const [mode, setMode] = useState('edit');

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setPageLoading(true);
                const res = await client.get('/store-locator');
                setPageData(res.data || { stores: [] });
            } catch (err) {
                setPageData({ stores: [] });
            } finally {
                setPageLoading(false);
            }
        };
        fetchPage();
    }, []);

    const handlePageChange = (field, value) => {
        setPageData(prev => ({ ...(prev || {}), [field]: value }));
    };

    const handleStoreChange = (index, field, value) => {
        const stores = (pageData?.stores || []).slice();
        stores[index] = { ...(stores[index] || {}), [field]: value };
        setPageData(prev => ({ ...(prev || {}), stores: stores }));
    };

    const addStore = () => {
        setPageData(prev => ({
            ...(prev || {}),
            stores: [...(prev?.stores || []), {
                name: '',
                address: '',
                phone: '',
                email: '',
                hours: '',
                mapUrl: '',
                image: '',
                lat: 0,
                lng: 0
            }]
        }));
    };

    const removeStore = (index) => {
        const stores = (pageData?.stores || []).filter((_, i) => i !== index);
        setPageData(prev => ({ ...(prev || {}), stores: stores }));
    };

    const savePage = async () => {
        try {
            setSavingPage(true);
            await client.put('/store-locator', pageData || {});
            // alert('Store locator page saved');
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to save page');
        } finally {
            setSavingPage(false);
        }
    };

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
        <div className="x_page">
            <style>{`
        .admin_edit_form { margin: 0 auto; }
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
        .x_page_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .x_page_header h3{margin-bottom:9px;  color: #2b4d6e}
        .x_btn { padding: 10px 20px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .x_btn-primary { background: #0a2845; color: #fff; }
        .x_btn-secondary { background: #f0f0f0; color: #2b4d6e; }
        @media (max-width: 768px) { .grid_2 { grid-template-columns: 1fr; } .x_page_header{ flex-direction: column;} .x_card_body{padding:6px 0px;} .x_form_group{ margin-bottom:15px;} }
        @media (max-width: 425px) { .x_header_btn{ flex-direction: column;width:100%;} .x_page_header h1{font-size:23px;} }
      `}</style>

            <div className="x_page_header">
                <h3>Store Locator Management</h3>
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
                        <h3>Store Locator Page</h3>
                    </div>
                    <div className="x_card_body">
                        {pageLoading ? <div>Loading page...</div> : (
                            mode === 'edit' ? (
                                <div className="admin_edit_form">
                                    <div className="x_form_group">
                                        <label>Page Title</label>
                                        <input value={pageData?.title || ''} onChange={(e) => handlePageChange('title', e.target.value)} placeholder="e.g., Find Our Stores" />
                                    </div>
                                    <div className="x_form_group">
                                        <label>Page Subtitle</label>
                                        <textarea rows={2} value={pageData?.subtitle || ''} onChange={(e) => handlePageChange('subtitle', e.target.value)} placeholder="e.g., Visit our beautiful locations" />
                                    </div>
                                    <div className="x_form_group">
                                        <label>Banner Image URL</label>
                                        <input value={pageData?.bannerImage || ''} onChange={(e) => handlePageChange('bannerImage', e.target.value)} placeholder="https://..." />
                                    </div>

                                    <div className="x_form_group">
                                        <label>Stores</label>
                                        {(pageData?.stores || []).map((store, idx) => (
                                            <div key={idx} className="array_item_card">
                                                <button type="button" className="btn_remove" onClick={() => removeStore(idx)}><FiTrash2 /></button>
                                                <div className="grid_2">
                                                    <div className="x_form_group">
                                                        <label>Store Name</label>
                                                        <input value={store.name || ''} onChange={(e) => handleStoreChange(idx, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="x_form_group">
                                                        <label>Phone</label>
                                                        <input value={store.phone || ''} onChange={(e) => handleStoreChange(idx, 'phone', e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="x_form_group">
                                                    <label>Address</label>
                                                    <input value={store.address || ''} onChange={(e) => handleStoreChange(idx, 'address', e.target.value)} />
                                                </div>
                                                <div className="grid_2">
                                                    <div className="x_form_group">
                                                        <label>Email</label>
                                                        <input value={store.email || ''} onChange={(e) => handleStoreChange(idx, 'email', e.target.value)} />
                                                    </div>
                                                    <div className="x_form_group">
                                                        <label>Business Hours</label>
                                                        <input value={store.hours || ''} onChange={(e) => handleStoreChange(idx, 'hours', e.target.value)} placeholder="e.g., Mon-Fri: 10AM-6PM" />
                                                    </div>
                                                </div>
                                                <div className="grid_2">
                                                    <div className="x_form_group">
                                                        <label>Latitude</label>
                                                        <input type="number" value={store.lat || 0} onChange={(e) => handleStoreChange(idx, 'lat', parseFloat(e.target.value))} />
                                                    </div>
                                                    <div className="x_form_group">
                                                        <label>Longitude</label>
                                                        <input type="number" value={store.lng || 0} onChange={(e) => handleStoreChange(idx, 'lng', parseFloat(e.target.value))} />
                                                    </div>
                                                </div>
                                                <div className="x_form_group">
                                                    <label>Store Image URL</label>
                                                    <input value={store.image || ''} onChange={(e) => handleStoreChange(idx, 'image', e.target.value)} placeholder="https://..." />
                                                </div>
                                                <div className="x_form_group">
                                                    <label>Google Maps Embed URL</label>
                                                    <textarea rows={2} value={store.mapUrl || ''} onChange={(e) => handleStoreChange(idx, 'mapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn_add" onClick={addStore}><FiPlus /> Add Store</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: '#fff' }}>
                                    <style>{`
                                    .store_preview_header { background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${pageData?.bannerImage || 'https://via.placeholder.com/1200x400'}'); background-size: cover; background-position: center; padding: 80px 0; text-align: center; color: #fff; }
                                    .store_preview_title { font-size: 36px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
                                    .store_preview_subtitle { font-size: 16px; color: #ddd; }
                                    .store_card { display: flex; background: #fff; border: 1px solid #eee; border-radius: 8px; overflow: hidden; transition: 0.3s; height: 100%; }
                                    .store_card:hover { box-shadow: 0 5px 20px rgba(0,0,0,0.1); transform: translateY(-5px); }
                                    .store_card_image { width: 100%; object-fit: cover; }
                                    .store_card_body { padding: 20px; }
                                    .store_card_name { font-size: 18px; font-weight: 700; color: #2b4d6e; margin-bottom: 15px; }
                                    .store_info_item { display: flex; align-items: flex-start; margin-bottom: 12px; gap: 10px; font-size: 14px; }
                                    .store_info_icon { color: #b08d57; font-size: 18px; margin-top: 2px; flex-shrink: 0; }
                                    .store_info_text { font-size: 13px; color: #666; line-height: 1.4; }
                                    .store_map_container { width: 100%; height: 250px; border-radius: 8px; overflow: hidden; margin-top: 15px; border: 1px solid #eee; }
                                    .store_map_container iframe { width: 100%; height: 100%; border: none; }
                                    .store_directions_btn { background: #b08d57; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 15px; width: 100%; text-transform: uppercase; transition: 0.3s; }
                                    .store_directions_btn:hover { background: #9d7645; }
                                    @media (max-width: 920px) {
                                        .store_card { flex-direction: column; }
                                    }
                                         @media (max-width: 768px) {
                                        .store_card { flex-direction: row; }
                                    }
                                        @media (max-width: 576px) {
                                        .store_card { flex-direction: column; }
                                        .store_card_image { max-height: 250px; width: 100%; }
                                    }
                                `}</style>

                                    {/* Header Banner */}
                                    <section className="store_preview_header">
                                        <div className="container">
                                            <h1 className="store_preview_title">{pageData?.title || 'Find Our Stores'}</h1>
                                            <p className="store_preview_subtitle">{pageData?.subtitle || 'Visit our beautiful locations'}</p>
                                        </div>
                                    </section>

                                    {/* Stores Grid */}
                                    <section className="container" style={{ padding: '60px 0px 10px 0px' }}>
                                        <div className="row">
                                            {(pageData?.stores || []).map((store, idx) => (
                                                <div key={idx} className="col-xxl-6 col-xl-12 col-lg-12 col-md-12 col-sm-12 px-2 mb-4">
                                                    <div className="store_card">
                                                        {store.image && <img src={store.image} alt={store.name} className="store_card_image" />}
                                                        <div className="store_card_body">
                                                            <h4 className="store_card_name">{store.name}</h4>

                                                            {store.address && (
                                                                <div className="store_info_item">
                                                                    <FiMapPin className="store_info_icon" />
                                                                    <div className="store_info_text">{store.address}</div>
                                                                </div>
                                                            )}

                                                            {store.phone && (
                                                                <div className="store_info_item">
                                                                    <FiPhone className="store_info_icon" />
                                                                    <div className="store_info_text"><a href={`tel:${store.phone}`} style={{ color: '#b08d57', textDecoration: 'none' }}>{store.phone}</a></div>
                                                                </div>
                                                            )}

                                                            {store.email && (
                                                                <div className="store_info_item">
                                                                    <FiMail className="store_info_icon" />
                                                                    <div className="store_info_text"><a href={`mailto:${store.email}`} style={{ color: '#b08d57', textDecoration: 'none' }}>{store.email}</a></div>
                                                                </div>
                                                            )}

                                                            {store.hours && (
                                                                <div className="store_info_item">
                                                                    <FiClock className="store_info_icon" />
                                                                    <div className="store_info_text">{store.hours}</div>
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

            export default StoreLocator;
