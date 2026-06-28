import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const CAT_KR = {
  starters: '전채', mains: '메인', sides: '반찬', desserts: '디저트',
  drinks: '음료', 'meal sets': '세트', 'rice bowls': '덮밥', 'fried chicken': '치킨',
  'stews & tteok': '찌개', 'drinks & sweets': '음료',
};
const krFor = (name = '') => CAT_KR[name.toLowerCase()] || '메뉴';

function Thumb({ src, alt, className }) {
  return src
    ? <img src={src} alt={alt} className={className} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
    : <div className={`${className} bg-[repeating-linear-gradient(45deg,#F0E5D0,#F0E5D0_8px,#E9DDC6_8px,#E9DDC6_16px)]`} />;
}

export default function Home() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/menu/items'),
      api.get('/menu/categories'),
      api.get('/menu/restaurants'),
    ]).then(([i, c, r]) => {
      setItems(i.data.data || []);
      setCategories(c.data.data || []);
      setRestaurantId(r.data.data?.[0]?._id || null);
    }).catch(() => {});
  }, []);

  const popular = items.filter((it) => it.isPopular);
  const popularList = (popular.length ? popular : items).slice(0, 8);
  const countFor = (catId) => items.filter((it) => (it.category?._id || it.category) === catId).length;
  const firstImageFor = (catId) => items.find((it) => (it.category?._id || it.category) === catId)?.image || null;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/menu?search=${encodeURIComponent(q)}` : '/menu');
  };

  const quickAdd = (it) => {
    if (!restaurantId) return toast.error('No restaurant available');
    addItem({ menuItemId: it._id, name: it.name, price: it.price, quantity: 1, restaurantId });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 md:pb-16">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b md:bg-gradient-to-r from-[#E0240F] to-[#B0160A] rounded-[24px] mt-4 px-6 md:px-12 pt-10 md:pt-16 pb-7 md:pb-14">
        <span className="font-kr pointer-events-none absolute -top-8 right-2 text-[130px] md:text-[220px] leading-none font-black text-white/[0.07]">반찬</span>
        <div className="relative max-w-2xl">
          <div className="flex justify-between items-center mb-6 gap-3">
            <span className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-[12.5px] font-bold text-[#FCEFD2]">
              <span className="w-2 h-2 rounded-full bg-[#6FE08A]" /> West Drayton, London
            </span>
            <span className="text-xs font-bold text-[#FCEFD2]/85 bg-black/15 px-2.5 py-1.5 rounded-full whitespace-nowrap">Open · 11–21</span>
          </div>
          <h1
            className="font-archivo text-[42px] md:text-[68px] leading-[0.95] font-black tracking-tight text-[#F8E7C7] cursor-default select-none transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_32px_rgba(255,255,255,0.35)] hover:tracking-wide">
            BANCHAN
          </h1>
          <p className="text-[15px] md:text-[19px] font-semibold text-[#FCEFD2]/85 mt-1.5 md:mt-3">Korean Grab n&apos; Go 🥢🥡 · authentic Korean recipes, freshly made</p>
          {/* ── Working search bar ── */}
          <form onSubmit={handleSearch}
            className="mt-5 md:mt-7 w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-lg focus-within:ring-2 focus-within:ring-white/60">
            <Search size={18} className="text-[#B7A78A] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, e.g. bibimbap…"
              className="flex-1 bg-transparent outline-none text-[#1C1613] placeholder:text-[#9C8E76] text-[14.5px] font-semibold"
            />
            {search && (
              <button type="submit" className="text-[#DC2113] text-[13px] font-extrabold whitespace-nowrap">Search</button>
            )}
          </form>
        </div>
      </section>

      {/* ── Lunch promo ── */}
      <section className="pt-5 md:pt-6">
        <button onClick={() => navigate('/menu')}
          className="w-full flex items-stretch gap-3.5 md:gap-6 bg-white rounded-[20px] p-4 md:p-6 text-left border border-[#F0E7D5] shadow-[0_12px_26px_-18px_rgba(60,30,10,0.4)] hover:shadow-[0_16px_32px_-12px_rgba(220,33,19,0.15)] hover:-translate-y-0.5 transition-all duration-150">
          <div className="flex-1">
            <span className="inline-block bg-[#FDECE9] text-[#B0160A] text-[11px] font-extrabold tracking-wider px-2.5 py-1 rounded uppercase">Lunch deal</span>
            <div className="font-archivo font-extrabold text-[19px] md:text-[24px] text-[#1C1613] mt-2 leading-tight">Lunch meal sets</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-archivo font-black text-[26px] md:text-[32px] text-[#DC2113]">£8.50</span>
              <span className="text-[13px] md:text-[15px] text-[#8A7C6A] font-semibold">· everything under £13</span>
            </div>
            <span className="inline-flex items-center gap-1.5 mt-3 bg-[#DC2113] text-[#FCEFD2] text-[13px] font-extrabold px-3.5 py-2 rounded-full">
              Order sets <ChevronRight size={14} />
            </span>
          </div>
          <Thumb src={popularList[0]?.image} alt="lunch sets" className="w-[104px] md:w-[200px] shrink-0 rounded-[14px] object-cover" />
        </button>
      </section>

      {/* ── Popular rail ── */}
      <section className="pt-7 md:pt-10">
        <div className="flex items-baseline justify-between mb-3.5">
          <span className="font-archivo font-extrabold text-[19px] md:text-[24px] text-[#1C1613]">Popular right now</span>
          <button onClick={() => navigate('/menu')} className="text-[13px] md:text-[15px] font-bold text-[#DC2113] hover:text-[#B0160A] transition-colors">See all</button>
        </div>
        <div className="flex gap-3.5 md:gap-5 overflow-x-auto no-scrollbar md:overflow-visible md:grid md:grid-cols-3 lg:grid-cols-4 -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          {popularList.map((it) => (
            <div key={it._id}
              className="group w-[156px] shrink-0 md:w-full bg-white rounded-[18px] overflow-hidden border border-[#F0E7D5] shadow-[0_10px_22px_-18px_rgba(60,30,10,0.5)] hover:shadow-[0_16px_32px_-10px_rgba(220,33,19,0.18)] hover:-translate-y-1 transition-all duration-150 cursor-pointer">
              <button onClick={() => navigate(`/menu?item=${it._id}`)} className="block w-full text-left">
                <div className="relative h-28 md:h-44">
                  <Thumb src={it.image} alt={it.name} className="h-28 md:h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {it.isPopular && <span className="absolute top-2 left-2 bg-[#DC2113] text-[#FCEFD2] text-[10px] font-extrabold px-1.5 py-[3px] rounded">Popular</span>}
                </div>
              </button>
              <div className="px-3 md:px-4 pt-2.5 pb-3 md:pb-4">
                <div className="font-extrabold text-[14.5px] md:text-[16px] text-[#1C1613] leading-tight line-clamp-1">{it.name}</div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="font-archivo font-extrabold text-[16px] md:text-[18px] text-[#1C1613]">£{it.price.toFixed(2)}</span>
                  <button onClick={(e) => { e.stopPropagation(); quickAdd(it); }}
                    className="w-[30px] h-[30px] rounded-[10px] bg-[#DC2113] text-white flex items-center justify-center hover:bg-[#B5160E] active:scale-95 transition-all duration-150">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!popularList.length && <p className="text-gray-400 text-sm px-1 col-span-4">Menu loading…</p>}
        </div>
      </section>

      {/* ── Browse categories with first-item images ── */}
      <section className="pt-7 md:pt-10">
        <div className="font-archivo font-extrabold text-[19px] md:text-[24px] text-[#1C1613] mb-3.5">Browse the menu</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3.5">
          {categories.map((c) => {
            const img = firstImageFor(c._id);
            return (
              <button key={c._id} onClick={() => navigate(`/menu?cat=${c._id}`)}
                className="flex items-center gap-3.5 bg-white rounded-[16px] p-2.5 md:p-3.5 border border-[#F0E7D5] text-left hover:shadow-[0_10px_24px_-12px_rgba(220,33,19,0.15)] hover:-translate-y-0.5 hover:border-[#E0CDBA] transition-all duration-150">
                <div className="w-[54px] h-[54px] rounded-[12px] shrink-0 overflow-hidden bg-[repeating-linear-gradient(45deg,#F0E5D0,#F0E5D0_7px,#E9DDC6_7px,#E9DDC6_14px)] flex items-center justify-center">
                  {img
                    ? <img src={img} alt={c.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
                    : <span className="font-kr font-bold text-[17px] text-[#C0A87F]">{krFor(c.name)}</span>
                  }
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-[15.5px] md:text-[17px] text-[#1C1613]">{c.name}</div>
                  <div className="text-[12.5px] text-[#9C8E76]">{countFor(c._id)} dishes</div>
                </div>
                <ChevronRight size={18} className="text-[#C9BAA0]" />
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Collection info ── */}
      <section className="pt-7 md:pt-10">
        <div className="bg-[#2a201b] rounded-[18px] p-[18px] md:p-8 text-[#F8E7C7] md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <div className="font-bold text-[14.5px] md:text-[18px]">Collection &amp; dine-in · Halal &amp; Vegan options</div>
            <div className="text-[13px] md:text-[15px] text-[#F8E7C7]/60 mt-1.5 leading-relaxed">
              121 Faling Lane, West Drayton, Hillingdon<br />United Kingdom UB7 8AG · open daily 11:00–21:00
            </div>
          </div>
          <a href="https://www.google.com/maps/search/?api=1&query=121+Faling+Lane+West+Drayton+UB7+8AG"
            target="_blank" rel="noreferrer"
            className="inline-block mt-4 md:mt-0 bg-[#DC2113] text-[#FCEFD2] text-[13px] md:text-[15px] font-extrabold px-4 md:px-6 py-2 md:py-3 rounded-full whitespace-nowrap hover:bg-[#B5160E] transition-colors">
            Get directions
          </a>
        </div>
      </section>
    </div>
  );
}
