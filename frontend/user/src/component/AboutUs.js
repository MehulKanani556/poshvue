import React, { useState, useEffect } from 'react';
import { Heart, Star, Award, Users, ShieldCheck, ShoppingBag, Quote } from 'lucide-react';
import '../styles/d_style.css';
import client from '../api/client';
import Loader from './Loader';

const AboutUs = () => {
  const [aboutUsData, setAboutUsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutUs = async () => {
      try {
        const response = await client.get('/about-us');
        setAboutUsData(response.data);
      } catch (error) {
        console.log('Failed to load about us data, using defaults:', error);
        // Fallback to static data if API fails
        setAboutUsData({
          heroHeader: {
            title: "Our Legacy",
            subtitle: "Crafting Dreams Since 2010",
          },
          ourStory: {
            image: "https://i.pinimg.com/1200x/51/af/ad/51afad40af61143805d996b127ae4951.jpg",
            subtitle: "The Journey",
            title: "Defining Elegance in Wedding Wear",
            description: [
              "Welcome to Poshvue. Our journey is fueled by a passion to make every bride feel like a queen. What started as a small dream is now a premier destination for bridal couture.",
              "We blend timeless Indian craftsmanship with modern silhouettes to create outfits that are as unique as your love story."
            ],
            stats: [
              { number: "15k+", label: "Brides" },
              { number: "25+", label: "Designers" },
            ],
          },
          whyChooseUs: [
            { icon: "Award", title: "Premium Quality", desc: "Finest fabrics and hand-work." },
            { icon: "Users", title: "Custom Styling", desc: "Made-to-measure perfection." },
            { icon: "ShieldCheck", title: "Secure Delivery", desc: "Insured global shipping." },
          ],
          visionSection: {
            quoteIcon: "Quote",
            subtitle: "Our Vision",
            visionText: "To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.",
            buttonText: "DISCOVER MORE",
          },
          experienceBanner: {
            icon: "ShoppingBag",
            title: "Experience Luxury",
            description: "Flagship Store: Surat, Gujarat, India",
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAboutUs();
  }, []);

  if (loading) {
    return (
      <Loader fullScreen  text="Loading Data..." />
    );
  }

  if (!aboutUsData) {
    return (
      <div className="d_about-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div>Failed to load content</div>
      </div>
    );
  }

  const getIcon = (iconName) => {
    const icons = {
      Heart, Star, Award, Users, ShieldCheck, ShoppingBag, Quote
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent /> : <Award />;
  };
  return (
    <div className="d_about-wrapper">
 

      {/* Hero Header */}
      <section className="d_about-hero">
        <div className="container">
          <h1 className="d_hero-title">{aboutUsData.heroHeader?.title}</h1>
          <p className="lead small text-uppercase tracking-wider">{aboutUsData.heroHeader?.subtitle}</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="d_section-padding">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <img 
                src={aboutUsData.ourStory?.image} 
                alt="Wedding Dress" 
                className="d_story-img"
              />
            </div>
            <div className="col-lg-6 ps-lg-5 mt-4 mt-lg-0">
              <span className="d_section-subtitle">{aboutUsData.ourStory?.subtitle}</span>
              <h2 className="d_section-title">{aboutUsData.ourStory?.title}</h2>
              {Array.isArray(aboutUsData.ourStory?.description) ? aboutUsData.ourStory.description.map((para, index) => (
                <p key={index} className="d_text-muted">{para}</p>
              )) : (
                <p className="d_text-muted">{aboutUsData.ourStory?.description || 'Welcome to Poshvue...'}</p>
              )}
              
              <div className="d-flex gap-3 mt-4 d_stat-flex">
                {aboutUsData.ourStory?.stats?.map((stat, index) => (
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

      {/* Why Choose Us - Compact */}
      <section className="d_features-bg d_section-padding">
        <div className="container">
          <div className="row g-4">
            {aboutUsData.whyChooseUs?.map((item, index) => (
              <div key={index} className="col-md-4 text-center">
                <div className="d_icon-box">{getIcon(item.icon)}</div>
                <h5 className="fw-bold mb-2">{item.title}</h5>
                <p className="d_text-muted small mb-0">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modified Our Vision Section */}
      <section className="d_vision-section">
        <div className="container">
          <div className="d_vision-content">
            <Quote className="d_quote-icon" size={40} fill="currentColor" />
            <span className="d_section-subtitle text-white opacity-75">{aboutUsData.visionSection?.subtitle}</span>
            <h2 className="d_vision-text">
              "{aboutUsData.visionSection?.visionText}"
            </h2>
            <hr className="d_vision-hr" />
            <button className="btn btn-outline-light mt-4 px-4 py-2 rounded-0 small">{aboutUsData.visionSection?.buttonText}</button>
          </div>
        </div>
      </section>

      {/* Experience Banner */}
      <div className="text-center py-5">
        {getIcon(aboutUsData.experienceBanner?.icon)}
        <h5 className="fw-bold text-uppercase">{aboutUsData.experienceBanner?.title}</h5>
        <p className="text-muted small">{aboutUsData.experienceBanner?.description}</p>
      </div>
    </div>
  );
};

export default AboutUs;