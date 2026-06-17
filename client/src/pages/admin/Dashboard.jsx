import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, revenue: 0 });

  useEffect(() => {
    api.get('/orders?limit=100').then(({ data }) => {
      const orders = data.data || [];
      const today = new Date().toDateString();
      const revenue = orders
        .filter((o) => o.paymentStatus === 'paid' && new Date(o.createdAt).toDateString() === today)
        .reduce((s, o) => s + o.total, 0);
      setStats({
        total: data.pagination?.total ?? orders.length,
        confirmed: orders.filter((o) => o.status === 'confirmed').length,
        pending: orders.filter((o) => o.status === 'pending').length,
        revenue,
      });
    }).catch(() => {});
  }, []);

  const Card = ({ label, value }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold text-[#1C1613] mt-1">{value}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#1C1613] mb-4">Admin dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card label="Total orders" value={stats.total} />
        <Card label="Confirmed" value={stats.confirmed} />
        <Card label="Pending" value={stats.pending} />
        <Card label="Today's revenue" value={`£${stats.revenue.toFixed(2)}`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/menu" className="bg-[#DC2113] text-white px-4 py-2 rounded">Manage menu</Link>
        <Link to="/admin/orders" className="bg-[#DC2113] text-white px-4 py-2 rounded">Manage orders</Link>
        <Link to="/admin/deliveries" className="bg-[#DC2113] text-white px-4 py-2 rounded">Manage deliveries</Link>
      </div>
    </div>
  );
}
