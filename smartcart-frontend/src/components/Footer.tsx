import { useState } from "react";
import { Link } from "react-router-dom";

function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail("");
        }
    };

    return (
        <footer className="site-footer">
            <div className="site-footer-container">
                <div className="footer-top-grid">
                    {/* Brand Column */}
                    <div>
                        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                            <span style={{ fontSize: "26px" }}>⚡</span>
                            <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
                                Smart<span style={{ color: "#f43f5e" }}>Cart</span>
                            </span>
                        </Link>
                        <p className="footer-brand-desc">
                            Next-generation e-commerce platform delivering curated electronics, computers, audio, and wearables with verified checkout security.
                        </p>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", background: "#261320", color: "#fda4af", padding: "4px 10px", borderRadius: "9999px", border: "1px solid #4a2139", fontWeight: 700 }}>
                                🛡️ Verified Merchant
                            </span>
                            <span style={{ fontSize: "12px", background: "#261320", color: "#10b981", padding: "4px 10px", borderRadius: "9999px", border: "1px solid #065f46", fontWeight: 700 }}>
                                ✓ PCI-DSS Level 1
                            </span>
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 className="footer-heading">Catalog</h4>
                        <ul className="footer-links-list">
                            <li><Link to="/explore" className="footer-link">All Products</Link></li>
                            <li><Link to="/explore" className="footer-link">Electronics</Link></li>
                            <li><Link to="/explore" className="footer-link">Smart Watches</Link></li>
                            <li><Link to="/explore" className="footer-link">Audio & Sound</Link></li>
                            <li><Link to="/explore" className="footer-link">Footwear & Gear</Link></li>
                        </ul>
                    </div>

                    {/* Customer Support */}
                    <div>
                        <h4 className="footer-heading">Account & Help</h4>
                        <ul className="footer-links-list">
                            <li><Link to="/orders" className="footer-link">Track Orders</Link></li>
                            <li><Link to="/cart" className="footer-link">My Shopping Cart</Link></li>
                            <li><Link to="/signin" className="footer-link">Customer Sign In</Link></li>
                            <li><Link to="/signup" className="footer-link">Create Account</Link></li>
                            <li><Link to="/admin/login" className="footer-link">Admin Portal</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Subscription */}
                    <div>
                        <h4 className="footer-heading">Stay in the Loop</h4>
                        <p className="footer-newsletter-text">
                            Subscribe for exclusive releases, member-only discounts, and tech drops.
                        </p>
                        {subscribed ? (
                            <div style={{ padding: "10px 14px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #059669", borderRadius: "8px", color: "#34d399", fontSize: "13px", fontWeight: 700 }}>
                                ✓ Thank you for subscribing!
                            </div>
                        ) : (
                            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
                                <input
                                    type="email"
                                    className="footer-newsletter-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="footer-newsletter-btn">
                                    Join
                                </button>
                            </form>
                        )}
                        <div style={{ marginTop: "16px", fontSize: "12px", color: "#8c7382" }}>
                            🔒 We respect your privacy. Unsubscribe anytime.
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom-bar">
                    <div>
                        © {new Date().getFullYear()} SmartCart Technologies Inc. All rights reserved.
                    </div>
                    <div className="footer-badges">
                        <span>Powered by Spring Boot 4</span>
                        <span>•</span>
                        <span>React 19 & TypeScript</span>
                        <span>•</span>
                        <span>Razorpay Secured</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
