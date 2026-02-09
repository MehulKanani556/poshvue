import React from 'react';
import axios from 'axios';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Send } from 'lucide-react';
import { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (!email) return setMsg('Please enter email');
    if (!consent) return setMsg('Please accept privacy policy');

    try {
      const res = await axios.post('http://localhost:5000/api/support/subscriptions', {
        email,
        source: 'frontend',
      });
      setMsg(res.data.message || 'Subscribed successfully');
      setEmail('');
      setConsent(false);
    } catch (err) {
      setMsg('Something went wrong');
    }
  };
  return (
    <footer className="d_footer-wrapper">
      <div className="container">
        {/* Newsletter Section */}
        <section className="d_newsletter-container">
          <h2 className="d_newsletter-title">Sign up to get latest offers & discount</h2>
          <p className="d_newsletter-sub">
            Get updates on new arrivals and exclusive promos directly in your inbox.
          </p>
          <div className="d_input-group-custom">
            <input
              type="email"
              placeholder="Enter your Email Address"
              className="d_newsletter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="d_subscribe-btn" onClick={handleSubmit}>
              Subscribe
            </button>
          </div>
          <div className="d_privacy-check">
            <input
              type="checkbox"
              id="d_consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="d_consent">
              I have read the Privacy Policy
            </label>
          </div>
        </section>

        {/* Links Grid */}
        <div className="row d_footer-main">
          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="d_footer-col-title">Poshvue Fashion</h5>
            <ul className="d_footer-links">
              <li><a href="/StoreLocator">Store Locator</a></li>
              <li><a href="/OurStory">Our Story</a></li>
              {/* <li><a href="#">Video Shopping</a></li> */}
              <li><a href="/Review">Add Reviews</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="d_footer-col-title">Support</h5>
            <ul className="d_footer-links">
              {/* <li><a href="/ContactUs">Contact Us</a></li> */}
              <li><a href="/TrackOrder">Track Order</a></li>
              <li><a href="/wholesale">Wholesale</a></li>
              <li><a href="/GeneralFeedback">Feedback</a></li>
              <li><a href="/Complain">Complain</a></li>
            </ul>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="d_footer-col-title">Policies</h5>
            <ul className="d_footer-links">
              <li><a href="/ShippingPolicy">Shipping</a></li>
              <li><a href="/ReturnPolicy">Return Policy</a></li>
              <li><a href="/PrivacyPolicy">Privacy</a></li>
              <li><a href="/TermAndConditions">T&C</a></li>
              {/* <li><a href="#">Payment</a></li> */}
            </ul>
          </div>

          <div className="col-12 col-md-12 col-lg-6 ps-lg-5">
            <div className="d_contact-box">
              <h5 className="d_footer-col-title">Get in Touch</h5>
              <div className="d_info-item">
                <div><Phone size={18} className="text-secondary" /></div>
                <strong>+91 99748 20227</strong>
              </div>
              <div className="d_info-item">
                <div><Mail size={18} className="text-secondary" /></div>
                <span>customercare@g3fashions.in</span>
              </div>
              <div className="d_info-item">
                <div><MapPin size={22} className="text-secondary" /></div>
                <span className='d_contact-text'>Poshvue Fashion, Surat, Gujarat 395007</span>
              </div>

              <div className="d_social-flex">
                <span className="w-100 small text-muted mb-1 d-md-block d-none">FOLLOW US</span>
                <a href="#" className="d_social-icon"><Facebook size={18} /></a>
                <a href="#" className="d_social-icon"><Instagram size={18} /></a>
                <a href="#" className="d_social-icon"><Youtube size={18} /></a>
                <a href="#" className="d_social-icon" style={{ background: '#25D366' }}><Send size={18} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="d_footer-bottom">
          <p className="m-0">© 2026 Poshvue. All Rights Reserved.</p>
          <div className="d_payment-methods">
            <img src="https://cdn-icons-png.flaticon.com/512/196/196566.png" alt="paypal" />
            <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="visa" />
            <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="mastercard" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;