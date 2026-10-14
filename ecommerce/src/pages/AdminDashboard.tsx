import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductList from "../components/ProductList";
import { addProduct } from "../api/productApi";
import { getJobStats } from "../api/jobApi";
import { websocketService } from "../services/websocketService";
import type { JobStats } from "../types/job";

function AdminDashboard() {
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
        getJobStats().then(setJobStats).catch(() => {});

        // Listen for live job updates to keep stats synchronized
        const unsubscribe = websocketService.subscribe(() => {
            getJobStats().then(setJobStats).catch(() => {});
        });

        return () => {
            unsubscribe();
        };
    }, []);

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

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, textAlign: "left", letterSpacing: "-0.5px", margin: "0 0 6px" }}>
                        ⚡ Admin Management Dashboard
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "16px", margin: 0 }}>
                        Manage store catalog, add new products, and monitor background tasks.
                    </p>
                </div>

                <Link to="/admin/jobs" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span>⚡ Live Job Monitor</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Background Jobs Section with Live Backend Data */}
            <div className="cart-card" style={{ marginBottom: "36px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 4px" }}>
                            ⚙️ Background Jobs Overview (Live Data)
                        </h2>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            Asynchronous processing for Email, Invoices, and Notifications
                        </span>
                    </div>

                    <Link to="/admin/jobs" className="btn-secondary btn-sm">
                        View Real-Time STOMP Monitor →
                    </Link>
                </div>

                <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", margin: 0 }}>
                    <div className="stat-card">
                        <div className="stat-title">Total Jobs</div>
                        <div className="stat-value">{jobStats.totalJobs}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Pending</div>
                        <div className="stat-value" style={{ color: "#b45309" }}>{jobStats.pendingJobs}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Processing</div>
                        <div className="stat-value" style={{ color: "var(--primary)" }}>{jobStats.processingJobs}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Completed</div>
                        <div className="stat-value" style={{ color: "var(--accent)" }}>{jobStats.completedJobs}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Failed</div>
                        <div className="stat-value" style={{ color: "var(--danger)" }}>{jobStats.failedJobs}</div>
                    </div>
                </div>
            </div>

            {/* Admin Stats Header */}
            <div className="admin-stats-grid" style={{ marginBottom: "36px" }}>
                <div className="stat-card">
                    <div className="stat-title">Catalog Operations</div>
                    <div className="stat-value">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Payment Gateway</div>
                    <div className="stat-value" style={{ color: "var(--accent)" }}>Razorpay Live</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Security Mode</div>
                    <div className="stat-value" style={{ color: "var(--primary)" }}>JWT Protected</div>
                </div>
            </div>

            {/* Insert Product Form */}
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
    );
}

export default AdminDashboard;