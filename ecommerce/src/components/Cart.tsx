import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

function Cart() {
    const cartItems = useCartStore((state) => state.cartItems);
    const increaseQuantity = useCartStore((state) => state.increaseQuantity);
    const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const clearCart = useCartStore((state) => state.clearCart);

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    const shipping = subtotal > 499 || subtotal === 0 ? 0 : 99;
    const total = subtotal + shipping;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

    if (cartItems.length === 0) {
        return (
            <div className="cart-card" style={{ textAlign: "center", padding: "60px 20px" }}>
                <span style={{ fontSize: "64px" }}>🛒</span>
                <h3 style={{ fontSize: "24px", fontWeight: 800, margin: "16px 0 8px" }}>Your cart is empty</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
                    Looks like you haven't added anything to your cart yet.
                </p>
                <Link to="/" className="btn-primary">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-layout">
            <div className="cart-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Shopping Cart ({cartItems.length} items)</h2>
                    <button className="btn-outline-danger btn-sm" onClick={clearCart}>
                        Clear Cart
                    </button>
                </div>

                {cartItems.map((item) => (
                    <div className="cart-item" key={item.product.productId}>
                        <img
                            src={item.product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                            alt={item.product.productName}
                            className="cart-item-img"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                            }}
                        />

                        <div className="cart-item-details">
                            <h4>{item.product.productName}</h4>
                            <div className="cart-item-price">{formatCurrency(item.product.price)} each</div>
                            <div className="qty-stepper">
                                <button
                                    className="qty-stepper-btn"
                                    onClick={() => decreaseQuantity(item.product.productId)}
                                >
                                    -
                                </button>
                                <span className="qty-stepper-val">{item.quantity}</span>
                                <button
                                    className="qty-stepper-btn"
                                    onClick={() => increaseQuantity(item.product.productId)}
                                    disabled={item.quantity >= item.product.stock}
                                    title={item.quantity >= item.product.stock ? "Max stock reached" : ""}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
                                {formatCurrency(item.product.price * item.quantity)}
                            </div>
                            <button
                                style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginTop: "8px" }}
                                onClick={() => removeFromCart(item.product.productId)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="cart-summary-card">
                <h3 className="summary-title">Order Summary</h3>

                <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="summary-row">
                    <span>Estimated Shipping</span>
                    <span>{shipping === 0 ? <strong style={{ color: "var(--accent)" }}>FREE</strong> : formatCurrency(shipping)}</span>
                </div>

                <div className="summary-row">
                    <span>Taxes</span>
                    <span>Included</span>
                </div>

                <div className="summary-row total">
                    <span>Total Amount</span>
                    <span>{formatCurrency(total)}</span>
                </div>

                <Link to="/checkout" className="btn-primary btn-full" style={{ padding: "14px" }}>
                    Proceed to Checkout →
                </Link>

                <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
                    🔒 Guaranteed Safe & Secure Checkout
                </p>
            </div>
        </div>
    );
}

export default Cart;