import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, Sparkles, AlertCircle, ShoppingCart, Package, MapPin, Truck, XCircle, Navigation, Star, Plus, Minus, ChevronRight } from 'lucide-react';
import { BasketScreen } from './BasketScreen';
import { PincodeDeliveryChecker } from '../../components/PincodeDeliveryChecker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ShopScreenProps {
  onBack: () => void;
  type?: 'Antioxidants' | 'SaferProducts' | string;
  defaultSearch?: string;
}

export const ProductImage: React.FC<{ src: string; apiUrl: string; className?: string; textClassName?: string }> = ({ src, apiUrl, className = "h-10 w-10 object-contain rounded-xl", textClassName = "text-3xl" }) => {
  const [error, setError] = useState(false);

  if (!src) {
    return (
      <div className={`${className} bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400`}>
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
      <div className={`${className} bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400`}>
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
  discountPercent?: number;
  offerPrice?: number;
  regularPrice?: number;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, type, defaultSearch }) => {
  const { apiUrl, token, user, branding } = useAuth();
  const { showToast } = useToast();
  const curr = user?.currency === 'INR' ? '₹' : '$';
  
  const [basket, setBasket] = useState<{ item: ShopItem; variantName?: string; qty: number }[]>(() => {
    try {
      const saved = localStorage.getItem('mitoreboot_health_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mitoreboot_health_cart', JSON.stringify(basket));
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  }, [basket]);
  const [showBasket, setShowBasket] = useState(false);
  const [products, setProducts] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(defaultSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(type || 'All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyDoctorRecommended, setOnlyDoctorRecommended] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Delivery Pincode Bar state
  const [userDeliveryPincode, setUserDeliveryPincode] = useState<string>(() => localStorage.getItem('user_delivery_pincode') || '560001');
  const [deliveryLocality, setDeliveryLocality] = useState<string>('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isDeliveryServiceable, setIsDeliveryServiceable] = useState<boolean | null>(null);
  const [showPincodeModal, setShowPincodeModal] = useState<boolean>(false);
  const [isEditingPincode, setIsEditingPincode] = useState<boolean>(false);
  const [tempPincodeInput, setTempPincodeInput] = useState<string>('');
  const [checkingPincode, setCheckingPincode] = useState<boolean>(false);

  const handleApplyPincode = async (codeToApply?: string, userLat?: number, userLon?: number) => {
    const code = (codeToApply || tempPincodeInput || userDeliveryPincode).toString().trim().replace(/\D/g, '');
    if (!code || code.length < 6) {
      showToast('Please enter a valid 6-digit pincode.', 'error');
      return;
    }

    setCheckingPincode(true);
    try {
      const res = await fetch(`${apiUrl}/shop/check-pincode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pincode: code, userLat, userLon })
      });

      if (res.ok) {
        const data = await res.json();
        setUserDeliveryPincode(code);
        localStorage.setItem('user_delivery_pincode', code);
        setIsDeliveryServiceable(data.serviceable);
        setDeliveryFee(data.shippingFee || 0);
        setDeliveryEstimate(data.estimatedDeliveryTime || '');
        setDeliveryLocality(data.localityName || data.city || '');
        setIsEditingPincode(false);
        setShowPincodeModal(false);
        showToast(data.message || `Delivery location updated to ${code}`, data.serviceable ? 'success' : 'info');
      }
    } catch (err) {
      console.error('Error applying pincode:', err);
      showToast('Network error checking pincode.', 'error');
    } finally {
      setCheckingPincode(false);
    }
  };

  useEffect(() => {
    if (userDeliveryPincode) {
      fetch(`${apiUrl}/shop/check-pincode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pincode: userDeliveryPincode })
      })
        .then(res => res.json())
        .then(data => {
          setIsDeliveryServiceable(data.serviceable);
          setDeliveryFee(data.shippingFee || 0);
          setDeliveryEstimate(data.estimatedDeliveryTime || '');
          setDeliveryLocality(data.localityName || data.city || '');
        })
        .catch(console.error);
    }
  }, [apiUrl, token, userDeliveryPincode]);

  // Selected Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<ShopItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [productReviews, setProductReviews] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProduct) {
      fetch(`${apiUrl}/shop/products/${selectedProduct.id}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setProductReviews(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    } else {
      setProductReviews([]);
    }
  }, [selectedProduct, apiUrl, token]);

  // Always reset selectedProduct when screen mounts/unmounts or when category type changes
  useEffect(() => {
    setSelectedProduct(null);
    return () => {
      setSelectedProduct(null);
      if (window.location.search.includes('product=')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('product');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    };
  }, [type, defaultSearch]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, selectedBrand, onlyDoctorRecommended, onlyAvailable, sortBy]);

  // Only load product details if product query param was present BEFORE user interaction
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId && !selectedProduct) {
      fetch(`${apiUrl}/shop/products/${prodId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const item: ShopItem = {
            id: data._id,
            name: data.name,
            desc: data.description,
            price: data.price,
            image: data.image,
            category: data.category,
            brand: data.brand,
            images: data.images,
            shortDescription: data.shortDescription,
            detailedDescription: data.detailedDescription,
            keyBenefits: data.keyBenefits,
            healthBenefits: data.healthBenefits,
            ingredients: data.ingredients,
            usageInstructions: data.usageInstructions,
            suitableFor: data.suitableFor,
            warnings: data.warnings,
            storageInstructions: data.storageInstructions,
            doctorRecommended: data.doctorRecommended,
            prescriptionRequired: data.prescriptionRequired,
            variants: data.variants,
            stock: data.stock,
            discountPercent: data.discountPercent,
            offerPrice: data.offerPrice,
            regularPrice: data.regularPrice
          };
          setSelectedProduct(item);
          if (item.variants && item.variants.length > 0) {
            setSelectedVariant(item.variants[0]);
          }
        }
      })
      .catch(console.error);
    }
  }, [apiUrl, token]);

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
          stock: d.stock,
          discountPercent: d.discountPercent,
          offerPrice: d.offerPrice,
          regularPrice: d.regularPrice
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

  const updateItemQty = (itemId: string, delta: number, variantName?: string) => {
    setBasket(prev => {
      const existing = prev.find(p => p.item.id === itemId && p.variantName === variantName);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter(p => !(p.item.id === itemId && p.variantName === variantName));
      }
      return prev.map(p => (p.item.id === itemId && p.variantName === variantName) ? { ...p, qty: newQty } : p);
    });
  };

  const getItemQtyInCart = (itemId: string, variantName?: string) => {
    const found = basket.find(p => p.item.id === itemId && p.variantName === variantName);
    return found ? found.qty : 0;
  };

  const totalItems = basket.reduce((sum, item) => sum + item.qty, 0);

  const getProductPrices = (item: ShopItem, variantName?: string) => {
    if (!item) {
      return { regularPrice: 0, finalPrice: 0, discountPercent: 0 };
    }
    let basePrice = Number(item.price || item.regularPrice || 0);
    if (variantName && item.variants) {
      const v = item.variants.find(x => x.name === variantName);
      if (v) basePrice = Number(v.price || 0);
    } else if (!variantName && item.variants && item.variants.length > 0) {
      basePrice = Number(item.variants[0].price || 0);
    }

    const discountPercent = Number(item.discountPercent || 0);
    const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
    return {
      regularPrice: basePrice,
      finalPrice: Number((finalPrice || 0).toFixed(2)),
      discountPercent
    };
  };

  // Distinct Brands calculation
  const distinctBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const openProductDetails = (item: ShopItem) => {
    setSelectedProduct(item);
    setActiveImageIndex(0);
    window.history.pushState({}, '', `?product=${item.id}`);
    if (item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    if (window.location.search.includes('product=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  if (showBasket) {
    return <BasketScreen onBack={() => setShowBasket(false)} basket={basket} setBasket={setBasket} />;
  }

  if (selectedProduct) {
    const isOutOfStock = (selectedVariant ? selectedVariant.stock : selectedProduct.stock) <= 0;
    const { regularPrice, finalPrice, discountPercent } = getProductPrices(selectedProduct);
    
    // Combine primary image and extra gallery images
    const allGalleryImages = Array.from(new Set([
      selectedProduct.image,
      ...(selectedProduct.images || [])
    ])).filter(img => img && !img.startsWith('💊') && img.length > 4);

    const activeImageSrc = allGalleryImages.length > 0
      ? (allGalleryImages[activeImageIndex] || allGalleryImages[0])
      : selectedProduct.image;
    
    return (
      <div className="pb-24 pt-[calc(env(safe-area-inset-top)+14px)] px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-bottom duration-300">
        {/* Back Button, Share & Basket Controls with Safe Notch Clearance */}
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <button 
            onClick={closeProductDetails}
            className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?product=${selectedProduct.id}`;
                navigator.clipboard.writeText(url);
                showToast('Link copied to clipboard! You can share it now.', 'success');
              }}
              className="h-10 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs"
            >
              🔗 Share Link
            </button>

            {branding.enableExternalPayments !== false && (
              <button 
                onClick={() => setShowBasket(true)}
                className="relative h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Product Details Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 md:p-10 flex flex-col md:flex-row gap-10">
          {/* Left Column: Image Gallery & Details */}
          <div className="md:w-2/5 flex flex-col items-center">
            <div className="w-full aspect-square bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-center overflow-hidden mb-3 relative shadow-inner">
              <ProductImage src={activeImageSrc} apiUrl={apiUrl} className="h-full w-full object-contain p-6" textClassName="text-8xl" />
            </div>

            {/* Thumbnail Gallery Selector */}
            {allGalleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto w-full pb-2 mb-4 scrollbar-thin scrollbar-thumb-slate-200">
                {allGalleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-16 shrink-0 rounded-2xl border-2 overflow-hidden bg-white dark:bg-slate-900 p-1 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-105'
                        : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <ProductImage src={img} apiUrl={apiUrl} className="h-full w-full object-contain" textClassName="text-xl" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="bg-slate-50/60 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 w-full space-y-3.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Category</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{selectedProduct.category}</span>
              </div>
              {selectedProduct.brand && (
                <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Brand</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedProduct.brand}</span>
                </div>
              )}
              {selectedProduct.manufacturer && (
                <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Manufacturer</span>
                  <span className="font-semibold text-slate-500">{selectedProduct.manufacturer}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Info & Actions */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedProduct.doctorRecommended && (
                    <span className="bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="h-3 w-3" /> Doctor Recommended
                    </span>
                  )}
                  {selectedProduct.prescriptionRequired && (
                    <span className="bg-amber-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Rx Prescribed
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-sans font-black text-slate-850 dark:text-slate-100 tracking-tight leading-tight">{selectedProduct.name}</h1>
                {productReviews.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center text-amber-400 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
                        return (
                          <span key={i} className={i < Math.round(avg) ? 'opacity-100' : 'opacity-20'}>★</span>
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)} ({productReviews.length} reviews)
                    </span>
                  </div>
                )}
                {selectedProduct.shortDescription ? (
                  <div 
                    className="text-sm font-medium text-slate-500 mt-2 leading-relaxed [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                    dangerouslySetInnerHTML={{ __html: selectedProduct.shortDescription }}
                  />
                ) : (
                  <p className="text-xs text-slate-400 mt-2 italic">High quality therapeutic grade health formulation.</p>
                )}
              </div>

              {/* Price & Variant Selection Box */}
              <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block pb-1">Fulfillment Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {curr}
                      {selectedVariant 
                        ? selectedVariant.price.toFixed(2)
                        : finalPrice.toFixed(2)
                      }
                    </span>
                    {!selectedVariant && discountPercent > 0 && (
                      <span className="text-sm text-slate-400 line-through font-semibold">
                        {curr}{regularPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-2 border-t border-slate-200/50 pt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Size / Pack Type</label>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedProduct.variants.map((v, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedVariant?.sku === v.sku
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-655 hover:border-indigo-400'
                          }`}
                        >
                          {v.name} ({curr}{v.price.toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-200/50 pt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>SKU: {selectedVariant ? selectedVariant.sku : (selectedProduct.sku || 'N/A')}</span>
                  <span className={isOutOfStock ? 'text-rose-500 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                    {isOutOfStock ? 'Out of Stock' : 'In Stock & Ready to Ship'}
                  </span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 text-xs text-slate-600 scrollbar-thin">
                {selectedProduct.detailedDescription && (
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] block">Product Details</span>
                    <div 
                      className="leading-relaxed text-slate-500 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_a]:text-primary [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.detailedDescription }}
                    />
                  </div>
                )}

                {selectedProduct.keyBenefits && selectedProduct.keyBenefits.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] block">Key Benefits</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-500 leading-relaxed">
                      {selectedProduct.keyBenefits.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}

                {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] block">Active Ingredients</span>
                    <p className="text-slate-500 leading-relaxed font-semibold">{selectedProduct.ingredients.join(', ')}</p>
                  </div>
                )}

                {selectedProduct.usageInstructions && (
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] block">Directions for Use</span>
                    <p className="text-slate-500 leading-relaxed">{selectedProduct.usageInstructions}</p>
                  </div>
                )}

                {selectedProduct.warnings && (
                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/60 text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <span className="font-bold text-[10px] uppercase tracking-wider block mb-1">Safety Precautions</span>
                      <p className="text-[10px] leading-relaxed text-red-650">{selectedProduct.warnings}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Pincode Checker inside Product Details View */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] block">Check Delivery Serviceability</span>
              <PincodeDeliveryChecker
                apiUrl={apiUrl}
                token={token}
                onShippingFeeCalculated={(fee, serviceable, code, estimate) => {
                  setUserDeliveryPincode(code);
                  setIsDeliveryServiceable(serviceable);
                  setDeliveryFee(fee);
                  setDeliveryEstimate(estimate);
                }}
              />
            </div>

            {/* Checkout Options */}
            {branding.enableExternalPayments !== false && (
              <div className="pt-6 border-t border-slate-100 flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const stockVal = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                    if (stockVal <= 0) {
                      showToast('This item is currently sold out.', 'info');
                      return;
                    }
                    addToBasket(selectedProduct, selectedVariant?.name);
                  }}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                >
                  <ShoppingCart className="h-4.5 w-4.5" /> Add to Order Basket
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const stockVal = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                    if (stockVal <= 0) {
                      showToast('This item is currently sold out.', 'info');
                      return;
                    }
                    addToBasket(selectedProduct, selectedVariant?.name);
                    setShowBasket(true);
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                >
                  <span>⚡ Buy Now</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Fixed Sticky Bottom Action Bar */}
        {branding.enableExternalPayments !== false && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 md:hidden shadow-2xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Price</span>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {curr}{selectedVariant ? selectedVariant.price.toFixed(2) : finalPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end max-w-[240px]">
              <button
                type="button"
                onClick={() => {
                  const stockVal = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                  if (stockVal <= 0) {
                    showToast('This item is currently sold out.', 'info');
                    return;
                  }
                  addToBasket(selectedProduct, selectedVariant?.name);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Cart
              </button>

              <button
                type="button"
                onClick={() => {
                  const stockVal = selectedVariant ? selectedVariant.stock : selectedProduct.stock;
                  if (stockVal <= 0) {
                    showToast('This item is currently sold out.', 'info');
                    return;
                  }
                  addToBasket(selectedProduct, selectedVariant?.name);
                  setShowBasket(true);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 md:p-10 mt-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-850">Patient Reviews & Feedback</h3>
            <p className="text-xs text-slate-500 mt-1">Verified patient feedback for {selectedProduct.name}</p>
          </div>

          {productReviews.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <span className="text-2xl block mb-2">⭐</span>
              <p className="text-xs font-bold text-slate-400">No approved reviews yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Purchased this item? Click the rating link in your delivery confirmation invoice email or order page to review it!</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {productReviews.map((r, rIdx) => (
                <div key={r._id} className={`${rIdx > 0 ? 'pt-4' : ''} space-y-2`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{r.patientName}</span>
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center text-amber-400 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < r.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                    ))}
                  </div>

                  {r.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100/60 italic">
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-6xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-6 sticky top-0 z-50 bg-slate-50 dark:bg-slate-950 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 -mx-4 px-4 shadow-xs gap-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button 
            onClick={onBack}
            className="h-10 w-10 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-[0.15em] sm:tracking-[0.2em] uppercase block truncate">MitoReboot Health</span>
            <h2 className="text-base sm:text-2xl font-sans font-bold text-slate-850 dark:text-slate-100 leading-none mt-0.5 flex items-center gap-1 sm:gap-2 truncate">
              <span className="shrink-0">🩺</span>
              <span className="truncate">Medical & Health Store</span>
            </h2>
          </div>
        </div>
        
        {branding.enableExternalPayments !== false && (
          <button 
            onClick={() => setShowBasket(true)}
            className="relative shrink-0 h-10 px-3 sm:h-12 sm:px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
            <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">My Basket</span>
            {totalItems > 0 && (
              <span className="bg-indigo-600 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Flipkart-Style Delivery Location & Pincode Bar (Adaptive Light/Dark Theme) */}
      <div className="mb-4 bg-indigo-50/90 dark:bg-slate-900 border border-indigo-150 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
              <MapPin className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                <span>Deliver to:</span>
                <span className="font-extrabold text-indigo-950 dark:text-white truncate">
                  {userDeliveryPincode ? `${userDeliveryPincode}${deliveryLocality ? ` (${deliveryLocality})` : ''}` : 'Select Pincode'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] mt-0.5 font-bold">
                {isDeliveryServiceable === false ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Delivery Unavailable for this pincode
                  </span>
                ) : deliveryEstimate ? (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-emerald-600" /> {deliveryEstimate} • <span className="font-black">{deliveryFee === 0 ? 'FREE Shipping' : `₹${deliveryFee} Shipping`}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Enter pincode for delivery estimate</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setTempPincodeInput(userDeliveryPincode);
                setIsEditingPincode(!isEditingPincode);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span>{isEditingPincode ? 'Cancel' : 'Change Pincode'}</span>
            </button>
          </div>
        </div>

        {/* Inline Expandable Pincode Editor */}
        {isEditingPincode && (
          <div className="pt-2.5 border-t border-indigo-100 dark:border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
            <div className="relative flex-1 min-w-[160px]">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
                value={tempPincodeInput}
                onChange={(e) => setTempPincodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => handleApplyPincode()}
              disabled={checkingPincode || tempPincodeInput.length < 6}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
            >
              {checkingPincode ? 'Checking...' : 'Apply'}
            </button>

            <button
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => handleApplyPincode(userDeliveryPincode || '560001', pos.coords.latitude, pos.coords.longitude),
                    () => showToast('Unable to fetch GPS location.', 'error')
                  );
                }
              }}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="h-3.5 w-3.5 text-indigo-500" /> GPS
            </button>
          </div>
        )}
      </div>

      {/* Main Search and Filters Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Filters Panel */}
        <div className={`md:block space-y-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl shadow-sm ${showFiltersPanel ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
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
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
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
                step="any"
                placeholder="Min" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              />
              <input 
                type="number" 
                step="any"
                placeholder="Max" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none"
              />
            </div>
            <button 
              onClick={fetchProducts} 
              className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all mt-1"
            >
              Apply Price Filter
            </button>
          </div>

          {/* Checkbox Toggles */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={onlyDoctorRecommended} 
                onChange={(e) => setOnlyDoctorRecommended(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Doctor Recommended</span>
            </label>
            
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={onlyAvailable} 
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Right Product Grid Column */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Top Search & Filter Mobile Toggle */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-3 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search medical products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-indigo-400"
              />
            </form>
            
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                type="button" 
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 md:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </button>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-700 dark:text-slate-350 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer"
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
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs text-slate-450 font-bold">Refreshing products feed...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl shadow-xs">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200">No items available</h3>
              <p className="text-xs text-slate-450 mt-1">Try resetting filters or checking for alternative items.</p>
              <button 
                onClick={() => { setSelectedCategory('All'); setSelectedBrand('All'); setSearch(''); setOnlyDoctorRecommended(false); setOnlyAvailable(false); }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(item => {
                const { regularPrice, finalPrice, discountPercent } = getProductPrices(item);
                const isOutOfStock = item.stock <= 0;
                const hasVariants = item.variants && item.variants.length > 0;
                const itemQty = getItemQtyInCart(item.id);
                
                return (
                  <div 
                    key={item.id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl dark:hover:shadow-none hover:border-indigo-300 dark:hover:border-indigo-800 rounded-[2.2rem] p-4 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 group relative cursor-pointer"
                    onClick={() => openProductDetails(item)}
                  >
                    <div>
                      {/* Badge Header Row */}
                      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between gap-1 pointer-events-none">
                        {discountPercent > 0 ? (
                          <span className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-xs tracking-wider">
                            {discountPercent}% OFF
                          </span>
                        ) : <span />}

                        {item.doctorRecommended ? (
                          <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                            <Sparkles className="h-2.5 w-2.5" /> Dr. Recommended
                          </span>
                        ) : item.prescriptionRequired ? (
                          <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            Rx Req.
                          </span>
                        ) : null}
                      </div>

                      {/* Image Frame */}
                      <div className="w-full aspect-square bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl mb-3 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-indigo-50/20 relative border border-slate-100 dark:border-slate-800/80">
                        <ProductImage src={item.image} apiUrl={apiUrl} className="h-full w-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" textClassName="text-6xl" />
                      </div>

                      {/* Brand & Star Rating */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                          {item.brand || item.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>4.8</span>
                        </div>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3 line-clamp-2 leading-relaxed font-semibold">
                        {(item.desc || '').replace(/<[^>]*>/g, '')}
                      </p>
                    </div>

                    {/* Price & Action Section */}
                    <div className="flex items-end justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                      <div>
                        {hasVariants && (
                          <span className="text-[8px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">Starts From</span>
                        )}
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-lg leading-none">{curr}{finalPrice.toFixed(2)}</span>
                          {discountPercent > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">{curr}{regularPrice.toFixed(2)}</span>
                          )}
                        </div>
                        {discountPercent > 0 && (
                          <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md inline-block mt-1">
                            Save {curr}{(regularPrice - finalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {isOutOfStock ? (
                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 px-2.5 py-1.5 rounded-xl uppercase">Sold Out</span>
                      ) : branding.enableExternalPayments !== false ? (
                        hasVariants ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductDetails(item);
                            }}
                            className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-2 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>Options</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        ) : itemQty > 0 ? (
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center bg-indigo-600 text-white rounded-xl p-1 shadow-md gap-2">
                            <button
                              onClick={() => updateItemQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-indigo-700 hover:bg-indigo-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-black px-1 min-w-[14px] text-center">{itemQty}</span>
                            <button
                              onClick={() => addToBasket(item)}
                              className="w-6 h-6 rounded-lg bg-indigo-700 hover:bg-indigo-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToBasket(item);
                            }}
                            className="text-[11px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl">View Info</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pincode Change Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-600" /> Choose Delivery Pincode
              </h4>
              <button
                onClick={() => setShowPincodeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <PincodeDeliveryChecker
              apiUrl={apiUrl}
              token={token}
              onShippingFeeCalculated={(_fee, _serviceable, code) => {
                handleApplyPincode(code);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
