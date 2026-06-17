import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  dietary: { isVegetarian: false, isVegan: false, isHalal: false, isGlutenFree: false },
};

const DIETARY = [
  { key: 'isVegetarian', label: 'Vegetarian' },
  { key: 'isVegan', label: 'Vegan' },
  { key: 'isHalal', label: 'Halal' },
  { key: 'isGlutenFree', label: 'Gluten-free' },
];

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    api.get('/menu/items').then(({ data }) => setItems(data.data || []));
    api.get('/menu/categories').then(({ data }) => setCategories(data.data || []));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      category: item.category?._id || item.category || '',
      image: item.image || '',
      dietary: {
        isVegetarian: !!item.dietary?.isVegetarian,
        isVegan: !!item.dietary?.isVegan,
        isHalal: !!item.dietary?.isHalal,
        isGlutenFree: !!item.dietary?.isGlutenFree,
      },
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      image: form.image || null,
      dietary: form.dietary,
    };
    try {
      if (editingId) {
        await api.patch(`/menu/items/${editingId}`, payload);
        toast.success('Item updated');
      } else {
        await api.post('/menu/items', payload);
        toast.success('Item created');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const toggle = async (id) => {
    try { await api.patch(`/menu/items/${id}/toggle`); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/menu/items/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#1C1613]">Menu management</h1>
        <button onClick={showForm ? () => setShowForm(false) : openCreate}
          className="bg-[#DC2113] text-white px-4 py-2 rounded">
          {showForm ? 'Cancel' : 'Add item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg p-4 shadow-sm mb-6 space-y-3">
          <h2 className="font-semibold text-[#1C1613]">{editingId ? 'Edit item' : 'New item'}</h2>

          <input className="w-full border rounded px-3 py-2" placeholder="Name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="w-full border rounded px-3 py-2" placeholder="Description" required rows={2}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="flex gap-3">
            <input type="number" step="0.01" min="0" className="w-1/2 border rounded px-3 py-2" placeholder="Price" required
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <select className="w-1/2 border rounded px-3 py-2" required
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <input className="w-full border rounded px-3 py-2" placeholder="Image URL (direct link to an image)"
            value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          {form.image && (
            <img src={form.image} alt="preview" className="h-28 w-28 object-cover rounded border"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}

          <div className="flex flex-wrap gap-4">
            {DIETARY.map((d) => (
              <label key={d.key} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={form.dietary[d.key]}
                  onChange={(e) => setForm({ ...form, dietary: { ...form.dietary, [d.key]: e.target.checked } })} />
                {d.label}
              </label>
            ))}
          </div>

          <button className="bg-[#DC2113] text-white px-4 py-2 rounded">
            {editingId ? 'Save changes' : 'Create item'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm divide-y">
        {items.map((it) => (
          <div key={it._id} className="flex items-center justify-between p-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {it.image
                ? <img src={it.image} alt={it.name} className="h-12 w-12 object-cover rounded" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                : <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">No img</div>}
              <div className="min-w-0">
                <p className="font-medium text-[#1C1613] truncate">{it.name}</p>
                <p className="text-sm text-gray-500">£{it.price.toFixed(2)} · {it.category?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggle(it._id)}
                className={`text-xs px-2 py-1 rounded ${it.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {it.isAvailable ? 'Available' : 'Unavailable'}
              </button>
              <button onClick={() => openEdit(it)} className="text-blue-600 text-sm">Edit</button>
              <button onClick={() => remove(it._id)} className="text-red-500 text-sm">Delete</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="p-4 text-gray-500">No items yet.</p>}
      </div>
    </div>
  );
}
