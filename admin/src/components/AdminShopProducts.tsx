import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit, Package, Search,
  ToggleLeft, ToggleRight, Tag, AlertTriangle, ArrowLeft
} from 'lucide-react';

interface AdminShopProductsProps {
  apiUrl: string;
  token: string;
}

type TabType = 'basic' | 'medical' | 'variants' | 'media';

export const ProductImage: React.FC<{ src: string; apiUrl: string; className?: string; textClassName?: string }> = ({ src, apiUrl, className = "h-10 w-10 object-contain rounded-xl", textClassName = "text-3xl" }) => {
  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className={`${className} bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-450`}>
        <Package className="h-5 w-5" />
      </div>
    );
  }

  const isEmoji = !src.startsWith('/') && !src.startsWith('http') && src.length <= 4;
  if (isEmoji) {
    return <span className={textClassName}>{src}</span>;
  }

  if (error) {
    return (
      <div className={`${className} bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-450`}>
        <Package className="h-5 w-5" />
      </div>
    );
  }

  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  const fullUrl = src.startsWith('http') ? src : `${baseUrl}${src}`;
  return (
    <img 
      src={fullUrl} 
      alt="Product" 
      className={className} 
      onError={() => setError(true)}
    />
  );
};

const EMPTY_PRODUCT_FORM = {
  _id: '',
  name: '',
  brand: '',
  category: 'Vitamins & Supplements',
  price: '',
  stock: '0',
  image: '💊', // Default emoji icon
  isActive: true,
  shortDescription: '',
  detailedDescription: '',
  keyBenefits: '',
  healthBenefits: '',
  ingredients: '',
  usageInstructions: '',
  suitableFor: '',
  warnings: '',
  storageInstructions: '',
  doctorRecommended: false,
  prescriptionRequired: false,
  productTags: '',
  manufacturer: '',
  countryOfOrigin: 'India',
  productWeight: '',
  sku: '',
  productStatus: 'active',
  discountPercent: '0',
  variants: [] as { name: string; price: number; stock: number; sku: string }[]
};

