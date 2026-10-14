import { useNavigate } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";

function CheckoutPage() {
    const navigate = useNavigate();

    return (
        <div className="container">
            <div style={{ marginBottom: "20px" }}>
                <button
                    className="btn-secondary btn-sm"
                    onClick={() => navigate("/cart")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                    ← Back to Cart
                </button>
            </div>
            <CheckoutForm onSuccess={() => navigate("/")} />
        </div>
    );
}

export default CheckoutPage;