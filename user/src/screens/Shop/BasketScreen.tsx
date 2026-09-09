import React, { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, ShieldCheck, Tag, Landmark, User, Mail, Phone, MapPin } from 'lucide-react';
import type { ShopItem } from './ShopScreen';
import { ProductImage } from './ShopScreen';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService } from '../../services/habitsService';
import { PincodeDeliveryChecker } from '../../components/PincodeDeliveryChecker';

interface BasketScreenProps {
  onBack: () => void;
  basket: { item: ShopItem; variantName?: string; qty: number }[];
  setBasket: React.Dispatch<React.SetStateAction<{ item: ShopItem; variantName?: string; qty: number }[]>>;
}

export const BasketScreen: React.FC<BasketScreenProps> = ({ onBack, basket, setBasket }) => {
  const { user, apiUrl, token, branding } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address and customer states
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientEmail, setPatientEmail] = useState(user?.email || '');
  const [patientPhone, setPatientPhone] = useState(user?.mobileNumber || '');
  
  const [line1, setLine1] = useState(user?.addressLine1 || '');
  const [city, setCity] = useState(user?.addressCity || '');
  const [state, setState] = useState(user?.addressState || '');
  const [postalCode, setPostalCode] = useState(user?.addressPinCode || '');
  const [country, setCountry] = useState('India');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [isPincodeServiceable, setIsPincodeServiceable] = useState<boolean>(true);

  const handleShippingFeeCalculated = (fee: number, serviceable: boolean) => {
    setShippingFee(fee);
    setIsPincodeServiceable(serviceable);
    const discounted = Math.max(0, subtotal - discountAmount);
    setFinalTotal(discounted + gstAmount + fee);
  };

  const curr = user?.currency === 'INR' ? '₹' : '$';
  
  // Subtotal calculated with variants prices
  const subtotal = basket.reduce((sum, p) => {
    let price = p.item.price;
    if (p.variantName && p.item.variants) {
      const v = p.item.variants.find(x => x.name === p.variantName);
      if (v) price = v.price;
    }
    return sum + (price * p.qty);
  }, 0);

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
    if (branding?.enableExternalPayments === false) {
      onBack();
    }
  }, [branding?.enableExternalPayments, onBack]);

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
  }, [basket, appliedCoupon, curr]);

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
         showToast(data.message || 'Invalid coupon', 'error');
         setCouponCode('');
         setAppliedCoupon(null);
         calculateBreakdown('');
      } else {
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

  const updateQty = (id: string, variantName: string | undefined, delta: number) => {
    setBasket(prev => prev.map(p => {
      if (p.item.id === id && p.variantName === variantName) {
        const newQty = p.qty + delta;
        
        // Stock checking limit
        let limitStock = p.item.stock;
        if (variantName && p.item.variants) {
          const v = p.item.variants.find(x => x.name === variantName);
          if (v) limitStock = v.stock;
        }

        if (delta > 0 && newQty > limitStock) {
          showToast(`Cannot add more. Limit of ${limitStock} items in stock.`, 'info');
          return p;
        }

        return { ...p, qty: Math.max(0, newQty) };
      }
      return p;
    }).filter(p => p.qty > 0));
  };

  const handleCheckout = async () => {
    if (!user?.id || basket.length === 0) return;
    
    // Address validation
    if (!patientName || !patientEmail || !patientPhone || !line1 || !city || !state || !postalCode) {
      setError('Please fill in all contact and shipping details.');
      showToast('Shipping details are incomplete.', 'info');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = basket.map(b => {
        let price = b.item.price;
        if (b.variantName && b.item.variants) {
          const v = b.item.variants.find(x => x.name === b.variantName);
          if (v) price = v.price;
        }
        return {
          productId: b.item.id,
          name: b.item.name,
          variantName: b.variantName || null,
          price,
          qty: b.qty
        };
      });

      const shippingAddress = { line1, city, state, postalCode, country };
      const billingAddress = shippingAddress; // Identical billing/shipping address for simplicity

      // 1. Create order on backend
      const orderRes = await fetch(`${apiUrl}/shop/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          totalAmount: subtotal,
          couponCode: appliedCoupon,
          patientName,
          patientEmail,
          patientPhone,
          shippingAddress,
          billingAddress
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to initialize order.');

      if (orderData.gateway === 'manual_bypass') {
        await HabitsService.logHabit(apiUrl, token, 'ShopOrder', { basket, total: subtotal });
        localStorage.removeItem('mitoreboot_health_cart');
        setBasket([]);
        setOrdered(true);
        setLoading(false);
      } else if (orderData.gateway === 'razorpay') {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: branding?.appName || 'Mito_Reboot',
          description: `Medical Health Order`,
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

              await HabitsService.logHabit(apiUrl, token, 'ShopOrder', { basket, total: subtotal });
              localStorage.removeItem('mitoreboot_health_cart');
              setBasket([]);
              setOrdered(true);
            } catch (err: any) {
              setError(err.message || 'Error verifying Razorpay payment signature.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: patientName,
            email: patientEmail,
            contact: patientPhone
          },
          theme: {
            color: '#4F46E5' // Indigo
          },
          retry: {
            enabled: true,
            max_count: 4
          },
          modal: {
            backdropclose: false,
            escape: false,
            handleback: false,
            ondismiss: () => {
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          console.warn('[Shop] Razorpay payment failed event:', resp?.error);
          setError(resp?.error?.description || resp?.error?.reason || 'Payment could not be completed.');
          setLoading(false);
        });
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
      <div 
        className="pb-24 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col items-center justify-center"
        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-250 flex items-center justify-center mb-6">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-sans font-bold text-slate-800 mb-2">{t('orderConfirmed')}</h2>
        <p className="text-sm text-slate-500 text-center mb-8 px-6">
          {t('orderSubmittedDesc')}
        </p>
        <button 
          onClick={onBack}
          className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold shadow-sm transition-all"
        >
          {t('returnToHealthStore')}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sticky Header with Safe Notch Clearance */}
      <div 
        className="sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-3 shadow-xs"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 24px) + 12px)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3.5">
          <button 
            onClick={onBack}
            className="h-10 w-10 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-[0.2em] uppercase block truncate">{t('checkoutFulfillment')}</span>
            <h2 className="text-lg sm:text-2xl font-sans font-black text-slate-850 dark:text-slate-100 leading-tight mt-0.5 truncate">
              {t('fulfillmentCart')} {basket.length > 0 ? t('itemsCount', { count: basket.reduce((acc, p) => acc + p.qty, 0) }) : ''}
            </h2>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-5xl mx-auto pt-4">

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-150">
          ⚠️ {error}
        </div>
      )}

      {basket.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <span className="text-4xl mb-4 block opacity-50">🛒</span>
          <p className="text-sm text-slate-400 font-bold">{t('shop.emptyCart')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Basket items & Address Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cart Items list */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-850">{t('selectedMedicalSupplies')}</h3>
              <div className="divide-y divide-slate-100">
                {basket.map((p, idx) => {
                  let price = p.item.price;
                  if (p.variantName && p.item.variants) {
                    const v = p.item.variants.find(x => x.name === p.variantName);
                    if (v) price = v.price;
                  }

                  return (
                    <div key={idx} className="py-4 flex gap-4 items-center">
                      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0 shadow-inner">
                        <ProductImage src={p.item.image} apiUrl={apiUrl} className="h-full w-full object-contain" textClassName="text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-xs leading-tight mb-1">{p.item.name}</h4>
                        {p.variantName && (
                          <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide inline-block mb-1">
                            {t('sizePrefix', { size: p.variantName })}
                          </span>
                        )}
                        <p className="font-black text-indigo-650 text-xs">{curr}{(price * p.qty).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => updateQty(p.item.id, p.variantName, -1)} className="p-1 text-slate-400 hover:text-slate-700 bg-white rounded shadow-sm">
                          {p.qty === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{p.qty}</span>
                        <button onClick={() => updateQty(p.item.id, p.variantName, 1)} className="p-1 text-slate-400 hover:text-slate-700 bg-white rounded shadow-sm">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Billing / Shipping Details Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-850 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-indigo-500" /> {t('patientContactShipping')}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('recipientName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={t('fullNamePlaceholder')} 
                      value={patientName} 
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('phoneLabel')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder={t('mobileNumberPlaceholder')} 
                      value={patientPhone} 
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder={t('emailAddressPlaceholder')} 
                      value={patientEmail} 
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('deliveryStreetLabel')}</label>
                  <input 
                    type="text" 
                    placeholder={t('streetAddressPlaceholder')} 
                    value={line1} 
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('cityLabel')}</label>
                  <input 
                    type="text" 
                    placeholder={t('cityPlaceholder')} 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('stateLabel')}</label>
                  <input 
                    type="text" 
                    placeholder={t('statePlaceholder')} 
                    value={state} 
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('postalCodeLabel')}</label>
                  <input 
                    type="text" 
                    placeholder={t('postalCodePlaceholder')} 
                    value={postalCode} 
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{t('countryLabel')}</label>
                  <input 
                    type="text" 
                    placeholder={t('countryPlaceholder')} 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Pricing breakdown & coupons */}
          <div className="space-y-6">
            
            {/* Promo coupon field */}
            {branding?.enableSaferFoodCoupons !== false && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t('couponCodePlaceholder')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-400 uppercase disabled:opacity-50"
                    />
                  </div>
                  {!appliedCoupon ? (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode}
                      className="px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      {t('apply')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCouponCode('');
                        setAppliedCoupon(null);
                        calculateBreakdown('');
                      }}
                      className="px-3 border border-red-200 bg-red-50 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"
                    >
                      {t('remove')}
                    </button>
                  )}
                </div>

                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{t('applicableCoupons')}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map(c => (
                        <button 
                          key={c.code}
                          onClick={() => setCouponCode(c.code)}
                          className="text-[10px] px-2 py-1 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-all"
                        >
                          {c.code} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `${curr}${c.discountValue}`})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing totals card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-850">{t('billingBreakdown')}</h3>
              
              {/* Delivery Pincode & Distance Checker */}
              <PincodeDeliveryChecker
                apiUrl={apiUrl}
                token={token || ''}
                onShippingFeeCalculated={handleShippingFeeCalculated}
              />

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>{t('cartSubtotal')}</span>
                  <span className="font-bold text-slate-700">{curr}{subtotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <span>{t('discountCode')}</span>
                    <span>-{curr}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {gstAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>{t('gstTax')}</span>
                    <span className="font-bold text-slate-700">+{curr}{gstAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 pb-3 border-b border-slate-100">
                  <span>{t('shippingFee')}</span>
                  {shippingFee > 0 ? (
                    <span className="font-bold text-slate-700">+{curr}{shippingFee.toFixed(2)}</span>
                  ) : (
                    <span className="font-bold text-emerald-500">{t('freeShipping')}</span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider">{t('payableTotal')}</span>
                  <span className="text-xl font-black text-slate-850">{curr}{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {!isPincodeServiceable && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                  {t('deliveryUnavailablePincode')}
                </div>
              )}

              <button 
                onClick={handleCheckout}
                disabled={loading || !isPincodeServiceable}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Landmark className="h-4 w-4" /> {loading ? t('processingCheckout') : t('confirmShipmentPay')}
              </button>
            </div>

          </div>

        </div>
      )}
      </div>
    </div>
  );
};
