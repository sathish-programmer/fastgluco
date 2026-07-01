import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cherry, ShieldCheck, ShoppingCart } from 'lucide-react';
import { BasketScreen } from './BasketScreen';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ShopScreenProps {
  onBack: () => void;
  type: 'Antioxidants' | 'SaferProducts';
}

export interface ShopItem {
  id: string; // we will map _id to id
  name: string;
  desc: string;
  price: number;
  image: string;
  category: 'Antioxidants' | 'SaferProducts';
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, type }) => {
  const { apiUrl, token, user } = useAuth();
  const { showToast } = useToast();
  const curr = user?.currency === 'INR' ? '₹' : '$';
  const [basket, setBasket] = useState<{item: ShopItem, qty: number}[]>([]);
  const [showBasket, setShowBasket] = useState(false);
  const [products, setProducts] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/shop/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        // Map _id to id and description to desc
        const mapped = data.map((d: any) => ({
          id: d._id,
          name: d.name,
          desc: d.description,
          price: d.price,
          image: d.image,
          category: d.category
        }));
        setProducts(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [apiUrl, token]);

  if (showBasket) {
    return <BasketScreen onBack={() => setShowBasket(false)} basket={basket} setBasket={setBasket} />;
  }

  const addToBasket = (item: ShopItem) => {
    setBasket(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { item, qty: 1 }];
    });
    showToast(`${item.name} added to basket`, 'success');
  };

  const isAntioxidants = type === 'Antioxidants';
  const Icon = isAntioxidants ? Cherry : ShieldCheck;
  const colorText = isAntioxidants ? 'text-rose-500' : 'text-emerald-500';
  const colorBg = isAntioxidants ? 'bg-rose-500' : 'bg-emerald-500';
  const colorHover = isAntioxidants ? 'hover:bg-rose-600' : 'hover:bg-emerald-600';

  const totalItems = basket.reduce((sum, item) => sum + item.qty, 0);
  const filteredProducts = products.filter(p => p.category === type);

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
              {isAntioxidants ? 'Repair · Antioxidants' : 'Repair · Safer Products'}
            </span>
            <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1 flex items-center gap-2">
              <Icon className={`h-6 w-6 ${colorText}`} /> {isAntioxidants ? 'Antioxidants' : 'Safer Products'}
            </h2>
          </div>
        </div>
        <button 
          onClick={() => setShowBasket(true)}
          className="relative h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-8">
        <h3 className="font-bold text-slate-800 mb-1.5">
          {isAntioxidants ? 'Neutralize cellular damage.' : 'Reduce your toxic load.'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {isAntioxidants 
            ? 'Carefully sourced compounds to help clear oxidative stress from your system.'
            : 'Everyday items formulated without endocrine disruptors or known carcinogens.'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400 font-bold">Loading products...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-full aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-5xl">
                  {item.image}
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{item.name}</h4>
                <p className="text-[10px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{curr}{item.price.toFixed(2)}</span>
                <button 
                  onClick={() => addToBasket(item)}
                  className={`text-[10px] font-bold text-white ${colorBg} ${colorHover} px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95`}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-8">
              <p className="text-xs text-slate-400 font-bold">No products available in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
