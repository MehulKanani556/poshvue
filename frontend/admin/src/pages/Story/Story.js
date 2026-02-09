import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiEye, FiPlus, FiTrash2, FiImage, FiType } from "react-icons/fi";
import client from "../../api/client";

function Story() {
  const [story, setStory] = useState({
    hero: { title: '', subtitle: '', backgroundImage: '' },
    philosophy: { established: '', title: '', text1: '', text2: '', image: '' },
    values: { title: '', subtitle: '', cards: [{ icon: '', title: '', description: '' }] },
    craftsmanship: { title: '', text: '', image: '', points: [{ icon: '', title: '', description: '' }] },
    whyChooseUs: [{ icon: '', title: '', description: '' }],
    cta: { title: '', subtitle: '' }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState('edit');

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const res = await client.get("/story");
        if (res.data) setStory(res.data);
      } catch (err) {
        setError("Failed to load story");
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.put("/story", story);
      alert("Story updated successfully");
    } catch (err) {
      setError("Failed to save story");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setStory(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleArrayChange = (section, arrayField, index, field, value) => {
    const newArray = [...story[section][arrayField]];
    newArray[index] = { ...newArray[index], [field]: value };
    setStory(prev => ({
      ...prev,
      [section]: { ...prev[section], [arrayField]: newArray }
    }));
  };

  const handleDirectArrayChange = (section, index, field, value) => {
    const newArray = [...story[section]];
    newArray[index] = { ...newArray[index], [field]: value };
    setStory(prev => ({ ...prev, [section]: newArray }));
  };

  const addItem = (section, arrayField) => {
    const newItem = { icon: '', title: '', description: '' };
    setStory(prev => ({
      ...prev,
      [section]: { ...prev[section], [arrayField]: [...prev[section][arrayField], newItem] }
    }));
  };

  const addDirectItem = (section) => {
    const newItem = { icon: '', title: '', description: '' };
    setStory(prev => ({ ...prev, [section]: [...prev[section], newItem] }));
  };

  const removeItem = (section, arrayField, index) => {
    const newArray = story[section][arrayField].filter((_, i) => i !== index);
    setStory(prev => ({
      ...prev,
      [section]: { ...prev[section], [arrayField]: newArray }
    }));
  };

  const removeDirectItem = (section, index) => {
    const newArray = story[section].filter((_, i) => i !== index);
    setStory(prev => ({ ...prev, [section]: newArray }));
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
        .x_page_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;  }
        .x_page_header h3{margin-bottom:9px;   color: #2b4d6e}
        .x_btn { padding: 10px 20px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .x_btn-primary { background: #0a2845; color: #fff; }
        .x_btn-secondary { background: #f0f0f0; color: #2b4d6e; }
        @media (max-width: 768px) { .grid_2 { grid-template-columns: 1fr; } .x_page_header{ flex-direction: column;} .x_card_body{padding:6px 0px;} .x_form_group{ margin-bottom:15px;} }
        @media (max-width: 425px) { .x_header_btn{ flex-direction: column;width:100%;} .x_page_header h1{font-size:23px;} }
      `}</style>

      <div className="x_page_header">
        <h3>Our Story Management</h3>
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
          {/* HERO SECTION */}
          <div className="x_card">
            <div className="x_card_header"><h3>Hero Section</h3><FiImage /></div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Title</label>
                  <input type="text" value={story.hero.title} onChange={(e) => handleInputChange('hero', 'title', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input type="text" value={story.hero.subtitle} onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)} />
                </div>
              </div>
              <div className="x_form_group">
                <label>Background Image URL</label>
                <input type="text" value={story.hero.backgroundImage} onChange={(e) => handleInputChange('hero', 'backgroundImage', e.target.value)} />
              </div>
            </div>
          </div>

          {/* PHILOSOPHY SECTION */}
          <div className="x_card">
            <div className="x_card_header"><h3>Philosophy Section</h3><FiType /></div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Established Text</label>
                  <input type="text" value={story.philosophy.established} onChange={(e) => handleInputChange('philosophy', 'established', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>Title</label>
                  <input type="text" value={story.philosophy.title} onChange={(e) => handleInputChange('philosophy', 'title', e.target.value)} />
                </div>
              </div>
              <div className="x_form_group">
                <label>Main Text (HTML supported)</label>
                <textarea rows="3" value={story.philosophy.text1} onChange={(e) => handleInputChange('philosophy', 'text1', e.target.value)} />
              </div>
              <div className="x_form_group">
                <label>Additional Text</label>
                <textarea rows="3" value={story.philosophy.text2} onChange={(e) => handleInputChange('philosophy', 'text2', e.target.value)} />
              </div>
              <div className="x_form_group">
                <label>Side Image URL</label>
                <input type="text" value={story.philosophy.image} onChange={(e) => handleInputChange('philosophy', 'image', e.target.value)} />
              </div>
            </div>
          </div>

          {/* VALUES SECTION */}
          <div className="x_card">
            <div className="x_card_header"><h3>Core Values</h3></div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Section Title</label>
                  <input type="text" value={story.values.title} onChange={(e) => handleInputChange('values', 'title', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>Section Subtitle</label>
                  <input type="text" value={story.values.subtitle} onChange={(e) => handleInputChange('values', 'subtitle', e.target.value)} />
                </div>
              </div>
              <div className="row">
                {story.values.cards.map((card, index) => (
                  <div key={index} className="col-md-6">
                    <div className="array_item_card">
                      <button className="btn_remove" onClick={() => removeItem('values', 'cards', index)}><FiTrash2 /></button>
                      <div className="x_form_group">
                        <label>Icon Name (e.g., FiAward)</label>
                        <input type="text" value={card.icon} onChange={(e) => handleArrayChange('values', 'cards', index, 'icon', e.target.value)} />
                      </div>
                      <div className="x_form_group">
                        <label>Card Title</label>
                        <input type="text" value={card.title} onChange={(e) => handleArrayChange('values', 'cards', index, 'title', e.target.value)} />
                      </div>
                      <div className="x_form_group">
                        <label>Description</label>
                        <textarea rows="2" value={card.description} onChange={(e) => handleArrayChange('values', 'cards', index, 'description', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn_add" onClick={() => addItem('values', 'cards')}><FiPlus /> Add Value Card</button>
            </div>
          </div>

          {/* CRAFTSMANSHIP SECTION */}
          <div className="x_card">
            <div className="x_card_header"><h3>Craftsmanship</h3></div>
            <div className="x_card_body">
              <div className="x_form_group">
                <label>Title</label>
                <input type="text" value={story.craftsmanship.title} onChange={(e) => handleInputChange('craftsmanship', 'title', e.target.value)} />
              </div>
              <div className="x_form_group">
                <label>Main Text</label>
                <textarea rows="3" value={story.craftsmanship.text} onChange={(e) => handleInputChange('craftsmanship', 'text', e.target.value)} />
              </div>
              <div className="x_form_group">
                <label>Section Image</label>
                <input type="text" value={story.craftsmanship.image} onChange={(e) => handleInputChange('craftsmanship', 'image', e.target.value)} />
              </div>
              <h6>Craft Points:</h6>
              {story.craftsmanship.points.map((point, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeItem('craftsmanship', 'points', index)}><FiTrash2 /></button>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <label>Icon</label>
                      <input type="text" value={point.icon} onChange={(e) => handleArrayChange('craftsmanship', 'points', index, 'icon', e.target.value)} />
                    </div>
                    <div className="x_form_group">
                      <label>Title</label>
                      <input type="text" value={point.title} onChange={(e) => handleArrayChange('craftsmanship', 'points', index, 'title', e.target.value)} />
                    </div>
                  </div>
                  <div className="x_form_group mb-0">
                    <label>Description</label>
                    <textarea rows="2" value={point.description} onChange={(e) => handleArrayChange('craftsmanship', 'points', index, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
              <button className="btn_add" onClick={() => addItem('craftsmanship', 'points')}><FiPlus /> Add Craft Point</button>
            </div>
          </div>

          {/* WHY CHOOSE US */}
          <div className="x_card">
            <div className="x_card_header"><h3>Why Choose Us Section</h3></div>
            <div className="x_card_body">
              <div className="row">
                {story.whyChooseUs.map((item, index) => (
                  <div key={index} className="col-md-4">
                    <div className="array_item_card">
                      <button className="btn_remove" onClick={() => removeDirectItem('whyChooseUs', index)}><FiTrash2 /></button>
                      <div className="x_form_group">
                        <label>Icon</label>
                        <input type="text" value={item.icon} onChange={(e) => handleDirectArrayChange('whyChooseUs', index, 'icon', e.target.value)} />
                      </div>
                      <div className="x_form_group">
                        <label>Title</label>
                        <input type="text" value={item.title} onChange={(e) => handleDirectArrayChange('whyChooseUs', index, 'title', e.target.value)} />
                      </div>
                      <div className="x_form_group mb-0">
                        <label>Text</label>
                        <textarea rows="2" value={item.description} onChange={(e) => handleDirectArrayChange('whyChooseUs', index, 'description', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn_add" onClick={() => addDirectItem('whyChooseUs')}><FiPlus /> Add Item</button>
            </div>
          </div>

          {/* CTA SECTION */}
          <div className="x_card">
            <div className="x_card_header"><h3>Call to Action (Bottom)</h3></div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>CTA Title</label>
                  <input type="text" value={story.cta.title} onChange={(e) => handleInputChange('cta', 'title', e.target.value)} />
                </div>
                <div className="x_form_group">
                  <label>CTA Subtitle</label>
                  <input type="text" value={story.cta.subtitle} onChange={(e) => handleInputChange('cta', 'subtitle', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="d_story_wrapper">
          <style>{`
            .d_story_wrapper { overflow-x: hidden; }
            .d_story_hero { background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${story.hero?.backgroundImage || ''}); background-size: cover; background-position: center; padding: clamp(80px, 15vw, 150px) 0; text-align: center; color: #fff; }
            .d_story_hero h1 { font-size: clamp(32px, 5vw, 60px); font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px; }
            .d_story_hero p { font-size: clamp(16px, 2vw, 20px); max-width: 800px; margin: 0 auto; opacity: 0.9; }
            .d_story_section { padding: clamp(50px, 10vw, 60px) 0; }
            .d_story_section h2 { font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: #0a2845; margin-bottom: 25px; }
            .d_story_section p { font-size: 16px; color: #444; line-height: 1.8; margin-bottom: 20px; }
            .d_story_img { width: 100%; border-radius: 4px; box-shadow: 20px 20px 0px #f4e6d6; object-fit: cover; height: 500px; }
            .d_story_values { background: #fdf8f3; padding: 60px 0; }
            .d_value_card { background: #fff; padding: 40px 25px; border-bottom: 4px solid #b08d57; height: 100%; transition: all 0.4s ease; text-align: center; }
            .d_value_card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
            .d_value_icon { font-size: 45px; color: #b08d57; margin-bottom: 20px; }
            .d_value_card h4 { font-weight: 700; font-size: 22px; margin-bottom: 15px; color: #2b4d6e; }
            .d_craft_img { width: 100%; height: 400px; object-fit: cover; border-radius: 50% 50% 0 0; border: 8px solid #fff; }
            .d_story_why { padding: 60px 0; background: #fff; }
            .d_why_box { padding: 20px; border: 1px dashed #b08d57; height: 100%; }
            .d_why_icon { font-size: 30px; color: #b08d57; margin-bottom: 15px; }
            .d_story_cta { background: linear-gradient(rgba(74, 4, 4, 0.9), rgba(74, 4, 4, 0.9)), url("https://images.unsplash.com/photo-1594142404832-731338604d53?q=80&w=1974&auto=format&fit=crop"); background-size: cover; background-attachment: fixed; color: #fff; text-align: center; padding: 70px 20px; }
            .d_story_btn { background: #b08d57; color: #fff; border: none; padding: 15px 45px; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; transition: 0.3s; }
            .d_story_btn:hover { background: #fff; color: #0a2845; }
            @media (max-width: 1440px){.d_story_why, .d_story_section, .d_story_values {padding: 40px 0;} .d_value_icon {font-size: 30px;   margin-bottom: 10px;}     padding: 50px 20px;}
            @media (max-width: 768px) {.d_value_card {padding: 15px 25px;}.d_story_values {padding: 40px 0;} .d_story_img { height: 350px; box-shadow: 10px 10px 0px #f4e6d6; } .d_craft_img { height: 300px; border-radius: 10px; } .d_story_btn { padding: 15px 20px; font-size: 14px; } }
          `}</style>

          <section className="d_story_hero">
            <div className="container">
              <h1>{story?.hero?.title}</h1>
              <p>{story?.hero?.subtitle}</p>
            </div>
          </section>

          <section className="d_story_section">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-6 mb-5 mb-lg-0 text-center text-lg-start">
                  <span className="text-uppercase mb-2 d-block" style={{ color: '#b08d57', letterSpacing: '2px', fontWeight: '600' }}>{story?.philosophy?.established}</span>
                  <h2>{story?.philosophy?.title}</h2>
                  <p dangerouslySetInnerHTML={{ __html: story?.philosophy?.text1 }} />
                  <p>{story?.philosophy?.text2}</p>
                </div>
                <div className="col-lg-6">
                  <img src={story?.philosophy?.image} alt="Story Image" className="d_story_img" />
                </div>
              </div>
            </div>
          </section>

          <section className="d_story_values">
            <div className="container">
              <div className="text-center mb-5">
                <h2 style={{ color: '#0a2845' }}>{story?.values?.title}</h2>
                <p className="text-muted">{story?.values?.subtitle}</p>
              </div>
              <div className="row">
                {story?.values?.cards?.map((card, index) => (
                  <div className="col-md-4 mb-4" key={index}>
                    <div className="d_value_card">
                      <div className="d_value_icon"><span>{card.icon}</span></div>
                      <h4>{card.title}</h4>
                      <p className="text-muted">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="d_story_section" style={{ background: '#fff' }}>
            <div className="container">
              <div className="row align-items-center flex-column-reverse flex-lg-row">
                <div className="col-lg-5 mt-0 mt-lg-0">
                  <img src={story?.craftsmanship?.image} alt="Craftsmanship" className="d_craft_img" />
                </div>
                <div className="col-lg-6 offset-lg-1">
                  <h2 style={{ color: '#0a2845' }}>{story?.craftsmanship?.title}</h2>
                  <p>{story?.craftsmanship?.text}</p>
                  <div className="mt-4">
                    {story?.craftsmanship?.points?.map((point, index) => (
                      <div className="d-flex mb-3" key={index}>
                        <div style={{ color: '#b08d57', marginTop: '4px', marginRight: '12px' }}>
                          <span>{point.icon}</span>
                        </div>
                        <div>
                          <h6>{point.title}</h6>
                          <p className="small text-muted">{point.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="d_story_why">
            <div className="container">
              <div className="row text-center g-4 justify-content-center">
                {story?.whyChooseUs?.map((item, index) => (
                  <div className="col-12 col-md-6 col-xl-4 d-flex justify-content-center" key={index}>
                    <div className="d_why_box">
                      <div className="d_why_icon"><span>{item.icon}</span></div>
                      <h5>{item.title}</h5>
                      <p className="small text-muted mb-0">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="d_story_cta">
            <div className="container">
              <h2 className="mb-3">{story?.cta?.title}</h2>
              <p className="lead">{story?.cta?.subtitle}</p>
              <button className="d_story_btn">Explore Collections</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Story;