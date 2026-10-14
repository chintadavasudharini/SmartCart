import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { createOrder, createPayment, verifyPayment } from "../api/paymentApi";

const checkoutSchema = z.object({
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "10-digit phone number is required"),
    address: z.string().min(5, "Complete delivery address is required")
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayErrorResponse {
    error: unknown;
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
}

interface RazorpayConstructor {
    new (options: unknown): RazorpayInstance;
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

interface CheckoutFormProps {
    onSuccess?: () => void;
}

function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const user = useAuthStore((state) => state.user);
    const cartItems = useCartStore((state) => state.cartItems);
    const getTotal = useCartStore((state) => state.getTotal);
    const clearCart = useCartStore((state) => state.clearCart);
    const total = getTotal();
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || ""
        }
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    const onSubmit = async (data: CheckoutFormData) => {
        const token = localStorage.getItem("token");
        if (!user && !token) {
            alert("Please sign in to place an order.");
            navigate("/signin");
            return;
        }

        try {
            if (cartItems.length === 0) {
                alert("Your cart is empty. Please add items before checking out.");
                return;
            }
            setSubmitting(true);
            const order = await createOrder(
                cartItems.map((item) => ({
                    productId: item.product.productId,
                    quantity: item.quantity
                }))
            );
            const payment = await createPayment(order.orderId);

            const options = {
                key: payment.keyId,
                amount: payment.amount,
                currency: payment.currency,
                name: "SmartCart Store",
                description: "E-Commerce Order #" + order.orderId,
                order_id: payment.razorpayOrderId,
                prefill: { name: data.name, email: data.email, contact: data.phone },
                notes: { address: data.address },
                handler: async function (response: RazorpayResponse) {
                    try {
                        await verifyPayment({
                            orderId: order.orderId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        clearCart();
                        alert("🎉 Payment Successful! Order #" + order.orderId + " placed successfully.");
                        if (onSuccess) {
                            onSuccess();
                        }
                    } catch (error) {
                        console.error("Payment verification error:", error);
                        alert("Payment verification failed. Please contact support.");
                    } finally {
                        setSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", function (response: RazorpayErrorResponse) {
                console.error("Payment failed:", response.error);
                alert("Payment failed. Please try again.");
                setSubmitting(false);
            });
            razorpay.open();
        } catch (error: unknown) {
            console.error("Order/payment error:", error);
            const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
            if (err?.response?.status === 403 || err?.response?.status === 401) {
                alert("Your session has expired or you are not signed in. Please sign in to complete your order.");
                navigate("/signin");
            } else {
                alert("Unable to initiate payment: " + (err?.response?.data?.message || err?.message || "Please make sure backend server is running."));
            }
            setSubmitting(false);
        }
    };

    return (
        <div>
            {!user && (
                <div style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    color: "#b45309",
                    padding: "16px 20px",
                    borderRadius: "10px",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div>
                        <strong>🔒 Sign In Required:</strong> You must be signed in to your account to place an order.
                    </div>
                    <button
                        className="btn-primary btn-sm"
                        onClick={() => navigate("/signin")}
                        style={{ marginLeft: "16px", whiteSpace: "nowrap" }}
                    >
                        Sign In Now →
                    </button>
                </div>
            )}

            {/* Step Progress */}
            <div className="checkout-steps">
                <div className="step-item">
                    <div className="step-num">1</div>
                    <span>Cart</span>
                </div>
                <div style={{ width: "40px", height: "2px", background: "var(--primary)" }} />
                <div className="step-item active">
                    <div className="step-num">2</div>
                    <span>Shipping & Billing</span>
                </div>
                <div style={{ width: "40px", height: "2px", background: "var(--border)" }} />
                <div className="step-item">
                    <div className="step-num">3</div>
                    <span>Payment</span>
                </div>
            </div>

            <div className="checkout-layout">
                {/* Shipping Details Form */}
                <div className="cart-card">
                    <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "24px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                        Shipping Address & Contact
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-control" type="text" placeholder="Your Name" {...register("name")} />
                            {errors.name && <p className="error-message">{errors.name.message}</p>}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input className="form-control" type="email" placeholder="yourname@gmail.com" {...register("email")} />
                                {errors.email && <p className="error-message">{errors.email.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-control" type="text" placeholder="9876543210" {...register("phone")} />
                                {errors.phone && <p className="error-message">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Delivery Address</label>
                            <textarea className="form-control" placeholder="House no, Street, Landmark, City, Pincode" {...register("address")} />
                            {errors.address && <p className="error-message">{errors.address.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="btn-primary btn-full"
                            style={{ padding: "14px", marginTop: "12px" }}
                            disabled={submitting}
                        >
                            {submitting ? "Opening Payment Gateway..." : `Proceed to Pay ${formatCurrency(total)} 💳`}
                        </button>
                    </form>
                </div>

                {/* Sidebar Order Overview */}
                <div className="cart-summary-card">
                    <h3 className="summary-title">Order Details</h3>

                    <div style={{ maxHeight: "240px", overflowY: "auto", marginBottom: "16px" }}>
                        {cartItems.map((item) => (
                            <div key={item.product.productId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.product.productName}</div>
                                    <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>Qty: {item.quantity} × {formatCurrency(item.product.price)}</div>
                                </div>
                                <div style={{ fontWeight: 700 }}>
                                    {formatCurrency(item.product.price * item.quantity)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="summary-row total">
                        <span>Total Payable</span>
                        <span>{formatCurrency(total)}</span>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-muted)" }}>
                        <div>🔒 <strong>Razorpay Secure Checkout</strong></div>
                        <div style={{ marginTop: "4px" }}>Supports Credit/Debit Cards, UPI, Net Banking, & Wallets.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutForm;