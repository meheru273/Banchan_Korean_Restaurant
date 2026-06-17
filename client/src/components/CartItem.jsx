import { Minus, Plus, Trash2 } from 'lucide-react';

export default function CartItem({ item, onSetQuantity, onRemove }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
      <div>
        <p className="font-medium text-[#1C1613]">{item.name}</p>
        <p className="text-sm text-gray-500">£{item.price.toFixed(2)} each</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onSetQuantity(item.menuItemId, item.quantity - 1)} className="p-1 border rounded">
            <Minus size={16} />
          </button>
          <span className="w-6 text-center">{item.quantity}</span>
          <button onClick={() => onSetQuantity(item.menuItemId, item.quantity + 1)} className="p-1 border rounded">
            <Plus size={16} />
          </button>
        </div>

        <span className="font-bold w-16 text-right">£{(item.price * item.quantity).toFixed(2)}</span>

        <button onClick={() => onRemove(item.menuItemId)} className="text-red-500 p-1">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
