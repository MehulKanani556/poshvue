import React, { useState, useEffect } from "react";
import { FiSave, FiEye, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import adminClient from "../../../api/adminClient";
import { Heart, Star, Award, Users, ShieldCheck, ShoppingBag, Quote } from 'lucide-react';
import CustomDropdown from "../../components/CustomDropdown";

// Image Uploader Component
const ImageUploader = ({ value, onChange, label }) => {
  const [preview, setPreview] = useState(value);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploading(true);
        // Create preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await adminClient.post('/upload/home-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success && res.data.url) {
          onChange(res.data.url);
          setPreview(res.data.url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="image-uploader-container">
      <label className="x_form_label">{label}</label>
      <div className="uploader-wrapper">
        <div className="preview-box">
          {uploading ? (
            <div className="upload-loader">Uploading...</div>
          ) : preview ? (
            <img src={preview} alt="Preview" />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>
        <div className="uploader-controls">
          <input
            type="text"
            className="form-control mb-2"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL"
          />
          <label className={`upload-btn ${uploading ? 'disabled' : ''}`}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload Image'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              hidden 
              disabled={uploading}
            />
          </label>
        </div>
      </div>
      <style>{`
        .uploader-wrapper { display: flex; gap: 15px; align-items: flex-start; }
        .preview-box { width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fa; }
        .preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .no-image { font-size: 10px; color: #999; }
        .upload-loader { font-size: 10px; color: #b08d57; font-weight: 600; }
        .uploader-controls { flex: 1; }
        .upload-btn { display: inline-flex; align-items: center; gap: 8px; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; border: 1px solid #ddd; }
        .upload-btn:hover { background: #e8e8e8; }
        .upload-btn.disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

function Home() {
  const [homePoster, setHomePoster] = useState({
    topText: { title: '', desc: '' },
    mainContent: { title: '', desc: '', buttonText: '', image: '' },
    whyChooseUs: [{ icon: '', title: '', desc: '' }],
    cards: [{ image: '', title: '', buttonText: '' }],
    slider: [{ title: '', subtitle: '', image: '', buttonText: '' }]
  });
  const [slider, setSlider] = useState({
    slides: [{ title: '', subtitle: '', image: '', buttonText: '' }]
  });
  const [visionSection, setVisionSection] = useState({
    quoteIcon: '',
    subtitle: '',
    visionText: '',
    buttonText: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState('edit');

  const ICON_OPTIONS = [
    'Heart',
    'Star',
    'Award',
    'Users',
    'ShieldCheck',
    'ShoppingBag',
    'Quote',
  ];

  const ICON_COMPONENTS = { Heart, Star, Award, Users, ShieldCheck, ShoppingBag, Quote };

  useEffect(() => {
    const fetchHomePoster = async () => {
      try {
        setLoading(true);
        const res = await adminClient.get("/home-poster");
        if (res.data) {
          // Remove visionSection from homePoster if it exists (we fetch it separately)
          const { visionSection: _, ...homeData } = res.data;
          setHomePoster(homeData);
        }
      } catch (err) {
        setError("Failed to load home poster");
      } finally {
        setLoading(false);
      }
    };
    fetchHomePoster();
  }, []);

  // Fetch Vision Section from AboutUs endpoint
  useEffect(() => {
    const fetchVisionSection = async () => {
      try {
        const res = await adminClient.get("/about-us");
        if (res.data && res.data.visionSection) {
          setVisionSection(res.data.visionSection);
        } else {
          // Initialize with default if no data exists
          setVisionSection({
            quoteIcon: 'Quote',
            subtitle: 'Our Vision',
            visionText: 'To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.',
            buttonText: 'DISCOVER MORE'
          });
        }
      } catch (err) {
        console.log("Failed to load vision section, using default");
        // Initialize with default on error
        setVisionSection({
          quoteIcon: 'Quote',
          subtitle: 'Our Vision',
          visionText: 'To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.',
          buttonText: 'DISCOVER MORE'
        });
      }
    };
    fetchVisionSection();
  }, []);

  useEffect(() => {
    const fetchSlider = async () => {
      try {
        const res = await adminClient.get("/slider");
        if (res.data && res.data.slides && res.data.slides.length > 0) {
          setSlider(res.data);
        } else {
          // Keep default data if no data from API
          console.log("No slider data found, using default");
        }
      } catch (err) {
        console.log("Failed to load slider, using default data");
      }
    };
    fetchSlider();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Fetch current about-us data, update only visionSection, then save
      let aboutUsData = {};
      try {
        const aboutRes = await adminClient.get("/about-us");
        aboutUsData = aboutRes.data || {};
      } catch (err) {
        console.log("No existing about-us data, creating new");
      }

      // Update visionSection in aboutUsData
      aboutUsData.visionSection = visionSection;

      // Save home poster, slider, and vision section (to about-us)
      await Promise.all([
        adminClient.put("/home-poster", homePoster),
        adminClient.put("/slider", slider),
        adminClient.put("/about-us", aboutUsData)
      ]);
      // alert("Home content, slider, and vision section updated successfully");
    } catch (err) {
      setError("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value, index = null) => {
    if (index !== null) {
      setHomePoster(prev => ({
        ...prev,
        [section]: prev[section].map((item, i) => i === index ? { ...item, [field]: value } : item)
      }));
    } else if (section.includes('.')) {
      const [parent, child] = section.split('.');
      setHomePoster(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setHomePoster(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    }
  };

  const addItem = (section) => {
    const newItem = section === 'whyChooseUs' ? { icon: '', title: '', desc: '' } : { image: '', title: '', buttonText: '' };
    setHomePoster(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const removeItem = (section, index) => {
    setHomePoster(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleSliderChange = (index, field, value) => {
    setSlider(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => i === index ? { ...slide, [field]: value } : slide)
    }));
  };

  const addSlide = () => {
    setSlider(prev => ({
      ...prev,
      slides: [...prev.slides, { title: '', subtitle: '', image: '', buttonText: '' }]
    }));
  };

  const removeSlide = (index) => {
    setSlider(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
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
        .grid_2 > * { min-width: 0; max-width: 100%; word-wrap: break-word; }
        .x_form_group { margin-bottom: 20px; }
        .x_form_group label { display: block; margin-bottom: 8px; font-weight: 500; color: #555; font-size: 0.9rem; }
        .x_form_group input, .x_form_group textarea { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95rem; transition: border-color 0.3s; }
        .x_form_group input:focus, .x_form_group textarea:focus { outline: none; border-color: #b08d57; }
        .array_item_card { background: #fcfcfc; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 15px; position: relative; }
        .btn_remove { position: absolute; top: 10px; right: 10px; background: #fff1f1; color: #dc3545; border: 1px solid #fdcccc; padding: 5px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; }
        .btn_remove:hover { background: #dc3545; color: #fff; }
        .btn_add { background: #fff; color: #b08d57; border: 1px dashed #b08d57; padding: 10px 20px; border-radius: 6px; width: 100%; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s; }
        .btn_add:hover { background: #fdf8f3; }
        .x_page_header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;  border-radius: 12px;  }
        .x_page_header h3{margin-bottom:9px; color:#2b4d6e; }
        .x_btn { padding: 10px 20px; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .x_btn-primary { background: #0a2845; color: #fff; }
        .x_btn-secondary { background: #f0f0f0; color: #2b4d6e; }
        @media (max-width: 768px) { .hero-slide-title {font-size: 2rem;} .grid_2 { grid-template-columns: 1fr; gap: 0px;} .x_page_header{ flex-direction: column;} .x_card_body{padding:6px 0px;} .x_form_group{ margin-bottom:15px;} }
        @media (max-width: 425px) { .x_header_btn{ flex-direction: column;width:100%;} .x_page_header h1{font-size:23px;} .array_item_card{padding: 20px 10px;}}
      `}</style>

      <div className="x_page_header">
        <h3>Home Poster Management</h3>
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
        // Preview Mode - Render the HomePoster component design
        <div>
          <style>{`
            .z_poster_section { padding: 50px 0; }
            .z_poster_top_title { font-size: 1.5rem; color: #2b4d6e; margin-bottom: 10px; }
            .z_poster_top_desc { font-size: 1rem; color: #666; line-height: 1.6; }
            .z_poster_main_bg { background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); }
            .z_poster_main_content { padding: 50px;  }
            .z_poster_title { font-size: 2.5rem; color: #0a2845; margin-bottom: 15px; }
            .z_poster_desc { font-size: 1.2rem; color: #666; margin-bottom: 20px; }
            .z_poster_btn { background: #fff; color: #0a2845; border: none; padding: 12px 30px; font-weight: bold; cursor: pointer; }
            .z_poster_img { width: 100%; height: 700px; object-fit: cover;  }
            .d_features-bg { background: #f8f9fa; padding: 50px 0; }
            .d_icon-box { font-size: 2rem; color: #b08d57; margin-bottom: 15px; }
            .d_text-muted { color: #6c757d; }
            .z_cards_section { padding: 50px 0; }
            .z_cards_wrapper { display: flex; flex-wrap: wrap; }
            .row{ --bs-gutter-x: none; }
            .z_cards_item {position: relative; height: 420px; overflow: hidden;}
            .z_cards_item::after {content: ""; position: absolute; inset: 0; background: rgba(0, 0, 0, 0.25); z-index: 1;}
            .z_cards_img { width: 100%; height: 100%; object-fit: cover; }
            .z_cards_content { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 2; text-align: center; color: #fff;}
            .z_cards_title { font-size: 22px; font-weight: 600; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase;}
            .z_cards_btn { background: #ffffff; color: #0a2845; border: none; padding: 10px 26px; font-size: 13px; font-weight: 600; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease;}
            .z_cards_btn:hover {background: #0a2845;color: #fff;}
            .hero-slider-section { padding: 50px 0; background: #f8f9fa; }
            .hero-slide { display: flex; align-items: center; min-height: 400px; background-size: cover; background-position: center; border-radius: 10px; margin-bottom: 20px; position: relative; }
            .hero-slide-image { position: absolute; width: 100%; height: 100%; object-fit: cover; border-radius: 10px; z-index: 1; }
            .hero-slide-content { position: relative; z-index: 2; flex: 1; padding: 50px; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: center; }
            .hero-slide-content.text_start { align-items: flex-start; text-align: left; }
            .hero-slide-content.text_center { align-items: center; text-align: center; }
            .hero-slide-content.text_end { align-items: flex-end; text-align: right; }
            .hero-slide-title { font-size: 3rem; font-weight: bold; margin-bottom: 15px; }
            .hero-slide-subtitle { font-size: 1.5rem; margin-bottom: 20px; }
            .hero-slide-btn { background: #fff; color: #0a2845; border: none; padding: 12px 30px; font-weight: bold; cursor: pointer; }
            .d_vision-section { background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://i.pinimg.com/1200x/d3/14/a2/d314a28c5dba7be6776cb93c3b4f9f9e.jpg'); background-size: cover; background-position: center; background-attachment: fixed; padding: 80px 0; color: #fff; text-align: center; }
            .d_vision-content { max-width: 800px; margin: 0 auto; position: relative; padding: 20px; }
            .d_quote-icon { color: #c5a059; opacity: 0.5; margin-bottom: 20px; font-size: 3rem; }
            .d_vision-subtitle { color: rgba(255,255,255,0.75); font-weight: 600; letter-spacing: 2px; text-transform: uppercase; font-size: 0.9rem; margin-bottom: 10px; display: block; }
            .d_vision-text { font-size: clamp(1.1rem, 3vw, 1.8rem); font-style: italic; line-height: 1.5; margin-bottom: 30px; }
            .d_vision-hr { width: 50px; height: 3px; background: #c5a059; margin: 20px auto; border: none; }
            @media (max-width: 768px) { .hero-slide-btn {padding: 12px 12px; }.hero-slide-title {font-size: 2rem;} .hero-slide-subtitle {font-size: 1.1rem;}.d_vision-section { background-attachment: scroll; padding: 50px 0; } .z_poster_title { font-size: 1.5rem; } .z_poster_desc { font-size: 1rem;} .z_poster_main_content { padding: 26px; } .hero-slider-section { padding: 0px 0; } .d_features-bg { padding: 16px 0; } .hero-slide-btn { font-size: 14px } }
            @media (max-width: 480px) { .hero-slide-content { padding: 50px 30px; } }
          `}</style>

          {/* Hero Slider Preview */}
          <section className="hero-slider-section">
            <div className="container">
              {slider.slides.map((slide, index) => {

                const imageSrc =
                  slide.image;

                return (
                  <div key={index} className="hero-slide">
                    <img
                      src={imageSrc}
                      alt={slide.title || "Slide"}
                      className="hero-slide-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/1200x400/cccccc/666666?text=No+Image";
                      }}
                    />
                    <div className={`hero-slide-content text_${slide.textPosition || 'center'}`}>
                      <h1 className="hero-slide-title">
                        {slide.title || "Sample Title"}
                      </h1>
                      <p className="hero-slide-subtitle">
                        {slide.subtitle || "Sample subtitle for the slide"}
                      </p>
                      <button className="hero-slide-btn">
                        {slide.buttonText || "Learn More"}
                      </button>
                    </div>
                  </div>
                );
              })}

            </div>
          </section>

          <section className="z_poster_section">
            <div className="">
              <div className="row w-100 mb-5">
                <div className="col-12 text-center">
                  <h6 className="z_poster_top_title">
                    {homePoster.topText?.title}
                  </h6>
                  <p className="z_poster_top_desc">
                    {homePoster.topText?.desc}
                  </p>
                </div>
              </div>

              <div className="row w-100 align-items-center mt-4 z_poster_main_bg">
                <div className="col-lg-6 col-md-6 col-12 p-0">
                  <div className="text-center z_poster_main_content">
                    <h2 className="z_poster_title">{homePoster.mainContent?.title}</h2>
                    <p className="z_poster_desc">
                      {homePoster.mainContent?.desc}
                    </p>
                    <button className="z_poster_btn">{homePoster.mainContent?.buttonText}</button>
                  </div>
                </div>
                <div className="col-lg-6 col-md-6 col-12 p-0">
                  <img
                    src={homePoster.mainContent?.image}
                    alt="Ethnic Wear"
                    className="z_poster_img"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="d_features-bg d_section-padding">
            <div className="container">
              <div className="row g-4">
                {homePoster.whyChooseUs?.map((item, index) => {
                  const IconComp = ICON_COMPONENTS[item.icon];
                  return (
                    <div key={index} className="col-md-4 text-center">
                      <div className="d_icon-box">{IconComp ? <IconComp size={28} /> : (item.icon || '•')}</div>
                      <h5 className="fw-bold mb-2">{item.title}</h5>
                      <p className="d_text-muted small mb-0">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="z_cards_section">
            <div className="container-fluid">
              <div className="row z_cards_wrapper">
                {homePoster.cards?.map((card, index) => (
                  <div key={index} className="col-lg-3 col-md-6 col-12">
                    <div className="z_cards_item">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="z_cards_img"
                      />
                      <div className="z_cards_content">
                        <h4 className="z_cards_title">{card.title}</h4>
                        <button className="z_cards_btn">{card.buttonText}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Vision Section Preview */}
          <section className="d_vision-section">
            <div className="container">
              <div className="d_vision-content">
                <span className="d_quote-icon">{(() => {
                  const IconComp = ICON_COMPONENTS[visionSection?.quoteIcon];
                  return IconComp ? <IconComp size={36} /> : (visionSection?.quoteIcon || '"');
                })()}</span>
                <span className="d_vision-subtitle">{visionSection?.subtitle || 'Our Vision'}</span>
                <h2 className="d_vision-text">
                  "{visionSection?.visionText || 'To be the global heart of Indian bridal wear...'}"
                </h2>
                <hr className="d_vision-hr" />
                <button className="btn btn-outline-light mt-4 px-4 py-2 rounded-0 small">
                  {visionSection?.buttonText || 'DISCOVER MORE'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : mode === 'edit' ? (
        // Edit Mode - Form
        <div className="container">
          {/* Hero Slider */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Hero Slider</h3>
            </div>
            <div className="x_card_body">
              {slider.slides.map((slide, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeSlide(index)}>
                    <FiTrash2 />
                  </button>
                  <div className="grid_2">
                    <div className={`x_form_group slider_content text_${slide.textPosition}`}>
                      <label>Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleSliderChange(index, 'title', e.target.value)}
                      />
                    </div>
                    <div className={`x_form_group slider_content text_${slide.textPosition}`}>
                      <label>Subtitle</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => handleSliderChange(index, 'subtitle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid_2">
                    <div className={`x_form_group slider_content text_${slide.textPosition}`}>
                      <label>Button Text</label>
                      <input
                        type="text"
                        value={slide.buttonText}
                        onChange={(e) => handleSliderChange(index, 'buttonText', e.target.value)}
                      />
                    </div>
                    <div className="x_form_group">
                      <ImageUploader
                        label="Slide Image"
                        value={slide.image}
                        onChange={(val) => handleSliderChange(index, 'image', val)}
                      />
                    </div>
                  </div>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <CustomDropdown
                      padding="10px 12px"
                        label="Text Position"
                        options={[
                          { label: "Start (Left)", value: "start" },
                          { label: "Center", value: "center" },
                          { label: "End (Right)", value: "end" }
                        ]}
                        value={slide.textPosition || 'center'}
                        onChange={(val) => handleSliderChange(index, 'textPosition', val)}
                      />
                    </div>
                  </div>

                </div>
              ))}
              {mode === 'edit' && (
                <button className="btn_add" onClick={addSlide}>
                  <FiPlus /> Add Slide
                </button>
              )}
            </div>

          </div>

          {/* Top Text */}
          <div className="x_card mb-4">
            <div className="x_card_header">
              <h3>Top Text</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={homePoster.topText.title}
                    onChange={(e) => handleInputChange('topText', 'title', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </div>
                <div className="x_form_group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={homePoster.topText.desc}
                    onChange={(e) => handleInputChange('topText', 'desc', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="x_card mb-4">
            <div className="x_card_header">
              <h3>Main Content</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={homePoster.mainContent.title}
                    onChange={(e) => handleInputChange('mainContent', 'title', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </div>
                <div className="x_form_group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={homePoster.mainContent.desc}
                    onChange={(e) => handleInputChange('mainContent', 'desc', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={homePoster.mainContent.buttonText}
                    onChange={(e) => handleInputChange('mainContent', 'buttonText', e.target.value)}
                    disabled={mode === 'view'}
                  />
                </div>
                <div className="x_form_group">
                  <ImageUploader
                    label="Main Image"
                    value={homePoster.mainContent.image}
                    onChange={(val) => handleInputChange('mainContent', 'image', val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="x_card mb-4">
            <div className="x_card_header d-flex justify-content-between">
              <h3>Why Choose Us</h3>
            </div>
            <div className="x_card_body">
              {homePoster.whyChooseUs.map((item, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeItem('whyChooseUs', index)}>
                    <FiTrash2 />
                  </button>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <CustomDropdown
                      padding="10px 12px"
                        label="Icon"
                        options={ICON_OPTIONS.map(opt => ({ label: opt, value: opt }))}
                        value={item.icon}
                        onChange={(val) => handleInputChange('whyChooseUs', 'icon', val, index)}
                        placeholder="Select Icon"
                      />
                    </div>
                    <div className="x_form_group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleInputChange('whyChooseUs', 'title', e.target.value, index)}
                        disabled={mode === 'view'}
                      />
                    </div>
                  </div>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => handleInputChange('whyChooseUs', 'desc', e.target.value, index)}
                        disabled={mode === 'view'}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {mode === 'edit' && (
                <button className="btn_add" onClick={() => addItem('whyChooseUs')}>
                  <FiPlus /> Add Item
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="x_card mb-4">
            <div className="x_card_header d-flex justify-content-between">
              <h3>Cards</h3>
            </div>
            <div className="x_card_body">
              {homePoster.cards.map((card, index) => (
                <div key={index} className="array_item_card">
                  <button className="btn_remove" onClick={() => removeItem('cards', index)}>
                    <FiTrash2 />
                  </button>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <ImageUploader
                        label="Card Image"
                        value={card.image}
                        onChange={(val) => handleInputChange('cards', 'image', val, index)}
                      />
                    </div>
                    <div className="x_form_group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleInputChange('cards', 'title', e.target.value, index)}
                        disabled={mode === 'view'}
                      />
                    </div>
                  </div>
                  <div className="grid_2">
                    <div className="x_form_group">
                      <label>Button Text</label>
                      <input
                        type="text"
                        value={card.buttonText}
                        onChange={(e) => handleInputChange('cards', 'buttonText', e.target.value, index)}
                        disabled={mode === 'view'}
                      />
                    </div>
                  </div>
                </div>
              ))}
 
              {mode === 'edit' && (
                <button className="btn_add" onClick={() => addItem('cards')}>
                  <FiPlus /> Add Card
                </button>
              )}
            </div>
          </div>

          {/* Vision Section */}
          <div className="x_card">
            <div className="x_card_header">
              <h3>Vision Section (from AboutUs)</h3>
            </div>
            <div className="x_card_body">
              <div className="grid_2">
                <div className="x_form_group">
                  <CustomDropdown
                  padding="10px 12px"
                    label="Quote Icon"
                    options={ICON_OPTIONS.map(opt => ({ label: opt, value: opt }))}
                    value={visionSection?.quoteIcon || ''}
                    onChange={(val) => setVisionSection(prev => ({ ...prev, quoteIcon: val }))}
                    placeholder="Select Icon"
                  />
                </div>
                <div className="x_form_group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    value={visionSection?.subtitle || ''}
                    onChange={(e) => setVisionSection(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g., Our Vision"
                  />
                </div>
              </div>
              <div className="grid_2">
                <div className="x_form_group">
                  <label>Vision Text</label>
                  <textarea
                    rows="3"
                    value={visionSection?.visionText || ''}
                    onChange={(e) => setVisionSection(prev => ({ ...prev, visionText: e.target.value }))}
                    placeholder="Enter your vision statement..."
                  />
                </div>
                <div className="x_form_group">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={visionSection?.buttonText || ''}
                    onChange={(e) => setVisionSection(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="e.g., DISCOVER MORE"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>



  );
}

export default Home;
