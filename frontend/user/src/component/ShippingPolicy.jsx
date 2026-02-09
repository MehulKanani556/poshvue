import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Accordion } from 'react-bootstrap';
import { 
  FaTruck, 
  FaGlobeAmericas, 
  FaBoxOpen, 
  FaCalendarCheck, 
  FaExclamationCircle 
} from 'react-icons/fa';
import client from "../api/client";
import Loader from './Loader';
 
const ShippingPolicy = () => {
  const [shippingPolicy, setShippingPolicy] = useState({
    title: 'Shipping & Delivery',
    subtitle: 'Every piece of wedding wear is crafted with love. Here is how we get your dream outfit to your doorstep.',
    infoCards: [
      { icon: 'FaCalendarCheck', title: "Processing Time", text: "Ready-to-wear: 3-5 days. Custom Bridal: 6-8 weeks." },
      { icon: 'FaTruck', title: "Free Shipping", text: "Complimentary shipping on all bridal orders over $500." },
      { icon: 'FaGlobeAmericas', title: "Global Delivery", text: "We ship to over 50 countries with insured logistics." }
    ],
    sections: [
      {
        title: "Domestic Shipping (Within Country)",
        content: "Standard delivery typically takes 5-7 business days. Express shipping is available at checkout for an additional fee. Please note that signature is required upon delivery for all bridal couture."
      },
      {
        title: "International Shipping & Duties",
        content: "International orders are shipped via DHL or FedEx. Delivery timelines range from 10-15 business days. Note: Import duties and taxes are not included in the item price and are the responsibility of the customer."
      },
      {
        title: "Order Tracking",
        content: "Once your order is dispatched, you will receive a confirmation email with a tracking link. You can also track your order through our 'Order Status' page using your Order ID."
      },
      {
        title: "Delayed or Damaged Shipments",
        content: "While we strive for perfection, delays may occur during peak wedding seasons. If your package arrives damaged, please contact our Concierge Team within 24 hours of receipt with photographic evidence."
      }
    ],
    footerText: "Questions about your delivery?",
    footerButtonText: "Contact Concierge",
    footerButtonEmail: "support@weddingwear.com"
  });
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    (async function fetchShippingPolicy() {
      try {
        const res = await client.get("/shipping-policy");
        if (res && res.data && res.data.sections && res.data.sections.length > 0) {
          setShippingPolicy(res.data);
        }
      } catch (error) {
        console.error('Error fetching shipping policy:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getIconComponent = (iconName) => {
    const icons = {
      FaTruck: <FaTruck />,
      FaGlobeAmericas: <FaGlobeAmericas />,
      FaBoxOpen: <FaBoxOpen />,
      FaCalendarCheck: <FaCalendarCheck />,
      FaExclamationCircle: <FaExclamationCircle />
    };
    return icons[iconName] || <FaTruck />;
  };

  if (loading) {
    return (
      <Loader fullScreen  text="Loading Data..." />
    );
  }

  return (
    <div className="d_shipping_wrapper py-md-5 py-3 bg-light">
      <Container>
        {/* Header Section */}
        <Row className="justify-content-center mb-5 text-center">
          <Col md={8}>
            <h1 className="display-6 d_policy_title mb-3">{shippingPolicy.title}</h1>
            <p className="text-muted">
              {shippingPolicy.subtitle}
            </p>
            <hr className="d_accent_hr mx-auto" style={{ width: '60px', borderTop: '3px solid #d4af37' }} />
          </Col>
        </Row>

        {/* Quick Info Cards */}
        <Row className="g-4 mb-5 justify-content-center">
          {shippingPolicy.infoCards.map((item, index) => (
            <Col lg={4} md={6} sm={12}  key={index}>
              <div className="d_info_card p-4 h-100 text-center bg-white shadow-sm border-0 rounded-0">
                <div className="d_icon_circle mb-3 text-gold" style={{ fontSize: '2rem', color: '#d4af37' }}>
                  {getIconComponent(item.icon)}
                </div>
                <h5 className="fw-bold">{item.title}</h5>
                <p className="small text-muted mb-0">{item.text}</p>
              </div>
            </Col>
          ))}
        </Row>

        {/* Detailed Policy Sections */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <Accordion defaultActiveKey="0" flush className="d_custom_accordion shadow-sm">
              {shippingPolicy.sections.map((section, index) => (
                <Accordion.Item eventKey={index.toString()} key={index}>
                  <Accordion.Header className="fw-bold">
                    {section.title.includes('Order Tracking') && <FaBoxOpen className="me-2"/>}
                    {section.title.includes('Delayed') && <FaExclamationCircle className="me-2"/>}
                    {section.title}
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>{section.content}</p>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </Col>
        </Row>

        {/* Footer Contact */}
        <div className="text-center mt-5">
          <p className="text-muted italic">{shippingPolicy.footerText}</p>
          <a href={`mailto:${shippingPolicy.footerButtonEmail}`} className="btn btn-outline-dark px-4 rounded-0 d_btn_hover">
            {shippingPolicy.footerButtonText}
          </a>
        </div>
      </Container>

      {/* Custom Styles */}
      <style>{`
        .d_shipping_wrapper {
          color: #2b4d6e;
        }
        .d_policy_title {
          font-weight: 500;
          letter-spacing: 1px;
        }
        .d_info_card {
          transition: transform 0.3s ease;
          border-top: 4px solid #d4af37 !important;
        }
        .d_info_card:hover {
          transform: translateY(-5px);
        }
        .d_custom_accordion .accordion-button:not(.collapsed) {
          background-color: #fcf8f0;
          color: #d4af37;
        }
        .d_custom_accordion .accordion-button:focus {
          box-shadow: none;
          border-color: rgba(212, 175, 55, 0.5);
        }
        .d_btn_hover:hover {
          background-color: #d4af37;
          border-color: #d4af37;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ShippingPolicy;