import { useState } from "react";
import type { Product } from "../types/product";
import { useCartStore } from "../store/cartStore";
import { deleteProduct, updateProduct } from "../api/productApi";

interface ProductCardProps {
    product: Product;
    isAdmin?: boolean;
}

function ProductCard({ product, isAdmin = false }: ProductCardProps) {
    const addToCart = useCartStore((state) => state.addToCart);
    const cartItems = useCartStore((state) => state.cartItems);

    const cartItem = cartItems.find((item) => item.product.productId === product.productId);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const availableStock = Math.max(0, product.stock - cartQuantity);

    const [editing, setEditing] = useState(false);
    const [addedToast, setAddedToast] = useState(false);
    const [productName, setProductName] = useState(product.productName);
    const [category, setCategory] = useState(product.category);
    const [description, setDescription] = useState(product.description);
    const [price, setPrice] = useState(String(product.price));
    const [stock, setStock] = useState(String(product.stock));
    const [imageUrl, setImageUrl] = useState(product.imageUrl);
    const [rating, setRating] = useState(String(product.rating));
    const [message, setMessage] = useState("");

    const handleAddToCart = () => {
        if (availableStock <= 0) return;
        addToCart(product);
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 1500);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete ${product.productName}?`)) return;
        try {
            await deleteProduct(product.productId);
            window.location.reload();
        } catch {
            alert("Product deletion failed");
        }
    };

    const handleUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await updateProduct(product.productId, {
                productName,
                category,
                description,
                price: Number(price),
                stock: Number(stock),
                imageUrl,
                rating: Number(rating),
                status: Number(stock) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"
            });
            setMessage("Product updated successfully");
            setEditing(false);
            window.location.reload();
        } catch {
            setMessage("Product update failed");
        }
    };

    const formattedPrice = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(product.price);

    return (
        <div className="product-card">
            {!editing ? (
                <>
                    <div className="product-image-container">
                        <img
                            src={product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                            alt={product.productName}
                            className="product-image"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                            }}
                        />
                        <span className="product-badge-category">{product.category}</span>
                        <span className="product-rating-badge">
                            ⭐ {product.rating.toFixed(1)}
                        </span>
                    </div>

                    <h3 className="product-title">{product.productName}</h3>
                    <p className="product-description">{product.description}</p>

                    <div className="product-footer">
                        <div>
                            <div className="product-price">{formattedPrice}</div>
                            <span className={`stock-status ${availableStock > 0 ? "in-stock" : "out-of-stock"}`}>
                                {availableStock > 0 ? `In Stock (${availableStock})` : "Out of Stock"}
                            </span>
                        </div>

                        {!isAdmin ? (
                            <button
                                className="btn-primary"
                                onClick={handleAddToCart}
                                disabled={availableStock === 0}
                            >
                                {addedToast ? "✓ Added" : availableStock > 0 ? "Add to Cart" : "Sold Out"}
                            </button>
                        ) : (
                            <div className="admin-product-buttons">
                                <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>
                                    Edit
                                </button>
                                <button className="btn-outline-danger btn-sm" onClick={handleDelete}>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <form className="product-form" onSubmit={handleUpdate}>
                    <h3 style={{ gridColumn: "span 2", marginBottom: "10px" }}>Update Product</h3>
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                        <label className="form-label">Product Name</label>
                        <input className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Price (₹)</label>
                        <input className="form-control" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Stock</label>
                        <input className="form-control" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Rating</label>
                        <input className="form-control" type="number" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                        <label className="form-label">Image URL</label>
                        <input className="form-control" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                        <label className="form-label">Description</label>
                        <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
                        <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                    {message && <p className="form-message" style={{ gridColumn: "span 2" }}>{message}</p>}
                </form>
            )}
        </div>
    );
}

export default ProductCard;