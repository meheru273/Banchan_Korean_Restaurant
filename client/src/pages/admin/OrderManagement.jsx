import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const STATUSES = [
  'pending', 'confirmed', 'preparing', 'ready_for_pickup',
  'out_for_delivery', 'delivered', 'cancelled',
];

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/orders?limit=100')
      .then(({ data }) => setOrders(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success('Status updated');
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="p-20 text-center">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#1C1613] mb-4">Order management</h1>
      <div className="bg-white rounded-lg shadow-sm divide-y">
        {orders.map((o) => (
          <div key={o._id} className="flex items-center justify-between p-3 gap-3">
            <div>
              <p className="font-medium text-[#1C1613]">{o.orderNumber}</p>
              <p className="text-sm text-gray-500">£{o.total.toFixed(2)} · {o.paymentStatus}</p>
            </div>
            <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}
              className="border rounded px-2 py-1 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
        {!orders.length && <p className="p-4 text-gray-500">No orders yet.</p>}
      </div>
    </div>
  );
}
