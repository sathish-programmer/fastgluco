import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit, Package, Leaf, ShieldCheck, Search,
  ToggleLeft, ToggleRight, Box, Tag, DollarSign, X, AlertTriangle
} from 'lucide-react';

interface AdminShopProductsProps {
  apiUrl: string;
  token: string;
}

type Category = 'All' | 'Antioxidants' | 'SaferProducts';

const EMPTY_FORM = {
  _id: '',
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'Antioxidants',
  stock: '0',
  isActive: true
};

export const AdminShopProducts: React.FC<AdminShopProductsProps> = ({ apiUrl, token }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/shop-products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${apiUrl}/admin/shop-products/${form._id}`
        : `${apiUrl}/admin/shop-products`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock)
        })
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ ...EMPTY_FORM });
        fetchProducts();
      } else {
        alert('Error saving product');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${apiUrl}/admin/shop-products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (prod: any) => {
    try {
      await fetch(`${apiUrl}/admin/shop-products/${prod._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...prod, isActive: !prod.isActive })
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (prod: any) => {
    setForm({ ...prod, price: String(prod.price), stock: String(prod.stock ?? 0) });
    setIsEditing(true);
    setShowModal(true);
  };

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = {
    All: products.length,
    Antioxidants: products.filter(p => p.category === 'Antioxidants').length,
    SaferProducts: products.filter(p => p.category === 'SaferProducts').length
  };

  const stockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', cls: 'bg-red-50 text-red-600 border-red-200' };
    if (stock < 10) return { label: 'Low Stock', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    return { label: `${stock} in stock`, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Shop Products
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage Antioxidants & Safer Products for non-cancer patients</p>
        </div>
        <button onClick={openNew}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Category Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Antioxidants', 'SaferProducts'] as Category[]).map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
              }`}>
              {cat === 'Antioxidants' && <Leaf className="h-3 w-3" />}
              {cat === 'SaferProducts' && <ShieldCheck className="h-3 w-3" />}
              {cat === 'All' && <Package className="h-3 w-3" />}
              {cat === 'SaferProducts' ? 'Safer Products' : cat}
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                activeCategory === cat ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
              }`}>{counts[cat]}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-56"
          />
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Package className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs mt-1">Try adjusting your filters or add a new product</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const ss = stockStatus(p.stock ?? 0);
            return (
              <div key={p._id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md group ${
                  !p.isActive ? 'opacity-60 border-slate-200' : 'border-slate-200'
                }`}>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.image}</span>
                    <div>
                      <h3 className={`font-bold text-slate-800 text-sm leading-tight ${!p.isActive ? 'line-through text-slate-400' : ''}`}>
                        {p.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        p.category === 'Antioxidants'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-sky-50 text-sky-600'
                      }`}>
                        {p.category === 'Antioxidants' ? <Leaf className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                        {p.category === 'SaferProducts' ? 'Safer Products' : p.category}
                      </span>
                    </div>
                  </div>
                  {/* Active Toggle */}
                  <button onClick={() => handleToggleActive(p)} title={p.isActive ? 'Deactivate' : 'Activate'}
                    className="text-slate-400 hover:text-primary transition-colors">
                    {p.isActive
                      ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                      : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{p.description}</p>

                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-primary font-bold text-sm">
                    <DollarSign className="h-3.5 w-3.5" />
                    {Number(p.price).toFixed(2)}
                  </div>
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${ss.cls}`}>
                    {ss.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-200 transition-all">
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(p._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl text-xs font-bold border border-slate-200 hover:border-red-200 transition-all">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {isEditing ? <Edit className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                {isEditing ? 'Edit Product' : 'New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Product Name *</label>
                <input required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mito-C Complex"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description *</label>
                <textarea required value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief product description..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  rows={3} />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Price *
                  </label>
                  <input required type="number" step="0.01" min="0" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Box className="h-3 w-3" /> Stock Qty *
                  </label>
                  <input required type="number" min="0" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
              </div>

              {/* Image + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Image (Emoji / URL) *</label>
                  <input required value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                    placeholder="🍊 or https://..."
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Category *
                  </label>
                  <select value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
                    <option value="Antioxidants">Antioxidants</option>
                    <option value="SaferProducts">Safer Products</option>
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <input type="checkbox" id="active-check" checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 accent-primary" />
                <label htmlFor="active-check" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Active — visible to patients in the shop
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60 flex items-center gap-2">
                  {saving && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  {isEditing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Product?</h3>
            <p className="text-xs text-slate-500 mb-6">This action cannot be undone. The product will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white shadow-sm transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
