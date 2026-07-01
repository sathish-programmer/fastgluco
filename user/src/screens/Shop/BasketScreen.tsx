import React, { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, ShieldCheck, Tag } from 'lucide-react';
import type { ShopItem } from './ShopScreen';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService } from '../../services/habitsService';

interface BasketScreenProps {
  onBack: () => void;
  basket: { item: ShopItem, qty: number }[];
  setBasket: React.Dispatch<React.SetStateAction<{ item: ShopItem, qty: number }[]>>;
}

export const BasketScreen: React.FC<BasketScreenProps> = ({ onBack, basket, setBasket }) => {
  const { user, apiUrl, token, branding } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  const curr = user?.currency === 'INR' ? '₹' : '$';
  const subtotal = basket.reduce((sum, p) => sum + (p.item.price * p.qty), 0);

  useEffect(() => {
    // Fetch available coupons
    fetch(`${apiUrl}/shop/coupons`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setAvailableCoupons(data);
    })
    .catch(console.error);
  }, [apiUrl, token]);

  useEffect(() => {
    // Re-evaluate breakdown if basket changes
    if (basket.length > 0) {
      calculateBreakdown(appliedCoupon || '');
    } else {
      setDiscountAmount(0);
      setGstAmount(0);
      setShippingFee(0);
      setFinalTotal(0);
    }
  }, [basket]);

  const calculateBreakdown = async (code: string = '') => {
    try {
      const res = await fetch(`${apiUrl}/shop/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ couponCode: code || 'NO_COUPON', totalAmount: subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountAmount(data.discountAmount);
        setGstAmount(data.gstAmount);
        setShippingFee(data.shippingFee || 0);
        setFinalTotal(data.finalAmount);
        if (code) {
          setAppliedCoupon(code);
        }
      } else if (code) {
         // It failed validation but we passed a code
         showToast(data.message || 'Invalid coupon', 'error');
         setCouponCode('');
         setAppliedCoupon(null);
         calculateBreakdown(''); // Re-calc without coupon
      } else {
         // Default if NO_COUPON (no coupon applied, just shop discount/gst)
         if (data.finalAmount !== undefined) {
           setDiscountAmount(data.discountAmount);
           setGstAmount(data.gstAmount);
           setShippingFee(data.shippingFee || 0);
           setFinalTotal(data.finalAmount);
         }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    await calculateBreakdown(couponCode);
    setValidatingCoupon(false);
  };

  const updateQty = (id: string, delta: number) => {
    setBasket(prev => prev.map(p => {
      if (p.item.id === id) {
        const newQty = p.qty + delta;
        return { ...p, qty: Math.max(0, newQty) };
      }
      return p;
    }).filter(p => p.qty > 0));
  };

  const handleCheckout = async () => {
    if (!user?.id || basket.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const items = basket.map(b => ({
        productId: b.item.id,
        name: b.item.name,
        price: b.item.price,
        qty: b.qty
      }));

      // 1. Create order on backend
      const orderRes = await fetch(`${apiUrl}/shop/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items, totalAmount: subtotal, couponCode: appliedCoupon })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to initialize order.');

      if (orderData.gateway === 'mock') {
        // Automatically succeed for mock
        await HabitsService.logHabit(apiUrl, token, 'ShopOrder', { basket, total: subtotal });
        setBasket([]);
        setOrdered(true);
        setLoading(false);
      } else if (orderData.gateway === 'razorpay') {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: branding?.appName || 'Mito_Reboot',
          description: `Order for Safer Products`,
          order_id: orderData.rzpOrderId,
          handler: async (response: any) => {
            setLoading(true);
            try {
              const verifyRes = await fetch(`${apiUrl}/shop/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed.');

              // Log habit upon success
              await HabitsService.logHabit(apiUrl, token, 'ShopOrder', { basket, total: subtotal });
              setBasket([]);
              setOrdered(true);
            } catch (err: any) {
              setError(err.message || 'Error verifying Razorpay payment signature.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || ''
          },
          theme: {
            color: '#10B981' // emerald-500
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error initiating checkout.');
      setLoading(false);
    }
  };

  if (ordered) {
    return (
      <div className="pb-24 pt-6 px-4 max-w-md mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-6">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-sans font-bold text-slate-800 mb-2">Order Confirmed</h2>
        <p className="text-sm text-slate-500 text-center mb-8 px-6">
          Your items are on the way. Taking steps towards cellular repair.
        </p>
        <button 
          onClick={onBack}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Store</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Your Basket</h2>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {basket.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <span className="text-4xl mb-4 block opacity-50">🛒</span>
          <p className="text-sm text-slate-400 font-bold">Your basket is empty</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 mb-6">
            {basket.map(p => (
              <div key={p.item.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-2xl border border-slate-100 shrink-0">
                  {p.item.image}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{p.item.name}</h4>
                  <span className="font-bold text-indigo-600 text-xs">{curr}{(p.item.price * p.qty).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button onClick={() => updateQty(p.item.id, -1)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-md shadow-sm">
                    {p.qty === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{p.qty}</span>
                  <button onClick={() => updateQty(p.item.id, 1)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-md shadow-sm">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm text-slate-800 font-bold focus:outline-none focus:border-indigo-400 uppercase disabled:opacity-50"
                />
              </div>
              {!appliedCoupon ? (
                <button
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode}
                  className="px-5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50 text-sm"
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCouponCode('');
                    setAppliedCoupon(null);
                    calculateBreakdown('');
                  }}
                  className="px-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-100 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-wide">
                ✓ Coupon applied successfully
              </p>
            )}
            
            {availableCoupons.length > 0 && !appliedCoupon && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Available Coupons</span>
                <div className="flex flex-wrap gap-2">
                  {availableCoupons.map(c => (
                    <button 
                      key={c.code}
                      onClick={() => setCouponCode(c.code)}
                      className="text-xs px-2.5 py-1 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-all"
                    >
                      {c.code} ({c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${curr}${c.discountValue} OFF`})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Subtotal</span>
              <span className="font-bold text-slate-800">{curr}{subtotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-indigo-500">Discount</span>
                <span className="font-bold text-indigo-500">-{curr}{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {gstAmount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Taxes (GST)</span>
                <span className="font-bold text-slate-600">+{curr}{gstAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <span className="text-sm text-slate-500">Shipping</span>
              {shippingFee > 0 ? (
                <span className="font-bold text-slate-600">+{curr}{shippingFee.toFixed(2)}</span>
              ) : (
                <span className="font-bold text-emerald-500">Free</span>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-slate-800">{curr}{finalTotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Checkout & Pay'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
