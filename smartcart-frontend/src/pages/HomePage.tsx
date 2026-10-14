import ProductList from "../components/ProductList";

function HomePage() {
    return (
        <div className="container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Discover Premium Tech & Modern Lifestyle Goods
                    </h1>
                    <p className="hero-description">
                        Shop curated, top-tier electronics, wearables, and gadgets with instant checkout and verified secure payments.
                    </p>
                </div>
            </section>

            {/* Section Heading & Products */}
            <div className="section-header">
                <h2 className="section-title">Explore Trending Products</h2>
            </div>

            <ProductList />
        </div>
    );
}

export default HomePage;