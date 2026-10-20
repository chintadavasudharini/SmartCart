import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signin } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

function AdminLoginPage() {
    const user = useAuthStore((state) => state.user);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === "ADMIN") {
            navigate("/admin");
        }
    }, [user, navigate]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await signin({ email, password });

            // Strict Role Enforcement: Only ADMIN role is authorized
            if (user.role !== "ADMIN") {
                logout();
                setError("⛔ Access Denied: This portal is strictly restricted to SmartCart Administrators. Standard user accounts cannot log in here.");
                return;
            }

            // Valid Admin: Authenticate and redirect to Admin Dashboard
            login(user);
            navigate("/admin");
        } catch {
            setError("Invalid administrator email or password. Please verify credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-theme">
            <div className="auth-wrapper" style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="auth-card" style={{ maxWidth: "440px", width: "100%", borderTop: "4px solid var(--primary)" }}>
                {/* Security Badge Header */}
                <div className="auth-header" style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(37, 99, 235, 0.1)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        margin: "0 auto 12px"
                    }}>
                        🔒
                    </div>
                    <h2 className="auth-title" style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 6px" }}>
                        Admin Portal
                    </h2>
                    <p className="auth-subtitle" style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                        SmartCart Control Center
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: "18px" }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: "14px", display: "block", marginBottom: "6px" }}>
                            Admin Email
                        </label>
                        <input
                            className="form-control"
                            type="email"
                            placeholder="admin@smartcart.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: "22px" }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: "14px", display: "block", marginBottom: "6px" }}>
                            Admin Password
                        </label>
                        <div className="password-input-wrapper" style={{ position: "relative" }}>
                            <input
                                className="form-control"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide password" : "Show password"}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" x2="22" y1="2" y2="22" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: "12px 14px",
                            borderRadius: "8px",
                            background: "rgba(220, 38, 38, 0.1)",
                            border: "1px solid rgba(220, 38, 38, 0.25)",
                            color: "var(--danger)",
                            fontSize: "13px",
                            fontWeight: 600,
                            lineHeight: "1.4",
                            marginBottom: "18px"
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary btn-full"
                        style={{ padding: "13px", fontSize: "15px", fontWeight: 700 }}
                        disabled={loading}
                    >
                        {loading ? "Verifying Credentials..." : "Authenticate as Admin →"}
                    </button>
                </form>

                {/* Footer Navigation */}
                <div className="auth-footer" style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border)", fontSize: "13px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div>
                        Are you a customer? <Link to="/signin" style={{ color: "var(--primary)", fontWeight: 700 }}>Customer Sign In</Link>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                        <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← Back to Store</Link>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

export default AdminLoginPage;
