import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaCrown,
  FaHeart,
  FaLeaf,
  FaGem,
  FaHandsHelping,
  FaStar,
} from "react-icons/fa";
import { getStory } from "../api/client";
import Loader from "./Loader";

const iconMap = {
  FaCrown,
  FaHeart,
  FaLeaf,
  FaGem,
  FaHandsHelping,
  FaStar,
};

const OurStory = ({ story: propStory }) => {
  const [story, setStory] = useState(propStory || null);
  const [loading, setLoading] = useState(!propStory);

  useEffect(() => {
    if (propStory) {
      setStory(propStory);
      setLoading(false);
      return;
    }
    const fetchStory = async () => {
      try {
        const response = await getStory();
        setStory(response.data);
      } catch (error) {
        console.error('Error fetching story:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [propStory]);

  if (loading) {
    return <Loader fullScreen  text="Loading Data..." />;
  }

  if (!story) {
    return <div>No story data available.</div>;
  }

  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <div className="d_story_wrapper">
      {/* INLINE CSS */}
      <style>{`
        .d_story_wrapper {
          overflow-x: hidden;
        }

        /* --- Hero Section --- */
        .d_story_hero {
          background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${story.hero?.backgroundImage || ''});
          background-size: cover;
          background-position: center;
          padding: clamp(80px, 15vw, 150px) 0;
          text-align: center;
          color: #fff;
        }

        .d_story_hero h1 {
          font-size: clamp(32px, 5vw, 60px);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 15px;
        }

        .d_story_hero p {
          font-size: clamp(16px, 2vw, 20px);
          max-width: 800px;
          margin: 0 auto;
          opacity: 0.9;
        }

        /* --- Story Section --- */
        .d_story_section {
          padding: clamp(50px, 6vw, 100px) 0;
        }

        .d_story_section h2 {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 700;
          color: #0a2845; /* Deep Maroon */
          margin-bottom: 25px;
          position: relative;
        }

        .d_story_section p {
          font-size: 16px;
          color: #444;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .d_story_img {
          width: 100%;
          border-radius: 4px;
          box-shadow: 20px 20px 0px #f4e6d6;
          object-fit: cover;
          height: 500px;
        }

        /* --- Values Section --- */
        .d_story_values {
          background: #fdf8f3;
          padding: 80px 0;
        }

        .d_value_card {
          background: #fff;
          padding: 40px 25px;
          border-bottom: 4px solid #b08d57;
          height: 100%;
          transition: all 0.4s ease;
          text-align: center;
        }

        .d_value_card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        .d_value_icon {
          font-size: 45px;
          color: #b08d57;
          margin-bottom: 20px;
        }

        .d_value_card h4 {
          font-weight: 700;
          font-size: 22px;
          margin-bottom: 15px;
          color: #2b4d6e;
        }

        /* --- Craftmanship Section --- */
        .d_craft_img {
            width: 100%;
            height: 400px;
            object-fit: cover;
            border-radius: 50% 50% 0 0;
            border: 8px solid #fff;
        }

        /* --- Why Us Section --- */
        .d_story_why {
          padding: 80px 0;
          background: #fff;
        }

        .d_why_box {
            padding: 20px;
            border: 1px dashed #b08d57;
            height: 100%;
        }

        .d_why_icon {
          font-size: 30px;
          color: #b08d57;
          margin-bottom: 15px;
        }

        /* --- CTA Section --- */
        .d_story_cta {
          background: linear-gradient(rgba(74, 4, 4, 0.9), rgba(74, 4, 4, 0.9)),
          url("https://images.unsplash.com/photo-1594142404832-731338604d53?q=80&w=1974&auto=format&fit=crop");
          background-size: cover;
          background-attachment: fixed;
          color: #fff;
          text-align: center;
          padding: 100px 20px;
        }

        .d_story_btn {
          background: #b08d57;
          color: #fff;
          border: none;
          padding: 15px 45px;
          font-size: 18px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 25px;
          transition: 0.3s;
        }

        .d_story_btn:hover {
          background: #fff;
          color: #0a2845;
        }

        @media (max-width: 768px) {
          .d_story_img { height: 350px; box-shadow: 10px 10px 0px #f4e6d6; }
          .d_craft_img { height: 300px; border-radius: 10px; }
          .d_story_values { padding: 20px 0; }
          .d_story_btn { padding: 15px 22px; font-size: 16px; }
          .d_story_cta { padding: 52px 20px; }
      `}</style>

      {/* HERO */}
      <section className="d_story_hero">
        <Container>
          <h1 className="animate__animated animate__fadeInDown">{story?.hero?.title}</h1>
          <p className="animate__animated animate__fadeInUp">
            {story?.hero?.subtitle}
          </p>
        </Container>
      </section>

      {/* OUR PHILOSOPHY */}
      <section className="d_story_section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0 text-center text-lg-start">
              <span className="text-uppercase mb-2 d-block" style={{ color: '#b08d57', letterSpacing: '2px', fontWeight: '600' }}>{story?.philosophy?.established}</span>
              <h2>{story?.philosophy?.title}</h2>
              <p dangerouslySetInnerHTML={{ __html: story?.philosophy?.text1 }} />
              <p>
                {story?.philosophy?.text2}
              </p>
            </Col>
            <Col lg={6}>
              <img
                src={story?.philosophy?.image}
                alt="Indian Bridal Lehenga"
                className="d_story_img"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* CORE VALUES */}
      <section className="d_story_values">
        <Container>
          <div className="text-center mb-5">
            <h2 style={{ color: '#0a2845' }}>{story?.values?.title}</h2>
            <p className="text-muted">{story?.values?.subtitle}</p>
          </div>
          <Row>
            {story?.values?.cards?.map((card, index) => (
              <Col md={4} className="mb-4" key={index}>
                <div className="d_value_card">
                  <div className="d_value_icon">
                    {renderIcon(card.icon)}
                  </div>
                  <h4>{card.title}</h4>
                  <p className="text-muted">{card.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CRAFTMANSHIP */}
      <section className="d_story_section" style={{ background: '#fff' }}>
        <Container>
          <Row className="align-items-center flex-column-reverse flex-lg-row">
            <Col lg={5} className="mt-lg-0">
              <img
                src={story?.craftsmanship?.image}
                alt="Hand Embroidery"
                className="d_craft_img"
              />
            </Col>
            <Col lg={{ span: 6, offset: 1 }}>
              <h2 style={{ color: '#0a2845' }}>{story?.craftsmanship?.title}</h2>
              <p>
                {story?.craftsmanship?.text}
              </p>
              <div className="mt-4">
                {story?.craftsmanship?.points?.map((point, index) => (
                  <div className="d-flex mb-3" key={index}>
                    <div style={{ color: '#b08d57', marginTop: '4px', marginRight: '12px' }}>
                      {renderIcon(point.icon)}
                    </div>
                    <div>
                      <h6>{point.title}</h6>
                      <p className="small text-muted">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* WHY CHOOSE US */}
      <section className="d_story_why pb-md-4 pb-4 pt-3">
        <Container>
          <Row className="text-center g-4">
            {story?.whyChooseUs?.map((item, index) => (
              <Col md={4} key={index}>
                <div className="d_why_box">
                  <div className="d_why_icon">
                    {renderIcon(item.icon)}
                  </div>
                  <h5>{item.title}</h5>
                  <p className="small text-muted mb-0">{item.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA */}
      <section className="d_story_cta">
        <Container>
          <h2 className="mb-3">{story?.cta?.title}</h2>
          <p className="lead">{story?.cta?.subtitle}</p>
          <button className="d_story_btn">Explore Collections</button>
        </Container>
      </section>
    </div>
  );
};

export default OurStory;                                         