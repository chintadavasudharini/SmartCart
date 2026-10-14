import ProductList from "../components/ProductList";
import { useAuthStore } from "../store/authStore";

function UserDashboard() {
    const { user } = useAuthStore();

    return (
        <div className="container">
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 800, textAlign: "left", letterSpacing: "-0.5px" }}>
                    Welcome back, {user?.name || "Customer"} 👋
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
                    Browse our latest arrivals and manage your shopping cart.
                </p>
            </div>

            <div className="section-header">
                <h2 className="section-title">Explore Catalog</h2>
            </div>
            <ProductList />
        </div>
    );
}

export default UserDashboard;