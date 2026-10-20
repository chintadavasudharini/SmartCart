import ProductList from "../components/ProductList";

function ExplorePage() {
    return (
        <div className="container">
            {/* Explore Header */}
            <div style={{ marginBottom: "28px" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                }}>
                    ✨ Full Catalog
                </div>
                <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                    Explore Products
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: 0, maxWidth: "600px" }}>
                    Browse our full collection of premium tech, electronics, wearables, and lifestyle essentials with instant search and category filtering.
                </p>
            </div>

            <ProductList />
        </div>
    );
}

export default ExplorePage;
