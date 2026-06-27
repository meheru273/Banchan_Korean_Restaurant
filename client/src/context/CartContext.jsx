import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

const GUEST_KEY = 'banchan_guest_cart';
const emptyCart = { items: [], subtotal: 0, itemCount: 0, restaurantId: null };

const readGuest = () => {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || emptyCart; } catch { return emptyCart; }
};
const writeGuest = (items, restaurantId) => {
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const cart = { items, subtotal, itemCount, restaurantId: restaurantId || null };
  localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
  return cart;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(emptyCart);

  // Load cart on mount / user change
  const refresh = useCallback(async () => {
    if (!user) { setCart(readGuest()); return; }
    try { const { data } = await api.get('/orders/cart'); setCart(data.data); } catch { /* ignore */ }
  }, [user]);

  // Migrate guest cart → server when user logs in
  useEffect(() => {
    if (!user) { setCart(readGuest()); return; }
    const guest = readGuest();
    if (!guest.items.length) { refresh(); return; }
    (async () => {
      for (const item of guest.items) {
        try { await api.post('/orders/cart/items', item); } catch { /* skip conflicts */ }
      }
      localStorage.removeItem(GUEST_KEY);
      refresh();
      toast.success('Your basket was saved');
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addItem = async (item) => {
    if (!user) {
      const g = readGuest();
      const existing = g.items.find((i) => i.menuItemId === item.menuItemId);
      const newItems = existing
        ? g.items.map((i) => i.menuItemId === item.menuItemId
            ? { ...i, quantity: Math.min(20, i.quantity + (item.quantity || 1)) }
            : i)
        : [...g.items, { ...item, quantity: item.quantity || 1 }];
      setCart(writeGuest(newItems, item.restaurantId));
      toast.success(`${item.name} added`);
      return;
    }
    try {
      const { data } = await api.post('/orders/cart/items', item);
      setCart(data.data);
      toast.success(`${item.name} added`);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to add item'); }
  };

  const setQuantity = async (menuItemId, quantity) => {
    if (!user) {
      const g = readGuest();
      const newItems = quantity <= 0
        ? g.items.filter((i) => i.menuItemId !== menuItemId)
        : g.items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity } : i);
      setCart(writeGuest(newItems, g.restaurantId));
      return;
    }
    try { const { data } = await api.patch(`/orders/cart/items/${menuItemId}`, { quantity }); setCart(data.data); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const removeItem = async (menuItemId) => {
    if (!user) {
      const g = readGuest();
      setCart(writeGuest(g.items.filter((i) => i.menuItemId !== menuItemId), g.restaurantId));
      return;
    }
    try { const { data } = await api.delete(`/orders/cart/items/${menuItemId}`); setCart(data.data); } catch { /* ignore */ }
  };

  const clear = async () => {
    if (!user) { localStorage.removeItem(GUEST_KEY); setCart(emptyCart); return; }
    try { await api.delete('/orders/cart'); setCart(emptyCart); } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{ cart, refresh, addItem, setQuantity, removeItem, clear }}>{children}</Ctx.Provider>;
};

export const useCart = () => useContext(Ctx);
