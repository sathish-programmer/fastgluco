import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle, XCircle, Clock, Truck, RefreshCw } from 'lucide-react';

interface PincodeCheckResult {
  serviceable: boolean;
  localityName?: string;
  city?: string;
  state?: string;
  shippingFee: number;
  estimatedDeliveryTime: string;
  distanceKm?: number;
  isFallback?: boolean;
  message?: string;
}

interface PincodeDeliveryCheckerProps {
  apiUrl: string;
  token: string;
  onShippingFeeCalculated: (fee: number, isServiceable: boolean, pincode: string, deliveryTime: string) => void;
  className?: string;
}

export const PincodeDeliveryChecker: React.FC<PincodeDeliveryCheckerProps> = ({
  apiUrl,
  token,
  onShippingFeeCalculated,
  className = ''
}) => {
  const [pincode, setPincode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [result, setResult] = useState<PincodeCheckResult | null>(null);

  // Auto check default saved pincode if available
  useEffect(() => {
    const savedPincode = localStorage.getItem('user_delivery_pincode');
    if (savedPincode) {
      setPincode(savedPincode);
      checkPincode(savedPincode);
    }
  }, []);

  const checkPincode = async (codeToCheck: string, userLat?: number, userLon?: number) => {
    const cleanCode = codeToCheck.trim();
    if (!cleanCode) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/shop/check-pincode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pincode: cleanCode,
          userLat,
          userLon
        })
      });

      if (res.ok) {
        const data: PincodeCheckResult = await res.json();
        setResult(data);
        localStorage.setItem('user_delivery_pincode', cleanCode);
        onShippingFeeCalculated(data.shippingFee, data.serviceable, cleanCode, data.estimatedDeliveryTime);
      }
    } catch (err) {
      console.error('Error checking pincode:', err);
    } finally {
      setLoading(false);
      setDetectingGps(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length >= 6) {
      checkPincode(pincode.trim());
    }
  };

  const handleUseGpsLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your device.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        // Reverse geocode to find pincode if possible
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          if (res.ok) {
            const data = await res.json();
            const detectedCode = data.postcode || pincode || '560001';
            setPincode(detectedCode);
            await checkPincode(detectedCode, lat, lon);
          } else {
            await checkPincode(pincode || '560001', lat, lon);
          }
        } catch {
          await checkPincode(pincode || '560001', lat, lon);
        }
      },
      (err) => {
        console.warn('GPS location error:', err);
        setDetectingGps(false);
        alert('Unable to detect GPS location. Please type your 6-digit pincode.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className={`bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-3 font-sans text-slate-800 dark:text-slate-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Truck className="h-3.5 w-3.5 text-indigo-500" />
          <span>Delivery & Shipping Pincode</span>
        </div>
        <button
          type="button"
          onClick={handleUseGpsLocation}
          disabled={detectingGps || loading}
          className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`h-3 w-3 ${detectingGps ? 'animate-spin' : ''}`} />
          <span>{detectingGps ? 'Locating...' : 'Use GPS Location'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit Pincode (e.g. 560001)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || pincode.trim().length < 6}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
        >
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Check'}
        </button>
      </form>

      {/* Results Box */}
      {result && (
        <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
          !result.serviceable
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
            : result.isFallback
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              {result.serviceable ? (
                <CheckCircle className={`h-3.5 w-3.5 ${result.isFallback ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} shrink-0`} />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>
                {result.serviceable
                  ? (result.isFallback ? 'Standard National Delivery' : (result.localityName || 'Serviceable Zone'))
                  : 'Delivery Unavailable'}
              </span>
            </div>

            {result.serviceable && (
              <span className="font-black text-xs">
                {result.shippingFee === 0 ? 'FREE Shipping' : `₹${result.shippingFee.toFixed(2)}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[10px] opacity-90 border-t border-current/10 pt-1">
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="h-3 w-3 opacity-70" />
              <span>Est: {result.estimatedDeliveryTime}</span>
            </span>

            {result.isFallback ? (
              <span className="font-bold opacity-80">
                Standard Courier
              </span>
            ) : result.distanceKm !== undefined && result.distanceKm > 0 ? (
              <span className="font-bold opacity-80">
                {result.distanceKm} km from Warehouse
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
