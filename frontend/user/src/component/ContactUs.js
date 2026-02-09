import React, { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Facebook,
  Instagram,
  Youtube,
  Home,
  Target,
  Star,
  Heart,
  Gift,
  Award,
  TrendingUp,
  MessageCircle,
  CheckCircle,
  Briefcase,
  Compass,
} from "lucide-react";
import {
  FaCrown,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaHome,
  FaAward,
  FaStar,
  FaHeart,
  FaGift,
  FaTrophy,
  FaChartLine,
  FaComment,
  FaCheckCircle,
  FaBriefcase,
  FaCompass,
  FaMapMarkerAlt,
  FaHandshake,
  FaSmile,
  FaThumbsUp,
  FaLightbulb,
  FaRocket,
  FaFire,
  FaLeaf,
  FaWater,
} from "react-icons/fa";
import client from "../api/client";
import { Link, NavLink } from "react-router-dom";

const ContactUs = () => {
  // ફોર્મ સ્ટેટ મેનેજમેન્ટ
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  // Validation errors
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [page, setPage] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name) errs.name = "Name required";
    else if (name.length < 2) errs.name = "Name must be at least 2 characters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errs.email = "Email required";
    else if (!emailRegex.test(email)) errs.email = "Invalid email address";

    if (!subject) errs.subject = "Subject required";
    else if (subject.length < 3)
      errs.subject = "Subject must be at least 3 characters";

    if (!message) errs.message = "Message required";
    else if (message.length < 10)
      errs.message = "Message must be at least 10 characters";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage("");
    if (!validate()) return;

    try {
      setSubmitting(true);
      await client.post("/support/contacts", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      setSubmitMessage("Thank you! Your message has been sent successfully.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to send message. Please try again.";
      setSubmitMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchPage = async () => {
      try {
        setLoadingPage(true);
        const res = await client.get("/contact-page");
        if (mounted) setPage(res.data);
      } catch (err) {
        if (mounted) setPage(null);
      } finally {
        if (mounted) setLoadingPage(false);
      }
    };
    fetchPage();
    return () => {
      mounted = false;
    };
  }, []);

  const iconMap = {
    // Lucide React Icons
    MapPin: <MapPin size={22} />,
    Phone: <Phone size={22} />,
    Mail: <Mail size={22} />,
    Clock: <Clock size={22} />,
    Home: <Home size={22} />,
    Target: <Target size={22} />,
    Star: <Star size={22} />,
    Heart: <Heart size={22} />,
    Gift: <Gift size={22} />,
    Award: <Award size={22} />,
    TrendingUp: <TrendingUp size={22} />,
    MessageCircle: <MessageCircle size={22} />,
    CheckCircle: <CheckCircle size={22} />,
    Briefcase: <Briefcase size={22} />,
    Compass: <Compass size={22} />,

    // FontAwesome Icons
    FaCrown: <FaCrown size={22} />,
    FaPhone: <FaPhone size={22} />,
    FaEnvelope: <FaEnvelope size={22} />,
    FaClock: <FaClock size={22} />,
    FaHome: <FaHome size={22} />,
    FaAward: <FaAward size={22} />,
    FaStar: <FaStar size={22} />,
    FaHeart: <FaHeart size={22} />,
    FaGift: <FaGift size={22} />,
    FaTrophy: <FaTrophy size={22} />,
    FaChartLine: <FaChartLine size={22} />,
    FaComment: <FaComment size={22} />,
    FaCheckCircle: <FaCheckCircle size={22} />,
    FaBriefcase: <FaBriefcase size={22} />,
    FaCompass: <FaCompass size={22} />,
    FaMapMarkerAlt: <FaMapMarkerAlt size={22} />,
    FaHandshake: <FaHandshake size={22} />,
    FaSmile: <FaSmile size={22} />,
    FaThumbsUp: <FaThumbsUp size={22} />,
    FaLightbulb: <FaLightbulb size={22} />,
    FaRocket: <FaRocket size={22} />,
    FaFire: <FaFire size={22} />,
    FaLeaf: <FaLeaf size={22} />,
    FaWater: <FaWater size={22} />,

    // Fallback for old emoji data
    "📍": <MapPin size={22} />,
    "📞": <Phone size={22} />,
    "📧": <Mail size={22} />,
    "⏰": <Clock size={22} />,
  };

  return (
    <div className="d_contact-wrapper">
      <style>{`
        .d_contact-wrapper {
          color: #2b4d6e;
          background-color: #fff;
        }

        /* --- Updated Header Section with Banner BG --- */
        .d_contact-header {
          background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), 
                      url('${(page && page.bannerImage) || "https://i.pinimg.com/736x/ff/98/68/ff9868f1606a756920066392fce5e8fc.jpg"}');
          background-size: cover;
          background-position: center;
          padding: clamp(60px, 10vw, 100px) 0;
          text-align: center;
          color: #fff;
        }

        .d_page-title {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .d_breadcrumb {
          font-size: 14px;
          color: #ddd;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* --- Info Cards --- */
        .d_info-card {
          padding: 25px;
          background: #fff;
          border: 1px solid #eee;
          text-align: center;
          transition: 0.3s;
          height: 100%;
        }

        .d_info-card:hover {
          border-color: #c5a059;
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .d_icon-circle {
          width: 50px;
          height: 50px;
          background: #fdf8f3;
          color: #c5a059;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin: 0 auto 15px auto;
        }

        /* --- Form Section --- */
        .d_contact-form-container {
          padding: clamp(40px, 8vw, 80px) 0;
        }

        .d_form-card {
          background: #fff;
          padding: clamp(20px, 5vw, 40px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          border-radius: 12px;
        }

        .d_input-field {
          border: 1px solid #eee;
          background: #fcfcfc;
          padding: 14px;
          font-size: 14px;
          border-radius: 6px;
          width: 100%;
          margin-bottom: 20px;
          outline: none;
          transition: 0.3s;
        }

        .d_input-field:focus {
          border-color: #c5a059;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.1);
        }

        .d_submit-btn {
          background: #2b4d6e;
          color: #fff;
          border: none;
          padding: 14px 30px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 1px;
          transition: 0.3s;
          width: 100%;
          border-radius: 6px;
        }

        .d_submit-btn:hover {
          background: #0a2845;
          transform: translateY(-2px);
        }

        .d_map-container {
         height: 350px; border-radius: 12px; overflow: hidden; border: 1px solid #eee;
        }

        .d_map-wrapper {
          width: 100%;
        }
              
        .d_map-container {
          width: 100%;
          height: 350px;
          border-radius: 12px;
          overflow: hidden;
        }
              
        .d_map-container iframe {
          width: 100% !important;
          height: 100% !important;
          border: 0;
        }
              
        .custom-gutter {
          --bs-gutter-x: 1.5rem !important;
        }

        @media (max-width: 768px) {
          .d_info-card { margin-bottom: 10px; padding: 15px;}
          .d_map-container { height: 300px; }
          .d_contact-form-container { padding-top: 20px; }
        }
          .breadcrumb-link {
  color: #fff;
  text-decoration: none;
  opacity: 0.8;
  cursor: pointer;
}

.breadcrumb-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.breadcrumb-link.active {
  font-weight: 700;
  opacity: 1;
  pointer-events: none; /* SHOP already active */
}

      `}</style>

      {/* Header with Background Banner */}
      <section className="d_contact-header">
        <div className="container">
          <h1 className="d_page-title">
            {(page && page.title) || "Connect With Us"}
          </h1>
          <div className="d_breadcrumb">
            <div className="breadcrumb-text">
              <Link to="/" className="breadcrumb-link">
                HOME
              </Link>
              {" | "}
              <NavLink to="/" className="breadcrumb-link active">
                CONTACT US
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Info Grid */}
      <section className="container" style={{ marginTop: "-40px" }}>
        <div className="row g-3 justify-content-center">
          {(page && page.infoCards ? page.infoCards : []).map((item, idx) => (
            <div key={idx} className="col-6 col-md-3">
              <div className="d_info-card shadow-sm">
                <div className="d_icon-circle">
                  {iconMap[item.icon] || <MapPin size={22} />}
                </div>
                <h6 className="fw-bold small text-uppercase">{item.title}</h6>
                <p className="small text-muted mb-0 d-none d-md-block text-wrap">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form & Map */}
      <section className="d_contact-form-container container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6 px-lg-3  p-2">
            <div className="d_form-card">
              <div className="mb-4">
                <h3 className="fw-bold mb-2">Get In Touch</h3>
                <p className="text-muted small">
                  Have questions about our bridal collection? We'd love to hear
                  from you.
                </p>
              </div>
              {submitMessage && (
                <div className="alert alert-info py-2" role="alert">
                  {submitMessage}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row custom-gutter">
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      className="d_input-field"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <div className="text-danger small">{errors.name}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      className="d_input-field"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && (
                      <div className="text-danger small">{errors.email}</div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  className="d_input-field"
                  value={formData.subject}
                  onChange={handleChange}
                />
                {errors.subject && (
                  <div className="text-danger small">{errors.subject}</div>
                )}
                <textarea
                  name="message"
                  placeholder="Message"
                  className="d_input-field"
                  rows="4"
                  required
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
                {errors.message && (
                  <div className="text-danger small">{errors.message}</div>
                )}

                <button
                  type="submit"
                  className="d_submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Message"}{" "}
                  <Send size={16} className="ms-2" />
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-6 px-lg-3  p-2">
            <div className="d_map-wrapper">
              <div className="d_map-container shadow-sm border mb-4">
                {page?.mapSrc ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: page.mapSrc }}
                    style={{ height: "100%", width: "100%" }}
                  />
                ) : (
                  <div className="d_map-fallback">Map not configured</div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h6 className="fw-bold mb-1">Follow Us</h6>
                  <div className="d-flex gap-3">
                    <a
                      href={page?.followLinks?.facebook || "#"}
                      className="text-dark"
                    >
                      <Facebook size={18} />
                    </a>
                    <a
                      href={page?.followLinks?.instagram || "#"}
                      className="text-dark"
                    >
                      <Instagram size={18} />
                    </a>
                    <a
                      href={page?.followLinks?.youtube || "#"}
                      className="text-dark"
                    >
                      <Youtube size={18} />
                    </a>
                  </div>
                </div>

                <div className="text-end">
                  <p className="small text-muted mb-0">Need urgent help?</p>
                  <h6 className="fw-bold">
                    {page?.contactPhone || "+91 81601 81706"}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
