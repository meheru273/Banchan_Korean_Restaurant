import { useLocation, useNavigate } from 'react-router';
import { Home, UtensilsCrossed, ShoppingBag, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart } = useCart();

  if (pathname === '/login' || pathname === '/register') return null;

  const tabs = [
    { key: 'home', label: 'Home', icon: Home, to: '/', active: pathname === '/' },
    { key: 'menu', label: 'Menu', icon: UtensilsCrossed, to: '/menu', active: pathname.startsWith('/menu') },
    { key: 'cart', label: 'Basket', icon: ShoppingBag, to: '/cart', active: pathname === '/cart' || pathname === '/checkout', badge: cart.itemCount },
    { key: 'account', label: user ? 'Account' : 'Sign in', icon: User, to: user ? '/orders' : '/login', active: pathname.startsWith('/orders') },
  ];

  return (
    <>
      {/* Admin FAB — mobile only, admin users only */}
      {user?.role === 'admin' && (
        <button
          onClick={() => navigate('/admin')}
          title="Admin panel"
          className={`md:hidden fixed bottom-[76px] right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-colors ${
            pathname.startsWith('/admin') ? 'bg-[#B0160A]' : 'bg-[#DC2113]'
          }`}>
          <LayoutDashboard size={21} strokeWidth={2.2} />
        </button>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#EFE6D3] flex px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => navigate(t.to)}
              className={`flex-1 flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${t.active ? 'text-[#DC2113]' : 'text-[#A99C8A]'}`}>
              <span className="relative">
                <Icon size={22} strokeWidth={2.2} />
                {t.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#DC2113] text-white text-[10px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">{t.badge}</span>
                )}
              </span>
              {t.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
