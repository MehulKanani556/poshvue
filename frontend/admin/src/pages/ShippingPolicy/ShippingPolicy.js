import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiEye, FiPlus, FiTrash2, FiType, FiImage } from "react-icons/fi";
import client from "../../api/client";

function ShippingPolicy() {
  const [shippingPolicy, setShippingPolicy] = useState({
    title: '',
    subtitle: '',
    infoCards: [{ icon: '', title: '', text: '' }],
    sections: [{ title: '', content: '' }],
    footerText: '',
    footerButtonText: '',
    footerButtonEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState('edit');

  useEffect(() => {
    const fetchShippingPolicy = async () => {
      try {
        setLoading(true);
        const res = await client.get("/shipping-policy");
        if (res.data) setShippingPolicy(res.data);
      } catch (err) {
        setError("Failed to load shipping policy");
      } finally {
        setLoading(false);
      }
    };
    fetchShippingPolicy();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.put("/shipping-policy", shippingPolicy);
      // alert("Shipping Policy updated successfully");
    } catch (err) {
      setError("Failed to save shipping policy");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShippingPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInfoCardChange = (index, field, value) => {
    const newInfoCards = [...shippingPolicy.infoCards];
    newInfoCards[index] = { ...newInfoCards[index], [field]: value };
    setShippingPolicy(prev => ({
      ...prev,
      infoCards: newInfoCards
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...shippingPolicy.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setShippingPolicy(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const addInfoCard = () => {
    const newInfoCard = { icon: '', title: '', text: '' };
    setShippingPolicy(prev => ({
      ...prev,
      infoCards: [...prev.infoCards, newInfoCard]
    }));
  };

  const addSection = () => {
    const newSection = { title: '', content: '' };
    setShippingPolicy(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeInfoCard = (index) => {
    const newInfoCards = shippingPolicy.infoCards.filter((_, i) => i !== index);
    setShippingPolicy(prev => ({
      ...prev,
      infoCards: newInfoCards
    }));
  };

  const removeSection = (index) => {
    const newSections = shippingPolicy.sections.filter((_, i) => i !== index);
    setShippingPolicy(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className="x_page">
      {/* CSS For Admin Form */}
      <style>{`
        .admin_edit_form { max-width: 1000px; margin: 0 auto; padding-bottom: 50px; }
        .x_card { background: #fff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px; overflow: hidden; border: 1px solid #eee; }
        .x_card_header { background: #f8f9fa; padding: 15px 25px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .x_card_header h3 { margin: 0; font-size: 1.1rem; color: #0a2845c2; font-weight: 600; }
        .x_card_body { padding: 25px; }
        .grid_2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid_3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
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
        @media (max-width: 768px) { .grid_2, .grid_3 { grid-template-columns: 1fr; } .x_page_header{ flex-direction: column;} .x_card_body{padding:6px 0px;} .x_form_group{ margin-bottom:15px;} }
        @media (max-width: 425px) { .x_header_btn{ flex-direction: column;width:100%;} .x_page_header h1{font-size:23px;} }
      `}</style>

      <div className="x_page_header">
        <h3>Shipping Policy Management</h3>
        <div style={{ display: 'flex', gap: '10px' }} className="x_header_btn"> 
          <button className="x_btn x_btn-secondary" onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>
            <FiEye /> {mode === 'edit' ? 'Switch to Preview' : 'Back to Edit'}
          </button>
          {mode === 'edit' && (
            <button className="x_btn x_btn-primary" onClick={handleSave} disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {mode === 'edit' ? (
        <div className="container">
          {/* HEADER SECTION */}
          <div className="x_card">
            <div className="x_card_header"><h3>Header Section</h3><FiType /></div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Title</label>
                  <input type="text" value={shippingPolicy.title} onChange={(e) => handleInputChange('title', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input type="text" value={shippingPolicy.subtitle} onChange={(e) => handleInputChange('subtitle', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* INFO CARDS */}
          <div className="x_card">
            <div className="x_card_header"><h3>Info Cards</h3><FiImage /></div>
            <div className="x_card_body">
              {shippingPolicy.infoCards.map((card, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeInfoCard(index)}><FiTrash2 /></button>
                  <div className="grid_3">
                    <div className="x_form_group">
                      <label>Icon (e.g., FaTruck)</label>
                      <input type="text" value={card.icon} onChange={(e) => handleInfoCardChange(index, 'icon', e.target.value)} />
                    </div>
                    <div className="x_form_group">
                      <label>Card Title</label>
                      <input type="text" value={card.title} onChange={(e) => handleInfoCardChange(index, 'title', e.target.value)} />
                    </div>
                    <div className="x_form_group">
                      <label>Card Text</label>
                      <input type="text" value={card.text} onChange={(e) => handleInfoCardChange(index, 'text', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn_add" onClick={addInfoCard}><FiPlus /> Add Info Card</button>
            </div>
          </div>

          {/* SECTIONS */}
          <div className="x_card">
            <div className="x_card_header"><h3>Policy Sections</h3></div>
            <div className="x_card_body">
              {shippingPolicy.sections.map((section, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeSection(index)}><FiTrash2 /></button>
                  <div className="x_form_group">
                    <label>Section Title</label>
                    <input type="text" value={section.title} onChange={(e) => handleSectionChange(index, 'title', e.target.value)} />
                  </div>
                  <div className="x_form_group mb-0">
                    <label>Section Content</label>
                    <textarea rows="4" value={section.content} onChange={(e) => handleSectionChange(index, 'content', e.target.value)} />
                  </div>
                </div>
              ))}
              <button className="btn_add" onClick={addSection}><FiPlus /> Add Section</button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="x_card">
            <div className="x_card_header"><h3>Footer Section</h3></div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Footer Text</label>
                  <input type="text" value={shippingPolicy.footerText} onChange={(e) => handleInputChange('footerText', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>Footer Button Text</label>
                  <input type="text" value={shippingPolicy.footerButtonText} onChange={(e) => handleInputChange('footerButtonText', e.target.value)} />
                </div>
              </div>
              <div className="x_form_group mb-0">
                <label>Footer Button Email</label>
                <input type="text" value={shippingPolicy.footerButtonEmail} onChange={(e) => handleInputChange('footerButtonEmail', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="d_shipping_wrapper py-md-5 py-3 bg-light">
          <style>{`
            .d_shipping_wrapper { color: #2b4d6e; }
            .d_shipping_container { max-width: 1200px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
            .d_shipping_header { background: linear-gradient(135deg, #0a2845, #19423d); color: #fff; padding: 40px; text-align: center; }
            .d_shipping_header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; letter-spacing: 1px; }
            .d_shipping_header p { font-size: 1.1rem; opacity: 0.9; margin: 0; }
            .d_shipping_info_cards { padding: 40px; background: #f8f9fa; }
            .d_info_card { background: #fff; border-radius: 8px; padding: 25px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: transform 0.3s ease; border-top: 4px solid #d4af37 !important; }
            .d_info_card:hover { transform: translateY(-5px); }
            .d_info_card h5 { color: #0a2845; font-weight: 600; margin-bottom: 10px; }
            .d_info_card p { color: #666; margin: 0; font-size: 14px; }
            .d_shipping_sections { padding: 40px; }
            .d_section_item { margin-bottom: 20px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
            .d_section_header { background: #f8f9fa; padding: 15px 20px; font-weight: 600; color: #0a2845; border-bottom: 1px solid #eee; }
            .d_section_body { padding: 20px; }
            .d_section_body p { color: #555; line-height: 1.6; margin: 0; }
            .d_shipping_footer { background: #0a2845; color: #fff; padding: 30px; text-align: center; }
            .d_shipping_footer p { margin-bottom: 15px; opacity: 0.9; font-style: italic; }
            .d_footer_btn { background: #d4af37; color: #fff; border: none; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; transition: background 0.3s ease; }
            .d_footer_btn:hover { background: #b8941f; color: #fff; }
            @media (max-width: 768px) { 
              .d_shipping_wrapper { padding: 20px 0; }
              .d_shipping_header { padding: 25px; }
              .d_shipping_header h1 { font-size: 2rem; }
              .d_shipping_info_cards, .d_shipping_sections { padding: 25px; }
            }
          `}</style>

          <div className="d_shipping_container">
            <div className="d_shipping_header">
              <h1>{shippingPolicy?.title || 'Shipping & Delivery'}</h1>
              <p>{shippingPolicy?.subtitle || 'Every piece of wedding wear is crafted with love.'}</p>
            </div>

            <div className="d_shipping_info_cards">
              <div className="row g-4 justify-content-center">
                {shippingPolicy?.infoCards?.map((card, index) => (
                  <div key={index} className="col-12 col-md-6 col-xl-4">
                    <div className="d_info_card">
                      <div style={{fontSize: '1.7rem', color: '#d4af37', marginBottom: '15px'}}>
                        {card.icon}
                      </div>
                      <h5>{card.title}</h5>
                      <p>{card.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="d_shipping_sections">
              {shippingPolicy?.sections?.map((section, index) => (
                <div key={index} className="d_section_item">
                  <div className="d_section_header">
                    {section.title}
                  </div>
                  <div className="d_section_body">
                    <p>{section.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="d_shipping_footer">
              <p>{shippingPolicy?.footerText || 'Questions about your delivery?'}</p>
              <a href={`mailto:${shippingPolicy?.footerButtonEmail || 'support@example.com'}`} className="d_footer_btn">
                {shippingPolicy?.footerButtonText || 'Contact Concierge'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShippingPolicy;