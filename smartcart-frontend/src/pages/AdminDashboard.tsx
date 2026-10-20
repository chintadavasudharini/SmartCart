import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductList from "../components/ProductList";
import BackgroundJobMonitor from "./BackgroundJobMonitor";
import AdminLoginPage from "./AdminLoginPage";
import { addProduct } from "../api/productApi";
import { getJobStats } from "../api/jobApi";
import { getAllOrders } from "../api/orderApi";
import { websocketService } from "../services/websocketService";
import { useAuthStore } from "../store/authStore";
import type { JobStats } from "../types/job";
import type { Order } from "../types/order";

function AdminDashboard() {
    const user = useAuthStore((state) => state.user);
    const [activeSection, setActiveSection] = useState<"products" | "orders" | "jobs">("products");

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

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

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

    useEffect(() => {
        if (!user || user.role !== "ADMIN") return;
        if (activeSection === "orders") {
            let ignore = false;
            getAllOrders()
                .then((data) => {
                    if (!ignore) {
                        setOrders(data);
                        setOrdersLoading(false);
                    }
                })
                .catch((err) => {
                    if (!ignore) {
                        console.error("Failed to load orders", err);
                        setOrdersLoading(false);
                    }
                });
            return () => {
                ignore = true;
            };
        }
    }, [user, activeSection]);

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

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    // If not authenticated as Admin, show Admin Login Portal directly
    if (!user || user.role !== "ADMIN") {
        return <AdminLoginPage />;
    }

    return (
        <div className="container">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, textAlign: "left", letterSpacing: "-0.5px", margin: "0 0 6px" }}>
                        ⚡ Admin Management Dashboard
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "16px", margin: 0 }}>
                        Manage store catalog, view customer orders, and monitor real-time background jobs.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Link to="/admin/jobs" className="btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span>⚡ Dedicated Job Monitor</span>
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

                    <button
                        onClick={() => setActiveSection("jobs")}
                        className="btn-primary btn-sm"
                        style={{ cursor: "pointer" }}
                    >
                        View Live Job Table ↓
                    </button>
                </div>

                <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", margin: 0 }}>
                    <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveSection("jobs")}>
                        <div className="stat-title">Total Jobs</div>
                        <div className="stat-value">{jobStats.totalJobs}</div>
                    </div>
                    <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveSection("jobs")}>
                        <div className="stat-title">Pending</div>
                        <div className="stat-value" style={{ color: "#b45309" }}>{jobStats.pendingJobs}</div>
                    </div>
                    <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveSection("jobs")}>
                        <div className="stat-title">Processing</div>
                        <div className="stat-value" style={{ color: "var(--primary)" }}>{jobStats.processingJobs}</div>
                    </div>
                    <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveSection("jobs")}>
                        <div className="stat-title">Completed</div>
                        <div className="stat-value" style={{ color: "var(--accent)" }}>{jobStats.completedJobs}</div>
                    </div>
                    <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveSection("jobs")}>
                        <div className="stat-title">Failed</div>
                        <div className="stat-value" style={{ color: "var(--danger)" }}>{jobStats.failedJobs}</div>
                    </div>
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
                <button
                    type="button"
                    onClick={() => setActiveSection("products")}
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "15px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        background: activeSection === "products" ? "var(--primary)" : "transparent",
                        color: activeSection === "products" ? "#ffffff" : "var(--text-muted)"
                    }}
                >
                    📦 Products
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setActiveSection("orders");
                        if (orders.length === 0) setOrdersLoading(true);
                    }}
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "15px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        background: activeSection === "orders" ? "var(--primary)" : "transparent",
                        color: activeSection === "orders" ? "#ffffff" : "var(--text-muted)"
                    }}
                >
                    📋 Orders
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection("jobs")}
                    style={{
                        padding: "10px 22px",
                        fontWeight: 700,
                        fontSize: "15px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        background: activeSection === "jobs" ? "var(--primary)" : "transparent",
                        color: activeSection === "jobs" ? "#ffffff" : "var(--text-muted)"
                    }}
                >
                    ⚡ Background Jobs
                </button>
            </div>

            {/* SECTION 1: PRODUCTS */}
            {activeSection === "products" && (
                <>
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
                </>
            )}

            {/* SECTION 2: ORDERS */}
            {activeSection === "orders" && (
                <div className="cart-card" style={{ padding: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 4px" }}>
                                📋 Customer Orders Management
                            </h2>
                            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                                Real-time transaction records with payment confirmation
                            </span>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                            {orders.length} {orders.length === 1 ? "Order" : "Orders"} Recorded
                        </span>
                    </div>

                    {ordersLoading ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                            Loading customer orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                            No orders found yet.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="jobs-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Order Date</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Purchased Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((ord) => (
                                        <tr key={ord.orderId}>
                                            <td style={{ fontWeight: 800 }}>#{ord.orderId}</td>
                                            <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                                {formatDate(ord.createdAt)}
                                            </td>
                                            <td style={{ fontWeight: 800, color: "var(--accent)" }}>
                                                {formatCurrency(ord.totalAmount)}
                                            </td>
                                            <td>
                                                <span className={`job-status-badge ${ord.status === "PAID" ? "badge-completed" : "badge-pending"}`}>
                                                    {ord.status === "PAID" ? "✓ PAID" : ord.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: "13px" }}>
                                                    {ord.items && ord.items.length > 0 ? (
                                                        ord.items.map((it, idx) => (
                                                            <div key={idx} style={{ color: "var(--text-main)" }}>
                                                                • {it.product ? it.product.productName : "Product"} × {it.quantity}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: "var(--text-muted)" }}>-</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* SECTION 3: BACKGROUND JOBS */}
            {activeSection === "jobs" && (
                <div>
                    <BackgroundJobMonitor />
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
