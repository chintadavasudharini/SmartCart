import { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";
import type { Product } from "../types/product";
import ProductCard from "./ProductCard";

interface ProductListProps {
    isAdmin?: boolean;
}

function ProductList({ isAdmin = false }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    useEffect(() => {
        getProducts()
            .then(setProducts)
            .catch(() => setError("Unable to load products. Make sure backend is running on port 8080."))
            .finally(() => setLoading(false));
    }, []);

    // Ensure every unique item appears ONLY ONCE by product name
    const uniqueProducts = Array.from(
        new Map(
            products.map((item) => [item.productName.trim().toLowerCase(), item])
        ).values()
    );

    const categories = ["All", ...Array.from(new Set(uniqueProducts.map((product) => product.category)))];

    const filteredProducts = uniqueProducts.filter((product) =>
        product.productName.toLowerCase().includes(search.toLowerCase()) &&
        (category === "All" || product.category === category)
    );

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div className="brand-logo-icon" style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
                <p style={{ fontSize: "18px", color: "var(--text-muted)", fontWeight: 600 }}>Loading amazing products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#fee2e2", borderRadius: "12px", border: "1px solid #fca5a5" }}>
                <p className="error-message" style={{ fontSize: "16px" }}>⚠️ {error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="filters-bar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        placeholder="Search products by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="category-pills">
                    {categories.map((item) => (
                        <button
                            key={item}
                            className={`category-pill-btn ${category === item ? "active" : ""}`}
                            onClick={() => setCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "48px" }}>🔍</span>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "12px 0 6px" }}>No products found</h3>
                    <p style={{ color: "var(--text-muted)" }}>Try searching for a different keyword or select another category.</p>
                </div>
            ) : (
                <div className="product-grid">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.productId} product={product} isAdmin={isAdmin} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProductList;