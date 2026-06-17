import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Minus, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const vegTag = (d = {}) => d.isVegan ? 'Vegan' : d.isVegetarian ? 'Veg' : null;

function Thumb({ src, alt, className }) {
  return src
    ? <img src={src} alt={alt} className={className} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
    : <div className={`${className} bg-[repeating-linear-gradient(45deg,#F0E5D0,#F0E5D0_7px,#E9DDC6_7px,#E9DDC6_14px)]`} />;
}

/* ── Slide-up dish detail (matches the prototype's dish screen) ── */
function DishModal({ dish, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  if (!dish) return null;
  const veg = vegTag(dish.dietary);

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-[#FBF6EC] rounded-t-[26px] md:rounded-[26px] max-h-[92vh] overflow-y-auto">
        <div className="relative h-56">
          <Thumb src={dish.image} alt={dish.name} className="h-56 w-full object-cover" />
          <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pt-5 pb-4 -mt-6 relative bg-[#FBF6EC] rounded-t-[26px]">
          <div className="flex items-start justify-between gap-3">
            <div className="font-archivo font-black text-[26px] text-[#1C1613] leading-tight">{dish.name}</div>
            <div className="font-archivo font-black text-[24px] text-[#DC2113] whitespace-nowrap">£{dish.price.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {dish.isPopular && <span className="bg-[#FDECE9] text-[#B0160A] text-[11px] font-extrabold px-2.5 py-1 rounded-md">Popular</span>}
            {veg && <span className="bg-[#E7F1E9] text-[#2F7D4F] text-[11px] font-extrabold px-2.5 py-1 rounded-md">{veg}</span>}
            {dish.dietary?.isHalal && <span className="bg-[#FDECE9] text-[#B0160A] text-[11px] font-extrabold px-2.5 py-1 rounded-md">Halal</span>}
          </div>
          <p className="text-[14.5px] text-[#6B5F54] leading-relaxed mt-3.5">{dish.description}</p>

          <div className="mt-6">
            <div className="font-archivo font-extrabold text-[16px] text-[#1C1613] mb-2.5">Special instructions <span className="text-[12.5px] text-[#A2937C] font-semibold">optional</span></div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={200}
              placeholder="e.g. extra spicy, no onions"
              className="w-full border-[1.5px] border-[#ECE2D0] rounded-[14px] px-4 py-3 text-[15px] bg-white outline-none focus:border-[#DC2113]" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="font-archivo font-extrabold text-[17px] text-[#1C1613]">Quantity</span>
            <div className="flex items-center gap-4 bg-white border-[1.5px] border-[#ECE2D0] rounded-[14px] px-2 py-1.5">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-[10px] bg-[#F4ECDB] text-[#1C1613] flex items-center justify-center"><Minus size={18} /></button>
              <span className="font-archivo font-extrabold text-[19px] min-w-[22px] text-center">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="w-9 h-9 rounded-[10px] bg-[#DC2113] text-white flex items-center justify-center"><Plus size={18} /></button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 px-[18px] pt-3 pb-5 bg-gradient-to-t from-[#FBF6EC] from-70% to-transparent">
          <button onClick={() => onAdd(dish, qty, notes)}
            className="w-full bg-[#DC2113] text-[#FCEFD2] rounded-2xl py-4 font-archivo font-extrabold text-[16.5px] shadow-[0_14px_28px_-12px_rgba(220,33,19,0.6)]">
            Add to basket · £{(dish.price * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, cart } = useCart();
  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [openDish, setOpenDish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/menu/items'),
      api.get('/menu/categories'),
      api.get('/menu/restaurants'),
    ]).then(([i, c, r]) => {
      const its = i.data.data || [];
      const cats = c.data.data || [];
      setItems(its);
      setCategories(cats);
      setRestaurantId(r.data.data?.[0]?._id || null);
      const catParam = params.get('cat');
      setActiveCat(catParam || cats[0]?._id || null);
      const itemParam = params.get('item');
      if (itemParam) setOpenDish(its.find((x) => x._id === itemParam) || null);
    }).catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCategory = categories.find((c) => c._id === activeCat);
  const dishes = useMemo(
    () => items.filter((it) => (it.category?._id || it.category) === activeCat),
    [items, activeCat]
  );

  const selectCat = (id) => { setActiveCat(id); setParams({ cat: id }, { replace: true }); };

  const handleAdd = (dish, qty, notes) => {
    if (!user) { toast.error('Please log in to order'); return navigate('/login'); }
    if (!restaurantId) return toast.error('No restaurant available');
    addItem({ menuItemId: dish._id, name: dish.name, price: dish.price, quantity: qty, specialInstructions: notes, restaurantId });
    setOpenDish(null);
  };

  if (loading) return <div className="p-20 text-center text-[#9C8E76]">Loading menu…</div>;

  return (
    <div className="max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 md:static bg-[#FBF6EC] border-b border-[#EFE6D3] px-5 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-archivo font-black text-[26px] text-[#1C1613] tracking-tight">Menu</div>
            <div className="text-[13px] text-[#9C8E76] mt-0.5">Collection · West Drayton, London</div>
          </div>
          <button onClick={() => navigate('/cart')} className="relative text-[#1C1613] p-1">
            <span className="block w-6 h-6 rounded-md border-2 border-current" />
            {cart.itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#DC2113] text-white text-[11px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{cart.itemCount}</span>
            )}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mt-3.5 pb-1">
          {categories.map((c) => {
            const a = c._id === activeCat;
            return (
              <button key={c._id} onClick={() => selectCat(c._id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[14px] font-extrabold border-2 transition-colors ${a ? 'bg-[#DC2113] border-[#DC2113] text-[#FCEFD2]' : 'bg-white border-[#ECE2D0] text-[#6B5F54]'}`}>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dish list */}
      <div className="px-[18px] pt-4">
        <div className="font-archivo font-extrabold text-[20px] text-[#1C1613] mb-3.5">{activeCategory?.name || 'Dishes'}</div>
        <div className="grid md:grid-cols-2 gap-3.5">
          {dishes.map((d) => {
            const veg = vegTag(d.dietary);
            return (
              <button key={d._id} onClick={() => setOpenDish(d)}
                className="flex gap-3.5 bg-white border border-[#F0E7D5] rounded-[18px] p-3 text-left shadow-[0_10px_24px_-22px_rgba(60,30,10,0.6)]">
                <Thumb src={d.image} alt={d.name} className="w-[88px] h-[88px] rounded-[13px] shrink-0 object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[16px] text-[#1C1613] leading-tight">{d.name}</div>
                  <div className="text-[12.5px] text-[#8A7C6A] mt-1 leading-snug line-clamp-2">{d.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-archivo font-extrabold text-[16px] text-[#1C1613]">£{d.price.toFixed(2)}</span>
                    {d.isPopular && <span className="bg-[#FDECE9] text-[#B0160A] text-[10px] font-extrabold px-1.5 py-[3px] rounded-md">Popular</span>}
                    {veg && <span className="bg-[#E7F1E9] text-[#2F7D4F] text-[10px] font-extrabold px-1.5 py-[3px] rounded-md">{veg}</span>}
                    {!d.isAvailable && <span className="bg-gray-200 text-gray-500 text-[10px] font-extrabold px-1.5 py-[3px] rounded-md">Sold out</span>}
                  </div>
                </div>
                <span className="self-end w-[34px] h-[34px] rounded-[11px] bg-[#DC2113] text-white flex items-center justify-center shrink-0"><Plus size={20} /></span>
              </button>
            );
          })}
          {!dishes.length && <p className="text-[#9C8E76] text-sm">No dishes in this category yet.</p>}
        </div>
      </div>

      {openDish && <DishModal dish={openDish} onClose={() => setOpenDish(null)} onAdd={handleAdd} />}
    </div>
  );
}
