import { Link, useNavigate } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#1C1613] text-[#F8E7C7] px-4 py-3 hidden md:flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-baseline gap-2 group">
        <span className="text-xl font-extrabold tracking-tight text-[#F8E7C7] group-hover:text-[#DC2113] transition-colors duration-200">BANCHAN</span>
        <span className="text-lg text-[#DC2113] font-bold group-hover:text-[#F8E7C7] transition-colors duration-200">반찬</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/menu" className="hover:text-[#DC2113] transition-colors">Menu</Link>

        {user && <Link to="/orders" className="hover:text-[#DC2113] transition-colors">My Orders</Link>}
        {user?.role === 'admin' && <Link to="/admin" className="hover:text-[#DC2113] transition-colors">Admin</Link>}

        <Link to="/cart" className="relative hover:text-[#DC2113] transition-colors">
          <ShoppingCart size={22} />
          {cart.itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#DC2113] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </Link>

        {user ? (
          <button onClick={handleLogout} className="bg-[#DC2113] text-white px-3 py-1 rounded text-sm hover:bg-[#B0160A] transition-colors">Logout</button>
        ) : (
          <Link to="/login" className="bg-[#DC2113] text-white px-3 py-1 rounded text-sm hover:bg-[#B0160A] transition-colors">Login</Link>
        )}
      </div>
    </nav>
  );
}
