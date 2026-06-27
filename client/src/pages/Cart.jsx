import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { cart, refresh, setQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { refresh(); }, [refresh]);

  const handleCheckout = () => {
    if (!user) { navigate('/login?return=/checkout'); return; }
    navigate('/checkout');
  };

  const total = (cart.subtotal + 2.99).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col pb-28 md:pb-12">
      {/* Header */}
      <div className="px-5 pt-5 pb-3.5 flex items-center gap-3.5 border-b border-[#EFE6D3]">
        <button onClick={() => navigate('/menu')} className="w-10 h-10 rounded-full bg-[#F2E9D8] flex items-center justify-center shrink-0">
          <ChevronLeft size={18} className="text-[#1C1613]" />
        </button>
        <div>
          <div className="font-archivo font-black text-[23px] text-[#1C1613] leading-none">Your basket</div>
          <div className="text-[13px] text-[#9C8E76] mt-1">{cart.itemCount} items · collection</div>
        </div>
      </div>

      {!cart.items.length ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#F2E9D8] flex items-center justify-center mb-4 text-[#C0AD8B]">
            <Plus size={30} />
          </div>
          <div className="font-archivo font-extrabold text-[19px] text-[#1C1613]">Your basket is empty</div>
          <div className="text-[14px] text-[#9C8E76] mt-1.5 max-w-[220px]">Add some banchan, bowls or fried chicken to get started.</div>
          <button onClick={() => navigate('/menu')} className="mt-5 bg-[#DC2113] text-[#FCEFD2] font-extrabold text-[15px] px-6 py-3 rounded-full">Browse the menu</button>
        </div>
      ) : (
        <>
          <div className="flex-1 px-[18px] pt-4">
            <div className="flex flex-col gap-3">
              {cart.items.map((l) => (
                <div key={l.menuItemId} className="flex gap-3 bg-white border border-[#F0E7D5] rounded-[18px] p-3">
                  <div className="w-[70px] h-[70px] rounded-[12px] shrink-0 bg-[repeating-linear-gradient(45deg,#F0E5D0,#F0E5D0_7px,#E9DDC6_7px,#E9DDC6_14px)]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="font-extrabold text-[15px] text-[#1C1613] truncate">{l.name}</span>
                      <span className="font-archivo font-extrabold text-[15px] text-[#1C1613] whitespace-nowrap">£{(l.price * l.quantity).toFixed(2)}</span>
                    </div>
                    {l.specialInstructions && <div className="text-[12px] text-[#9C8E76] mt-0.5 truncate">{l.specialInstructions}</div>}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-3 bg-[#F7F0E2] rounded-[11px] px-1.5 py-1">
                        <button onClick={() => setQuantity(l.menuItemId, l.quantity - 1)} className="w-7 h-7 rounded-lg bg-white text-[#1C1613] flex items-center justify-center"><Minus size={15} /></button>
                        <span className="font-extrabold text-[15px] min-w-[16px] text-center">{l.quantity}</span>
                        <button onClick={() => setQuantity(l.menuItemId, l.quantity + 1)} className="w-7 h-7 rounded-lg bg-[#DC2113] text-white flex items-center justify-center"><Plus size={15} /></button>
                      </div>
                      <button onClick={() => removeItem(l.menuItemId)} className="text-[13px] font-bold text-[#A89A85]">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/menu')} className="w-full text-center text-[14px] font-bold text-[#DC2113] py-3 mt-2">+ Add more items</button>

            <div className="bg-white border border-[#F0E7D5] rounded-[18px] p-[18px] mt-1">
              <div className="flex justify-between text-[14.5px] text-[#6B5F54] mb-2.5"><span>Subtotal</span><span className="font-bold text-[#1C1613]">£{cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-[14.5px] text-[#6B5F54] mb-3"><span>Delivery</span><span className="font-bold text-[#1C1613]">£2.99</span></div>
              <div className="border-t border-dashed border-[#E4D9C4] pt-3 flex justify-between items-baseline">
                <span className="font-archivo font-extrabold text-[17px] text-[#1C1613]">Total</span>
                <span className="font-archivo font-black text-[21px] text-[#DC2113]">£{total}</span>
              </div>
            </div>
          </div>

          <div className="px-[18px] py-3.5 border-t border-[#EFE6D3] bg-[#FBF6EC] sticky bottom-0 md:static">
            <button onClick={handleCheckout}
              className="w-full bg-[#DC2113] text-[#FCEFD2] rounded-2xl py-4 flex items-center justify-between px-5 shadow-[0_14px_28px_-12px_rgba(220,33,19,0.6)] hover:bg-[#B5160E] active:scale-[0.98] transition-all duration-150">
              <span className="font-archivo font-extrabold text-[16.5px]">{user ? 'Go to checkout' : 'Log in to checkout'}</span>
              <span className="font-archivo font-black text-[17px]">£{total}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
