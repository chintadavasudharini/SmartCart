import { Link } from "react-router-dom";

function HomePage() {
    return (
        <div className="container" style={{ maxWidth: "1140px", padding: "32px 20px 60px" }}>
            {/* Simple Official Hero */}
            <section className="hero-section" style={{ padding: "56px 44px", borderRadius: "20px", marginBottom: "40px" }}>
                <div className="hero-content" style={{ maxWidth: "680px" }}>
                    <div className="hero-tag" style={{ marginBottom: "18px" }}>
                        <span>⚡</span>
                        <span>Official SmartCart Store</span>
                    </div>
                    <h1 className="hero-title" style={{ fontSize: "42px", fontWeight: 800, lineHeight: "1.2", marginBottom: "16px" }}>
                        Premium Tech & Modern Lifestyle Essentials.
                    </h1>
                    <p className="hero-description" style={{ fontSize: "17px", color: "#fecdd3", lineHeight: "1.6", marginBottom: "28px" }}>
                        Discover curated electronics, high-performance laptops, smart wearables, and audio gear with instant Razorpay checkout and express doorstep delivery.
                    </p>
                    <div className="hero-actions">
                        <Link to="/explore" className="btn-primary" style={{ padding: "14px 36px", fontSize: "16px", fontWeight: 700, borderRadius: "var(--radius-full)" }}>
                            Explore Products →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Simple 3-Pillar Value Bar */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginBottom: "48px"
            }}>
                <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "28px" }}>⚡</span>
                    <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Express Delivery</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Fast doorstep dispatch nationwide</div>
                    </div>
                </div>

                <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "28px" }}>🛡️</span>
                    <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>100% Genuine</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Direct certified brand warranty</div>
                    </div>
                </div>

                <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "28px" }}>🔒</span>
                    <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>Secure Checkout</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Encrypted payments via Razorpay</div>
                    </div>
                </div>
            </div>

            {/* Clean Categories Showcase */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                        Browse by Category
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0" }}>
                        Find what you need in our curated departments
                    </p>
                </div>
                <Link to="/explore" style={{ color: "var(--primary)", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>
                    View Full Catalog →
                </Link>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "18px",
                marginBottom: "48px"
            }}>
                <Link to="/explore" style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "22px 20px",
                    textDecoration: "none",
                    transition: "var(--transition)",
                    display: "block",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "10px" }}>💻</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-main)" }}>Laptops & Computers</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>High performance laptops</p>
                </Link>

                <Link to="/explore" style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "22px 20px",
                    textDecoration: "none",
                    transition: "var(--transition)",
                    display: "block",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "10px" }}>⌚</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-main)" }}>Smart Wearables</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Fitness & smart watches</p>
                </Link>

                <Link to="/explore" style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "22px 20px",
                    textDecoration: "none",
                    transition: "var(--transition)",
                    display: "block",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "10px" }}>🎧</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-main)" }}>Audio & Sound</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Wireless headphones</p>
                </Link>

                <Link to="/explore" style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "22px 20px",
                    textDecoration: "none",
                    transition: "var(--transition)",
                    display: "block",
                    boxShadow: "var(--shadow-sm)"
                }}>
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "10px" }}>👟</span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "var(--text-main)" }}>Footwear & Gear</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Comfortable shoes & bags</p>
                </Link>
            </div>

            {/* Simple Clean Call-to-Action */}
            <div style={{
                background: "linear-gradient(135deg, #1f0b16 0%, #3b1124 100%)",
                borderRadius: "16px",
                padding: "36px 32px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                border: "1px solid #562744"
            }}>
                <div>
                    <h3 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px", color: "#ffffff" }}>
                        Looking for something specific?
                    </h3>
                    <p style={{ color: "#fecdd3", fontSize: "14px", margin: 0 }}>
                        Search and filter across our complete inventory in the catalog.
                    </p>
                </div>
                <Link to="/explore" className="btn-primary" style={{ padding: "12px 28px", fontSize: "14px", fontWeight: 700, borderRadius: "var(--radius-full)" }}>
                    Go to Explore Catalog →
                </Link>
            </div>
        </div>
    );
}

export default HomePage;
