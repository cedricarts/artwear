import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider }   from "./context/ThemeContext";
import { AuthProvider }    from "./context/AuthContext";
import { CartProvider }    from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { WishlistProvider} from "./context/WishlistContext";
import ProtectedRoute      from "./components/ProtectedRoute";
import Navbar              from "./components/Navbar";

import StorefrontPage      from "./pages/StorefrontPage";
import ProductDetailPage   from "./pages/ProductDetailPage";
import CartPage            from "./pages/CartPage";
import CheckoutPage        from "./pages/CheckoutPage";
import OrderSuccessPage    from "./pages/OrderSuccessPage";
import LoginPage           from "./pages/LoginPage";
import WishlistPage        from "./pages/WishlistPage";
import OrderHistoryPage    from "./pages/OrderHistoryPage";
import CustomDesignPage    from "./pages/CustomDesignPage";
import DesignSuccessPage   from "./pages/DesignSuccessPage";
import AccountPage         from "./pages/AccountPage";

import AdminDashboard      from "./pages/admin/AdminDashboard";
import AdminProducts       from "./pages/admin/AdminProducts";
import AdminDesignRequests from "./pages/admin/AdminDesignRequests";
import AdminAnalytics      from "./pages/admin/AdminAnalytics";
import AdminHomeContent    from "./pages/admin/AdminHomeContent";

import "./styles/global.css";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProductProvider>
            <WishlistProvider>
              <CartProvider>
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/"                element={<StorefrontPage />} />
                    <Route path="/product/:id"     element={<ProductDetailPage />} />
                    <Route path="/cart"            element={<CartPage />} />
                    <Route path="/checkout"        element={<CheckoutPage />} />
                    <Route path="/order-success"   element={<OrderSuccessPage />} />
                    <Route path="/login"           element={<LoginPage />} />
                    <Route path="/wishlist"        element={<WishlistPage />} />
                    <Route path="/orders"          element={<OrderHistoryPage />} />
                    <Route path="/custom-design"   element={<CustomDesignPage />} />
                    <Route path="/design-success"  element={<DesignSuccessPage />} />
                    <Route path="/account"         element={<AccountPage />} />

                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                    <Route path="/admin/design-requests" element={<ProtectedRoute><AdminDesignRequests /></ProtectedRoute>} />
                    <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                    <Route path="/admin/home-content" element={<ProtectedRoute><AdminHomeContent /></ProtectedRoute>} />
                  </Routes>
                </main>
              </CartProvider>
            </WishlistProvider>
          </ProductProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
