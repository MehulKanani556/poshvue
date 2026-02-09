import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import client from '../api/client';
import s1 from '../img/freepik__horizontal-banner-indian-bride-under-royal-arch-in__74683.png'
import s2 from '../img/freepik__design-editorial-soft-studio-light-photography-hig__1932.png'
import s3 from '../img/freepik__design-editorial-soft-studio-light-photography-hig__74685 1.png'
import s4 from '../img/freepik__minimal-soft-studio-light-photography-minimal-stud__50046 (1).png'
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Default fallback slides
  const defaultSlides = [
    {
      id: 1,
      title: "Winter Wedding Edit 2026",
      subtitle: "Luxury Ensembles for Grand Celebrations",
      image: s1,
      buttonText: "SHOP WEDDING LOOKS",
    },
    {
      id: 2,
      title: "Festive New Arrivals",
      subtitle: "Statement Styles Crafted for the Season",
      image: s2,
      buttonText: "EXPLORE COLLECTION",
    },
    {
      id: 3,
      title: "Designer Ethnic Wear",
      subtitle: "Where Tradition Meets Contemporary Fashion",
      image: s3,
      buttonText: "VIEW DESIGNS",
    },
    {
      id: 4,
      title: "Party Wear Essentials",
      subtitle: "Elevated Styles for Every Special Moment",
      image: s4,
      buttonText: "SHOP PARTY WEAR",
    },
  ];

  useEffect(() => {
    if (slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides]);

  // Fetch slider data from backend
  useEffect(() => {
    const fetchSliderData = async () => {
      try {
        const response = await client.get('/slider');
        if (response.data && response.data.slides && response.data.slides.length > 0) {
          setSlides(response.data.slides);
        } else {
          // Use default slides if no data from API
          setSlides(defaultSlides);
        }
      } catch (error) {
        console.log('Failed to load slider data, using defaults:', error);
        setSlides(defaultSlides);
      } finally {
        setLoading(false);
      }
    };

    fetchSliderData();
  }, []);

  // ઓટોમેટિક સ્લાઇડ બદલવા માટે
  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) =>
          prev === slides.length - 1 ? 0 : prev + 1
        );
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [slides]);


  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === slides.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };


  if (loading) {
    return (
      <Loader fullScreen text="Loading Slider..." />
    );
  }

  if (slides.length === 0) {
    return (
      <div className="d_slider-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <div>No slides available</div>
      </div>
    );
  }

  return (
    <div className="d_slider-container">
      <style>{`
        .d_slider-container {
          position: relative;
          width: 100%;
          height: 80vh; /* ડેસ્કટોપ માટે ઊંચાઈ */
          overflow: hidden;
          background-color: #f4f4f4;
        }

        .d_slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
          display: flex;
          align-items: center;
        }

        .d_slide.d_active {
          opacity: 1;
        }

        .d_slide-image {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }

        /* ટેક્સ્ટ માટેનું કન્ટેન્ટ */
        .d_slide-content {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: 0 10%;
          color: #fff;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .d_slide-content.text_start {
          align-items: flex-start;
          text-align: left;
        }

        .d_slide-content.text_center {
          align-items: center;
          text-align: center;
        }

        .d_slide-content.text_end {
          align-items: flex-end;
          text-align: right;
        }

        .d_title {
          font-size: 3.5rem;
          font-weight: 600;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .d_subtitle {
          font-size: 1.5rem;
          font-weight: 300;
          margin-bottom: 30px;
          opacity: 0.9;
        }

        .d_shop-btn {
          background-color: #fff;
          color: #0a2845;
          border: none;
          padding: 12px 40px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .d_shop-btn:hover {
          background-color: #0a2845;
          color: #fff;
        }

        /* નેવિગેશન એરો (Arrows) */
        .d_arrow-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.3s;
        }

        .d_arrow-btn:hover { background: #fff; }
        .d_prev { left: 20px; }
        .d_next { right: 20px; }

        /* ઈન્ડિકેટર ડોટ્સ (Dots) */
        .d_dots-container {
          position: absolute;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .d_dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0,0,0,0.2);
          cursor: pointer;
          transition: 0.3s;
        }

        .d_dot.d_active {
          background: #fff;
          width: 12px;
          height: 12px;
          border: 2px solid #0a2845;
        }

        /* --- રિસ્પોન્સિવ સેટિંગ્સ --- */
        @media (max-width: 992px) {
          .d_slider-container { height: 60vh; }
          .d_title { font-size: 2.5rem; }
        }

        @media (max-width: 768px) {
          .d_slider-container { height: 50vh; }
          .d_slide-content { text-align: center; padding: 0 5%; }
          .d_title { font-size: 1.8rem; }
          .d_subtitle { font-size: 1.1rem; }
          .d_arrow-btn { width: 35px; height: 35px; }
        }

        @media (max-width: 480px) {
          .d_slider-container { height: 40vh; }
          .d_title { font-size: 1.4rem; }
          .d_subtitle { font-size: 0.9rem; margin-bottom: 20px; }
          .d_shop-btn { padding: 8px 25px; font-size: 12px; }
          .d_arrow-btn { display: none; } /* મોબાઇલમાં એરો છુપાવવા */
        }
      `}</style>

      {/* સ્લાઇડ્સ */}
      {slides.map((slide, index) => {
        // Use different fallback images based on index
        const fallbackImages = [s1, s2, s3, s4];
        const imageSrc = slide.image || fallbackImages[index % fallbackImages.length];

        return (
          <div
            key={slide.id || index}
            className={`d_slide ${index === currentSlide ? 'd_active' : ''}`}
          >
            <img
              src={imageSrc}
              alt={slide.title || `Slide ${index + 1}`}
              className="d_slide-image"
              onError={(e) => {
                // Fallback to default image if URL fails to load
                e.target.src = fallbackImages[index % fallbackImages.length];
              }}
            />
            <div className={`d_slide-content text_${slide.textPosition || 'start'}`}>
              <h1 className="d_title">{slide.title || `Slide ${index + 1} Title`}</h1>
              <p className="d_subtitle">{slide.subtitle || `Slide ${index + 1} subtitle`}</p>
              <button className="d_shop-btn" onClick={() => navigate("/ShopPage")}>{slide.buttonText || 'Learn More'}</button>
            </div>
          </div>
        );
      })}

      {/* નેવિગેશન બટન્સ */}
      <button className="d_arrow-btn d_prev" onClick={prevSlide}>
        <ChevronLeft size={24} />
      </button>
      <button className="d_arrow-btn d_next" onClick={nextSlide}>
        <ChevronRight size={24} />
      </button>

      {/* ડોટ્સ */}
      <div className="d_dots-container">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`d_dot ${index === currentSlide ? 'd_active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;