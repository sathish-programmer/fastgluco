import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle, XCircle, Clock, Truck, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getDeviceLocation, reverseGeocodeCoordsToPincode } from '../utils/geolocationHelper';

interface PincodeCheckResult {
  serviceable: boolean;
  localityName?: string;
  city?: string;
  state?: string;
  shippingFee: number;
  isFreeShipping?: boolean;
  freeShippingThreshold?: number;
  estimatedDeliveryDate?: string;
  estimatedDeliveryTime: string;
  courierPartner?: string;
  vendorName?: string;
  distanceKm?: number;
  isFallback?: boolean;
  message?: string;
}

interface PincodeDeliveryCheckerProps {
  apiUrl: string;
  token: string;
  onShippingFeeCalculated: (fee: number, isServiceable: boolean, pincode: string, deliveryTime: string, courier?: string, deliveryDate?: string) => void;
  className?: string;
  cartAmount?: number;
  vendorSlug?: string;
  address?: { line1?: string; city?: string; state?: string };
}

export const PincodeDeliveryChecker: React.FC<PincodeDeliveryCheckerProps> = ({
  apiUrl,
  token,
  onShippingFeeCalculated,
  className = '',
  cartAmount,
  vendorSlug,
  address
}) => {
  const { t } = useLanguage();
  const [pincode, setPincode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [result, setResult] = useState<PincodeCheckResult | null>(null);

  // Auto check default saved pincode if available
  useEffect(() => {
    const savedPincode = localStorage.getItem('user_delivery_pincode');
    if (savedPincode) {
      setPincode(savedPincode);
      checkPincode(savedPincode);
    }
  }, [cartAmount, vendorSlug, address?.line1, address?.city, address?.state]);

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
          userLon,
          cartAmount,
          vendorSlug: vendorSlug || 'arivu-foods',
          address
        })
      });

      if (res.ok) {
        const data: PincodeCheckResult = await res.json();
        setResult(data);
        localStorage.setItem('user_delivery_pincode', cleanCode);
        onShippingFeeCalculated(
          data.shippingFee, 
          data.serviceable, 
          cleanCode, 
          data.estimatedDeliveryTime,
          data.courierPartner,
          data.estimatedDeliveryDate
        );
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
      setGpsStatus(null);
      checkPincode(pincode.trim());
    }
  };

  const handleUseGpsLocation = async () => {
    setDetectingGps(true);
    setGpsStatus(null);
    try {
      const coords = await getDeviceLocation();
      if (!coords) {
        setGpsStatus({
          type: 'error',
          message: 'Unable to detect GPS coordinates. Please ensure device location is enabled, or type your 6-digit PIN code.'
        });
        return;
      }

      const geo = await reverseGeocodeCoordsToPincode(coords.lat, coords.lon);
      if (geo?.pincode && /^\d{6}$/.test(geo.pincode)) {
        setPincode(geo.pincode);
        setGpsStatus({
          type: 'success',
          message: `GPS detected: ${geo.locality ? `${geo.locality}, ` : ''}${geo.pincode}`
        });
        await checkPincode(geo.pincode, coords.lat, coords.lon);
      } else {
        if (pincode && pincode.length === 6) {
          await checkPincode(pincode, coords.lat, coords.lon);
        } else {
          setGpsStatus({
            type: 'error',
            message: 'Coordinates acquired, but postal PIN code could not be mapped. Please enter your 6-digit PIN code.'
          });
        }
      }
    } catch (err: any) {
      console.warn('GPS location error:', err);
      setGpsStatus({
        type: 'error',
        message: 'Error detecting GPS location. Please enter your 6-digit pincode.'
      });
    } finally {
      setDetectingGps(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 font-sans text-slate-800 dark:text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <div className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Truck className="h-3.5 w-3.5" />
          </div>
          <span>{t('deliveryShippingPincode', 'Delivery & Shipping Pincode')}</span>
        </div>
        <button
          type="button"
          onClick={handleUseGpsLocation}
          disabled={detectingGps || loading}
          className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <Navigation className={`h-3.5 w-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
          <span>{detectingGps ? t('common.loading', 'Detecting...') : t('useGpsLocation', 'Use GPS Location')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            maxLength={6}
            placeholder={t('enterPincodePlaceholder', 'Enter 6-digit Delivery Pincode')}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ''));
              if (gpsStatus) setGpsStatus(null);
            }}
            className="w-full bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading || pincode.trim().length < 6}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-sm active:scale-98"
        >
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : t('checkButton', 'Check Now')}
        </button>
      </form>

      {/* Inline GPS Status Message */}
      {gpsStatus && (
        <div className={`text-[11px] font-semibold px-3 py-2 rounded-xl border flex items-center justify-between ${
          gpsStatus.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
        }`}>
          <span>{gpsStatus.message}</span>
          <button 
            type="button" 
            onClick={() => setGpsStatus(null)} 
            className="opacity-60 hover:opacity-100 text-xs font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Results Box */}
      {result && (
        <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all animate-in fade-in duration-200 ${
          !result.serviceable
            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
            : result.isFallback
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
        }`}>
          <div className="flex items-center justify-between font-bold gap-2">
            <div className="flex items-center gap-2">
              {result.serviceable ? (
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${result.isFallback ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'}`}>
                  <CheckCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600">
                  <XCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              )}
              <span className="leading-snug font-extrabold text-xs">
                {result.serviceable
                  ? (result.localityName 
                      ? `${result.localityName}${result.state && !result.localityName.includes(result.state) ? `, ${result.state}` : ''}`
                      : (result.isFallback ? t('shop.standardNationalDelivery', 'Standard National Delivery') : t('shop.serviceableZone', 'Serviceable Zone')))
                  : (result.message || t('shop.deliveryUnavailable', 'Delivery Unavailable'))}
              </span>
            </div>

            {result.serviceable && (
              <span className="font-black text-xs shrink-0 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300">
                {result.shippingFee === 0 ? t('shop.freeShipping', 'FREE Shipping') : `₹${result.shippingFee.toFixed(0)} (FREE above ₹499)`}
              </span>
            )}
          </div>

          {(result.estimatedDeliveryTime || result.courierPartner || (result.distanceKm !== undefined && result.distanceKm > 0)) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/40 dark:border-emerald-800/40 text-[11px]">
              {result.estimatedDeliveryTime ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 font-bold text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
                  <Clock className="h-3 w-3 text-indigo-500" />
                  <span>{result.estimatedDeliveryTime}</span>
                </span>
              ) : null}

              {result.courierPartner ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 font-bold text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
                  <Truck className="h-3 w-3 text-emerald-500" />
                  <span>{result.courierPartner}</span>
                </span>
              ) : result.isFallback ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 font-bold text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
                  <Truck className="h-3 w-3 text-indigo-500" />
                  <span>{t('shop.standardCourier', 'Standard Courier')}</span>
                </span>
              ) : null}
            </div>
          )}

          {result.vendorName && result.serviceable && (
            <div className="text-[10px] text-emerald-800 dark:text-emerald-300/80 pt-0.5 flex items-center gap-1.5 font-bold">
              <span>🌱</span>
              <span>Fulfilled & direct dispatch by {result.vendorName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
