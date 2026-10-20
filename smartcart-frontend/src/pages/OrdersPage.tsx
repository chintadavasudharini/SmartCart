import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api/orderApi";
import { createPayment, verifyPayment } from "../api/paymentApi";
import { useAuthStore } from "../store/authStore";
import type { Order } from "../types/order";

function OrdersPage() {
    const user = useAuthStore((state) => state.user);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [payingOrderId, setPayingOrderId] = useState<number | null>(null);

    const fetchOrders = () => {
        getMyOrders()
            .then(setOrders)
            .catch((err) => {
                console.error("Failed to load user orders:", err);
                setError("Unable to load orders. Please make sure you are signed in.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handlePayNow = async (order: Order) => {
        try {
            setPayingOrderId(order.orderId);
            const payment = await createPayment(order.orderId);

            const options = {
                key: payment.keyId,
                amount: payment.amount,
                currency: payment.currency,
                name: "SmartCart Store",
                description: `Payment for Order #${order.orderId}`,
                order_id: payment.razorpayOrderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || ""
                },
                handler: async function (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) {
                    try {
                        await verifyPayment({
                            orderId: order.orderId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        alert(`🎉 Payment Successful! Order #${order.orderId} is now confirmed.`);
                        fetchOrders();
                    } catch (err) {
                        console.error("Payment verification error:", err);
                        alert("Payment verification failed. Please contact support.");
                    } finally {
                        setPayingOrderId(null);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setPayingOrderId(null);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", function (response: { error: unknown }) {
                console.error("Payment failed:", response.error);
                alert("Payment was unsuccessful. Please try again.");
                setPayingOrderId(null);
            });
            razorpay.open();
        } catch (err: unknown) {
            console.error("Failed to initiate payment:", err);
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
            alert("Unable to initiate payment: " + (errorObj?.response?.data?.message || errorObj?.message || "Please make sure backend server is running."));
            setPayingOrderId(null);
        }
    };

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
                <Link to="/explore" className="btn-secondary btn-sm">
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

                                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
                                    {order.status !== "PAID" && (
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={() => handlePayNow(order)}
                                            disabled={payingOrderId === order.orderId}
                                            style={{
                                                padding: "7px 16px",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                borderRadius: "var(--radius-sm)",
                                                cursor: payingOrderId === order.orderId ? "wait" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            {payingOrderId === order.orderId ? (
                                                "Processing..."
                                            ) : (
                                                <>
                                                    <span>💳</span>
                                                    <span>Pay Now →</span>
                                                </>
                                            )}
                                        </button>
                                    )}
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
