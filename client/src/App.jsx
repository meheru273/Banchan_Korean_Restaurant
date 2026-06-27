import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/admin/Dashboard';
import AdminMenu from './pages/admin/MenuManagement';
import AdminOrders from './pages/admin/OrderManagement';
import AdminDeliveries from './pages/admin/DeliveryManagement';

const Protected = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center">Loading…</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <main className="min-h-screen bg-[#FBF6EC]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/cart"           element={<Cart />} />
            <Route path="/checkout"       element={<Protected><Checkout /></Protected>} />
            <Route path="/orders"         element={<Protected><MyOrders /></Protected>} />
            <Route path="/orders/:id"     element={<Protected><OrderTracking /></Protected>} />

            <Route path="/admin"             element={<Protected role="admin"><AdminDashboard /></Protected>} />
            <Route path="/admin/menu"        element={<Protected role="admin"><AdminMenu /></Protected>} />
            <Route path="/admin/orders"      element={<Protected role="admin"><AdminOrders /></Protected>} />
            <Route path="/admin/deliveries"  element={<Protected role="admin"><AdminDeliveries /></Protected>} />
          </Routes>
        </main>
        <BottomNav />
      </CartProvider>
    </AuthProvider>
  );
}
