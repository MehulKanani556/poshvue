import React, { useState, useEffect } from 'react'
import HeroSlider from '../component/HeroSlider'
import HomeSlider from '../component/HomeSlider'
import HomePoster from '../component/HomePoster'
import { Quote, Heart, Star, Award, Users, ShieldCheck, ShoppingBag } from 'lucide-react';
import '../styles/d_style.css';
import { useNavigate } from 'react-router-dom';
import { getAboutUs } from '../api/client';
import Product from '../component/Product';

function Main() {
  const navigate = useNavigate();
  const [visionData, setVisionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisionSection = async () => {
      try {
        const response = await getAboutUs();
        if (response.data && response.data.visionSection) {
          setVisionData(response.data.visionSection);
        } else {
          // Fallback to default data
          setVisionData({
            quoteIcon: 'Quote',
            subtitle: 'Our Vision',
            visionText: 'To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.',
            buttonText: 'DISCOVER MORE'
          });
        }
      } catch (error) {
        console.log('Failed to load vision section, using defaults:', error);
        // Fallback to default data
        setVisionData({
          quoteIcon: 'Quote',
          subtitle: 'Our Vision',
          visionText: 'To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.',
          buttonText: 'DISCOVER MORE'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVisionSection();
  }, []);

  const getIcon = (iconName) => {
    const icons = {
      Quote, Heart, Star, Award, Users, ShieldCheck, ShoppingBag
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="d_quote-icon" size={40} fill="currentColor" /> : <Quote className="d_quote-icon" size={40} fill="currentColor" />;
  };

  return (
    <>
      <HomeSlider></HomeSlider>
      <HeroSlider></HeroSlider>
      <Product></Product>
      <HomePoster></HomePoster>
      {/* Dynamic Vision Section from AboutUs Backend */}
      {!loading && visionData && (
        <section className="d_vision-section">
          <div className="container">
            <div className="d_vision-content">
              {visionData.quoteIcon ? getIcon(visionData.quoteIcon) : <Quote className="d_quote-icon" size={40} fill="currentColor" />}
              <br /> <span className="d_vision-subtitle">{visionData.subtitle || 'Our Vision'}</span>
              <h2 className="d_vision-text">
                "{visionData.visionText || 'To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.'}"
              </h2>
              <hr className="d_vision-hr" />
              <button
                className="btn btn-outline-light mt-4 px-4 py-2 rounded-0 small"
                onClick={() => navigate("/ShopPage")}
              >
                {visionData.buttonText || 'DISCOVER MORE'}
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  )
} 

export default Main
