import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogOut, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusColor = (s) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  ready_for_pickup: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}[s] || 'bg-gray-100 text-gray-800');

export default function MyOrders() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="max-w-2xl mx-auto pb-28 md:pb-12">
      {/* Account header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-archivo font-black text-[26px] text-[#1C1613] leading-none">My orders</div>
            {user && <div className="text-[13px] text-[#9C8E76] mt-1.5 truncate">{user.name || user.email}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-1.5 bg-[#1C1613] text-[#F8E7C7] text-[13px] font-bold px-3 py-2 rounded-full">
                <ShieldCheck size={15} /> Admin
              </Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white border border-[#ECE2D0] text-[#6B5F54] text-[13px] font-bold px-3 py-2 rounded-full">
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      </div>

      <div className="px-[18px]">
        {loading ? (
          <div className="p-16 text-center text-[#9C8E76]">Loading…</div>
        ) : !orders.length ? (
          <div className="p-12 text-center">
            <p className="text-[#9C8E76] mb-3">You have no orders yet.</p>
            <Link to="/menu" className="text-[#DC2113] font-bold">Browse the menu</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <Link key={o._id} to={`/orders/${o._id}`}
                className="block bg-white border border-[#F0E7D5] rounded-[18px] p-4 hover:shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-archivo font-extrabold text-[16px] text-[#1C1613]">{o.orderNumber}</p>
                    <p className="text-[12.5px] text-[#9C8E76] mt-0.5">{new Date(o.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span>
                    <p className="font-archivo font-black text-[16px] text-[#1C1613] mt-1">£{o.total.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
