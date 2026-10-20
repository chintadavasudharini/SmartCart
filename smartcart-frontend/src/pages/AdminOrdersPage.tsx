import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getAllOrders } from "../api/orderApi";
import { useAuthStore } from "../store/authStore";
import type { Order } from "../types/order";

function AdminOrdersPage() {
    const user = useAuthStore((state) => state.user);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const fetchOrders = () => {
        setLoading(true);
        setError("");
        getAllOrders()
            .then((data) => {
                setOrders(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch admin orders", err);
                setError("Unable to retrieve customer orders. Please ensure your backend is running.");
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!user || user.role !== "ADMIN") return;
        let ignore = false;
        getAllOrders()
            .then((data) => {
                if (!ignore) {
                    setOrders(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    console.error("Failed to fetch admin orders", err);
                    setError("Unable to retrieve customer orders. Please ensure your backend is running.");
                    setLoading(false);
                }
            });
        return () => {
            ignore = true;
        };
    }, [user]);

    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/admin/login" replace />;
    }

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

    // Filtered orders
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.orderId.toString().includes(searchTerm) ||
            order.items?.some((item) =>
                item.product?.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        const matchesStatus =
            statusFilter === "ALL" || order.status.toUpperCase() === statusFilter.toUpperCase();
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = orders
        .filter((ord) => ord.status === "PAID")
        .reduce((sum, ord) => sum + ord.totalAmount, 0);

    const paidOrdersCount = orders.filter((ord) => ord.status === "PAID").length;

    return (
        <div className="admin-theme">
            <div className="container">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "8px",
                            background: "rgba(59, 130, 246, 0.2)",
                            border: "1px solid #3b82f6",
                            color: "#60a5fa",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "13px",
                            fontWeight: 700
                        }}>
                            🛡️ SmartCart Administrator
                        </div>
                        <h1 style={{ fontSize: "32px", fontWeight: 800, textAlign: "left", letterSpacing: "-0.5px", margin: "0 0 6px" }}>
                            📋 Customer Orders Management
                        </h1>
                        <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: 0 }}>
                            Review and track all transactions, receipts, and order items across SmartCart.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button onClick={fetchOrders} className="btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                            🔄 Refresh Orders
                        </button>
                    </div>
                </div>

                {/* Admin Subnav Tabs */}
                <div style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "28px",
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
                            background: "transparent",
                            color: "var(--text-muted)",
                            border: "none"
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
                            background: "var(--primary)",
                            color: "#ffffff",
                            border: "none"
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
                            color: "var(--text-muted)",
                            border: "none"
                        }}
                    >
                        ⚡ Background Jobs
                    </Link>
                </div>

                {/* Telemetry / Summary Cards */}
                <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "28px" }}>
                    <div className="stat-card">
                        <div className="stat-title">Total Orders Placed</div>
                        <div className="stat-value">{orders.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Paid & Confirmed</div>
                        <div className="stat-value" style={{ color: "var(--accent)" }}>{paidOrdersCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Total Gross Revenue</div>
                        <div className="stat-value" style={{ color: "#38bdf8" }}>{formatCurrency(totalRevenue)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Average Order Value</div>
                        <div className="stat-value" style={{ color: "#f59e0b" }}>
                            {orders.length > 0 ? formatCurrency(Math.round(totalRevenue / (paidOrdersCount || 1))) : "₹0"}
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="cart-card" style={{ padding: "16px 20px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: "1", minWidth: "260px" }}>
                            <span style={{ fontSize: "16px" }}>🔍</span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Order ID or Product name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ margin: 0 }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>Status:</span>
                            {(["ALL", "PAID", "PENDING"] as const).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        border: "1px solid var(--border)",
                                        cursor: "pointer",
                                        background: statusFilter === status ? "var(--primary)" : "transparent",
                                        color: statusFilter === status ? "#fff" : "var(--text-muted)"
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Orders Content */}
                <div className="cart-card" style={{ padding: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 4px" }}>
                                Orders Directory
                            </h2>
                            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                                Showing {filteredOrders.length} of {orders.length} total orders
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                            Loading customer orders...
                        </div>
                    ) : error ? (
                        <div style={{
                            padding: "16px",
                            borderRadius: "8px",
                            background: "rgba(220, 38, 38, 0.1)",
                            border: "1px solid rgba(220, 38, 38, 0.25)",
                            color: "var(--danger)",
                            textAlign: "center"
                        }}>
                            {error}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                            No orders match your filter criteria.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="jobs-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Order Date</th>
                                        <th>Total Amount</th>
                                        <th>Payment Status</th>
                                        <th>Items Purchased</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((ord) => (
                                        <tr key={ord.orderId}>
                                            <td style={{ fontWeight: 800, color: "#38bdf8" }}>
                                                #{ord.orderId}
                                            </td>
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
                                                            <div key={idx} style={{ color: "var(--text-main)", marginBottom: "4px" }}>
                                                                • <strong style={{ color: "var(--text-main)" }}>{it.product ? it.product.productName : "Product"}</strong> × {it.quantity}
                                                                <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>({formatCurrency(it.price)})</span>
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
            </div>
        </div>
    );
}

export default AdminOrdersPage;
