import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Calendar, User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Loader from './Loader';

function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await client.get("/content/blogs", {
          params: { page: 1, limit: 12 },
        });
        setPosts(res.data.items || []);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load blogs";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="d_blog-page-wrapper py-lg-5 py-3">
      <Container>
        <div className="text-center mb-lg-5 mb-3">
          <h1 className="d_blog-main-title">Fashion Journal</h1>
          <p className="d_blog-subtitle mx-auto">
            Stories, trends, and inspiration behind timeless Indian fashion.
          </p>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>

        <Row className="gx-4 gy-5">
          {loading && (
            <Col xs={12}>
            <Loader  text="Loading Data..." />
            </Col>
          )}
          {!loading &&
            posts.map((post) => (
              console.log(post,'post'),
              <Col key={post._id || post.slug} lg={4} md={6}>
                <Card className="d_blog-card h-100 mx-1">
                  <div className="d_blog-img-container">
                    <Card.Img
                      src={post.images[0]}
                      alt={post.title}
                    />
                  </div>

                  <Card.Body className="d-flex flex-column p-4">
                    <Card.Title className="d_blog-card-title">
                      {post.title}
                    </Card.Title>

                    <div className="d_blog-meta">
                      <span>
                        <Calendar size={14} />{" "}
                        {new Date(
                          post.publishedAt || post.createdAt
                        ).toLocaleDateString()}
                      </span>
                      <span>
                        <User size={14} /> {post.author || "Admin"}
                      </span>
                    </div>

                    <Card.Text className="d_blog-card-excerpt">
                      {post.excerpt || ""}
                    </Card.Text>

                    <Button
                      variant="link"
                      className="d_blog-read-more mt-auto"
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    >
                      Read Article <ArrowRight size={16} />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      </Container>

      <style>{`
        .d_blog-page-wrapper { background: #fafafa; }
        .d_blog-main-title { font-size: 2.6rem; font-weight: 800; letter-spacing: -1px; }
        .d_blog-subtitle { max-width: 620px; color: #666; font-size: 1rem; }
        .d_blog-card { border-radius: 16px; overflow: hidden; border: 1px solid #eee; transition: all 0.35s ease; background: #fff; }
        .d_blog-card:hover { transform: translateY(-8px); box-shadow: 0 20px 45px rgba(0,0,0,0.08); }
        .d_blog-img-container { aspect-ratio: 16/10; overflow: hidden; }
        .d_blog-img-container img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .d_blog-card:hover img { transform: scale(1.08); }
        .d_blog-card-title { font-size: 1.25rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.75rem; }
        .d_blog-meta { display: flex; gap: 16px; font-size: 0.8rem; color: #999; margin-bottom: 1rem; }
        .d_blog-meta svg { margin-right: 4px; }
        .d_blog-card-excerpt { font-size: 0.9rem; color: #555; line-height: 1.6; margin-bottom: 1.5rem; }
        .d_blog-read-more { font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; color: #0a2845; display: inline-flex; align-items: center; gap: 6px; padding: 0; }
        .d_blog-read-more:hover { color: #c59d5f; text-decoration: none; }
        .btn:first-child:active,:not(.btn-check)+.btn:active{ color:black; }
        @media (max-width: 768px) { .d_blog-main-title { font-size: 2rem; } }
      `}</style>
    </div>
  );
}

export default Blog;
