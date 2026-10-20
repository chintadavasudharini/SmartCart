import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signin } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

interface SigninPageProps {
    setPage?: (page: string) => void;
}

function SigninPage({ setPage }: SigninPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = await signin({ email, password });
            login(user);
            if (setPage) {
                setPage(user.role === "ADMIN" ? "admin" : "user");
            }
            if (user.role === "ADMIN") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch {
            setError("Invalid email address or password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="brand-logo-icon" style={{ fontSize: "36px" }}>⚡</span>
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to your SmartCart account</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-control"
                            type="email"
                            placeholder="yourname@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                className="form-control"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
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

                    {error && <p className="error-message" style={{ marginBottom: "16px" }}>⚠️ {error}</p>}

                    <button type="submit" className="btn-primary btn-full" disabled={loading}>
                        {loading ? "Signing In..." : "Sign In →"}
                    </button>
                </form>

                <div className="auth-footer" style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                    <div>
                        Don't have an account? <Link to="/signup">Create one now</Link>
                    </div>
                    <div style={{ fontSize: "13px", paddingTop: "8px", borderTop: "1px solid var(--border)", width: "100%", textAlign: "center" }}>
                        Store Administrator? <Link to="/admin/login" style={{ fontWeight: 700, color: "var(--primary)" }}>Admin Portal Login →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SigninPage;