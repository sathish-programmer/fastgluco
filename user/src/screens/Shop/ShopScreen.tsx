import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';
import { BasketScreen } from './BasketScreen';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ShopScreenProps {
  onBack: () => void;
  type?: 'Antioxidants' | 'SaferProducts' | string;
}

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  brand?: string;
  images?: string[];
  shortDescription?: string;
  detailedDescription?: string;
  keyBenefits?: string[];
  healthBenefits?: string[];
  ingredients?: string[];
  usageInstructions?: string;
  suitableFor?: string;
  warnings?: string;
  storageInstructions?: string;
  doctorRecommended?: boolean;
  prescriptionRequired?: boolean;
  productTags?: string[];
  manufacturer?: string;
  countryOfOrigin?: string;
  productWeight?: string;
  sku?: string;
  variants?: { sku: string; name: string; price: number; stock: number }[];
  stock: number;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, type }) => {
  const { apiUrl, token, user, branding } = useAuth();
  const { showToast } = useToast();
  const curr = user?.currency === 'INR' ? '₹' : '$';
  
  const [basket, setBasket] = useState<{ item: ShopItem; variantName?: string; qty: number }[]>([]);
  const [showBasket, setShowBasket] = useState(false);
  const [products, setProducts] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(type || 'All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyDoctorRecommended, setOnlyDoctorRecommended] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Selected Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<ShopItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, selectedBrand, onlyDoctorRecommended, onlyAvailable, sortBy]);

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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/shop/products?sortBy=${sortBy}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedBrand !== 'All') {
        url += `&brand=${encodeURIComponent(selectedBrand)}`;
      }
      if (onlyDoctorRecommended) {
        url += `&doctorRecommended=true`;
      }
      if (onlyAvailable) {
        url += `&available=true`;
      }
      if (minPrice) {
        url += `&minPrice=${minPrice}`;
      }
      if (maxPrice) {
        url += `&maxPrice=${maxPrice}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((d: any) => ({
          id: d._id,
          name: d.name,
          desc: d.description,
          price: d.price,
          image: d.image,
          category: d.category,
          brand: d.brand,
          images: d.images,
          shortDescription: d.shortDescription,
          detailedDescription: d.detailedDescription,
          keyBenefits: d.keyBenefits,
          healthBenefits: d.healthBenefits,
          ingredients: d.ingredients,
          usageInstructions: d.usageInstructions,
          suitableFor: d.suitableFor,
          warnings: d.warnings,
          storageInstructions: d.storageInstructions,
          doctorRecommended: d.doctorRecommended,
          prescriptionRequired: d.prescriptionRequired,
          variants: d.variants,
          stock: d.stock
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const addToBasket = (item: ShopItem, variantName?: string) => {
    let limitStock = item.stock;

    if (variantName && item.variants) {
      const v = item.variants.find(x => x.name === variantName);
      if (v) {
        limitStock = v.stock;
      }
    }

    if (limitStock <= 0) {
      showToast('Product variant is currently out of stock.', 'error');
      return;
    }

    setBasket(prev => {
      const existing = prev.find(p => p.item.id === item.id && p.variantName === variantName);
      if (existing) {
        if (existing.qty >= limitStock) {
          showToast(`Cannot add more. Limit of ${limitStock} items in stock reached.`, 'info');
          return prev;
        }
        return prev.map(p => (p.item.id === item.id && p.variantName === variantName) ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { item, variantName, qty: 1 }];
    });
    
    showToast(`${item.name}${variantName ? ` (${variantName})` : ''} added to basket`, 'success');
  };

  const totalItems = basket.reduce((sum, item) => sum + item.qty, 0);

  // Distinct Brands calculation
  const distinctBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];

  const openProductDetails = (item: ShopItem) => {
    setSelectedProduct(item);
    if (item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  if (showBasket) {
    return <BasketScreen onBack={() => setShowBasket(false)} basket={basket} setBasket={setBasket} />;
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-6xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">MitoReboot Health</span>
            <h2 className="text-2xl font-sans font-bold text-slate-850 leading-none mt-1 flex items-center gap-2">
              🩺 Medical & Health Store
            </h2>
          </div>
        </div>
        
        {branding.enableExternalPayments !== false && (
          <button 
            onClick={() => setShowBasket(true)}
            className="relative h-12 px-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ShoppingCart className="h-5 w-5 text-indigo-500" />
            <span className="text-xs font-bold hidden sm:inline">My Basket</span>
            {totalItems > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Search and Filters Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Filters Panel */}
        <div className={`md:block space-y-5 bg-white border border-slate-150 p-5 rounded-3xl shadow-sm ${showFiltersPanel ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-indigo-500" /> Search Filters
            </h3>
            {showFiltersPanel && (
              <button onClick={() => setShowFiltersPanel(false)} className="text-xs text-indigo-500 font-bold md:hidden">Close</button>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-400 bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Brands Filter */}
          {distinctBrands.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Brand</label>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-400 bg-white"
              >
                <option value="All">All Brands</option>
                {distinctBrands.map((b, idx) => (
                  <option key={idx} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price Range ({curr})</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
              />
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
              />
            </div>
            <button 
              onClick={fetchProducts} 
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all mt-1"
            >
              Apply Price Filter
            </button>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={onlyDoctorRecommended} 
                onChange={(e) => setOnlyDoctorRecommended(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs text-slate-600 font-medium">Doctor Recommended Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={onlyAvailable} 
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs text-slate-600 font-medium">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Right Products Feed */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Top Search bar and Sort control */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 border border-slate-150 rounded-2xl shadow-sm">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search vitamins, CGM patches, wellness brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
              />
            </form>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 md:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-400"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Categories Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', ...categories.slice(0, 8).map(c => c.name)].map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs text-slate-450 font-bold">Refreshing products feed...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-250 rounded-3xl shadow-sm">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700">No matches found</h3>
              <p className="text-xs text-slate-450 mt-1">Try resetting filters or modify your keywords.</p>
              <button 
                onClick={() => { setSelectedCategory('All'); setSelectedBrand('All'); setSearch(''); setOnlyDoctorRecommended(false); setOnlyAvailable(false); }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(item => {
                const isOutOfStock = item.stock <= 0;
                const hasVariants = item.variants && item.variants.length > 0;
                const displayPrice = hasVariants && item.variants ? item.variants[0].price : item.price;
                
                return (
                  <div 
                    key={item.id} 
                    className="bg-white border border-slate-200 shadow-sm rounded-3xl p-4 flex flex-col justify-between hover:shadow-md transition-all group relative cursor-pointer"
                    onClick={() => openProductDetails(item)}
                  >
                    <div>
                      {/* Badge tags */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {item.doctorRecommended && (
                          <span className="bg-emerald-550 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                            <Sparkles className="h-2 w-2" /> Doctor Recommended
                          </span>
                        )}
                        {item.prescriptionRequired && (
                          <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Rx Required
                          </span>
                        )}
                      </div>

                      <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-6xl group-hover:scale-102 transition-transform">
                        {item.image}
                      </div>

                      {item.brand && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{item.brand}</span>
                      )}
                      
                      <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-450 mb-3 line-clamp-2 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div>
                        {hasVariants ? (
                          <span className="text-[9px] text-slate-400 block font-semibold">From</span>
                        ) : null}
                        <span className="font-black text-slate-800 text-base">{curr}{displayPrice.toFixed(2)}</span>
                      </div>
                      
                      {isOutOfStock ? (
                        <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase">Sold Out</span>
                      ) : branding.enableExternalPayments !== false ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasVariants && item.variants) {
                              openProductDetails(item);
                            } else {
                              addToBasket(item);
                            }
                          }}
                          className="text-[10px] font-bold text-white bg-indigo-650 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-sm transition-all"
                        >
                          {hasVariants ? 'Options' : 'Add to Cart'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">View Info</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative my-8 border border-slate-100 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm z-20"
            >
              ✕
            </button>

            {/* Left Image Section */}
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-7xl mb-4 relative shadow-sm">
                {selectedProduct.image}
              </div>
              
              <div className="flex flex-col gap-1 w-full text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                <span className="text-xs font-bold text-indigo-600">{selectedProduct.category}</span>
                
                {selectedProduct.brand && (
                  <span className="text-xs text-slate-500 font-medium mt-1">Brand: {selectedProduct.brand}</span>
                )}
                {selectedProduct.manufacturer && (
                  <span className="text-[9px] text-slate-400">Mfg: {selectedProduct.manufacturer}</span>
                )}
              </div>
            </div>

            {/* Right Information Section */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selectedProduct.doctorRecommended && (
                    <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 border border-emerald-100">
                      🩺 Doctor Recommended
                    </span>
                  )}
                  {selectedProduct.prescriptionRequired && (
                    <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-100">
                      Rx Prescribed
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">{selectedProduct.name}</h3>
                {selectedProduct.shortDescription && (
                  <p className="text-xs font-medium text-slate-500 mt-1">{selectedProduct.shortDescription}</p>
                )}
              </div>

              {/* Price & Variants Selector */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold">Fulfillment Price</span>
                  <span className="text-xl font-black text-slate-800">
                    {curr}
                    {(selectedVariant ? selectedVariant.price : selectedProduct.price).toFixed(2)}
                  </span>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Available Sizes/Variants</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selectedVariant?.sku === v.sku
                              ? 'bg-indigo-650 border-indigo-650 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-650 hover:border-indigo-400'
                          }`}
                        >
                          {v.name} ({curr}{v.price.toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 text-[10px] font-semibold text-slate-400">
                  <span>Fulfillment SKU: {selectedVariant ? selectedVariant.sku : (selectedProduct.sku || 'N/A')}</span>
                  <span>
                    Stock: {selectedVariant ? (selectedVariant.stock > 0 ? `${selectedVariant.stock} left` : 'Out of Stock') : (selectedProduct.stock > 0 ? `${selectedProduct.stock} left` : 'Out of Stock')}
                  </span>
                </div>
              </div>

              {/* Descriptions & Detail tabs */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 text-xs text-slate-600 scrollbar-thin">
                {selectedProduct.detailedDescription && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Product Description</span>
                    <p className="leading-relaxed text-slate-500">{selectedProduct.detailedDescription}</p>
                  </div>
                )}

                {selectedProduct.keyBenefits && selectedProduct.keyBenefits.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Key Benefits</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-550">
                      {selectedProduct.keyBenefits.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}

                {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Active Ingredients</span>
                    <p className="text-slate-550 leading-relaxed">{selectedProduct.ingredients.join(', ')}</p>
                  </div>
                )}

                {selectedProduct.usageInstructions && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Directions for Use</span>
                    <p className="text-slate-550 leading-relaxed">{selectedProduct.usageInstructions}</p>
                  </div>
                )}

                {selectedProduct.warnings && (
                  <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-red-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Safety Warnings</span>
                      <p className="text-[10px] leading-relaxed text-red-650">{selectedProduct.warnings}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {branding.enableExternalPayments !== false && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      const stockVal = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                      if (stockVal <= 0) {
                        showToast('This item is currently sold out.', 'info');
                        return;
                      }
                      addToBasket(selectedProduct, selectedVariant?.name);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Order Basket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
