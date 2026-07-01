import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';

interface AdminShopProductsProps {
  apiUrl: string;
  token: string;
}

export const AdminShopProducts: React.FC<AdminShopProductsProps> = ({ apiUrl, token }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ _id: '', name: '', description: '', price: '', image: '', category: 'Antioxidants', isActive: true });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/shop-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${apiUrl}/admin/shop-products/${form._id}` : `${apiUrl}/admin/shop-products`;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, price: Number(form.price) })
      });

      if (res.ok) {
        setShowModal(false);
        fetchProducts();
      } else {
        alert('Error saving product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete product?')) return;
    try {
      await fetch(`${apiUrl}/admin/shop-products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setForm({ _id: '', name: '', description: '', price: '', image: '', category: 'Antioxidants', isActive: true });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (prod: any) => {
    setForm({ ...prod });
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Safer Products & Antioxidants</h2>
          <p className="text-xs text-slate-500 mt-1">Manage shop products for non-cancer patients</p>
        </div>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p._id}>
                <td className="px-4 py-3 text-2xl">{p.image}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3 font-bold">{p.price}</td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 bg-blue-50 rounded"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-500 bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" rows={3}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Price</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Image (Emoji/URL)</label>
                  <input required value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm">
                  <option value="Antioxidants">Antioxidants</option>
                  <option value="SaferProducts">SaferProducts</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} id="active" />
                <label htmlFor="active" className="text-sm font-semibold text-slate-600">Active</label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary rounded-lg text-sm font-bold text-white">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
