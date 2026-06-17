import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${orderId}` },
    });
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      <button disabled={!stripe || submitting}
        className="w-full bg-[#DC2113] text-[#FCEFD2] rounded-2xl py-4 font-archivo font-extrabold text-[16.5px] disabled:opacity-50 shadow-[0_14px_28px_-12px_rgba(220,33,19,0.6)]">
        {submitting ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState('address');     // 'address' → 'payment'
  const [name, setName] = useState(user?.name || user?.email?.split('@')[0] || '');
  const [address, setAddress] = useState({ line1: '', postcode: '', city: 'London' });
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  const total = (cart.subtotal + 2.99).toFixed(2);

  const placeOrder = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const orderRes = await api.post('/orders', {
        userName: name || 'Customer',
        restaurantId: cart.restaurantId,
        deliveryAddress: address,
      });
      const newOrderId = orderRes.data.data._id;
      setOrderId(newOrderId);
      const payRes = await api.post(`/orders/${newOrderId}/pay`);
      setClientSecret(payRes.data.data.clientSecret);
      setStep('payment');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setBusy(false);
    }
  };

  if (!cart.items.length && step === 'address') {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <p className="text-[#9C8E76] mb-3">Your basket is empty.</p>
        <button onClick={() => navigate('/menu')} className="text-[#DC2113] font-bold">Browse the menu</button>
      </div>
    );
  }

  const Header = ({ onBack, title }) => (
    <div className="px-5 pt-5 pb-3.5 flex items-center gap-3.5 border-b border-[#EFE6D3]">
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#F2E9D8] flex items-center justify-center shrink-0">
        <ChevronLeft size={18} className="text-[#1C1613]" />
      </button>
      <div className="font-archivo font-black text-[23px] text-[#1C1613]">{title}</div>
    </div>
  );

  if (step === 'payment' && clientSecret) {
    return (
      <div className="max-w-2xl mx-auto pb-28 md:pb-12">
        <Header onBack={() => setStep('address')} title="Payment" />
        <div className="px-[18px] pt-5">
          <div className="bg-white border border-[#F0E7D5] rounded-[18px] p-4 mb-4 flex justify-between items-baseline">
            <span className="font-archivo font-extrabold text-[16px] text-[#1C1613]">Total to pay</span>
            <span className="font-archivo font-black text-[20px] text-[#DC2113]">£{total}</span>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm orderId={orderId} />
          </Elements>
          <button onClick={() => navigate('/orders')} className="w-full text-center text-[13px] text-[#9C8E76] mt-4">View my orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-28 md:pb-12">
      <Header onBack={() => navigate('/cart')} title="Checkout" />
      <form onSubmit={placeOrder} className="px-[18px] pt-4">
        {/* Collection card */}
        <div className="bg-white border border-[#F0E7D5] rounded-[18px] p-4 flex gap-3.5 items-center">
          <div className="w-[54px] h-[54px] rounded-[13px] bg-[#DC2113] flex items-center justify-center shrink-0">
            <span className="font-kr font-black text-[20px] text-[#F8E7C7]">반찬</span>
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-[15px] text-[#1C1613]">Collect from Banchan</div>
            <div className="text-[12.5px] text-[#9C8E76] mt-0.5 leading-snug">121 Faling Lane, West Drayton<br />Hillingdon · UB7 8AG</div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-5">
          <div className="font-archivo font-extrabold text-[16px] text-[#1C1613] mb-3">Your details</div>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Name for the order"
            className="w-full border-[1.5px] border-[#ECE2D0] rounded-[14px] px-4 py-3.5 text-[15px] bg-white outline-none focus:border-[#DC2113] mb-2.5" />
          <input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} required placeholder="Address line 1"
            className="w-full border-[1.5px] border-[#ECE2D0] rounded-[14px] px-4 py-3.5 text-[15px] bg-white outline-none focus:border-[#DC2113] mb-2.5" />
          <input value={address.postcode} onChange={(e) => setAddress({ ...address, postcode: e.target.value })} required placeholder="Postcode (e.g. UB7 8AG)"
            className="w-full border-[1.5px] border-[#ECE2D0] rounded-[14px] px-4 py-3.5 text-[15px] bg-white outline-none focus:border-[#DC2113]" />
        </div>

        {/* Summary */}
        <div className="mt-5 bg-white border border-[#F0E7D5] rounded-[18px] p-[18px]">
          <div className="font-archivo font-extrabold text-[15px] text-[#1C1613] mb-3">Order summary</div>
          {cart.items.map((l) => (
            <div key={l.menuItemId} className="flex justify-between text-[14px] text-[#6B5F54] mb-2"><span>{l.quantity} × {l.name}</span><span className="font-bold text-[#1C1613]">£{(l.price * l.quantity).toFixed(2)}</span></div>
          ))}
          <div className="flex justify-between text-[14px] text-[#6B5F54] mb-2"><span>Delivery</span><span className="font-bold text-[#1C1613]">£2.99</span></div>
          <div className="border-t border-dashed border-[#E4D9C4] pt-3 mt-1 flex justify-between items-baseline">
            <span className="font-archivo font-extrabold text-[16px] text-[#1C1613]">Total</span>
            <span className="font-archivo font-black text-[20px] text-[#DC2113]">£{total}</span>
          </div>
        </div>

        <button disabled={busy}
          className="w-full mt-5 bg-[#DC2113] text-[#FCEFD2] rounded-2xl py-4 flex items-center justify-between px-5 disabled:opacity-50 shadow-[0_14px_28px_-12px_rgba(220,33,19,0.6)]">
          <span className="font-archivo font-extrabold text-[16.5px]">{busy ? 'Placing order…' : 'Continue to payment'}</span>
          <span className="font-archivo font-black text-[17px]">£{total}</span>
        </button>
      </form>
    </div>
  );
}