export const AdminShopProducts: React.FC<AdminShopProductsProps> = ({ apiUrl, token }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT_FORM });
  const [isEditing, setIsEditing] = useState(false);
  const [viewState, setViewState] = useState<'list' | 'form'>('list');
  const [formTab, setFormTab] = useState<TabType>('basic');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'products' | 'reviews'>('products');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Custom Category States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Variants Input Helpers
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('0');
  const [variantSku, setVariantSku] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (activeMainTab === 'reviews') {
      fetchReviews();
    } else {
      fetchProducts();
    }
  }, [activeMainTab]);

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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/shop/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${apiUrl}/admin/shop-reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleUpdateReviewStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${apiUrl}/admin/shop-reviews/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchReviews();
      } else {
        alert('Failed to update review status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.shortDescription) {
      alert('Please fill in Name, Short Description, Price, and Category.');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `${apiUrl}/admin/shop-products/${form._id}`
        : `${apiUrl}/admin/shop-products`;

      // Format arrays from comma-separated strings
      const payload: any = {
        ...form,
        description: form.shortDescription,
        price: Number(form.price),
        discountPercent: Number(form.discountPercent || 0),
        stock: form.variants.length > 0 ? form.variants.reduce((sum, v) => sum + v.stock, 0) : Number(form.stock),
        keyBenefits: form.keyBenefits.split(',').map(s => s.trim()).filter(Boolean),
        healthBenefits: form.healthBenefits.split(',').map(s => s.trim()).filter(Boolean),
        ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
        productTags: form.productTags.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (!isEditing) {
        delete payload._id;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setViewState('list');
        setForm({ ...EMPTY_PRODUCT_FORM });
        setFormTab('basic');
        fetchProducts();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error saving product');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    try {
      const res = await fetch(`${apiUrl}/admin/shop-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc })
      });
      if (res.ok) {
        setNewCategoryName('');
        setNewCategoryDesc('');
        setShowCategoryModal(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create category');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/shop-products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteTargetId(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProductActive = async (prod: any) => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${apiUrl}/admin/shop-products/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, image: data.imageUrl }));
      } else {
        const err = await res.json();
        alert(err.message || 'Image upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Network error during image upload');
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_PRODUCT_FORM });
    setIsEditing(false);
    setFormTab('basic');
    setViewState('form');
  };

  const openEdit = (prod: any) => {
    setForm({
      _id: prod._id,
      name: prod.name,
      brand: prod.brand || '',
      category: prod.category,
      price: String(prod.price),
      stock: String(prod.stock ?? 0),
      image: prod.image,
      isActive: prod.isActive,
      shortDescription: prod.shortDescription || '',
      detailedDescription: prod.detailedDescription || '',
      keyBenefits: Array.isArray(prod.keyBenefits) ? prod.keyBenefits.join(', ') : '',
      healthBenefits: Array.isArray(prod.healthBenefits) ? prod.healthBenefits.join(', ') : '',
      ingredients: Array.isArray(prod.ingredients) ? prod.ingredients.join(', ') : '',
      usageInstructions: prod.usageInstructions || '',
      suitableFor: prod.suitableFor || '',
      warnings: prod.warnings || '',
      storageInstructions: prod.storageInstructions || '',
      doctorRecommended: prod.doctorRecommended || false,
      prescriptionRequired: prod.prescriptionRequired || false,
      productTags: Array.isArray(prod.productTags) ? prod.productTags.join(', ') : '',
      manufacturer: prod.manufacturer || '',
      countryOfOrigin: prod.countryOfOrigin || 'India',
      productWeight: prod.productWeight || '',
      sku: prod.sku || '',
      productStatus: prod.productStatus || 'active',
      discountPercent: String(prod.discountPercent || 0),
      variants: prod.variants || []
    });
    setIsEditing(true);
    setFormTab('basic');
    setViewState('form');
  };

  const addVariant = () => {
    if (!variantName || !variantPrice) {
      alert('Variant name and price are required.');
      return;
    }
    const newVariant = {
      name: variantName,
      price: Number(variantPrice),
      stock: Number(variantStock),
      sku: variantSku || `${form.sku || 'SKU'}-${variantName.toUpperCase()}`
    };
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
    setVariantName('');
    setVariantPrice('');
    setVariantStock('0');
    setVariantSku('');
  };

  const removeVariant = (index: number) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index)
    }));
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', cls: 'bg-red-50 text-red-650 border-red-100' };
    if (stock < 10) return { label: `Low Stock (${stock})`, cls: 'bg-amber-50 text-amber-650 border-amber-100' };
    return { label: `${stock} in stock`, cls: 'bg-emerald-50 text-emerald-650 border-emerald-100' };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {viewState === 'list' ? (
        <>
          {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-500" /> Medical Product Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure health categories, variants, and pricing structures</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            + Create Category
          </button>
          <button 
            onClick={openNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Add Medical Product
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('products')}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeMainTab === 'products'
              ? 'border-indigo-650 text-indigo-650'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📦 Products Directory
        </button>
        <button
          onClick={() => setActiveMainTab('reviews')}
          className={`px-6 py-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeMainTab === 'reviews'
              ? 'border-indigo-650 text-indigo-650'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⭐ User Reviews Moderation
          {reviews.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {reviews.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeMainTab === 'products' && (
        <>
          {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['All', ...categories.slice(0, 5).map(c => c.name)].map((cat, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedCategoryFilter === cat
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-650 border-slate-200 hover:border-indigo-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brand, product..."
            className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 w-56"
          />
        </div>
      </div>

      {/* Products list grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <Package className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm font-bold">No products found</p>
          <p className="text-xs mt-1 text-slate-450">Try adjusting your category filter or keywords</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(p => {
            const ss = getStockStatus(p.stock ?? 0);
            return (
              <div 
                key={p._id}
                className={`bg-white border rounded-3xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                  !p.isActive ? 'opacity-65 border-slate-200' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <ProductImage src={p.image} apiUrl={apiUrl} className="h-10 w-10 object-contain" textClassName="text-3xl" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{p.name}</h3>
                        {p.brand && <span className="text-[10px] text-slate-400 block">{p.brand}</span>}
                        <span className="inline-block text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mt-1 uppercase">
                          {p.category}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleProductActive(p)}
                      className="text-slate-450 hover:text-indigo-500 transition-colors"
                    >
                      {p.isActive 
                        ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                        : <ToggleLeft className="h-6 w-6" />}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{p.description}</p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {p.doctorRecommended && (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-bold px-2 py-0.5 rounded">
                        🩺 Rec
                      </span>
                    )}
                    {p.prescriptionRequired && (
                      <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-bold px-2 py-0.5 rounded">
                        Rx Required
                      </span>
                    )}
                    {p.variants?.length > 0 && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-bold px-2 py-0.5 rounded">
                        {p.variants.length} Variants
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-600 font-black text-sm">
                      {p.variants?.length > 0 ? 'From ' : ''}Rs.{Number(p.price).toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${ss.cls}`}>
                      {ss.label}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEdit(p)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => setDeleteTargetId(p._id)}
                      className="py-2 px-3 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-650 border border-slate-200 hover:border-red-200 rounded-xl text-xs transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {activeMainTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">User Product Reviews</h3>
            <p className="text-xs text-slate-500">Moderate product ratings and comments posted by patients after delivery</p>
          </div>

          {loadingReviews ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
              <span className="text-3xl mb-2">⭐</span>
              <p className="text-sm font-bold">No product reviews yet</p>
              <p className="text-xs mt-1 text-slate-400">Reviews will appear here once patients submit feedback via invoice links.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r: any) => {
                const isPending = r.status === 'pending';
                const isApproved = r.status === 'approved';
                const isRejected = r.status === 'rejected';
                
                return (
                  <div key={r._id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      {/* Product Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          <ProductImage src={r.productId?.image || '💊'} apiUrl={apiUrl} className="h-8 w-8 object-contain" textClassName="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-850 text-xs truncate">{r.productId?.name || 'Unknown Product'}</h4>
                          <p className="text-[10px] text-slate-400">Category: {r.productId?.category || 'N/A'}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isPending ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          isApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < r.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">by {r.patientName}</span>
                      </div>

                      {/* Comment */}
                      {r.comment ? (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-2xl border border-slate-100/60 leading-relaxed italic">
                          "{r.comment}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-2">No written comments provided.</p>
                      )}
                      
                      <p className="text-[9px] text-slate-400 mt-2">Submitted on {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Moderation Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleUpdateReviewStatus(r._id, 'approved')}
                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            ✓ Approve Review
                          </button>
                          <button
                            onClick={() => handleUpdateReviewStatus(r._id, 'rejected')}
                            className="flex-1 py-2 bg-rose-50 hover:bg-rose-105 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                          >
                            ✗ Reject Review
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full text-xs">
                          <span className="text-[10px] text-slate-400 font-bold">Moderated</span>
                          <div className="flex gap-1.5">
                            {isApproved && (
                              <button
                                onClick={() => handleUpdateReviewStatus(r._id, 'rejected')}
                                className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                Switch to Reject
                              </button>
                            )}
                            {isRejected && (
                              <button
                                onClick={() => handleUpdateReviewStatus(r._id, 'approved')}
                                className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              >
                                Switch to Approve
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>
    ) : (
        <div className="bg-white rounded-3xl w-full border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewState('list')}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                {isEditing ? `Edit Product: ${form.name}` : 'New Medical Product'}
              </h3>
            </div>
          </div>

            {/* Tabs Selector */}
            <div className="flex bg-slate-50 border-b border-slate-100 px-4">
              {([
                { key: 'basic', label: 'Basic Info' },
                { key: 'medical', label: 'Medical Metadata' },
                { key: 'variants', label: 'Variants & Stock' },
                { key: 'media', label: 'Media & Description' }
              ] as { key: TabType; label: string }[]).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFormTab(t.key)}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                    formTab === t.key 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* TAB 1: BASIC DETAILS */}
              {formTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product Name *</label>
                      <input 
                        required 
                        type="text" 
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Mito-C Vitamin Complex"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product Brand</label>
                      <input 
                        type="text" 
                        value={form.brand}
                        onChange={e => setForm({ ...form, brand: e.target.value })}
                        placeholder="e.g. MitoLife Science"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 mt-4 mb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Short Description *</label>
                    <input 
                      required
                      type="text" 
                      value={form.shortDescription}
                      onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                      placeholder="Brief headline description (1 sentence)"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product Category *</label>
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none bg-white"
                      >
                        {categories.map((c, idx) => (
                          <option key={idx} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Primary SKU</label>
                      <input 
                        type="text" 
                        value={form.sku}
                        onChange={e => setForm({ ...form, sku: e.target.value })}
                        placeholder="e.g. MITO-VIT-C-500"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Price (INR) *</label>
                      <input 
                        required
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        placeholder="0.00"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Discount (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={form.discountPercent || ''}
                        onChange={e => setForm({ ...form, discountPercent: e.target.value })}
                        placeholder="0"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    {form.variants.length === 0 ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Stock Quantity *</label>
                        <input 
                          required
                          type="number" 
                          min="0"
                          value={form.stock}
                          onChange={e => setForm({ ...form, stock: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 opacity-50 pointer-events-none">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Stock (Sum of Variants)</label>
                        <input 
                          disabled
                          type="text" 
                          value={form.variants.reduce((sum, v) => sum + v.stock, 0)}
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none bg-slate-50"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.doctorRecommended} 
                        onChange={e => setForm({ ...form, doctorRecommended: e.target.checked })}
                        className="rounded text-indigo-600 h-4 w-4"
                      />
                      <span className="text-xs text-slate-700 font-bold">Recommended by Doctor</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.prescriptionRequired} 
                        onChange={e => setForm({ ...form, prescriptionRequired: e.target.checked })}
                        className="rounded text-indigo-600 h-4 w-4"
                      />
                      <span className="text-xs text-slate-700 font-bold">Prescription (Rx) Required</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: MEDICAL INFO */}
              {formTab === 'medical' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Active Ingredients (Separate with commas)</label>
                    <input 
                      type="text" 
                      value={form.ingredients}
                      onChange={e => setForm({ ...form, ingredients: e.target.value })}
                      placeholder="e.g. Vitamin C, Rosehips Extract, Bioflavonoids"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Key Benefits (Separate with commas)</label>
                    <input 
                      type="text" 
                      value={form.keyBenefits}
                      onChange={e => setForm({ ...form, keyBenefits: e.target.value })}
                      placeholder="e.g. Promotes Cellular Repair, Enhances Gut Immunity"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Health Benefits/Goals (Separate with commas)</label>
                    <input 
                      type="text" 
                      value={form.healthBenefits}
                      onChange={e => setForm({ ...form, healthBenefits: e.target.value })}
                      placeholder="e.g. Immunity Boost, Anti-aging, Bone Strength"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Directions for Use</label>
                      <input 
                        type="text" 
                        value={form.usageInstructions}
                        onChange={e => setForm({ ...form, usageInstructions: e.target.value })}
                        placeholder="e.g. Take 1 capsule daily after breakfast"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Suitable For</label>
                      <input 
                        type="text" 
                        value={form.suitableFor}
                        onChange={e => setForm({ ...form, suitableFor: e.target.value })}
                        placeholder="e.g. Adults over 18, Vegetarians"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Safety Warnings & Precautions</label>
                    <textarea 
                      value={form.warnings}
                      onChange={e => setForm({ ...form, warnings: e.target.value })}
                      placeholder="e.g. Consult doctor if pregnant. Do not exceed recommended dosage."
                      rows={2}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Storage Instructions</label>
                      <input 
                        type="text" 
                        value={form.storageInstructions}
                        onChange={e => setForm({ ...form, storageInstructions: e.target.value })}
                        placeholder="e.g. Store below 25°C in cool dry place"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Manufacturer Details</label>
                      <input 
                        type="text" 
                        value={form.manufacturer}
                        onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                        placeholder="e.g. PharmaCorp Labs"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VARIANTS */}
              {formTab === 'variants' && (
                <div className="space-y-6">
                  
                  {/* Add variant sub-form */}
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs text-slate-800">Add Product Variant (e.g. 500g, 1kg, 30 Capsules)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-500 block">Variant Name</label>
                        <input 
                          type="text" 
                          value={variantName}
                          onChange={e => setVariantName(e.target.value)}
                          placeholder="e.g. 500g"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-500 block">Price (INR)</label>
                        <input 
                          type="number" 
                          value={variantPrice}
                          onChange={e => setVariantPrice(e.target.value)}
                          placeholder="Price"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-500 block">Stock Qty</label>
                        <input 
                          type="number" 
                          value={variantStock}
                          onChange={e => setVariantStock(e.target.value)}
                          placeholder="Stock"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold text-slate-500 block">SKU</label>
                        <input 
                          type="text" 
                          value={variantSku}
                          onChange={e => setVariantSku(e.target.value)}
                          placeholder="Variant SKU"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={addVariant}
                      className="py-1.5 px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-755 transition-all shadow-sm"
                    >
                      + Append Variant
                    </button>
                  </div>

                  {/* List of current variants */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Configured Variants ({form.variants.length})</span>
                    {form.variants.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No variants configured. Product will use the default pricing and stock specified on Tab 1.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl p-3">
                        {form.variants.map((v, index) => (
                          <div key={index} className="py-2.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{v.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">SKU: {v.sku}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-slate-705">Rs.{v.price.toFixed(2)}</span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">{v.stock} in stock</span>
                              <button 
                                type="button" 
                                onClick={() => removeVariant(index)}
                                className="text-red-500 p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & FULL DESCRIPTION */}
              {formTab === 'media' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Product Icon/Emoji or Image URL *</label>
                      <input 
                        required
                        type="text" 
                        value={form.image}
                        onChange={e => setForm({ ...form, image: e.target.value })}
                        placeholder="e.g. 💊 or /uploads/filename.png"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Upload Image File</label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="w-full border border-slate-200 rounded-xl p-1.5 text-xs focus:outline-none bg-white file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 file:cursor-pointer"
                        />
                        {form.image && (
                          <div className="h-9 w-9 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-slate-50">
                            <ProductImage src={form.image} apiUrl={apiUrl} className="h-7 w-7 object-contain" textClassName="text-lg" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Tags (Separate with commas)</label>
                      <input 
                        type="text" 
                        value={form.productTags}
                        onChange={e => setForm({ ...form, productTags: e.target.value })}
                        placeholder="e.g. natural, sugar-free, organic"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Detailed Product Description *</label>
                    <textarea 
                      required
                      value={form.detailedDescription}
                      onChange={e => setForm({ ...form, detailedDescription: e.target.value })}
                      placeholder="Full specifications, clinical benefits, and product notes."
                      rows={5}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setViewState('list')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white shadow-sm transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />}
                  {isEditing ? 'Update Medical Product' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
      )}

      {/* Custom Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-500" /> Create Custom Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Category Name *</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Skin Care"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Brief Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Dermaceutical creams and face washes"
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-indigo-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center border border-slate-100">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Medical Product?</h3>
            <p className="text-xs text-slate-450 mb-6">This action cannot be undone. Product variants and inventory logs will be cleared.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteProduct(deleteTargetId)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-650 rounded-xl text-xs font-bold text-white shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
