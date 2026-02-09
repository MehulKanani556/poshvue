import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Card, Badge, ProgressBar } from 'react-bootstrap';
import { MessageSquare, Send, ThumbsUp, Heart, Bug, Lightbulb, Star } from 'lucide-react';
import client from '../api/client';

const GeneralFeedback = () => {
  const [category, setCategory] = useState('Suggestion');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const categories = [
    { name: 'Suggestion', icon: <Lightbulb size={18} />, color: '#c59d5f' },
    { name: 'Bug Report', icon: <Bug size={18} />, color: '#dc3545' },
    { name: 'Compliment', icon: <Heart size={18} />, color: '#e83e8c' },
    { name: 'Other', icon: <MessageSquare size={18} />, color: '#6c757d' },
  ];

  const mapCategoryToType = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('bug')) return 'service';
    if (c.includes('compliment')) return 'product';
    if (c.includes('suggestion')) return 'general';
    return 'general';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name,                      // <-- include name
        email,                     // <-- include email
        type: mapCategoryToType(category),
        rating: rating || undefined,
        message,
      };
      await client.post('/support/feedbacks', payload);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setRating(0);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit feedback';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Container className="py-5 text-center my-md-5">
        <div className="d_thank_you_card p-4 p-md-5 shadow-lg rounded-4 bg-white mx-auto" style={{ maxWidth: '600px' }}>
          <div className="d_success_icon mb-4">
            <ThumbsUp size={50} className="d_text_gold" />
          </div>
          <h2 className="fw-bold mb-3">Thank You!</h2>
          <p className="text-muted mb-4">Your feedback helps us grow. Our team reviews every suggestion to make your experience better.</p>
          <Button variant="dark" className="px-5 py-2 rounded-pill w-100 w-md-auto" onClick={() => setSubmitted(false)}>
            Send Another Note
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <section className="d_feedback_page py-4 py-md-5">
      <Container>
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        <Row className="justify-content-center g-4">
          {/* Left Side: Context & Branding */}
          <Col lg={4} xl={4}>
            <div className="d_info_panel h-100 p-4 p-md-4 text-white rounded-4 shadow-lg d-flex flex-column justify-content-between">
              <div>
                <Badge bg="light" text="dark" className="mb-3 px-3 d_badge">FEEDBACK HUB</Badge>
                <h1 className="display-6 fw-bold mb-3 mb-md-4">We're all ears.</h1>
                <p className="lead opacity-75 small-on-mobile">
                  Is there something we can do better? Or did you love a particular feature? Let us know.
                </p>
              </div>

              <div className="d_stats_box bg-white bg-opacity-10 p-3 p-md-4 rounded-3 mt-4 mt-lg-5">
                <div className="d_small_label mb-2 fw-bold text-uppercase tracking-wider">Community Pulse</div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small">Satisfaction</span>
                  <span className="small fw-bold">94%</span>
                </div>
                <ProgressBar now={94} className="d_progress_container" style={{ height: '6px' }} />
                <p className="d_tiny_text opacity-50 mt-3 mb-0">Based on 2,400+ user reviews this month.</p>
              </div>
            </div>
          </Col>

          {/* Right Side: Feedback Form */}
          <Col lg={8} xl={7}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleSubmit}>
                  <h4 className="fw-bold mb-4">Send us your thoughts</h4>

                  {/* Category Selection */}
                  <Form.Group className="mb-4">
                    <Form.Label className="d_label_muted mb-3">WHAT IS THIS ABOUT?</Form.Label>
                    <div className="d_category_grid">
                      {categories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          className={`d_category_pill ${category === cat.name ? 'd_active' : ''}`}
                          style={{ '--d_cat_color': cat.color }}
                        >
                          {cat.icon}
                          <span className="ms-2">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </Form.Group>

                  <Row className='custom-gutter'>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="d_label_muted">NAME</Form.Label>
                        <Form.Control type="text" placeholder="John Doe" className="d_custom_input shadow-none" value={name} onChange={(e)=>setName(e.target.value)} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="d_label_muted">EMAIL</Form.Label>
                        <Form.Control type="email" placeholder="john@example.com" className="d_custom_input shadow-none" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="d_label_muted">OVERALL EXPERIENCE</Form.Label>
                    <div className="d-flex gap-3 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={28}
                          className="d_star_rating"
                          fill={rating >= s ? "#c59d5f" : "none"}
                          stroke={rating >= s ? "#c59d5f" : "#dee2e6"}
                          onClick={() => setRating(s)}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="d_label_muted">YOUR MESSAGE</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={4} 
                      placeholder="Tell us what's on your mind..." 
                      className="d_custom_input shadow-none"
                      value={message}
                      onChange={(e)=>setMessage(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button type="submit" disabled={submitting} className="d_btn_send w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                    {submitting ? 'Submitting...' : 'Submit Feedback'} <Send size={18} />
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .d_feedback_page {
          background-color: #7fb0df1f;
          min-height: 100vh;
        }

        .d_info_panel {
          background: linear-gradient(135deg, #1a1a1a 0%, #0a2845 100%);
        }

        .d_text_gold { color: #c59d5f; }
        .d_badge { font-size: 0.7rem; letter-spacing: 1px; }
        
        .d_progress_container { background-color: rgba(255,255,255,0.1) !important; }
        .d_progress_container .progress-bar {
           background-color: #c59d5f !important;
        }

        /* Responsive Grid for Categories */
        .d_category_grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }

        .d_category_pill {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #495057;
          width: 100%;
        }
          .custom-gutter {
            --bs-gutter-x: 1.5rem !important;
          }

        .d_category_pill.d_active {
          background: var(--d_cat_color);
          color: white;
          border-color: var(--d_cat_color);
        }

        .d_label_muted {
          font-size: 0.75rem;
          font-weight: 700;
          color: #adb5bd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .d_custom_input {
          border: 1px solid #e9ecef !important;
          padding: 12px 15px;
          border-radius: 10px;
          background: #fcfcfc;
          font-size: 15px;
        }
        
        .d_custom_input:focus {
          border-color: #c59d5f !important;
          background: #fff;
        }

        .d_star_rating {
          cursor: pointer;
          transition: transform 0.2s;
        }

        .d_btn_send {
          background: #1a1a1a;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
        }

        .d_btn_send:hover {
          background: #c59d5f;
          transform: translateY(-2px);
        }

        .d_btn_send:active {
           background-color: #9c7d4fff !important;
        }

        /* Animation */
        .d_thank_you_card {
          animation: d_slideUp 0.5s ease-out;
        }

        @keyframes d_slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Specific Adjustments */
        @media (max-width: 768px) {
          .d_category_grid {
            grid-template-columns: 1fr 1fr;
          }
          .small-on-mobile {
            font-size: 0.95rem;
          }
          .d_tiny_text {
            font-size: 0.75rem;
          }
          .d_small_label {
            font-size: 0.8rem;
          }
        }

        button {
          -webkit-tap-highlight-color: transparent;
          outline: none !important;
        }
      `}</style>
    </section>
  );
};

export default GeneralFeedback;