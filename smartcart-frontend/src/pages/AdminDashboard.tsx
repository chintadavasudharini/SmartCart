import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import ProductList from "../components/ProductList";
import { addProduct } from "../api/productApi";
import { getJobStats } from "../api/jobApi";
import { websocketService } from "../services/websocketService";
import { useAuthStore } from "../store/authStore";
import type { JobStats } from "../types/job";

function AdminDashboard() {
    const user = useAuthStore((state) => state.user);

    // Product state
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [rating, setRating] = useState("4.5");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    // Real backend job stats
    const [jobStats, setJobStats] = useState<JobStats>({
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0
    });

    useEffect(() => {
        if (!user || user.role !== "ADMIN") return;
        getJobStats().then(setJobStats).catch(() => {});

        // Listen for live job updates to keep stats synchronized
        const unsubscribe = websocketService.subscribe(() => {
            getJobStats().then(setJobStats).catch(() => {});
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage("");
        setIsError(false);
        setLoading(true);
        try {
            await addProduct({
                productName,
                category,
                description,
                price: Number(price),
                stock: Number(stock),
                imageUrl,
                rating: Number(rating),
                status: Number(stock) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"
            });
            setMessage("✓ Product inserted into catalog successfully!");
            setProductName("");
            setCategory("");
            setDescription("");
            setPrice("");
            setStock("");
            setImageUrl("");
            setRating("4.5");
            setTimeout(() => window.location.reload(), 1200);
        } catch {
            setIsError(true);
            setMessage("⚠️ Failed to insert product. Make sure you are logged in as ADMIN.");
        } finally {
            setLoading(false);
        }
    };

    // If not authenticated as Admin, redirect to separate Admin Login page
    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="admin-theme">
            <div className="container">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", background: "rgba(59, 130, 246, 0.2)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "4px 12px", borderRadius: "9999px", fontSize: "13px", fontWeight: 700 }}>
                        🛡️ SmartCart Administrator
                    </div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, textAlign: "left", letterSpacing: "-0.5px", margin: "0 0 6px" }}>
                        ⚡ Admin Management Dashboard
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: 0 }}>
                        Welcome back, <strong style={{ color: "#38bdf8" }}>SmartCart Administrator</strong> ({user?.email}) • Control Center
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link to="/admin/orders" className="btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span>📋 Customer Orders</span>
                        <span>→</span>
                    </Link>
                    <Link to="/admin/jobs" className="btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span>⚡ Job Monitor</span>
                        <span>→</span>
                    </Link>
                </div>
            </div>

            {/* Background Jobs Live Summary Card */}
            <div className="cart-card" style={{ marginBottom: "28px", padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px" }}>
                            ⚙️ Background Jobs Telemetry (Live via WebSocket)
                        </h2>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            Asynchronous workers for Email, PDF Invoices, and Notifications
                        </span>
                    </div>

                    <Link
                        to="/admin/jobs"
                        className="btn-primary btn-sm"
                    >
                        View Live Job Table →
                    </Link>
                </div>

                <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", margin: 0 }}>
                    <Link to="/admin/jobs" className="stat-card" style={{ textDecoration: "none", cursor: "pointer" }}>
                        <div className="stat-title">Total Jobs</div>
                        <div className="stat-value">{jobStats.totalJobs}</div>
                    </Link>
                    <Link to="/admin/jobs" className="stat-card" style={{ textDecoration: "none", cursor: "pointer" }}>
                        <div className="stat-title">Pending</div>
                        <div className="stat-value" style={{ color: "#b45309" }}>{jobStats.pendingJobs}</div>
                    </Link>
                    <Link to="/admin/jobs" className="stat-card" style={{ textDecoration: "none", cursor: "pointer" }}>
                        <div className="stat-title">Processing</div>
                        <div className="stat-value" style={{ color: "var(--primary)" }}>{jobStats.processingJobs}</div>
                    </Link>
                    <Link to="/admin/jobs" className="stat-card" style={{ textDecoration: "none", cursor: "pointer" }}>
                        <div className="stat-title">Completed</div>
                        <div className="stat-value" style={{ color: "var(--accent)" }}>{jobStats.completedJobs}</div>
                    </Link>
                    <Link to="/admin/jobs" className="stat-card" style={{ textDecoration: "none", cursor: "pointer" }}>
                        <div className="stat-title">Failed</div>
                        <div className="stat-value" style={{ color: "var(--danger)" }}>{jobStats.failedJobs}</div>
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: "flex",
                gap: "12px",
                marginBottom: "32px",
                borderBottom: "2px solid var(--border)",
                paddingBottom: "12px"
            }}>
                <Link
                    to="/admin"
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "15px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        background: "var(--primary)",
                        color: "#ffffff"
                    }}
                >
                    📦 Products & Catalog
                </Link>
                <Link
                    to="/admin/orders"
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "15px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        background: "transparent",
                        color: "var(--text-muted)"
                    }}
                >
                    📋 Orders
                </Link>
                <Link
                    to="/admin/jobs"
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "15px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        background: "transparent",
                        color: "var(--text-muted)"
                    }}
                >
                    ⚡ Background Jobs
                </Link>
            </div>

            {/* Add Product Form */}
            <div className="cart-card" style={{ marginBottom: "40px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px" }}>
                            ➕ Add New Product to Catalog
                        </h2>

                        <form className="product-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Product Name</label>
                                <input className="form-control" placeholder="e.g. Wireless Noise-Canceling Headphones" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input className="form-control" placeholder="e.g. Audio / Electronics / Wearables" value={category} onChange={(e) => setCategory(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Price (₹)</label>
                                <input className="form-control" type="number" placeholder="2999" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Stock Quantity</label>
                                <input className="form-control" type="number" placeholder="50" value={stock} onChange={(e) => setStock(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Image URL</label>
                                <input className="form-control" placeholder="https://images.unsplash.com/..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Initial Rating (1-5)</label>
                                <input className="form-control" type="number" step="0.1" placeholder="4.5" value={rating} onChange={(e) => setRating(e.target.value)} required />
                            </div>

                            <div className="form-group" style={{ gridColumn: "span 2" }}>
                                <label className="form-label">Description</label>
                                <textarea className="form-control" placeholder="Detailed product specifications and highlights..." value={description} onChange={(e) => setDescription(e.target.value)} required />
                            </div>

                            <button type="submit" className="btn-primary" style={{ gridColumn: "span 2", padding: "14px" }} disabled={loading}>
                                {loading ? "Inserting Product..." : "Insert Product into Catalog →"}
                            </button>
                        </form>

                        {message && (
                            <p style={{
                                marginTop: "16px",
                                color: isError ? "var(--danger)" : "var(--accent)",
                                fontWeight: 700,
                                textAlign: "center"
                            }}>
                                {message}
                            </p>
                        )}
                    </div>

                    {/* Product Catalog List */}
                    <div className="section-header">
                        <h2 className="section-title">Manage Existing Inventory</h2>
                    </div>
                    <ProductList isAdmin={true} />
                </div>
            </div>
        );
}

export default AdminDashboard;
