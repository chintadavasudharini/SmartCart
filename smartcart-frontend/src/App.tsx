import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import UserDashboard from "./pages/UserDashboard";
import BackgroundJobMonitor from "./pages/BackgroundJobMonitor";
import OrdersPage from "./pages/OrdersPage";

function AppContent() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ flex: "1 0 auto" }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/signin" element={<SigninPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/jobs" element={<BackgroundJobMonitor />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/user" element={<UserDashboard />} />
                </Routes>
            </main>
            {!isAdminRoute && <Footer />}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
