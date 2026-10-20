import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

function Navbar() {
    const { user, logout } = useAuthStore();
    const cartItems = useCartStore((state) => state.cartItems);
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/signin");
    };

    return (
        <header className={`navbar-header ${user?.role === "ADMIN" ? "admin-navbar-header" : ""}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-logo-icon">⚡</span>
                    <span>Smart<span className="brand-accent">Cart</span></span>
                    {user?.role === "ADMIN" && (
                        <span className="admin-badge-pill" style={{ marginLeft: "10px", fontSize: "12px", padding: "3px 10px", background: "rgba(59, 130, 246, 0.25)", color: "#60a5fa", border: "1px solid #3b82f6" }}>
                            🛡️ SmartCart Administrator
                        </span>
                    )}
                </Link>

                <nav className="navbar-links">
                    <Link to="/" className="nav-link">
                        Explore
                    </Link>

                    {user && (
                        <Link to="/orders" className="nav-link">
                            My Orders
                        </Link>
                    )}

                    {user && user.role === "ADMIN" && (
                        <>
                            <Link to="/admin" className="nav-link">
                                Admin Dashboard
                            </Link>
                            <Link to="/admin/jobs" className="nav-link admin-badge-link">
                                ⚡ Background Jobs
                            </Link>
                        </>
                    )}

                    <Link to="/cart" className="nav-cart-btn">
                        <span>🛒</span>
                        <span>Cart</span>
                        {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
                    </Link>

                    {!user ? (
                        <div className="nav-auth-buttons">
                            <Link to="/signin" className="btn-secondary btn-sm">
                                Sign In
                            </Link>
                            <Link to="/signup" className="btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </div>
                    ) : (
                        <div className="user-profile-menu">
                            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                            <span className="user-name">{user.name}</span>
                            <button onClick={handleLogout} className="btn-outline-danger">
                                Logout
                            </button>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Navbar;