import React, { useState, useEffect, useMemo } from 'react';
import {
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link2,
  Eye,
  Check,
  ShoppingBag
} from 'lucide-react';

interface AdminAmazonVendorProps {
  apiUrl: string;
  token: string;
}

interface AmazonProduct {
  _id: string;
  name: string;
  brand?: string;
  category: string;
  image: string;
  buyOnAmazonUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const PREDEFINED_CATEGORIES = [
  'Pesticide free food',
  'Arivu in nutrition',
  'Environment safe products',
  'Safe kitchen',
  'Glucose monitoring',
  'Cancer support wig',
  'Antioxidants'
];

export const AdminAmazonVendor: React.FC<AdminAmazonVendorProps> = ({ apiUrl, token }) => {
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Product Form State
  const [urlInput, setUrlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Preview State
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    asin: string;
    title: string;
    image: string;
    brand: string;
    affiliateUrl: string;
  } | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  // Fetch all existing Amazon products
  const fetchAmazonProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/admin/amazon/products`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to load Amazon products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmazonProducts();
  }, [apiUrl, token]);

  // Preview details from Amazon link
  const handlePreview = async () => {
    if (!urlInput.trim()) {
      setError('Please paste an Amazon link or ASIN first.');
      return;
    }
    try {
      setPreviewing(true);
      setError(null);
      setPreviewData(null);

      const res = await fetch(`${apiUrl}/admin/amazon/preview`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch details from Amazon');
      }

      setPreviewData(data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch live Amazon details');
    } finally {
      setPreviewing(false);
    }
  };

  // Add product to store
  const handleAddProduct = async () => {
    const finalCategory = isCustomCategory ? customCategory.trim() : selectedCategory;
    if (!urlInput.trim()) {
      setError('Please enter an Amazon link.');
      return;
    }
    if (!finalCategory) {
      setError('Please select or specify a category.');
      return;
    }

    try {
      setAddingProduct(true);
      setError(null);

      const payload = {
        url: urlInput.trim(),
        category: finalCategory,
        name: previewData?.title,
        brand: previewData?.brand,
        image: previewData?.image
      };

      const res = await fetch(`${apiUrl}/admin/amazon/add-product`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add Amazon product');
      }

      setSuccessMessage(`Successfully added "${data.product.name.slice(0, 40)}..." to ${finalCategory}!`);
      setUrlInput('');
      setPreviewData(null);
      fetchAmazonProducts();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add Amazon product');
    } finally {
      setAddingProduct(false);
    }
  };

  // Refresh live metadata for an existing product
  const handleRefreshProduct = async (id: string) => {
    try {
      setRefreshingId(id);
      setError(null);
      const res = await fetch(`${apiUrl}/admin/amazon/products/${id}/refresh`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to refresh product');

      setSuccessMessage('Product refreshed with latest live details from Amazon.');
      fetchAmazonProducts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error refreshing product');
    } finally {
      setRefreshingId(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the shop?`)) {
      return;
    }
    try {
      setDeletingId(id);
      const res = await fetch(`${apiUrl}/admin/amazon/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to delete product');

      setSuccessMessage('Amazon product removed from shop.');
      fetchAmazonProducts();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error deleting product');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  // Unique categories list
  const existingCategories = useMemo(() => {
    const set = new Set([...PREDEFINED_CATEGORIES, ...products.map((p) => p.category)]);
    return Array.from(set);
  }, [products]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-200 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Amazon Affiliate Partner Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Amazon Vendor & Affiliate Hub
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-2xl font-medium leading-relaxed">
              Add Amazon product links with categories. The system automatically extracts live titles, high-resolution imagery, and appends the affiliate tag (<span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-white">mitoreboot-21</span>) to reflect in the user shop dynamically.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">Active Products</span>
              <span className="text-2xl font-black text-white">{products.length}</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">Categories</span>
              <span className="text-2xl font-black text-white">{existingCategories.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ADD AMAZON PRODUCT CONSOLE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Add New Amazon Product</h2>
              <p className="text-xs text-slate-500">Paste any Amazon URL or 10-digit ASIN to automatically fetch live metadata</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* INPUT FORM (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amazon Link or ASIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://www.amazon.in/dp/B09R4DGRH9 or ASIN code"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-10 pr-28 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
                <Link2 className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewing || !urlInput.trim()}
                  className="absolute right-2 top-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  {previewing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports full Amazon URLs, shortlinks, or 10-digit ASIN codes.
              </p>
            </div>

            {/* CATEGORY SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Shop Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  {isCustomCategory ? 'Choose from existing' : '+ Add Custom Category'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  placeholder="e.g. Organic Herbal Teas, Sleep Aids, etc."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              ) : (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition cursor-pointer"
                >
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddProduct}
              disabled={addingProduct || !urlInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {addingProduct ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Adding to App Shop...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Publish Amazon Product to User App</span>
                </>
              )}
            </button>
          </div>

          {/* LIVE PREVIEW CARD (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Live App Card Preview
              </span>

              {previewData ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
                  <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative p-2">
                    <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      Amazon
                    </span>
                    <img
                      src={previewData.image}
                      alt={previewData.title}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest truncate block">
                      {previewData.brand || (isCustomCategory ? customCategory : selectedCategory)}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 mt-0.5">
                      {previewData.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black text-slate-900 block leading-tight">
                        See on Amazon
                      </span>
                      <span className="text-[9px] font-bold text-amber-600">
                        Live Price & Details ↗
                      </span>
                    </div>

                    <a
                      href={previewData.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <span>Amazon</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <ShoppingBag className="h-8 w-8 stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No product previewed yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click "Preview" above or directly submit to fetch live image and title from Amazon.
                  </p>
                </div>
              )}
            </div>

            {previewData && (
              <div className="mt-3 bg-amber-100/60 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span className="truncate">
                  ASIN: <strong>{previewData.asin}</strong> • Tag attached: <strong>mitoreboot-21</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXISTING AMAZON PRODUCTS TABLE & CATALOG */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Current Amazon Affiliate Catalog</h2>
            <p className="text-xs text-slate-500">Live products rendered in the MitoReboot user app</p>
          </div>

          <button
            onClick={fetchAmazonProducts}
            disabled={loading}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Table</span>
          </button>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by title, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition cursor-pointer"
            >
              <option value="ALL">All Categories ({products.length})</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({products.filter((p) => p.category === cat).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4 text-center">Affiliate URL</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading Amazon products...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No products matching your search or category filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-contain"
                            onError={(e: any) => {
                              e.target.src = 'https://m.media-amazon.com/images/I/41rcAhHKpcL.jpg';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 line-clamp-2 leading-tight">
                            {p.name}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                            ● Live in User App
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-[10px] px-2.5 py-1 rounded-lg inline-block">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700">
                      {p.brand || 'Amazon'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <a
                        href={p.buyOnAmazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition"
                      >
                        <span>Open Amazon</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRefreshProduct(p._id)}
                          disabled={refreshingId === p._id}
                          title="Re-scrape and update image & title from live Amazon"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${refreshingId === p._id ? 'animate-spin text-amber-600' : ''}`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p._id, p.name)}
                          disabled={deletingId === p._id}
                          title="Remove product from app"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
