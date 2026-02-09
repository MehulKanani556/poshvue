import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiEye, FiPlus, FiTrash2 } from "react-icons/fi";
import client from "../../api/client";

function AboutUs() {
  const [aboutUs, setAboutUs] = useState({
    heroHeader: { title: '', subtitle: '' },
    ourStory: {
      image: '',
      subtitle: '',
      title: '',
      description: [''],
      stats: [{ number: '', label: '' }]
    },
    whyChooseUs: [{ icon: '', title: '', desc: '' }],
    visionSection: {
      quoteIcon: '',
      subtitle: '',
      visionText: '',
      buttonText: ''
    },
    experienceBanner: { icon: '', title: '', description: '' }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState('edit');

  useEffect(() => {
   const fetchAboutUs = async () => {
  try {
    setLoading(true);
    const res = await client.get("/about-us");

    const data = res.data || {};

    setAboutUs({
      heroHeader: data.heroHeader || { title: "", subtitle: "" },

      ourStory: {
        image: data.ourStory?.image || "",
        subtitle: data.ourStory?.subtitle || "",
        title: data.ourStory?.title || "",

        // ✅ FORCE ARRAY
        description: Array.isArray(data.ourStory?.description)
          ? data.ourStory.description
          : data.ourStory?.description
          ? [data.ourStory.description]
          : [""],

        stats: Array.isArray(data.ourStory?.stats)
          ? data.ourStory.stats
          : [],
      },

      whyChooseUs: Array.isArray(data.whyChooseUs)
        ? data.whyChooseUs
        : [],

      visionSection: data.visionSection || {
        quoteIcon: "",
        subtitle: "",
        visionText: "",
        buttonText: "",
      },

      experienceBanner: data.experienceBanner || {
        icon: "",
        title: "",
        description: "",
      },
    });
  } catch (err) {
    setError("Failed to load about us content");
  } finally {
    setLoading(false);
  }
};

    fetchAboutUs();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.put("/about-us", aboutUs);
      // alert("About Us content updated successfully");
    } catch (err) {
      setError("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
  section,
  field,
  value,
  index = null,
  subField = null
) => {
  setAboutUs(prev => {
    // 🔹 OUR STORY
    if (section === "ourStory") {
      // Description array
      if (field === "description" && index !== null) {
        const updatedDesc = [...prev.ourStory.description];
        updatedDesc[index] = value;

        return {
          ...prev,
          ourStory: {
            ...prev.ourStory,
            description: updatedDesc,
          },
        };
      }

      // Stats array
      if (field === "stats" && index !== null) {
        const updatedStats = [...prev.ourStory.stats];
        updatedStats[index] = {
          ...updatedStats[index],
          [subField]: value,
        };

        return {
          ...prev,
          ourStory: {
            ...prev.ourStory,
            stats: updatedStats,
          },
        };
      }

      // Normal ourStory fields
      return {
        ...prev,
        ourStory: {
          ...prev.ourStory,
          [field]: value,
        },
      };
    }

    // 🔹 WHY CHOOSE US (array)
    if (section === "whyChooseUs" && index !== null) {
      const updated = [...prev.whyChooseUs];
      updated[index] = { ...updated[index], [field]: value };

      return { ...prev, whyChooseUs: updated };
    }

    // 🔹 OTHER OBJECT SECTIONS
    return {
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    };
  });
};


  const addItem = (section) => {
    if (section === 'whyChooseUs') {
      setAboutUs(prev => ({
        ...prev,
        [section]: [...prev[section], { icon: '', title: '', desc: '' }]
      }));
    } else if (section === 'stats') {
      setAboutUs(prev => ({
        ...prev,
        ourStory: {
          ...prev.ourStory,
          stats: [...prev.ourStory.stats, { number: '', label: '' }]
        }
      }));
    } else if (section === 'description') {
      setAboutUs(prev => ({
        ...prev,
        ourStory: {
          ...prev.ourStory,
          description: [...prev.ourStory.description, '']
        }
      }));
    }
  };

  const removeItem = (section, index) => {
    if (section === 'whyChooseUs') {
      setAboutUs(prev => ({
        ...prev,
        [section]: prev[section].filter((_, i) => i !== index)
      }));
    } else if (section === 'stats') {
      setAboutUs(prev => ({
        ...prev,
        ourStory: {
          ...prev.ourStory,
          stats: prev.ourStory.stats.filter((_, i) => i !== index)
        }
      }));
    } else if (section === 'description') {
      setAboutUs(prev => ({
        ...prev,
        ourStory: {
          ...prev.ourStory,
          description: prev.ourStory.description.filter((_, i) => i !== index)
        }
      }));
    }
  };

  if (loading) return <div className="text-center p-5">Loading...</div>;

  return (
    <div className="x_page">
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
        .x_page_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;  border-radius: 12px; }
        .x_page_header h3{margin-bottom:9px; color: #2b4d6e}
        .x_btn { padding: 10px 20px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .x_btn-primary { background: #0a2845; color: #fff; }
        .x_btn-secondary { background: #f0f0f0; color: #2b4d6e; }
        @media (max-width: 768px) { .grid_2 { grid-template-columns: 1fr; } .x_page_header{ flex-direction: column;} .x_card_body{padding:6px 0px;} .x_form_group{ margin-bottom:15px;} }
        @media (max-width: 425px) { .x_header_btn{ flex-direction: column;width:100%;} .x_page_header h1{font-size:23px;} }
      `}</style>

      <div className="x_page_header">
        <h3>About Us Management</h3>
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

      {mode === 'preview' ? (
        <div>
          <style>{`
            .d_about-wrapper { background: #f8f9fa; }
            .d_about-hero { background: linear-gradient(135deg, #b08d57 0%, #8b6b47 100%); color: white; padding: 80px 0; text-align: center; }
            .d_hero-title { font-size: 3rem; font-weight: bold; margin-bottom: 10px; }
            .d_section-padding { padding: 80px 0; }
            .d_section-subtitle { color: #b08d57; font-weight: 600; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px; }
            .d_section-title { font-size: 2.5rem; color: #0a2845; margin-bottom: 20px; }
            .d_text-muted { color: #6c757d; line-height: 1.6; }
            .d_story-img { width: 100%; height: 400px; object-fit: cover; border-radius: 10px; }
            .d_stat-flex { flex-wrap: wrap; }
            .d_stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); min-width: 120px; text-align: center; }
            .d_features-bg { background: #f8f9fa; }
            .d_icon-box { font-size: 2rem; color: #b08d57; margin-bottom: 15px; }
            .d_vision-section { background: linear-gradient(135deg, #0a2845 0%, #2d0202 100%); color: white; padding: 80px 0; text-align: center; }
            .d_vision-content { max-width: 800px; margin: 0 auto; }
            .d_quote-icon { color: #b08d57; margin-bottom: 20px; }
            .d_vision-text { font-size: 1.8rem; font-style: italic; margin-bottom: 30px; line-height: 1.4; }
            .d_vision-hr { border-color: #b08d57; width: 100px; margin: 0 auto; }

            /* about page */

.d_about-wrapper {
  font-family: 'Playfair Display', serif;
  color: #2b4d6e;
  background-color: #fff;
  overflow-x: hidden;
}

/* --- Hero Section --- */
.d_about-hero {
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('https://i.pinimg.com/1200x/be/34/ed/be34edbe2b2332f1a250be9d9a82edbf.jpg');
  background-size: cover;
  background-position: center;
  height: clamp(250px, 40vh, 400px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
}

.d_hero-title {
  font-size: clamp(1.8rem, 5vw, 3.5rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

/* --- Section Padding Management --- */
.d_section-padding {
  padding: clamp(40px, 8vw, 80px) 0;
}

.d_story-img {
  width: 100%;
  height: clamp(300px, 40vw, 500px);
  object-fit: cover;
  border-radius: 8px;
  box-shadow: clamp(10px, 2vw, 20px) clamp(10px, 2vw, 20px) 0px #f8f4f0;
}

.d_section-subtitle {
  color: #c5a059;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: clamp(12px, 2vw, 14px);
  margin-bottom: 8px;
  display: block;
}

.d_section-title {
  font-size: clamp(1.4rem, 4vw, 2.5rem);
  margin-bottom: clamp(15px, 3vw, 25px);
  font-weight: 700;
  line-height: 1.2;
}

.d_text-muted {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  color: #666;
  font-size: clamp(14px, 1.5vw, 16px);
}

/* --- Stats Card --- */
.d_stat-card {
  padding: 15px;
  border-left: 3px solid #c5a059;
  background: #fafafa;
}

/* --- Features Section --- */
.d_features-bg {
  background-color: #f5f5f5;
}

.d_icon-box {
  width: clamp(50px, 8vw, 65px);
  height: clamp(50px, 8vw, 65px);
  background: #0a2845;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px auto;
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

/* --- Enhanced Our Vision Section --- */
.d_vision-section {
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
    url('https://i.pinimg.com/1200x/d3/14/a2/d314a28c5dba7be6776cb93c3b4f9f9e.jpg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 80px 0;
  color: #fff;
  text-align: center;
}

.d_vision-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  padding: 20px;
}

.d_quote-icon {
  color: #c5a059;
  opacity: 0.5;
  margin-bottom: 20px;
}

.d_vision-text {
  font-size: clamp(1.1rem, 3vw, 1.8rem);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 30px;
}

.d_vision-hr {
  width: 50px;
  height: 3px;
  background: #c5a059;
  margin: 20px auto;
  border: none;
}

/* --- Mobile Adjustments --- */
@media (max-width: 768px) {
  .d_story-img {
    margin-bottom: 30px;
    box-shadow: 10px 10px 0px #f8f4f0;
  }

  .d_vision-section {
    background-attachment: scroll;
    /* મોબાઈલમાં પેરાલેક્સ ઈફેક્ટ બંધ કરી */
    padding: 50px 0;
  }

  .d_stat-flex {
    justify-content: center;
    gap: 20px !important;
  }
}


/* footer */

.d_footer-wrapper {
  background-color: #f8f9fa;
  padding: 60px 0 20px 0;
  color: #2b4d6e;
  border-top: 1px solid #ddd;
}

/* --- Newsletter Section --- */
.d_newsletter-container {
  text-align: center;
  margin-bottom: 50px;
  padding: 0 15px;
}

.d_newsletter-title {
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 15px;
  letter-spacing: 0.5px;
}

.d_newsletter-sub {
  font-size: 14px;
  color: #666;
  max-width: 600px;
  margin: 0 auto 25px auto;
}

.d_input-group-custom {
  display: flex;
  max-width: 500px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.d_newsletter-input {
  flex: 1;
  border: none;
  padding: 12px 15px;
  font-size: 14px;
  outline: none;
}

.d_subscribe-btn {
  background-color: #2b4d6e;
  color: #fff;
  border: none;
  padding: 0 25px;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.3s;
}

.d_subscribe-btn:hover {
  background-color: #0a2845;
}

.d_privacy-check {
  margin-top: 15px;
  font-size: 12px;
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* --- Footer Main Grid --- */
.d_footer-main {
  padding-top: 40px;
  border-top: 1px solid #e0e0e0;
}

.d_footer-col-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 20px;
  text-transform: uppercase;
  position: relative;
}

.d_footer-links {
  list-style: none;
  padding: 0;
}

.d_footer-links li {
  margin-bottom: 12px;
}

.d_footer-links a {
  text-decoration: none;
  color: #555;
  font-size: 13px;
  transition: 0.3s;
}

.d_footer-links a:hover {
  color: #0a2845;
  transform: translateX(5px);
  display: inline-block;
}

/* --- Contact Section --- */
.d_contact-box {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.d_info-item {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  font-size: 14px;
  align-items: flex-start;
}

.d_social-flex {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.d_social-icon {
  width: 36px;
  height: 36px;
  background: #2b4d6e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  text-decoration: none;
  transition: 0.3s;
}

.d_social-icon:hover {
  background: #0a2845;
  transform: translateY(-3px);
}

/* --- Footer Bottom --- */
.d_footer-bottom {
  margin-top: 50px;
  padding: 20px 0;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #777;
}

.d_payment-methods img {
  height: 20px;
  margin-left: 15px;
  opacity: 0.8;
  filter: grayscale(1);
}

/* --- રિસ્પોન્સિવ મીડિયા ક્વેરીઝ --- */
@media (max-width: 991px) {
  .d_footer-col-title {
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }

  .d_footer-main>div {
    margin-bottom: 30px;
  }
}

@media (max-width: 576px) {
  .d_input-group-custom {
    flex-direction: column;
    border: none;
    background: transparent;
    gap: 10px;
  }

  .d_newsletter-input {
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .d_subscribe-btn {
    padding: 12px;
    border-radius: 4px;
  }

  .d_footer-main {
    text-align: center;
  }

  .d_info-item {
    justify-content: center;
    text-align: center;
    flex-direction: column;
    align-items: center;
  }

  .d_social-flex {
    justify-content: center;
  }

  .d_footer-bottom {
    justify-content: center;
    gap: 15px;
  }
}
          `}</style>

          {/* Hero Header */}
          <section className="d_about-hero">
            <div className="container">
              <h1 className="d_hero-title">{aboutUs.heroHeader?.title || 'Our Legacy'}</h1>
              <p className="lead small text-uppercase tracking-wider">{aboutUs.heroHeader?.subtitle || 'Crafting Dreams Since 2010'}</p>
            </div>
          </section>

          {/* Our Story */}
          <section className="d_section-padding">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <img 
                    src={aboutUs.ourStory?.image || "https://i.pinimg.com/1200x/51/af/ad/51afad40af61143805d996b127ae4951.jpg"} 
                    alt="Wedding Dress" 
                    className="d_story-img"
                  />
                </div>
                <div className="col-lg-6 ps-lg-5 mt-4 mt-lg-0">
                  <span className="d_section-subtitle">{aboutUs.ourStory?.subtitle || 'The Journey'}</span>
                  <h2 className="d_section-title">{aboutUs.ourStory?.title || 'Defining Elegance in Wedding Wear'}</h2>
                  {Array.isArray(aboutUs.ourStory.description) &&
  aboutUs.ourStory.description.map((para, index) => (
    <p key={index}>{para}</p>
  ))}

                  <div className="d-flex gap-3 mt-4 d_stat-flex">
                    {aboutUs.ourStory?.stats?.map((stat, index) => (
                      <div key={index} className="d_stat-card">
                        <h4 className="fw-bold mb-0">{stat.number}</h4>
                        <small className="text-muted text-uppercase">{stat.label}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="d_features-bg d_section-padding">
            <div className="container">
              <div className="row g-4">
                {aboutUs.whyChooseUs?.map((item, index) => (
                  <div key={index} className="col-md-4 text-center">
                    <div className="d_icon-box">{item.icon}</div>
                    <h5 className="fw-bold mb-2">{item.title}</h5>
                    <p className="d_text-muted small mb-0">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Vision Section */}
          <section className="d_vision-section">
            <div className="container">
              <div className="d_vision-content">
                <span className="d_quote-icon">"</span>
                <span className="d_section-subtitle text-white opacity-75">{aboutUs.visionSection?.subtitle || 'Our Vision'}</span>
                <h2 className="d_vision-text">
                  "{aboutUs.visionSection?.visionText || 'To be the global heart of Indian bridal wear...'}"
                </h2>
                <hr className="d_vision-hr" />
                <button className="btn btn-outline-light mt-4 px-4 py-2 rounded-0 small">{aboutUs.visionSection?.buttonText || 'DISCOVER MORE'}</button>
              </div>
            </div>
          </section>

          {/* Experience Banner */}
          <div className="text-center py-5">
            <div className="text-muted mb-3" style={{fontSize: '28px'}}>{aboutUs.experienceBanner?.icon || '🛍️'}</div>
            <h5 className="fw-bold text-uppercase">{aboutUs.experienceBanner?.title || 'Experience Luxury'}</h5>
            <p className="text-muted small">{aboutUs.experienceBanner?.description || 'Flagship Store: Surat, Gujarat, India'}</p>
          </div>
        </div>
      ) : (
        <div className="container">
          {/* Hero Header */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Hero Header</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={aboutUs.heroHeader.title}
                    onChange={(e) => handleInputChange('heroHeader', 'title', e.target.value)}
                  />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={aboutUs.heroHeader.subtitle}
                    onChange={(e) => handleInputChange('heroHeader', 'subtitle', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Our Story */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Our Story</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/story-image.jpg"
                    value={aboutUs.ourStory.image}
                    onChange={(e) => handleInputChange('ourStory', 'image', e.target.value)}
                  />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={aboutUs.ourStory.subtitle}
                    onChange={(e) => handleInputChange('ourStory', 'subtitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="x_form_group">
                <label>Title</label>
                <input
                  type="text"
                  value={aboutUs.ourStory.title}
                  onChange={(e) => handleInputChange('ourStory', 'title', e.target.value)}
                />
              </div>
              <div className="x_form_group">
                <label>Description Paragraphs</label>
                {aboutUs.ourStory.description.map((para, index) => (
                  <div key={index} className="array_item_card">
                    <button className="btn_remove" onClick={() => removeItem('description', index)}>
                      <FiTrash2 />
                    </button>
                    <label>Paragraph</label>
                    <textarea
                      rows="2"
                      value={para}
                      onChange={(e) => handleInputChange('ourStory', 'description', e.target.value, index)}
                    />
                  </div>
                ))}
                <button className="btn_add" onClick={() => addItem('description')}>
                  <FiPlus /> Add Paragraph
                </button>
              </div>
              <div className="x_form_group">
                <label>Stats</label>
                {aboutUs.ourStory.stats.map((stat, index) => (
                  <div key={index} className="array_item_card">
                    <button className="btn_remove" onClick={() => removeItem('stats', index)}>
                      <FiTrash2 />
                    </button>
                    <div className="grid_2">
                      <div className="x_form_group">
                        <label>Number (e.g., 15k+)</label>
                        <input
                          type="text"
                          value={stat.number}
                          onChange={(e) => handleInputChange('ourStory', 'stats', e.target.value, index, 'number')}
                        />
                      </div>
                      <div className="x_form_group">
                        <label>Label (e.g., Brides)</label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => handleInputChange('ourStory', 'stats', e.target.value, index, 'label')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn_add" onClick={() => addItem('stats')}>
                  <FiPlus /> Add Stats
                </button>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Why Choose Us</h3>             
            </div>
            <div className="x_card_body">
              {aboutUs.whyChooseUs.map((item, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeItem('whyChooseUs', index)}>
                    <FiTrash2 />
                  </button>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <label>Icon</label>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => handleInputChange('whyChooseUs', 'icon', e.target.value, index)}
                        placeholder="e.g., Award"
                      />
                    </div>
                    <div className="x_form_group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleInputChange('whyChooseUs', 'title', e.target.value, index)}
                      />
                    </div>
                  </div>
                  <div className="x_form_group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={item.desc}
                      onChange={(e) => handleInputChange('whyChooseUs', 'desc', e.target.value, index)}
                    />
                  </div>
                </div>
              ))}
              <button className="btn_add" onClick={() => addItem('whyChooseUs')}>
                <FiPlus /> Add Item
              </button>
            </div>
          </div>

          {/* Vision Section */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Vision Section</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Quote Icon</label>
                  <input
                    type="text"
                    value={aboutUs.visionSection.quoteIcon}
                    onChange={(e) => handleInputChange('visionSection', 'quoteIcon', e.target.value)}
                    placeholder="e.g., Quote"
                  />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={aboutUs.visionSection.subtitle}
                    onChange={(e) => handleInputChange('visionSection', 'subtitle', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Vision Text</label>
                  <textarea
                    rows="3"
                    value={aboutUs.visionSection.visionText}
                    onChange={(e) => handleInputChange('visionSection', 'visionText', e.target.value)}
                  />
                </div>
                <div className="x_form_group">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={aboutUs.visionSection.buttonText}
                    onChange={(e) => handleInputChange('visionSection', 'buttonText', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Experience Banner */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Experience Banner</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Icon</label>
                  <input
                    type="text"
                    value={aboutUs.experienceBanner.icon}
                    onChange={(e) => handleInputChange('experienceBanner', 'icon', e.target.value)}
                    placeholder="e.g., ShoppingBag"
                  />
                </div>
                <div className="x_form_group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={aboutUs.experienceBanner.title}
                    onChange={(e) => handleInputChange('experienceBanner', 'title', e.target.value)}
                  />
                </div>
              </div>
              <div className="x_form_group">
                <label>Description</label>
                <input
                  type="text"
                  value={aboutUs.experienceBanner.description}
                  onChange={(e) => handleInputChange('experienceBanner', 'description', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutUs;