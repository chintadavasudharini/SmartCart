import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api/orderApi";
import type { Order } from "../types/order";

function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyOrders()
            .then(setOrders)
            .catch((err) => {
                console.error("Failed to load user orders:", err);
                setError("Unable to load orders. Please make sure you are signed in.");
            })
            .finally(() => setLoading(false));
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString() + " at " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 6px" }}>My Orders</h1>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>View your past orders, payment receipts, and delivery status.</p>
                </div>
                <Link to="/" className="btn-secondary btn-sm">
                    ← Back to Shopping
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Loading your orders...</p>
                </div>
            ) : error ? (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "16px", borderRadius: "8px" }}>
                    <p className="error-message" style={{ margin: 0 }}>⚠️ {error}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="cart-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <span style={{ fontSize: "48px" }}>📦</span>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "16px 0 8px" }}>No Orders Yet</h3>
                    <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>You have not placed any orders yet.</p>
                    <Link to="/" className="btn-primary">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {orders.map((order) => (
                        <div key={order.orderId} className="cart-card" style={{ padding: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                                <div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px" }}>
                                        Order #{order.orderId}
                                    </h3>
                                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                        Placed on {formatDate(order.createdAt)}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{
                                        padding: "4px 12px",
                                        borderRadius: "9999px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        background: order.status === "PAID" ? "#dcfce7" : "#fef3c7",
                                        color: order.status === "PAID" ? "#15803d" : "#b45309"
                                    }}>
                                        {order.status === "PAID" ? "✓ PAID" : order.status}
                                    </span>
                                    <strong style={{ fontSize: "18px", color: "var(--text-main)" }}>
                                        {formatCurrency(order.totalAmount)}
                                    </strong>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {order.items && order.items.map((item) => (
                                    <div key={item.orderItemId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ fontWeight: 600 }}>{item.product?.productName || "Product"}</span>
                                            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>× {item.quantity}</span>
                                        </div>
                                        <span style={{ fontWeight: 600 }}>
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OrdersPage;
