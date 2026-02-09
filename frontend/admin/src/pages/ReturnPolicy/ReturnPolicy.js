import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiEye, FiPlus, FiTrash2, FiType } from "react-icons/fi";
import client from "../../api/client";

function ReturnPolicy() {
  const [returnPolicy, setReturnPolicy] = useState({
    title: '',
    subtitle: '',
    sections: [{ title: '', content: '' }]
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState('edit');

  useEffect(() => {
    const fetchReturnPolicy = async () => {
      try {
        setLoading(true);
        const res = await client.get("/return-policy");
        if (res.data) setReturnPolicy(res.data);
      } catch (err) {
        setError("Failed to load return policy");
      } finally {
        setLoading(false);
      }
    };
    fetchReturnPolicy();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.put("/return-policy", returnPolicy);
      // alert("Return Policy updated successfully");
    } catch (err) {
      setError("Failed to save return policy");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setReturnPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...returnPolicy.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setReturnPolicy(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const addSection = () => {
    const newSection = { title: '', content: '' };
    setReturnPolicy(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (index) => {
    const newSections = returnPolicy.sections.filter((_, i) => i !== index);
    setReturnPolicy(prev => ({
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
        <h3>Return Policy Management</h3>
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
                  <input type="text" value={returnPolicy.title} onChange={(e) => handleInputChange('title', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input type="text" value={returnPolicy.subtitle} onChange={(e) => handleInputChange('subtitle', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* POLICY SECTIONS */}
          <div className="x_card">
            <div className="x_card_header"><h3>Policy Sections</h3></div>
            <div className="x_card_body">
              {returnPolicy.sections.map((section, index) => (
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
        </div>
      ) : (
        /* Preview Mode */
        <div className="d_return_wrapper py-md-5 py-3 bg-light">
          <style>{`
            .d_return_wrapper { color: #2b4d6e; }
            .d_return_container { max-width: 1200px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
            .d_return_header { background: linear-gradient(135deg, #0a2845, #19423d); color: #fff; padding: 40px; text-align: center; }
            .d_return_header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 10px; letter-spacing: 1px; }
            .d_return_header p { font-size: 1.1rem; opacity: 0.9; margin: 0; }
            .d_return_content { padding: 40px; }
            .d_privacy_section { margin-bottom: 35px; text-align: justify; }
            .d_privacy_section:last-child { margin-bottom: 0; }
            .d_privacy_section h5 { color: #0a2845; font-weight: 600; font-size: 1.3rem; margin-bottom: 15px; border-left: 4px solid #b08d57; padding-left: 15px; }
            .d_privacy_section p { color: #555; line-height: 1.8; font-size: 1rem; margin-bottom: 15px; }
            .d_privacy_section p:last-child { margin-bottom: 0; }           
            .d_section_content ul { padding-left: 20px; margin: 10px 0; }
            .d_section_content li { margin-bottom: 5px; }
            @media (max-width: 768px) { 
              .d_return_wrapper { padding: 20px 0; }
              .d_return_header { padding: 25px; }
              .d_return_header h1 { font-size: 2rem; }
              .d_return_content { padding: 25px; }
              .d_section_content { font-size: 14px; }
              .d_privacy_section h5 { font-size: 1.1rem; }
            }
          `}</style>

          <div className="d_return_container">
            <div className="d_return_header">
              <h1>{returnPolicy?.title || 'Return, Refund & Cancellation Policy'}</h1>
              <p>{returnPolicy?.subtitle || 'Please read the following policy carefully before placing an order.'}</p>
            </div>

            <div className="d_return_content">
              {returnPolicy?.sections?.map((section, index) => (
                 <div key={index} className="d_privacy_section">
                  <h5>{section.title}</h5>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReturnPolicy;