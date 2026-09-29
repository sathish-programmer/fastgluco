import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, SlidersHorizontal, Sparkles, AlertCircle, ShoppingCart, 
  Package, MapPin, Plus, Minus, ChevronRight, ExternalLink,
  Check, X, Share2, ShieldCheck
} from 'lucide-react';
import { BasketScreen } from './BasketScreen';
import { PincodeDeliveryChecker } from '../../components/PincodeDeliveryChecker';
import { ProductImageZoomShowcase } from '../../components/ProductImageZoomShowcase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

interface ShopScreenProps {
  onBack?: () => void;
  onOpenOrders?: () => void;
  type?: 'Antioxidants' | 'SaferProducts' | string;
  defaultSearch?: string;
}

// Verified Cloudinary packaging photography hosted on Arivu Foods' CDN
const VERIFIED_CLIENT_IMAGES: Record<string, string> = {
  'Multi Seed Dosa': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739889943/squlpcnma8gkeojw5z7a.png',
  'Multi Seed Atta': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739888457/xnjvdqb269yskfuxxc5h.png',
  'Coconut Flour': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739890451/uthgww5i45nxxgr4prwk.png',
  'Dia Nutri Mix': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775117318/x6va0pmgkbwk8nwnvpwo.jpg',
  'Energy Booster': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775099153/w2ipxqvfu2r8sdiwhv8f.png',
  'Energy Booster Nutri Mix': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775099153/w2ipxqvfu2r8sdiwhv8f.png',
  'Women Nutri Mix': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775031738/nuxin2ynchkil57qucgc.jpg',
  'Women’s Health Nutri Mix': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775031738/nuxin2ynchkil57qucgc.jpg',
  'Multi Seed Chakli': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739891802/nmcwib3u8wjpjde7majb.png',
  'Mix Seed Dosa': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739889943/squlpcnma8gkeojw5z7a.png',
  'Low-Carb Multi Seeds Atta': 'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739888457/xnjvdqb269yskfuxxc5h.png'
};

export const ProductImage: React.FC<{
  src?: string;
  apiUrl: string;
  className?: string;
  textClassName?: string;
  title?: string;
  category?: string;
}> = ({ src, apiUrl, className = "h-10 w-10 object-contain rounded-xl", textClassName = "text-3xl", title = "", category = "" }) => {
  const [error, setError] = useState(false);
  const { t } = useLanguage();

  const resolvedSrc = (src && src.trim() !== '') ? src : (title ? VERIFIED_CLIENT_IMAGES[title] : undefined);

  if (resolvedSrc && !error) {
    const isEmoji = !resolvedSrc.startsWith('/') && !resolvedSrc.startsWith('http') && resolvedSrc.length <= 4;
    if (isEmoji) {
      return <span className={textClassName}>{resolvedSrc}</span>;
    }
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    const fullUrl = resolvedSrc.startsWith('http') ? resolvedSrc : `${baseUrl}${resolvedSrc}`;
    return (
      <img
        src={fullUrl}
        alt={title || t('productAlt', 'Product')}
        className={className}
        onError={() => setError(true)}
        loading="lazy"
      />
    );
  }

  // Modern minimalist health & nutrition card placeholder
  const categoryLabel = category ? category.replace('MitoReboot ', '') : 'Functional Nutrition';

  return (
    <div className={`${className} bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200/50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center p-3 relative overflow-hidden select-none`}>
      <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/15 border border-indigo-200/60 dark:border-indigo-500/30 flex items-center justify-center shadow-xs mb-1.5">
        <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center max-w-[120px] truncate">
        {categoryLabel}
      </span>
      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wide mt-0.5">
        MitoReboot Verified
      </span>
    </div>
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
  vendorId?: any;
  vendorSku?: string;
  buyOnAmazonUrl?: string;
  nutritionFacts?: Record<string, any>;
  allergens?: string[];
  fssaiNumber?: string;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, onOpenOrders, type, defaultSearch }) => {
  const { t } = useLanguage();
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
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (!type || type === 'All' || type.toLowerCase() === 'antioxidants' || type.toLowerCase() === 'saferproducts') {
      return 'All';
    }
    return type;
  });
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyDoctorRecommended, setOnlyDoctorRecommended] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Delivery Pincode Bar state
  const [userDeliveryPincode, setUserDeliveryPincode] = useState<string>(() => localStorage.getItem('user_delivery_pincode') || user?.addressPinCode || '560001');
  const [deliveryLocality, setDeliveryLocality] = useState<string>('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryCourier, setDeliveryCourier] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isDeliveryServiceable, setIsDeliveryServiceable] = useState<boolean | null>(null);
  const [isEditingPincode, setIsEditingPincode] = useState<boolean>(false);
  const [tempPincodeInput, setTempPincodeInput] = useState<string>('');
  const [checkingPincode, setCheckingPincode] = useState<boolean>(false);

  // Selected Product Detail View state
  const [selectedProduct, setSelectedProduct] = useState<ShopItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Tab selection inside product detail view
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'benefits' | 'ingredients' | 'usage' | 'nutrition'>('overview');

  // Sync profile pincode if not manually overridden in localStorage
  useEffect(() => {
    if (!localStorage.getItem('user_delivery_pincode') && user?.addressPinCode) {
      setUserDeliveryPincode(user.addressPinCode);
    }
  }, [user?.addressPinCode]);

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
        body: JSON.stringify({
          pincode: code,
          userLat,
          userLon,
          vendorSlug: 'arivu-foods',
          address: {
            line1: user?.addressLine1,
            city: user?.addressCity,
            state: user?.addressState
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUserDeliveryPincode(code);
        localStorage.setItem('user_delivery_pincode', code);
        setIsDeliveryServiceable(data.serviceable);
        setDeliveryFee(data.shippingFee || 0);
        setDeliveryEstimate(data.estimatedDeliveryTime || '');
        setDeliveryDate(data.estimatedDeliveryDate || '');
        setDeliveryCourier(data.courierPartner || '');
        setDeliveryLocality(data.localityName || data.city || '');
        setIsEditingPincode(false);
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
        body: JSON.stringify({
          pincode: userDeliveryPincode,
          vendorSlug: 'arivu-foods',
          address: {
            line1: user?.addressLine1,
            city: user?.addressCity,
            state: user?.addressState
          }
        })
      })
        .then(res => res.json())
        .then(data => {
          setIsDeliveryServiceable(data.serviceable);
          setDeliveryFee(data.shippingFee || 0);
          setDeliveryEstimate(data.estimatedDeliveryTime || '');
          setDeliveryDate(data.estimatedDeliveryDate || '');
          setDeliveryCourier(data.courierPartner || '');
          setDeliveryLocality(data.localityName || data.city || '');
        })
        .catch(console.error);
    }
  }, [apiUrl, token, userDeliveryPincode, user]);

  useEffect(() => {
    if (selectedProduct && selectedProduct.id && selectedProduct.id !== 'undefined') {
      fetch(`${apiUrl}/shop/products/${selectedProduct.id}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setProductReviews(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    } else {
      setProductReviews([]);
    }
  }, [selectedProduct, apiUrl, token]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, selectedBrand, onlyDoctorRecommended, onlyAvailable, sortBy]);

  // Real-time debounced backend search when typing
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load product details if product query param is in URL or changes via popstate
  useEffect(() => {
    const loadProductFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product');
      if (prodId) {
        fetch(`${apiUrl}/shop/products/${prodId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              const p = data.product || data;
              if (p && (p._id || p.id)) {
                const item: ShopItem = {
                  id: p._id || p.id,
                  name: p.name || 'Product',
                  desc: p.description || p.desc || '',
                  price: p.price || 0,
                  image: p.image || '',
                  category: p.category || 'General',
                  brand: p.brand || '',
                  images: p.images || [],
                  shortDescription: p.shortDescription || '',
                  detailedDescription: p.detailedDescription || '',
                  keyBenefits: p.keyBenefits || [],
                  healthBenefits: p.healthBenefits || [],
                  ingredients: p.ingredients || [],
                  usageInstructions: p.usageInstructions || '',
                  suitableFor: p.suitableFor || '',
                  warnings: p.warnings || '',
                  storageInstructions: p.storageInstructions || '',
                  doctorRecommended: p.doctorRecommended || false,
                  prescriptionRequired: p.prescriptionRequired || false,
                  variants: p.variants || [],
                  stock: p.stock ?? 10,
                  discountPercent: p.discountPercent || 0,
                  offerPrice: p.offerPrice || 0,
                  regularPrice: p.regularPrice || p.price || 0,
                  vendorId: p.vendorId,
                  vendorSku: p.vendorSku,
                  buyOnAmazonUrl: p.buyOnAmazonUrl,
                  nutritionFacts: p.nutritionFacts,
                  allergens: p.allergens,
                  fssaiNumber: p.fssaiNumber
                };
                setSelectedProduct(item);
                if (item.variants && item.variants.length > 0) {
                  setSelectedVariant(item.variants[0]);
                } else {
                  setSelectedVariant(null);
                }
              }
            }
          })
          .catch(console.error);
      }
    };

    loadProductFromUrl();
    window.addEventListener('popstate', loadProductFromUrl);
    return () => window.removeEventListener('popstate', loadProductFromUrl);
  }, [apiUrl, token]);

  useEffect(() => {
    if (!type || type === 'All' || type.toLowerCase() === 'antioxidants' || type.toLowerCase() === 'saferproducts') {
      setSelectedCategory('All');
    } else {
      setSelectedCategory(type);
    }
  }, [type]);

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
          regularPrice: d.regularPrice,
          vendorId: d.vendorId,
          vendorSku: d.vendorSku,
          buyOnAmazonUrl: d.buyOnAmazonUrl,
          nutritionFacts: d.nutritionFacts,
          allergens: d.allergens,
          fssaiNumber: d.fssaiNumber
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
    let limitStock = Number(item.stock ?? 0);

    if (variantName && item.variants && item.variants.length > 0) {
      const v = item.variants.find(x => x.name === variantName);
      limitStock = v ? Number(v.stock ?? 0) : 0;
    } else if (!variantName && item.variants && item.variants.length > 0) {
      limitStock = item.variants.reduce((acc, v) => acc + Number(v.stock ?? 0), 0);
    }

    if (limitStock <= 0) {
      showToast(`${item.name}${variantName ? ` (${variantName})` : ''} is currently out of stock.`, 'error');
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

  // Instant real-time multi-word client-side filter alongside debounced backend search
  const displayedProducts = products.filter(item => {
    if (!search.trim()) return true;
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const searchable = `${item.name} ${item.desc || ''} ${item.shortDescription || ''} ${item.brand || ''} ${item.category || ''} ${item.variants?.map(v => v.name).join(' ') || ''}`.toLowerCase();
    return terms.every(term => searchable.includes(term));
  });

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

  const distinctBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];

  const openProductDetails = (item: ShopItem) => {
    setSelectedProduct(item);
    setActiveImageIndex(0);
    setActiveDetailTab('overview');
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

  // Hardware back button / popstate handling
  useEffect(() => {
    const handleBackButtonEvent = (e: Event) => {
      if (showBasket) {
        e.preventDefault();
        if ('stopImmediatePropagation' in e) e.stopImmediatePropagation();
        setShowBasket(false);
        return;
      }
      if (selectedProduct) {
        e.preventDefault();
        if ('stopImmediatePropagation' in e) e.stopImmediatePropagation();
        closeProductDetails();
        return;
      }
    };

    window.addEventListener('appBackButton', handleBackButtonEvent);
    window.addEventListener('popstate', handleBackButtonEvent);
    return () => {
      window.removeEventListener('appBackButton', handleBackButtonEvent);
      window.removeEventListener('popstate', handleBackButtonEvent);
    };
  }, [showBasket, selectedProduct]);

  if (showBasket) {
    return <BasketScreen onBack={() => setShowBasket(false)} basket={basket} setBasket={setBasket} />;
  }

  // ==========================================
  // PRODUCT DETAILS PAGE VIEW
  // ==========================================
  if (selectedProduct) {
    const currentStock = selectedVariant
      ? Number(selectedVariant.stock ?? 0)
      : (selectedProduct.variants && selectedProduct.variants.length > 0)
        ? selectedProduct.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)
        : Number(selectedProduct.stock ?? 0);
    const isOutOfStock = currentStock <= 0;
    const { regularPrice, finalPrice, discountPercent } = getProductPrices(selectedProduct, selectedVariant?.name);

    const allGalleryImages = Array.from(new Set([
      selectedProduct.image,
      ...(selectedProduct.images || [])
    ])).filter(img => img && !img.startsWith('💊') && img.length > 4);

    const activeImageSrc = allGalleryImages.length > 0
      ? (allGalleryImages[activeImageIndex] || allGalleryImages[0])
      : selectedProduct.image;

    const savingsAmount = regularPrice - finalPrice;
    const avgRating = productReviews.length > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : null;

    return (
      <div className="shop-screen-container pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">

        {/* Sticky Header Bar */}
        <div
          className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-xs"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={closeProductDetails}
              className="h-10 px-3.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200/60 dark:border-slate-700/60 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('shop.backToStore', 'Back to Store')}</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="min-w-0 flex-1 px-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">
                {selectedProduct.category}
              </span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {selectedProduct.name}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?product=${selectedProduct.id}`;
                  navigator.clipboard.writeText(url);
                  showToast('Product link copied to clipboard!', 'success');
                }}
                className="h-10 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Share product link"
              >
                <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {branding.enableExternalPayments !== false && (
                <button
                  onClick={() => setShowBasket(true)}
                  className="relative h-10 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Basket</span>
                  {totalItems > 0 && (
                    <span className="bg-white text-indigo-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 max-w-5xl mx-auto pt-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-10 flex flex-col md:flex-row gap-8 lg:gap-12 relative">
            
            {/* Left Column: Image Showcase with Flipkart / Amazon Zooming */}
            <div className="md:w-5/12 flex flex-col items-center">
              <ProductImageZoomShowcase
                activeImageSrc={activeImageSrc}
                allGalleryImages={allGalleryImages}
                activeImageIndex={activeImageIndex}
                onSelectImageIndex={setActiveImageIndex}
                apiUrl={apiUrl}
                productName={selectedProduct.name}
                category={selectedProduct.category}
                discountPercent={discountPercent}
                verifiedImagesMap={VERIFIED_CLIENT_IMAGES}
              />
            </div>

            {/* Right Column: Information, Pricing, & Controls */}
            <div className="md:w-7/12 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  {/* Badges & Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                      {selectedProduct.brand || selectedProduct.category}
                    </span>

                    {selectedProduct.doctorRecommended && (
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Sparkles className="h-3 w-3" /> Doctor Recommended
                      </span>
                    )}

                    {selectedProduct.prescriptionRequired && (
                      <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs">
                        Rx Prescribed
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {selectedProduct.name}
                  </h1>

                  {/* Reviews Stars Snippet */}
                  {avgRating && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-400 text-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < Math.round(Number(avgRating)) ? 'opacity-100' : 'opacity-20'}>★</span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {avgRating} <span className="text-slate-400">({productReviews.length} verified reviews)</span>
                      </span>
                    </div>
                  )}

                  {/* Short Description */}
                  {selectedProduct.shortDescription ? (
                    <div
                      className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-3 leading-relaxed [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.shortDescription }}
                    />
                  ) : selectedProduct.desc ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {selectedProduct.desc.replace(/<[^>]*>/g, '')}
                    </p>
                  ) : null}
                </div>

                {/* Sleek, Modern High-End Price & Options Card */}
                <div className="bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-[2rem] space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                          {curr}{finalPrice.toFixed(0)}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-base text-slate-400 line-through font-semibold">
                            {curr}{regularPrice.toFixed(0)}
                          </span>
                        )}
                        {discountPercent > 0 && (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black text-xs px-3 py-1 rounded-full border border-emerald-500/20">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-medium block mt-1">
                        {typeof selectedProduct.vendorId === 'object' && selectedProduct.vendorId?.gstPercentage !== undefined
                          ? (selectedProduct.vendorId.gstPercentage > 0
                              ? `Inclusive of ${selectedProduct.vendorId.gstPercentage}% GST${selectedProduct.vendorId?.name ? ` • Dispatched by ${selectedProduct.vendorId.name}` : ' • Doorstep delivery available'}`
                              : `GST Exempt (0%)${selectedProduct.vendorId?.name ? ` • Dispatched by ${selectedProduct.vendorId.name}` : ' • Doorstep delivery available'}`)
                          : 'Inclusive of all taxes • Doorstep delivery available'}
                      </span>
                    </div>

                    {discountPercent > 0 && (
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-2xl border border-emerald-200/70 shadow-2xs">
                        Save {curr}{savingsAmount.toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Pack / Variant Selector */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-2.5 border-t border-slate-200/60 dark:border-slate-800 pt-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                          Select Pack / Weight
                        </label>
                        {selectedVariant && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                            Selected: {selectedVariant.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedProduct.variants.map((v, idx) => {
                          const isSelected = selectedVariant?.sku === v.sku;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedVariant(v)}
                              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20 scale-[1.02]'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              <span>{v.name}</span>
                              <span className="opacity-90 font-black">({curr}{v.price.toFixed(0)})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stock & Trust Bar */}
                  <div className="flex flex-wrap justify-between items-center border-t border-slate-200/60 dark:border-slate-800 pt-3.5 text-xs font-bold gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>100% Genuine • Direct Dispatch</span>
                    </span>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black ${
                      isOutOfStock 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                      <span>{isOutOfStock ? 'Sold Out - Unavailable' : 'In Stock • Dispatches in 24-48 hrs'}</span>
                    </span>
                  </div>
                </div>

                {/* Delivery Pincode Checker (Clean unnested presentation) */}
                <PincodeDeliveryChecker
                  apiUrl={apiUrl}
                  token={token}
                  cartAmount={finalPrice}
                  vendorSlug={selectedProduct.brand === 'Arivu Foods' || selectedProduct.vendorSku ? 'arivu-foods' : undefined}
                  onShippingFeeCalculated={(fee, serviceable, code, estimate, courier, date) => {
                    setUserDeliveryPincode(code);
                    setIsDeliveryServiceable(serviceable);
                    setDeliveryFee(fee);
                    setDeliveryEstimate(estimate);
                    if (courier) setDeliveryCourier(courier);
                    if (date) setDeliveryDate(date);
                  }}
                />

                {/* Structured Information Tabs with Modern Pill Container */}
                <div className="space-y-3 pt-2">
                  <div className="flex p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl gap-1 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setActiveDetailTab('overview')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        activeDetailTab === 'overview'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Overview
                    </button>
                    {selectedProduct.keyBenefits && selectedProduct.keyBenefits.length > 0 && (
                      <button
                        onClick={() => setActiveDetailTab('benefits')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                          activeDetailTab === 'benefits'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Key Benefits
                      </button>
                    )}
                    {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                      <button
                        onClick={() => setActiveDetailTab('ingredients')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                          activeDetailTab === 'ingredients'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Ingredients
                      </button>
                    )}
                    {selectedProduct.usageInstructions && (
                      <button
                        onClick={() => setActiveDetailTab('usage')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                          activeDetailTab === 'usage'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Usage & Directions
                      </button>
                    )}
                    {selectedProduct.nutritionFacts && Object.keys(selectedProduct.nutritionFacts).length > 0 && (
                      <button
                        onClick={() => setActiveDetailTab('nutrition')}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                          activeDetailTab === 'nutrition'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Nutrition Facts
                      </button>
                    )}
                  </div>

                  {/* Tab Content Display */}
                  <div className="pt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {activeDetailTab === 'overview' && (
                      selectedProduct.detailedDescription ? (
                        <div
                          className="space-y-2 [&_p]:mb-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                          dangerouslySetInnerHTML={{ __html: selectedProduct.detailedDescription }}
                        />
                      ) : (
                        <p>{selectedProduct.desc || 'High quality therapeutic grade health formulation curated by clinical nutritionists.'}</p>
                      )
                    )}

                    {activeDetailTab === 'benefits' && selectedProduct.keyBenefits && (
                      <ul className="space-y-2">
                        {selectedProduct.keyBenefits.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeDetailTab === 'ingredients' && selectedProduct.ingredients && (
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          {selectedProduct.ingredients.join(', ')}
                        </p>
                        {selectedProduct.allergens && selectedProduct.allergens.length > 0 && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 mt-2">
                            <strong>Allergens:</strong> {selectedProduct.allergens.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    {activeDetailTab === 'usage' && selectedProduct.usageInstructions && (
                      <div className="space-y-2">
                        <p>{selectedProduct.usageInstructions}</p>
                        {selectedProduct.warnings && (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 mt-2">
                            <strong>Precautions:</strong> {selectedProduct.warnings}
                          </div>
                        )}
                      </div>
                    )}

                    {activeDetailTab === 'nutrition' && selectedProduct.nutritionFacts && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {Object.entries(selectedProduct.nutritionFacts).map(([k, val]) => (
                          <div key={k} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">{k.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FSSAI License Footer */}
                    {selectedProduct.fssaiNumber && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 rounded-xl px-3.5 py-2 text-slate-600 dark:text-slate-300 mt-4">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">FSSAI License</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedProduct.fssaiNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                {branding.enableExternalPayments !== false && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 hidden md:flex gap-3">
                    {selectedProduct.buyOnAmazonUrl ? (
                      <a
                        href={selectedProduct.buyOnAmazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                      >
                        <span>Buy on Amazon</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : isOutOfStock ? (
                      <div className="flex-1 py-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs">
                        <AlertCircle className="h-4 w-4" />
                        <span>Currently Out of Stock</span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => addToBasket(selectedProduct, selectedVariant?.name)}
                          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>{t('shop.addToOrderBasket', 'Add to Cart')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            addToBasket(selectedProduct, selectedVariant?.name);
                            setShowBasket(true);
                          }}
                          className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
                        >
                          <span>Buy Now</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-10 mt-6 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Patient Reviews & Clinical Experience</h3>
              <p className="text-xs text-slate-400 mt-1">Verified patient feedback for {selectedProduct.name}</p>
            </div>

            {productReviews.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-2xl block mb-2">⭐</span>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('shop.noReviewsYet', 'No approved reviews yet')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Purchased this item? You can submit your feedback after order delivery!</p>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {productReviews.map((r, rIdx) => (
                  <div key={r._id || rIdx} className={`${rIdx > 0 ? 'pt-4' : ''} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.patientName || 'Verified Patient'}</span>
                        <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Verified Purchase
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                      ))}
                    </div>

                    {r.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 italic">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sticky Bottom Buy Bar */}
        {branding.enableExternalPayments !== false && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/70 dark:border-slate-800/80 p-3.5 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Total Price</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {curr}{finalPrice.toFixed(0)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-[11px] text-slate-400 line-through font-bold">
                    {curr}{regularPrice.toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end max-w-[250px]">
              {selectedProduct.buyOnAmazonUrl ? (
                <a
                  href={selectedProduct.buyOnAmazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
                >
                  <span>Amazon</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : isOutOfStock ? (
                <div className="flex-1 py-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Out of Stock</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => addToBasket(selectedProduct, selectedVariant?.name)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      addToBasket(selectedProduct, selectedVariant?.name);
                      setShowBasket(true);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // MAIN STORE CATALOG & PRODUCT LIST VIEW
  // ==========================================
  return (
    <div className="shop-screen-container pb-28 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Sticky Shop Header */}
      <div
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-xs"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="h-10 w-10 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200/60 dark:border-slate-700/60 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase block">
                {t('shop.storeTitle', 'MitoReboot Clinical Store')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                Health & Functional Store
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenOrders && (
              <button
                onClick={onOpenOrders}
                className="h-10 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer"
                title="View My Order History"
              >
                <Package className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">My Orders</span>
              </button>
            )}

            {branding.enableExternalPayments !== false && (
              <button
                onClick={() => setShowBasket(true)}
                className="relative h-10 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">{t('shop.cart', 'Cart')}</span>
                {totalItems > 0 && (
                  <span className="bg-white text-indigo-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto pt-4 space-y-4">

        {/* Minimalist, Clean Editorial Showcase Strip */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1.5 max-w-xl relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200/70 dark:border-emerald-800/50 shadow-2xs">
                <Sparkles className="h-3 w-3" /> Doctor Formulated
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hidden sm:inline">
                • 100% Whole Food Nutrition
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Functional Nutrition & Toxin-Free Foods
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Curated low-glycemic staples, cold-pressed oils, and targeted functional mixes designed for metabolic health and cellular wellness.
            </p>
          </div>

          {/* Delivery Location Pill & Quick Edit */}
          <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 relative z-10">
            <div className="flex items-center gap-2.5 bg-slate-50/90 dark:bg-slate-950/70 px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs">
              <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="text-slate-700 dark:text-slate-300">
                Deliver to: <strong className="font-mono font-black text-slate-900 dark:text-white">{userDeliveryPincode}</strong> {deliveryLocality ? `(${deliveryLocality})` : ''}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPincode(!isEditingPincode)}
                className="ml-1 text-indigo-600 dark:text-indigo-400 font-extrabold hover:text-indigo-700 cursor-pointer text-xs"
              >
                {isEditingPincode ? 'Cancel' : 'Change'}
              </button>
            </div>

            {isEditingPincode && (
              <div className="flex items-center gap-2 w-full animate-in fade-in duration-150">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  value={tempPincodeInput}
                  onChange={(e) => setTempPincodeInput(e.target.value.replace(/\D/g, ''))}
                  className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold w-32 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPincode()}
                  disabled={checkingPincode || tempPincodeInput.length < 6}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {checkingPincode ? '...' : 'Apply'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                {isDeliveryServiceable === false ? (
                  <span className="text-rose-500 font-bold">Unserviceable</span>
                ) : deliveryFee === 0 ? (
                  <span>✓ Free Delivery (Orders above ₹499)</span>
                ) : (
                  <span>Free delivery above ₹499 (₹70 below ₹499)</span>
                )}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">{deliveryDate ? `Expected by ${deliveryDate}` : (deliveryEstimate || '2-3 Business Days')}</span>
              {deliveryCourier && (
                <>
                  <span>•</span>
                  <span>via {deliveryCourier}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search, Filter Toggles & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search low-carb, atta, oils, mixes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchProducts();
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setOnlyDoctorRecommended(!onlyDoctorRecommended)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs ${
                onlyDoctorRecommended
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Dr. Recommended</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 whitespace-nowrap cursor-pointer shadow-2xs ${
                onlyAvailable
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
              }`}
            >
              <span>In Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`px-3.5 py-2 border rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap cursor-pointer shadow-2xs ${
                showFiltersPanel || minPrice || maxPrice || selectedBrand !== 'All'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="newest">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Expandable Advanced Filter Drawer */}
        {showFiltersPanel && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Filter by Price & Brand
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('All');
                  setMinPrice('');
                  setMaxPrice('');
                  setOnlyDoctorRecommended(false);
                  setOnlyAvailable(false);
                }}
                className="text-xs text-indigo-600 hover:underline font-bold"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {distinctBrands.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Brand</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 font-bold"
                  >
                    <option value="All">All Brands</option>
                    {distinctBrands.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Price Range ({curr})</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 font-bold font-mono"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 font-bold font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Horizontal Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {['All', ...categories.map(c => c.name)].map((cat, idx) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-black border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-slate-50/50'
                }`}
              >
                {cat === 'All' ? 'All Products' : cat}
              </button>
            );
          })}
        </div>

        {/* Modern, Clean & Neat Product Cards Grid (2 cols mobile, 3 tablet, 4 desktop) */}
        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {t('shop.refreshingProducts', 'Loading products...')}
            </p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
            <AlertCircle className="h-9 w-9 text-slate-300 mx-auto" />
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
              {search.trim() ? `No products matching "${search}"` : t('shop.noItemsAvailable', 'No products found')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search.trim() ? 'Try checking for typos or searching for a broader term like "atta", "mix", or "snacks".' : t('shop.tryResettingFilters', 'Try selecting a different category or clearing search.')}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedBrand('All');
                setSearch('');
                setOnlyDoctorRecommended(false);
                setOnlyAvailable(false);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {search.trim() ? 'Clear Search & Reset' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div>
            {search.trim() && (
              <div className="mb-4 flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-4 py-2 rounded-2xl text-xs">
                <span className="font-bold text-indigo-950 dark:text-indigo-200">
                  Showing <span className="font-black text-indigo-600 dark:text-indigo-400">{displayedProducts.length}</span> {displayedProducts.length === 1 ? 'product' : 'products'} for "<span className="font-extrabold">{search}</span>"
                </span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {displayedProducts.map(item => {
                const { regularPrice, finalPrice, discountPercent } = getProductPrices(item);
                const itemTotalStock = (item.variants && item.variants.length > 0)
                  ? item.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)
                  : (Number(item.stock) || 0);
                const isOutOfStock = itemTotalStock <= 0;
                const hasVariants = item.variants && item.variants.length > 0;
                const itemQty = getItemQtyInCart(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => openProductDetails(item)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-700/80 rounded-[1.75rem] p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] group relative cursor-pointer overflow-hidden"
                  >
                    <div>
                      {/* Clean Image Showcase Pedestal */}
                      <div className="w-full aspect-square bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/40 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-900/40 rounded-2xl mb-3 flex items-center justify-center overflow-hidden relative border border-slate-100 dark:border-slate-800/60 p-2.5">
                        {/* Badge Overlays */}
                        {isOutOfStock ? (
                          <span className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-md flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            Sold Out
                          </span>
                        ) : discountPercent > 0 ? (
                          <span className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                            {discountPercent}% OFF
                          </span>
                        ) : null}

                        {item.doctorRecommended && (
                          <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-600/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-0.5">
                            <Sparkles className="h-2 w-2" /> Dr. Pick
                          </span>
                        )}

                        <ProductImage
                          src={item.image}
                          apiUrl={apiUrl}
                          title={item.name}
                          category={item.category}
                          className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                          textClassName="text-5xl"
                        />
                      </div>

                      {/* Brand & Category Label */}
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate block mb-1">
                        {item.brand || item.category}
                      </span>

                      {/* Product Name */}
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.4rem] tracking-tight">
                        {item.name}
                      </h3>
                    </div>

                    {/* Pricing & ADD Action */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-2.5 flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg leading-none tracking-tight">
                            {curr}{finalPrice.toFixed(0)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-[10px] text-slate-400 line-through font-bold">
                              {curr}{regularPrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {hasVariants ? (
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            {item.variants?.length} pack sizes
                          </span>
                        ) : discountPercent > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            Save {curr}{(regularPrice - finalPrice).toFixed(0)}
                          </span>
                        ) : null}
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1.5 rounded-xl block text-center shadow-2xs">
                            Sold Out
                          </span>
                        ) : item.buyOnAmazonUrl ? (
                        <a
                          href={item.buyOnAmazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-black text-amber-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
                        >
                          <span>Amazon</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : branding.enableExternalPayments !== false ? (
                        hasVariants ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductDetails(item);
                            }}
                            className="text-xs font-black text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white"
                          >
                            <span>Select</span>
                            <ChevronRight className="h-3 w-3 stroke-[2.5]" />
                          </button>
                        ) : itemQty > 0 ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center bg-indigo-600 text-white rounded-xl p-0.5 gap-0.5 shadow-xs"
                          >
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.id, -1)}
                              className="h-6 w-6 flex items-center justify-center hover:bg-indigo-700 rounded-lg text-xs font-bold"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-black px-1.5">{itemQty}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.id, 1)}
                              className="h-6 w-6 flex items-center justify-center hover:bg-indigo-700 rounded-lg text-xs font-bold"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToBasket(item);
                            }}
                            className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1 shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[3]" />
                            <span>ADD</span>
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>

    </div>
  );
};
