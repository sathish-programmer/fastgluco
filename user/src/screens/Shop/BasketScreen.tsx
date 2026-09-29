import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Minus, Plus, Trash2, ShieldCheck, Tag, Landmark, User, Mail, 
  Phone, MapPin, Truck, CheckCircle, AlertCircle, RefreshCw, Lock, Sparkles, ShoppingBag, ChevronRight, Package, Stethoscope
} from 'lucide-react';
import type { ShopItem } from './ShopScreen';
import { ProductImage } from './ShopScreen';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HabitsService } from '../../services/habitsService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BasketScreenProps {
  onBack: () => void;
  basket: { item: ShopItem; variantName?: string; qty: number }[];
  setBasket: React.Dispatch<React.SetStateAction<{ item: ShopItem; variantName?: string; qty: number }[]>>;
}

export const BasketScreen: React.FC<BasketScreenProps> = ({ onBack, basket, setBasket }) => {
  const { user, apiUrl, token, branding } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Customer Contact & Shipping Details
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientEmail, setPatientEmail] = useState(user?.email || '');
  const [patientPhone, setPatientPhone] = useState(user?.mobileNumber || '');
  
  const [line1, setLine1] = useState(user?.addressLine1 || '');
  const [city, setCity] = useState(user?.addressCity || '');
  const [state, setState] = useState(user?.addressState || '');
  const [postalCode, setPostalCode] = useState(user?.addressPinCode || localStorage.getItem('user_delivery_pincode') || '');
  const country = 'India';

  // Real-time postal resolution & delivery check states
  const [resolvingPincode, setResolvingPincode] = useState<boolean>(false);
  const [pincodeLocality, setPincodeLocality] = useState<string>('');
  const [pincodeStatusMessage, setPincodeStatusMessage] = useState<string>('');
  const [isPincodeServiceable, setIsPincodeServiceable] = useState<boolean>(true);
  const [deliveryEstimate, setDeliveryEstimate] = useState<string>('');
  const [deliveryCourier, setDeliveryCourier] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  // Pricing & Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Dynamic Vendor Configuration states (GST, Shipping, Logistics)
  const [vendorFreeThreshold, setVendorFreeThreshold] = useState<number>(499);
  const [vendorShippingBelowThreshold, setVendorShippingBelowThreshold] = useState<number>(70);
  const [vendorShippingNote, setVendorShippingNote] = useState<string>('');
  const [vendorDisplayName, setVendorDisplayName] = useState<string>('');
  const [vendorGstPercentage, setVendorGstPercentage] = useState<number>(0);
  const [vendorGstInclusive, setVendorGstInclusive] = useState<boolean>(true);
  const [includedGstAmount, setIncludedGstAmount] = useState<number>(0);
  
  // Real-time Cart Stock Validation State
  const [stockValidation, setStockValidation] = useState<{
    valid: boolean;
    hasOutOfStock: boolean;
    hasInsufficient: boolean;
    items: Array<{
      productId: string;
      name: string;
      variantName: string | null;
      requestedQty: number;
      availableStock: number;
      isOutOfStock: boolean;
      isInsufficient: boolean;
      message: string | null;
    }>;
  } | null>(null);

  const validateCartStock = async () => {
    if (!basket.length) {
      setStockValidation(null);
      return;
    }
    try {
      const itemsPayload = basket.map(b => ({
        productId: b.item.id,
        name: b.item.name,
        variantName: b.variantName || null,
        qty: b.qty
      }));
      const res = await fetch(`${apiUrl}/shop/validate-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsPayload })
      });
      if (res.ok) {
        const data = await res.json();
        setStockValidation(data);
        if (data.hasOutOfStock) {
          const outNames = data.items.filter((i: any) => i.isOutOfStock).map((i: any) => i.name).join(', ');
          setError(`Insufficient stock for: ${outNames}. Please remove unavailable items to continue.`);
        } else if (data.hasInsufficient) {
          setError('Some items in your basket exceed current available inventory. Please adjust quantities.');
        } else {
          setError(prev => prev && prev.toLowerCase().includes('stock') ? null : prev);
        }
      }
    } catch (err) {
      console.error('Error validating cart stock:', err);
    }
  };

  useEffect(() => {
    validateCartStock();
  }, [basket.length, apiUrl, token]);

  const handleRemoveOutOfStockItems = () => {
    if (!stockValidation?.items) return;
    const outKeys = new Set(
      stockValidation.items.filter(i => i.isOutOfStock).map(i => `${i.productId}_${i.variantName || ''}`)
    );
    setBasket(prev => prev.filter(p => !outKeys.has(`${p.item.id}_${p.variantName || ''}`)));
    showToast('Removed out-of-stock items from your basket.', 'info');
    setError(null);
  };

  const curr = user?.currency === 'INR' ? '₹' : '$';
  
  // Calculate subtotal with variant prices
  const subtotal = basket.reduce((sum, p) => {
    let price = p.item.price;
    if (p.variantName && p.item.variants) {
      const v = p.item.variants.find(x => x.name === p.variantName);
      if (v) price = v.price;
    }
    return sum + (price * p.qty);
  }, 0);

  // Dynamically resolve active vendor from cart items
  const firstVendorObj = basket.find(b => typeof b.item.vendorId === 'object' && b.item.vendorId !== null)?.item.vendorId;
  const firstVendorIdStr = basket.find(b => typeof b.item.vendorId === 'string' && b.item.vendorId.trim() !== '')?.item.vendorId;
  const activeVendorId = (typeof firstVendorObj === 'object' && firstVendorObj?._id) ? firstVendorObj._id : firstVendorIdStr;
  const activeVendorSlug = (typeof firstVendorObj === 'object' && firstVendorObj?.slug) ? firstVendorObj.slug : (basket.some(b => b.item.brand === 'Arivu Foods' || b.item.vendorSku) ? 'arivu-foods' : undefined);

  // Exact deterministic total: Subtotal - Discount + (Exclusive GST if any) + Shipping
  const exclusiveGst = (!vendorGstInclusive && gstAmount > 0) ? gstAmount : 0;
  const finalTotal = Number((Math.max(0, subtotal - discountAmount + exclusiveGst) + (shippingFee || 0)).toFixed(2));

  // Real-time postal code resolution & vendor serviceability verification
  useEffect(() => {
    const cleanPin = (postalCode || '').trim().replace(/\D/g, '');
    if (cleanPin.length === 6) {
      setResolvingPincode(true);
      fetch(`${apiUrl}/shop/check-pincode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pincode: cleanPin,
          vendorId: activeVendorId,
          vendorSlug: activeVendorSlug,
          cartAmount: subtotal
        })
      })
      .then(res => res.json())
      .then(data => {
        setResolvingPincode(false);
        if (data.serviceable) {
          setIsPincodeServiceable(true);
          setShippingFee(data.shippingFee || 0);
          if (data.freeShippingThreshold !== undefined) setVendorFreeThreshold(data.freeShippingThreshold);
          if (data.shippingChargeBelowThreshold !== undefined) setVendorShippingBelowThreshold(data.shippingChargeBelowThreshold);
          if (data.carrierPartnerName) setDeliveryCourier(data.carrierPartnerName);
          if (data.shippingNote !== undefined) setVendorShippingNote(data.shippingNote);
          if (data.vendorName) setVendorDisplayName(data.vendorName);
          setPincodeLocality(data.localityName || data.city || '');
          setPincodeStatusMessage(data.message || `Delivery available to ${data.localityName || data.city}`);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
          if (data.estimatedDeliveryTime) setDeliveryEstimate(data.estimatedDeliveryTime);
          if (data.courierPartner) setDeliveryCourier(data.courierPartner);
          if (data.estimatedDeliveryDate) setDeliveryDate(data.estimatedDeliveryDate);
          localStorage.setItem('user_delivery_pincode', cleanPin);
        } else {
          setIsPincodeServiceable(false);
          setPincodeLocality('');
          setPincodeStatusMessage(data.message || `Delivery is unavailable for pincode ${cleanPin}.`);
        }
      })
      .catch(err => {
        setResolvingPincode(false);
        console.error('Pincode check error:', err);
      });
    } else {
      setPincodeLocality('');
      setPincodeStatusMessage('');
      if (cleanPin.length > 0 && cleanPin.length < 6) {
        setIsPincodeServiceable(false);
      } else {
        setIsPincodeServiceable(true);
      }
    }
  }, [postalCode, apiUrl, token, subtotal, activeVendorId, activeVendorSlug]);

  // Fetch available coupons filtered specifically by active vendor
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeVendorId) params.append('vendorId', activeVendorId);
    if (activeVendorSlug) params.append('vendorSlug', activeVendorSlug);
    const qs = params.toString() ? `?${params.toString()}` : '';

    fetch(`${apiUrl}/shop/coupons${qs}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        setAvailableCoupons(data);
      } else {
        setAvailableCoupons([]);
      }
    })
    .catch(err => {
      console.error(err);
      setAvailableCoupons([]);
    });
  }, [apiUrl, token, activeVendorId, activeVendorSlug]);

  useEffect(() => {
    if (branding?.enableExternalPayments === false) {
      onBack();
    }
  }, [branding?.enableExternalPayments, onBack]);

  // Recalculate price breakdown
  useEffect(() => {
    if (basket.length > 0) {
      calculateBreakdown(appliedCoupon || '');
    } else {
      setDiscountAmount(0);
      setGstAmount(0);
      setIncludedGstAmount(0);
      setShippingFee(0);
    }
  }, [basket, appliedCoupon, activeVendorId, activeVendorSlug]);

  const calculateBreakdown = async (code: string = '') => {
    try {
      const cleanPin = (postalCode || '').trim().replace(/\D/g, '');
      const res = await fetch(`${apiUrl}/shop/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          couponCode: code || 'NO_COUPON', 
          totalAmount: subtotal,
          pincode: cleanPin,
          vendorId: activeVendorId,
          vendorSlug: activeVendorSlug,
          cartItems: basket.map(b => ({
            productId: b.item.id,
            qty: b.qty,
            price: b.variantName ? (b.item.variants?.find(v => v.name === b.variantName)?.price ?? b.item.price) : b.item.price
          }))
        })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscountAmount(data.discountAmount || 0);
        setGstAmount(data.gstAmount || 0);
        if (data.includedGstAmount !== undefined) setIncludedGstAmount(data.includedGstAmount);
        if (data.gstPercentage !== undefined) setVendorGstPercentage(data.gstPercentage);
        if (data.gstInclusive !== undefined) setVendorGstInclusive(data.gstInclusive);
        if (data.freeShippingThreshold !== undefined) setVendorFreeThreshold(data.freeShippingThreshold);
        if (data.shippingChargeBelowThreshold !== undefined) setVendorShippingBelowThreshold(data.shippingChargeBelowThreshold);
        if (data.carrierPartnerName) setDeliveryCourier(data.carrierPartnerName);
        if (data.shippingNote !== undefined) setVendorShippingNote(data.shippingNote);
        if (data.vendorName) setVendorDisplayName(data.vendorName);
        if (data.shippingFee !== undefined) setShippingFee(data.shippingFee);
        if (code) {
          setAppliedCoupon(code);
        }
      } else if (code) {
        showToast(data.message || 'Invalid coupon', 'error');
        setCouponCode('');
        setAppliedCoupon(null);
        setDiscountAmount(0);
        calculateBreakdown('');
      } else {
        if (data.discountAmount !== undefined) {
          setDiscountAmount(data.discountAmount || 0);
        }
        if (data.gstAmount !== undefined) {
          setGstAmount(data.gstAmount || 0);
        }
        if (data.includedGstAmount !== undefined) setIncludedGstAmount(data.includedGstAmount);
        if (data.gstPercentage !== undefined) setVendorGstPercentage(data.gstPercentage);
        if (data.gstInclusive !== undefined) setVendorGstInclusive(data.gstInclusive);
        if (data.freeShippingThreshold !== undefined) setVendorFreeThreshold(data.freeShippingThreshold);
        if (data.shippingChargeBelowThreshold !== undefined) setVendorShippingBelowThreshold(data.shippingChargeBelowThreshold);
        if (data.carrierPartnerName) setDeliveryCourier(data.carrierPartnerName);
        if (data.shippingNote !== undefined) setVendorShippingNote(data.shippingNote);
        if (data.vendorName) setVendorDisplayName(data.vendorName);
        if (data.shippingFee !== undefined) setShippingFee(data.shippingFee);
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
        const stockItem = stockValidation?.items?.find(
          si => si.productId === id && (si.variantName || null) === (variantName || null)
        );
        let limitStock = stockItem ? stockItem.availableStock : p.item.stock;
        if (!stockItem && variantName && p.item.variants) {
          const v = p.item.variants.find(x => x.name === variantName);
          if (v) limitStock = v.stock;
        }

        if (delta > 0 && limitStock <= 0) {
          showToast(`${p.item.name} is currently out of stock.`, 'error');
          return p;
        }

        if (delta > 0 && newQty > limitStock) {
          showToast(`Only ${limitStock} units available for ${p.item.name}.`, 'info');
          return p;
        }

        return { ...p, qty: Math.max(0, newQty) };
      }
      return p;
    }).filter(p => p.qty > 0));
  };

  const handleCheckout = async () => {
    if (!user?.id || basket.length === 0) return;
    
    // Live stock verification check before initiating order
    if (stockValidation?.hasOutOfStock) {
      const outNames = stockValidation.items.filter(i => i.isOutOfStock).map(i => i.name).join(', ');
      setError(`Cannot checkout: ${outNames} is currently out of stock. Please remove unavailable items to continue.`);
      showToast('Please remove out-of-stock items before checkout.', 'error');
      return;
    }

    if (stockValidation?.hasInsufficient) {
      setError('Some items in your basket exceed current stock. Please adjust quantities.');
      showToast('Please adjust item quantities to available stock.', 'error');
      return;
    }

    // Address validation
    const cleanPin = postalCode.trim().replace(/\D/g, '');
    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim() || !line1.trim() || !city.trim() || !state.trim() || cleanPin.length !== 6) {
      setError('Please provide complete recipient and delivery address details.');
      showToast('Please complete all delivery address fields.', 'info');
      return;
    }

    if (!isPincodeServiceable) {
      setError(`Delivery is currently unavailable for pincode ${cleanPin}. Please use an alternative address.`);
      showToast('Entered delivery address is not serviceable.', 'error');
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

      const shippingAddress = { 
        line1: line1.trim(), 
        city: city.trim(), 
        state: state.trim(), 
        postalCode: cleanPin, 
        country: country.trim() || 'India' 
      };
      const billingAddress = shippingAddress;

      // Create order on backend
      const orderRes = await fetch(`${apiUrl}/shop/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          totalAmount: finalTotal,
          couponCode: appliedCoupon,
          patientName: patientName.trim(),
          patientEmail: patientEmail.trim(),
          patientPhone: patientPhone.trim(),
          shippingAddress,
          billingAddress,
          vendorId: activeVendorId,
          vendorSlug: activeVendorSlug,
          pincode: cleanPin
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Failed to initialize order.');

      if (orderData.gateway === 'manual_bypass') {
        await HabitsService.logHabit(apiUrl, token, 'ShopOrder', { basket, total: finalTotal });
        localStorage.removeItem('mitoreboot_health_cart');
        setBasket([]);
        setPlacedOrderId(orderData.vendorOrderId || orderData.displayOrderId || orderData.orderId);
        setOrdered(true);
        showToast(`Order confirmed! ${vendorDisplayName || 'Our fulfillment team'} is preparing your shipment.`, 'success');
      } else if (orderData.gateway === 'razorpay') {
        const displayRef = orderData.vendorOrderId || orderData.displayOrderId || orderData.orderId.toString().slice(-6).toUpperCase();
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: branding?.appName || 'Mito_Reboot Health Store',
          description: `Order #${displayRef}`,
          order_id: orderData.rzpOrderId,
          prefill: {
            name: patientName,
            email: patientEmail,
            contact: patientPhone
          },
          theme: {
            color: '#4f46e5'
          },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${apiUrl}/shop/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                await HabitsService.logHabit(apiUrl, token, 'ShopOrder', { basket, total: finalTotal });
                localStorage.removeItem('mitoreboot_health_cart');
                setBasket([]);
                setPlacedOrderId(verifyData.vendorOrderId || verifyData.displayOrderId || orderData.vendorOrderId || orderData.orderId);
                setOrdered(true);
                showToast('Payment successful! Order forwarded to Arivu Foods.', 'success');
              } else {
                throw new Error(verifyData.message || 'Payment verification failed.');
              }
            } catch (err: any) {
              setError(err.message || 'Payment verification failed.');
              showToast(err.message || 'Payment verification error.', 'error');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setError(`Payment failed: ${response.error.description}`);
          showToast(`Payment failed: ${response.error.description}`, 'error');
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order.');
      showToast(err.message || 'Error creating order.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-screen-container pb-28 bg-slate-50/50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sleek Top Navigation Bar */}
      <div 
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-xs"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack} 
              className="h-10 w-10 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase block">Checkout & Shipping</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">My Health Basket</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center gap-1.5 shadow-2xs">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{basket.reduce((sum, b) => sum + b.qty, 0)} Items</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto pt-3 sm:pt-4">

      {ordered ? (
        /* Order Placed Success View */
        <div className="max-w-xl mx-auto text-center py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <CheckCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
              Direct Brand Dispatch
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Order Confirmed!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your order has been received by <strong className="text-slate-700 dark:text-slate-200">Arivu Foods</strong> for precision packing and priority courier dispatch.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 text-left space-y-2 text-xs">
            {placedOrderId && (
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-400 uppercase text-[10px]">Order Reference ID</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">#{placedOrderId.startsWith('MR-') ? placedOrderId : placedOrderId.slice(-8).toUpperCase()}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-400 uppercase text-[10px]">Destination</span>
              <span className="text-slate-800 dark:text-slate-200">{city}, {state} ({postalCode})</span>
            </div>
            <div className="flex justify-between items-center font-bold">
              <span className="text-slate-400 uppercase text-[10px]">Recipient</span>
              <span className="text-slate-800 dark:text-slate-200">{patientName} ({patientPhone})</span>
            </div>
            <div className="flex justify-between items-center font-bold pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 uppercase text-[10px]">Estimated Delivery</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">{deliveryDate || deliveryEstimate || '3 - 5 Business Days'}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'orders');
                window.history.replaceState({}, '', url.toString());
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Order Status</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ) : basket.length === 0 ? (
        /* Empty Basket View */
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Your basket is empty</h3>
            <p className="text-xs text-slate-400">Discover fresh, clinical-grade nutrition from Arivu Foods.</p>
          </div>
          <button 
            onClick={onBack}
            className="mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            Explore Health Store
          </button>
        </div>
      ) : (
        /* Main Two-Column Checkout View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Basket Items & Shipping Details */}
          <div className="lg:col-span-7 space-y-6">

            {/* Out of Stock Alert Banner */}
            {stockValidation?.hasOutOfStock && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-900 dark:text-rose-100 uppercase tracking-wide">
                      Out of Stock Warning
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 font-medium">
                      {stockValidation.items.filter(i => i.isOutOfStock).map(i => i.name).join(', ')} is currently unavailable. Please remove it from your basket to proceed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveOutOfStockItems}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Sold Out Items</span>
                </button>
              </div>
            )}

            {/* Error Banner */}
            {error && !stockValidation?.hasOutOfStock && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Basket Items List Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Selected Health Supplies</span>
                </h3>
                <span className="text-xs font-bold text-slate-400">{basket.length} {basket.length === 1 ? 'Product' : 'Products'}</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {basket.map((p, idx) => {
                  let price = p.item.price;
                  if (p.variantName && p.item.variants) {
                    const v = p.item.variants.find(x => x.name === p.variantName);
                    if (v) price = v.price;
                  }

                  const stockItem = stockValidation?.items?.find(
                    si => si.productId === p.item.id && (si.variantName || null) === (p.variantName || null)
                  );
                  const isItemOutOfStock = stockItem ? stockItem.isOutOfStock : (p.item.stock <= 0);
                  const isItemInsufficient = stockItem ? stockItem.isInsufficient : false;
                  const availableLimit = stockItem ? stockItem.availableStock : (p.item.stock ?? 999);

                  return (
                    <div 
                      key={idx} 
                      className={`py-4 flex gap-4 items-center group transition-colors rounded-2xl px-2 ${
                        isItemOutOfStock 
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 my-1.5' 
                          : isItemInsufficient
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 my-1'
                            : ''
                      }`}
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 p-1 relative">
                        <ProductImage 
                          src={p.item.image} 
                          apiUrl={apiUrl} 
                          title={p.item.name} 
                          category={p.item.category} 
                          className={`h-full w-full object-contain ${isItemOutOfStock ? 'opacity-40 grayscale' : ''}`} 
                          textClassName="text-2xl" 
                        />
                        {isItemOutOfStock && (
                          <div className="absolute inset-0 bg-rose-950/40 flex items-center justify-center p-0.5">
                            <span className="text-[8px] font-black uppercase text-white bg-rose-600 px-1 py-0.5 rounded shadow-xs text-center leading-none">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{p.item.brand || 'Arivu Foods'}</span>
                          {isItemOutOfStock ? (
                            <span className="bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="h-2.5 w-2.5" /> Out of Stock (0 left)
                            </span>
                          ) : isItemInsufficient ? (
                            <span className="bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                              <AlertCircle className="h-2.5 w-2.5" /> Only {availableLimit} left
                            </span>
                          ) : null}
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug truncate">{p.item.name}</h4>
                        {p.variantName && (
                          <span className="inline-block mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Pack: {p.variantName}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">{curr}{(price * p.qty).toFixed(2)}</p>
                          {isItemOutOfStock && (
                            <button
                              type="button"
                              onClick={() => {
                                setBasket(prev => prev.filter(x => !(x.item.id === p.item.id && x.variantName === p.variantName)));
                                showToast(`Removed ${p.item.name} from basket`, 'info');
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 underline cursor-pointer"
                            >
                              Remove Item
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                        <button 
                          onClick={() => updateQty(p.item.id, p.variantName, -1)} 
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-lg shadow-2xs flex items-center justify-center transition-all cursor-pointer"
                        >
                          {p.qty === 1 ? <Trash2 className="h-3 w-3 text-rose-500" /> : <Minus className="h-3 w-3" />}
                        </button>
                        <span className={`text-xs font-black w-5 text-center ${isItemOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {p.qty}
                        </span>
                        <button 
                          onClick={() => updateQty(p.item.id, p.variantName, 1)} 
                          disabled={isItemOutOfStock || p.qty >= availableLimit}
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-lg shadow-2xs flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recipient & Delivery Address Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Delivery Address & Recipient Info</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used for Courier Dispatch</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Recipient Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Recipient Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Sathish Kumar" 
                      value={patientName} 
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Contact Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210" 
                      value={patientPhone} 
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Email Address (For Order Updates & Tracking)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="name@example.com" 
                      value={patientEmail} 
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Delivery Street Address (Flat / House No., Apartment, Street)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Flat 402, Green Avenue, 7th Cross" 
                    value={line1} 
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                {/* Postal Code with Real-Time Validation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Postal Code (PIN Code)</label>
                    {resolvingPincode && (
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Verifying...
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="e.g. 600020 or 560075" 
                      value={postalCode} 
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2.5 pl-10 pr-3 text-xs font-bold focus:outline-none transition-all ${
                        postalCode.length === 6
                          ? isPincodeServiceable
                            ? 'border-emerald-500 text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500/20'
                            : 'border-rose-500 text-rose-900 dark:text-rose-300 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                </div>

                {/* City (Auto-populated from Postal Code) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">City / District</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chennai" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                {/* State (Auto-populated from Postal Code) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">State</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tamil Nadu" 
                    value={state} 
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Country</label>
                  <input 
                    type="text" 
                    value={country} 
                    disabled
                    className="w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              {/* Real-time Dynamic Postal Resolution Indicator */}
              {postalCode.length === 6 && (
                <div className={`p-3 rounded-2xl border text-xs transition-all ${
                  isPincodeServiceable
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {isPincodeServiceable ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>
                      {isPincodeServiceable
                        ? (pincodeLocality ? `${pincodeLocality}, ${state}` : `${city}, ${state}`)
                        : 'Invalid or Unserviceable Pincode'}
                    </span>
                    {isPincodeServiceable && (
                      <span className="ml-auto text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-black uppercase">
                        Free Shipping
                      </span>
                    )}
                  </div>
                  {pincodeStatusMessage && (
                    <p className="text-[11px] opacity-80 mt-1 pl-6">
                      {pincodeStatusMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order Summary & Payment */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Promo Coupon Card - Only shown when active vendor has available coupons or a coupon is applied */}
            {branding?.enableSaferFoodCoupons !== false && (availableCoupons.length > 0 || !!appliedCoupon) && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-600" /> Apply Promo Coupon
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50"
                  />
                  {!appliedCoupon ? (
                    <button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCouponCode('');
                        setAppliedCoupon(null);
                        calculateBreakdown('');
                      }}
                      className="px-3 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Available Codes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map(c => (
                        <button 
                          key={c.code}
                          onClick={() => setCouponCode(c.code)}
                          className="text-[10px] px-2.5 py-1 border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-extrabold hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                          {c.code} ({c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Order & Billing Breakdown</span>
                </h3>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Direct Dispatch
                </span>
              </div>

              {/* Delivery Assurance Tile */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-3 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <span>{city && state ? `${city}, ${state}` : 'Pan-India Delivery'}</span>
                  </span>
                  <span className="font-black uppercase text-[10px] text-emerald-600 dark:text-emerald-400">
                    {shippingFee === 0 ? 'FREE Shipping' : `₹${shippingFee.toFixed(0)} (FREE above ₹${vendorFreeThreshold})`}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed font-medium">
                  {subtotal < vendorFreeThreshold && (
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                      💡 Add {curr}{(vendorFreeThreshold - subtotal).toFixed(0)} more to get FREE delivery!
                    </span>
                  )}
                  {deliveryEstimate ? `Estimated Timeline: ${deliveryEstimate}${deliveryCourier ? ` via ${deliveryCourier}` : ''}. ` : ''}
                  {vendorShippingNote ? vendorShippingNote : `Dispatched directly from fresh certified stock${vendorDisplayName ? ` by ${vendorDisplayName}` : ''}. Tracking ID is issued upon dispatch.`}
                </p>
              </div>

              {/* Itemized Numbers */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{curr}{subtotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Coupon Savings {appliedCoupon ? `(${appliedCoupon})` : ''}</span>
                    <span>-{curr}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Dynamic Vendor GST */}
                {vendorGstPercentage > 0 && (
                  vendorGstInclusive ? (
                    includedGstAmount > 0 && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                        <span>GST ({vendorGstPercentage}% Included in MRP)</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Included ({curr}{includedGstAmount.toFixed(2)})</span>
                      </div>
                    )
                  ) : (
                    gstAmount > 0 && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                        <span>GST ({vendorGstPercentage}% Exclusive)</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">+{curr}{gstAmount.toFixed(2)}</span>
                      </div>
                    )
                  )
                )}

                <div className="flex justify-between items-baseline text-slate-500 dark:text-slate-400 font-medium pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span>Standard Shipping</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {subtotal >= vendorFreeThreshold ? `Free on orders above ₹${vendorFreeThreshold} (Pan-India)` : `Free above ₹${vendorFreeThreshold} (₹${vendorShippingBelowThreshold} below ₹${vendorFreeThreshold})`}
                    </span>
                  </div>
                  {shippingFee > 0 ? (
                    <span className="font-bold text-slate-800 dark:text-slate-200">+{curr}{shippingFee.toFixed(2)}</span>
                  ) : (
                    <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px]">FREE</span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm pt-1">
                  <div>
                    <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider block">Total Payable</span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Inclusive of all taxes & delivery ({curr}{subtotal.toFixed(2)} {discountAmount > 0 ? `- ${curr}${discountAmount.toFixed(2)} ` : ''}{(!vendorGstInclusive && gstAmount > 0) ? `+ ${curr}${gstAmount.toFixed(2)} GST ` : ''}+ {shippingFee === 0 ? 'FREE shipping' : `${curr}${shippingFee.toFixed(2)} shipping`})
                    </span>
                  </div>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {curr}{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button 
                onClick={handleCheckout}
                disabled={loading || !isPincodeServiceable || postalCode.length !== 6 || stockValidation?.hasOutOfStock}
                className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 text-xs tracking-wide uppercase ${
                  stockValidation?.hasOutOfStock
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-indigo-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Order Securely...</span>
                  </>
                ) : stockValidation?.hasOutOfStock ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span>Resolve Out of Stock Items to Checkout</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Confirm Order & Pay {curr}{finalTotal.toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Stethoscope className="h-3.5 w-3.5" /> Doctor Formulated & Certified
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 100% Genuine Supplies
                </span>
                <span>•</span>
                <span>Encrypted 256-Bit SSL</span>
              </div>
            </div>

          </div>

        </div>
      )}
      </div>
    </div>
  );
};
