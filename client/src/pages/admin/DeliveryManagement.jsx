import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null); // deliveryId being assigned
  const [driver, setDriver] = useState({ driverId: '', driverName: '', driverPhone: '' });

  const load = () => {
    setLoading(true);
    api.get('/deliveries/pending')
      .then(({ data }) => setDeliveries(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const assign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/deliveries/${assigning}/assign`, driver);
      toast.success('Driver assigned');
      setAssigning(null);
      setDriver({ driverId: '', driverName: '', driverPhone: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="p-20 text-center">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-[#1C1613] mb-4">Pending deliveries</h1>

      {!deliveries.length && <p className="text-gray-500">No pending deliveries.</p>}

      <div className="space-y-3">
        {deliveries.map((d) => (
          <div key={d._id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#1C1613]">{d.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  {d.deliveryAddress?.line1}, {d.deliveryAddress?.postcode}
                </p>
                <p className="text-sm text-gray-500">Customer: {d.customerName}</p>
              </div>
              <button onClick={() => setAssigning(assigning === d._id ? null : d._id)}
                className="bg-[#DC2113] text-white px-3 py-1 rounded text-sm">
                {assigning === d._id ? 'Close' : 'Assign driver'}
              </button>
            </div>

            {assigning === d._id && (
              <form onSubmit={assign} className="mt-3 space-y-2 border-t pt-3">
                <input className="w-full border rounded px-3 py-2" placeholder="Driver ID" required
                  value={driver.driverId} onChange={(e) => setDriver({ ...driver, driverId: e.target.value })} />
                <input className="w-full border rounded px-3 py-2" placeholder="Driver name" required
                  value={driver.driverName} onChange={(e) => setDriver({ ...driver, driverName: e.target.value })} />
                <input className="w-full border rounded px-3 py-2" placeholder="Driver phone"
                  value={driver.driverPhone} onChange={(e) => setDriver({ ...driver, driverPhone: e.target.value })} />
                <button className="bg-[#DC2113] text-white px-4 py-2 rounded">Confirm</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
