import { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Ctx = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });

  const refresh = useCallback(async () => {
    try { const { data } = await api.get('/orders/cart'); setCart(data.data); } catch { /* not logged in */ }
  }, []);

  const addItem = async (item) => {
    try { const { data } = await api.post('/orders/cart/items', item); setCart(data.data); toast.success(`${item.name} added`); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const setQuantity = async (menuItemId, quantity) => {
    try { const { data } = await api.patch(`/orders/cart/items/${menuItemId}`, { quantity }); setCart(data.data); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const removeItem = async (menuItemId) => {
    try { const { data } = await api.delete(`/orders/cart/items/${menuItemId}`); setCart(data.data); } catch { /* ignore */ }
  };
  const clear = async () => {
    try { await api.delete('/orders/cart'); setCart({ items: [], subtotal: 0, itemCount: 0 }); } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{ cart, refresh, addItem, setQuantity, removeItem, clear }}>{children}</Ctx.Provider>;
};

export const useCart = () => useContext(Ctx);
