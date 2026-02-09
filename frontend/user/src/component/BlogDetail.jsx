import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import {
  ArrowLeft,
  Share2,
  Facebook,
  Instagram,
  ShoppingBag,
  Quote,
  Bookmark,
  Heart,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import { Link } from "react-router-dom";
import Loader from './Loader';


// ... blogPosts data remains the same as your code ...
const blogPosts = [
  {
    id: 1,
    title: "The Timeless Elegance of Silk Sarees: A Style Guide",
    date: "January 05, 2026",
    author: "Fashion Editor",
    category: "Heritage",
    image:
      "https://avatars.mds.yandex.net/i?id=03d602b005be64c5b381901734377756a8a78bb6-5332128-images-thumbs&n=13",
    introduction:
      "Silk sarees are the pride of Indian heritage. From the intricate zari of Banarasi to the vibrant temple borders of Kanjeevaram, each weave tells a story of culture and craftsmanship. Styling a silk saree requires a balance between traditional roots and modern aesthetics.",
    quote:
      "A saree is not just a garment; it’s a power suit made of six yards of elegance.",
    sections: [
      {
        heading: "1. Choosing the Right Silk",
        body: "The journey of styling starts with picking the right fabric. For grand weddings, heavy mulberry silk or Banarasi silk with gold zari provides a majestic look. For evening galas, lightweight Tussar or Raw Silk offers a sophisticated charm.",
      },
      {
        heading: "2. The Modern Twist",
        body: "For a contemporary wedding look, pair your heritage saree with a contrast-colored corset-style blouse or a heavy embroidered jacket. This blend of structured western silhouettes with fluid Indian drapes is the highlight of 2026 fashion.",
      },
    ],
    tips: [
      "Always pin your pleats from the inside for a cleaner look.",
      "Pair heavy sarees with minimal jewelry to avoid a cluttered appearance.",
      "Use a 'Seedha Pallu' drape for a traditional look.",
    ],
  },
  {
    id: 2,
    title: "Lehenga Trends 2026: What's Hot This Wedding Season",
    date: "January 02, 2026",
    author: "Stylist Sarah",
    category: "Trends",
    image:
      "https://i.pinimg.com/originals/52/aa/e2/52aae2fe91f070ec983e5d0eea95fb17.jpg",
    introduction:
      "Wedding fashion in 2026 is shifting towards 'Quiet Luxury'. Pastel lehengas in shades of dusty rose, sage green, and lavender are dominating the bridal mood boards.",
    quote:
      "Fashion is about comfort and confidence, especially on your big day.",
    sections: [
      {
        heading: "The Rise of Lightweight Fabrics",
        body: "The trend is moving away from heavy 15kg lehengas toward breathable silhouettes like organza and tissue silk. This allows brides to enjoy their day without being weighed down by fabric.",
      },
      {
        heading: "Minimalist Embroidery",
        body: "Instead of full-body zari work, designers are opting for scattered 3D floral motifs and feathered hemlines, giving a whimsical and modern vibe to the traditional silhouette.",
      },
    ],
    tips: [
      "Opt for detachable trails for a dramatic entry.",
      "Mix and match traditional embroidery with modern pastel palettes.",
      "Choose a double dupatta style for a more regal look.",
    ],
  },
  {
    id: 3,
    title: "Mastering the Art of Anarkali: Royal Looks for Everyone",
    date: "December 28, 2025",
    author: "Aditi Sharma",
    category: "Styling",
    image: "https://i.ytimg.com/vi/tJWC-FdNTb4/maxresdefault.jpg",
    introduction:
      "The Anarkali silhouette has been a symbol of regal grace since the Mughal era. Its floor-length flare and fitted bodice make it a universally flattering choice for women of all body types.",
    quote:
      "Anarkalis are the perfect blend of historical grandeur and modern comfort.",
    sections: [
      {
        heading: "Finding Your Perfect Length",
        body: "While floor-length Anarkalis are perfect for weddings, midi-length versions are gaining popularity for pre-wedding functions like Mehendi. Ensure the flare starts just above your waist to create an elongated silhouette.",
      },
      {
        heading: "Fabric Matters",
        body: "Choose velvet Anarkalis for winter events to stay warm and look royal, or opt for Chanderi silk for summer festivities to keep the look light and airy.",
      },
    ],
    tips: [
      "Wear high heels to let the flare fall beautifully.",
      "Heavy Chandbalis are the only accessory you need with a high-neck Anarkali.",
      "Keep your hair in a sleek bun to showcase the neckline.",
    ],
  },
  {
    id: 4,
    title: "Sustainable Fashion: The Rise of Hand-Woven Textiles",
    date: "December 20, 2025",
    author: "Eco Fashionista",
    category: "Sustainability",
    image:
      "https://i.pinimg.com/736x/6e/b9/41/6eb94156fb7017328b5bb9a883ada203.jpg",
    introduction:
      "As the world moves toward conscious consumption, hand-woven Indian textiles like Patola, Jamdani, and Khadi are gaining global recognition for their ethical production and durability.",
    quote: "Wear clothes that tell a story of heritage, not a story of waste.",
    sections: [
      {
        heading: "The Beauty of Imperfection",
        body: "Unlike machine-made fabrics, handloom textiles have slight variations in weave that give them character. These pieces are breathable, skin-friendly, and improve with every wash.",
      },
      {
        heading: "Investing in Heirlooms",
        body: "A hand-woven Saree or Dupatta is an investment. These pieces do not lose their value or style, making them perfect heirlooms to pass down through generations.",
      },
    ],
    tips: [
      "Look for the Handloom Mark to ensure authenticity.",
      "Dry clean your handloom silks to preserve the natural dyes.",
      "Pair a handloom dupatta with a simple solid suit to let the craft shine.",
    ],
  },
  {
    id: 5,
    title: "Contemporary Ethnic: Blending Tradition with Modernity",
    date: "December 15, 2025",
    author: "Modern Muse",
    category: "Indo-Western",
    image:
      "https://i.pinimg.com/originals/0f/4d/93/0f4d933283bcff58eeda10537c9ebf98.jpg",
    introduction:
      "Indo-western fusion is for the modern woman who loves her roots but enjoys contemporary comfort. It’s about breaking boundaries and creating a unique style statement.",
    quote: "Style is a way to say who you are without having to speak.",
    sections: [
      {
        heading: "The Belted Saree Trend",
        body: "Adding a leather or embroidered belt to your saree not only secures the pallu but also defines your waistline, giving a structured and chic look to the fluid drape.",
      },
      {
        heading: "Ethnic Capes and Jackets",
        body: "Swap your traditional dupatta for a long sheer cape or a silk trench coat. This adds a layer of sophistication and is perfect for cooler evening events.",
      },
    ],
    tips: [
      "Balance the look: if the top is heavy, keep the bottom simple.",
      "Experiment with Dhoti pants for a fun, youthful vibe.",
      "Oxidized silver jewelry works best with fusion outfits.",
    ],
  },
  {
    id: 6,
    title: "Navratri Special: Colorful Chaniya Cholis and Mirror Work",
    date: "December 10, 2025",
    author: "Ritika Goel",
    category: "Festive",
    image:
      "https://i.pinimg.com/736x/41/8e/e3/418ee3eee3e58f6338993f0c1e9308f1.jpg",
    introduction:
      "Navratri is the ultimate celebration of colors and rhythm. The classic Chaniya Choli, adorned with 'Abhala' (mirror) work, remains the heartbeat of the festival.",
    quote: "Let your outfit dance with you under the festive lights.",
    sections: [
      {
        heading: "The Power of Mirror Work",
        body: "Traditional Kutchi embroidery mixed with mirrors creates a sparkling effect during Garba. This year, we see mirrors paired with neon threads for a vibrant pop.",
      },
      {
        heading: "Comfort for Dance",
        body: "Choose cotton-based fabrics for your Chaniya Choli. They are breathable and allow you to move freely during long hours of dance and celebration.",
      },
    ],
    tips: [
      "Use heavy safety pins to secure your dupatta for the dance floor.",
      "Stacked oxidized bangles are a must for the festive look.",
      "Go for a backless choli with colorful latkans (tassels).",
    ],
  },
];
function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get(`/content/blogs/${slug}`);
        setPost(res.data.item);
        const rel = await client.get(`/content/blogs`, {
          params: { page: 1, limit: 3 },
        });
        const items = Array.isArray(rel.data.items) ? rel.data.items : [];
        setRelatedPosts(items.filter((it) => it.slug !== slug));
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load blog";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <Loader fullScreen  text="Loading Article..." />
    );
  }

  if (!post) {
    return (
      <Container className="py-5 text-center min-vh-100 d-flex flex-column justify-content-center">
        <h2 className="fw-bold mb-3">Article not found</h2>
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        <Button variant="outline-dark" onClick={() => navigate("/blog")}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <div className="modern-blog-wrapper">
      <Container className="main-container">
        {/* TOP NAVIGATION */}
        <div className="top-nav-bar">
          <Button
            variant="link"
            className="back-btn"
            onClick={() => navigate("/blog")}
          >
            <ArrowLeft size={18} /> Back to Blog
          </Button>
          <div className="share-actions d-flex gap-3">
            <Heart size={18} className="icon-btn" />
            <Bookmark size={18} className="icon-btn" />
            <Share2 size={18} className="icon-btn" />
          </div>
        </div>

        <Row className="justify-content-center">
          <Col lg={10} xl={9}>
            {/* COMPACT HEADER */}
            <header className="post-header text-center">
              <span className="category-tag">{post.category}</span>
              <h1 className="main-title">{post.title}</h1>
              <div className="author-meta">
                <img
                  src={`https://ui-avatars.com/api/?name=${
                    post.author || "Author"
                  }`}
                  alt="author"
                />
                <span>{post.author || "Admin"}</span>
                <span className="dot" />
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </header>

            {/* FEATURED IMAGE */}
            <div className="blog-image-wrapper">
              <img
                src={
                  post.image ||
                  (Array.isArray(post.images) ? post.images[0] : "")
                }
                alt={post.title}
                className="featured-img"
              />
            </div>

            {/* ARTICLE CONTENT */}
            <Row className="justify-content-center">
              <Col lg={10}>
                <article className="blog-content">
                  {post.introduction && (
                    <p className="intro-text">{post.introduction}</p>
                  )}

                  {Array.isArray(post.sections) &&
                    post.sections.map((sec, i) => (
                      <div key={i} className="content-block">
                        <h3>{sec.heading}</h3>
                        <p>{sec.body}</p>
                      </div>
                    ))}

                  {post.quote && (
                    <blockquote className="blog-quote">
                      <Quote size={30} className="quote-icon" />
                      <p>{post.quote}</p>
                    </blockquote>
                  )}

                  {Array.isArray(post.tips) && post.tips.length > 0 && (
                    <div className="tips-box">
                      <h5>✨ Pro Style Guide</h5>
                      <ul>
                        {post.tips.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* COMPACT CTA */}
                  <div className="cta-box-compact">
                    <div className="cta-text">
                      <h4>The {post.category} Edit</h4>
                      <p>Shop now for your favorite look.</p>
                    </div>
                    <Link to="/shoppage" className="cta-btn">
                      Shop Now <ShoppingBag size={16} />
                    </Link>
                  </div>
                </article>

                {/* RELATED POSTS SECTION */}
                <div className="related-section">
                  <h4 className="section-title">You Might Also Love</h4>
                  <Row className="g-3">
                    {relatedPosts.map((rp) => (
                      <Col xs={12} md={4} key={rp._id || rp.slug}>
                        <div
                          className="mini-card-horizontal mx-1"
                          onClick={() => navigate(`/blog/${rp.slug}`)}
                        >
                          <img
                            src={
                              rp.image ||
                              (Array.isArray(rp.images) ? rp.images[0] : "")
                            }
                            alt={rp.title}
                          />
                          <div className="mini-card-info">
                            <span>{rp.category}</span>
                            <h6>{rp.title}</h6>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');

        .modern-blog-wrapper {
          background: #fff;
          color: #2b4d6e;
          padding-bottom: 50px;
        }

        .main-container { max-width: 1100px; }

        /* Navigation */
        .top-nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
        }
        .back-btn { color: #666; text-decoration: none; font-weight: 500; padding: 0; }
        .icon-btn { cursor: pointer; color: #888; transition: 0.3s; }
        .icon-btn:hover { color: #c59d5f; }

        /* Header Area */
        .post-header { margin-bottom: 30px; }
        .category-tag { 
          color: #c59d5f; 
          text-transform: uppercase; 
          font-size: 0.7rem; 
          letter-spacing: 1.5px; 
          font-weight: 700;
        }
        .main-title { 
          font-size: 2.5rem; 
          margin: 10px 0 15px;
          line-height: 1.2;
        }
        .author-meta { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 10px; 
          font-size: 0.85rem; 
          color: #777; 
        }
        .author-meta img { width: 28px; height: 28px; border-radius: 50%; }
        .dot { width: 4px; height: 4px; background: #ddd; border-radius: 50%; }

        /* Image Management */
        .blog-image-wrapper { margin-bottom: 35px; }
        .featured-img { 
          width: 100%; 
          height: 450px; 
          object-fit: cover; 
          border-radius: 12px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        /* Content Spacing */
        .blog-content { line-height: 1.8; font-size: 1.05rem; }
        .intro-text { 
          font-size: 1.2rem; 
          color: #555; 
          font-style: italic; 
          margin-bottom: 25px;
          border-left: 3px solid #c59d5f;
          padding-left: 20px;
        }
        .content-block h3 { margin-top: 30px; font-size: 1.6rem; }
        
        .blog-quote {
          margin: 35px 0;
          padding: 25px;
          background: #fdfaf5;
          border-radius: 12px;
          text-align: center;
        }
        .quote-icon { color: #c59d5f; margin-bottom: 10px; opacity: 0.5; }
        .blog-quote p { font-size: 1.4rem; margin: 0; }

        .tips-box {
          background: #1a1a1a;
          color: #fff;
          padding: 25px;
          border-radius: 12px;
          margin: 30px 0;
        }
        .tips-box h5 { color: #c59d5f; margin-bottom: 15px; }
        .tips-box ul { list-style: none; padding: 0; margin: 0; }
        .tips-box li { margin-bottom: 10px; padding-left: 20px; position: relative; font-size: 0.95rem; }
        .tips-box li::before { content: "→"; position: absolute; left: 0; color: #c59d5f; }

        /* Compact CTA */
        .cta-box-compact {
          background: #f4f1ee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-radius: 12px;
          margin-top: 40px;
        }
        .cta-text h4 { margin: 0; }
        .cta-text p { margin: 0; font-size: 0.9rem; color: #666; }
        .cta-btn { background: #1a1a1a; border: none; padding: 10px 20px; font-size: 0.9rem; border-radius: 6px; color: #fff; list-style: none; text-decoration: none;}

        /* Related Posts */
        .related-section { margin-top: 60px; border-top: 1px solid #eee; padding-top: 40px; }
        .section-title { margin-bottom: 25px; text-align: center; }
        
        .mini-card-horizontal { cursor: pointer; transition: 0.3s; }
        .mini-card-horizontal img { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; }
        .mini-card-info span { font-size: 0.7rem; color: #c59d5f; font-weight: 700; }
        .mini-card-info h6 { font-size: 0.95rem; margin-top: 5px; }
        .mini-card-horizontal:hover img { transform: translateY(-5px); }
         .btn:first-child:active,.btn-link:hover {
         color:black;
         }
        /* Responsive */
        @media (max-width: 768px) {
          .main-title { font-size: 1.8rem; }
          .featured-img { height: 250px; }
          .cta-box-compact { flex-direction: column; text-align: center; gap: 15px; }
          .intro-text { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}

export default BlogDetail;
