import { Link } from "react-router-dom";
import ProductList from "../components/ProductList";

function HomePage() {
    return (
        <div className="container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-tag">
                        <span>⚡</span>
                        <span>Next-Gen E-Commerce</span>
                    </div>
                    <h1 className="hero-title">
                        Discover Premium Tech & Modern Lifestyle Goods
                    </h1>
                    <p className="hero-description">
                        Shop curated, top-tier electronics, wearables, and gadgets with instant checkout and verified secure payments.
                    </p>
                    <div className="hero-actions">
                        <Link to="/explore" className="btn-primary" style={{ padding: "12px 28px", fontSize: "15px", fontWeight: 700 }}>
                            Explore Products →
                        </Link>
                        <Link to="/cart" className="btn-secondary" style={{ padding: "12px 24px", fontSize: "15px", fontWeight: 700, background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                            View Cart 🛒
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Highlights Bar */}
            <div className="hero-features-bar">
                <div className="feature-pill">
                    <span className="feature-icon">⚡</span>
                    <div>
                        <div className="feature-title">Fast Delivery</div>
                        <div className="feature-desc">Express doorstep shipping</div>
                    </div>
                </div>
                <div className="feature-pill">
                    <span className="feature-icon">🛡️</span>
                    <div>
                        <div className="feature-title">100% Genuine</div>
                        <div className="feature-desc">Verified brand authenticity</div>
                    </div>
                </div>
                <div className="feature-pill">
                    <span className="feature-icon">💳</span>
                    <div>
                        <div className="feature-title">Secure Payments</div>
                        <div className="feature-desc">Encrypted Razorpay checkout</div>
                    </div>
                </div>
                <div className="feature-pill">
                    <span className="feature-icon">🔄</span>
                    <div>
                        <div className="feature-title">Easy Returns</div>
                        <div className="feature-desc">7-day replacement guarantee</div>
                    </div>
                </div>
            </div>

            {/* Section Heading & Products Preview */}
            <div className="section-header">
                <div>
                    <h2 className="section-title">Trending Products</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
                        Popular picks loved by our customers this week
                    </p>
                </div>
                <Link to="/explore" style={{ color: "var(--primary)", fontWeight: 700, fontSize: "15px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span>Browse All in Explore</span>
                    <span>→</span>
                </Link>
            </div>

            <ProductList />
        </div>
    );
}

export default HomePage;
