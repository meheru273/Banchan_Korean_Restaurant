import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import api from '../api/axios';
import OrderStatus from '../components/OrderStatus';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);
      try {
        const dRes = await api.get(`/deliveries/order/${id}`);
        setDelivery(dRes.data.data);
      } catch { /* delivery may not exist yet */ }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll every 5s while the order is still in progress
  useEffect(() => {
    if (!order || ['delivered', 'cancelled'].includes(order.status)) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [order, load]);

  if (loading) return <div className="p-20 text-center">Loading…</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1C1613]">{order.orderNumber}</h1>
        <span className={`text-sm px-2 py-1 rounded ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting payment'}
        </span>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-3 text-[#1C1613]">Status</h2>
        <OrderStatus status={order.status} />
      </div>

      {delivery && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold mb-2 text-[#1C1613]">Delivery</h2>
          <p className="text-sm text-gray-600">Status: {delivery.status}</p>
          {delivery.driverName && <p className="text-sm text-gray-600">Driver: {delivery.driverName}</p>}
          {delivery.driverPhone && <p className="text-sm text-gray-600">Phone: {delivery.driverPhone}</p>}
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold mb-2 text-[#1C1613]">Items</h2>
        {order.items.map((it) => (
          <div key={it.menuItemId} className="flex justify-between text-sm py-1">
            <span>{it.quantity}× {it.name}</span>
            <span>£{(it.price * it.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t mt-2 pt-2">
          <span>Total</span><span>£{order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
