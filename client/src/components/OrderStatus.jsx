const STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderStatus({ status }) {
  if (status === 'cancelled') {
    return <p className="text-red-600 font-medium">This order was cancelled.</p>;
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex flex-wrap gap-4">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${done ? 'bg-[#DC2113]' : 'bg-gray-300'}`} />
            <span className={done ? 'text-[#1C1613] font-medium' : 'text-gray-400'}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
