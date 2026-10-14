import { Link } from "react-router-dom";
import Cart from "../components/Cart";

function CartPage() {
    return (
        <div className="container">
            <div style={{ marginBottom: "20px" }}>
                <Link to="/" className="btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    ← Continue Shopping
                </Link>
            </div>
            <Cart />
        </div>
    );
}

export default CartPage;