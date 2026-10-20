import { Link } from "react-router-dom";

function HomePage() {
    return (
        <div className="container">
            {/* Hero Section */}
            <section className="hero-section" style={{ minHeight: "360px" }}>
                <div className="hero-content">
                    <div className="hero-tag">
                        <span>⚡</span>
                        <span>Official SmartCart Store • 2026 Collection</span>
                    </div>
                    <h1 className="hero-title" style={{ fontSize: "44px", letterSpacing: "-1px" }}>
                        The Next Generation of Modern Commerce.
                    </h1>
                    <p className="hero-description" style={{ fontSize: "18px", color: "#fecdd3" }}>
                        Experience frictionless shopping with instant checkout, encrypted payments via Razorpay, and automated digital invoice delivery.
                    </p>
                    <div className="hero-actions">
                        <Link to="/explore" className="btn-primary" style={{ padding: "14px 34px", fontSize: "16px", fontWeight: 700, borderRadius: "var(--radius-full)" }}>
                            Explore All Products →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Live Stats Counter Banner */}
            <div className="stats-banner">
                <div className="stat-item-box">
                    <div className="stat-number">10,000+</div>
                    <div className="stat-label">Happy Shoppers</div>
                </div>
                <div className="stat-item-box">
                    <div className="stat-number">4.9 ★</div>
                    <div className="stat-label">Customer Satisfaction</div>
                </div>
                <div className="stat-item-box">
                    <div className="stat-number">100%</div>
                    <div className="stat-label">Verified Authenticity</div>
                </div>
                <div className="stat-item-box">
                    <div className="stat-number">&lt; 24h</div>
                    <div className="stat-label">Express Dispatch</div>
                </div>
            </div>

            {/* Shop by Department Grid */}
            <div style={{ marginBottom: "24px" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    textTransform: "uppercase"
                }}>
                    Categories
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h2 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                            Shop by Department
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: "4px 0 0" }}>
                            Curated selections built for performance, durability, and daily style.
                        </p>
                    </div>
                    <Link to="/explore" style={{ color: "var(--primary)", fontWeight: 700, fontSize: "15px", textDecoration: "none" }}>
                        View All Categories →
                    </Link>
                </div>
            </div>

            <div className="categories-showcase">
                <Link to="/explore" className="category-card">
                    <span className="category-card-icon">💻</span>
                    <h3 className="category-card-title">Computers & Laptops</h3>
                    <p className="category-card-desc">High-performance workstations, thin ultrabooks, and enterprise laptops.</p>
                    <span className="category-card-link">Browse Laptops →</span>
                </Link>

                <Link to="/explore" className="category-card">
                    <span className="category-card-icon">⌚</span>
                    <h3 className="category-card-title">Smart Wearables</h3>
                    <p className="category-card-desc">Advanced fitness tracking, optical heart rate monitors, and smart lifestyle watches.</p>
                    <span className="category-card-link">Browse Watches →</span>
                </Link>

                <Link to="/explore" className="category-card">
                    <span className="category-card-icon">🎧</span>
                    <h3 className="category-card-title">Audio & Sound</h3>
                    <p className="category-card-desc">Active noise-canceling headphones, true wireless earbuds, and studio monitors.</p>
                    <span className="category-card-link">Browse Audio →</span>
                </Link>

                <Link to="/explore" className="category-card">
                    <span className="category-card-icon">👟</span>
                    <h3 className="category-card-title">Footwear & Gear</h3>
                    <p className="category-card-desc">Ergonomic daily running shoes, lightweight backpacks, and travel essentials.</p>
                    <span className="category-card-link">Browse Footwear →</span>
                </Link>
            </div>

            {/* Core Value Pillars */}
            <div className="hero-features-bar" style={{ marginBottom: "56px" }}>
                <div className="feature-pill">
                    <span className="feature-icon">⚡</span>
                    <div>
                        <div className="feature-title">Express Shipping</div>
                        <div className="feature-desc">Doorstep delivery nationwide</div>
                    </div>
                </div>
                <div className="feature-pill">
                    <span className="feature-icon">🛡️</span>
                    <div>
                        <div className="feature-title">100% Genuine</div>
                        <div className="feature-desc">Direct from certified brands</div>
                    </div>
                </div>
                <div className="feature-pill">
                    <span className="feature-icon">💳</span>
                    <div>
                        <div className="feature-title">Razorpay Encrypted</div>
                        <div className="feature-desc">PCI-DSS 256-bit safe checkout</div>
                    </div>
                </div>
                <div className="feature-pill">
                    <span className="feature-icon">🔄</span>
                    <div>
                        <div className="feature-title">7-Day Guarantee</div>
                        <div className="feature-desc">Hassle-free replacement policy</div>
                    </div>
                </div>
            </div>

            {/* Customer Testimonials & Social Proof */}
            <div style={{ marginBottom: "24px" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    textTransform: "uppercase"
                }}>
                    Reviews
                </div>
                <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
                    Loved by Discerning Shoppers
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: 0 }}>
                    Real experiences from verified SmartCart customers.
                </p>
            </div>

            <div className="testimonials-grid">
                <div className="testimonial-card">
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-quote">
                        "The smoothest checkout experience I have ever had online. Paid through UPI, and received my digital PDF invoice within seconds."
                    </p>
                    <div className="testimonial-author">
                        <div className="testimonial-avatar">R</div>
                        <div>
                            <div className="testimonial-name">Rahul Sharma</div>
                            <div className="testimonial-location">Verified Buyer • Bengaluru</div>
                        </div>
                    </div>
                </div>

                <div className="testimonial-card">
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-quote">
                        "Ordered a fitness smartwatch and wireless headphones. Both arrived in pristine packaging with valid manufacturer warranties."
                    </p>
                    <div className="testimonial-author">
                        <div className="testimonial-avatar">P</div>
                        <div>
                            <div className="testimonial-name">Priya Mukhopadhyay</div>
                            <div className="testimonial-location">Verified Buyer • Mumbai</div>
                        </div>
                    </div>
                </div>

                <div className="testimonial-card">
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-quote">
                        "The real-time order tracking and Pay Now features for pending checkouts are super helpful. SmartCart is my new favorite store."
                    </p>
                    <div className="testimonial-author">
                        <div className="testimonial-avatar">A</div>
                        <div>
                            <div className="testimonial-name">Amitabh Kulkarni</div>
                            <div className="testimonial-location">Verified Buyer • Hyderabad</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VIP CTA Card */}
            <div className="cart-card" style={{
                padding: "48px 36px",
                textAlign: "center",
                background: "linear-gradient(135deg, #1f0b16 0%, #3b1124 100%)",
                color: "#ffffff",
                border: "1px solid #562744",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                borderRadius: "var(--radius-lg)"
            }}>
                <span style={{ fontSize: "44px", display: "inline-block", marginBottom: "12px" }}>🛍️</span>
                <h2 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 10px", color: "#ffffff" }}>
                    Ready to Upgrade Your Lifestyle?
                </h2>
                <p style={{ color: "#fecdd3", fontSize: "16px", maxWidth: "620px", margin: "0 auto 28px", lineHeight: "1.6" }}>
                    Discover our full product catalog with instant search, category filtering, and certified secure checkout.
                </p>
                <Link to="/explore" className="btn-primary" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 36px",
                    fontSize: "16px",
                    fontWeight: 700,
                    borderRadius: "var(--radius-full)"
                }}>
                    <span>Browse All Products in Explore</span>
                    <span>→</span>
                </Link>
            </div>
        </div>
    );
}

export default HomePage;
