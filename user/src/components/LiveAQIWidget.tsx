import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, AlertTriangle, Info, Wind, Clock, TrendingUp, Search, ShieldAlert, ShoppingBag, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface LiveAQIWidgetProps {
  className?: string;
  compact?: boolean;
  onNavigateToShop?: (query: string) => void;
}

interface HourlyAQIPoint {
  time: string; // e.g. "09:00 PM"
  hourLabel: string; // e.g. "09 PM"
  fullTime: string;
  inAqi: number;
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
}

interface AQIData {
  inAqi: number;
  usAqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
  cityName: string;
  lat: number;
  lon: number;
  updatedAt: string;
  hourly: HourlyAQIPoint[];
  hoursBelow50: number;
  hoursBelow100: number;
  hoursBelow150: number;
  hoursAbove150: number;
}

// Convert PM2.5 (ug/m3) to official Indian Air Quality Index (CPCB Formula)
const calcIndianAQIFromPM25 = (pm25: number): number => {
  if (pm25 <= 0) return 0;
  if (pm25 <= 30) return Math.round((50 / 30) * pm25);
  if (pm25 <= 60) return Math.round(50 + (50 / 30) * (pm25 - 30));
  if (pm25 <= 90) return Math.round(100 + (100 / 30) * (pm25 - 60));
  if (pm25 <= 120) return Math.round(200 + (100 / 30) * (pm25 - 90));
  if (pm25 <= 250) return Math.round(300 + (100 / 130) * (pm25 - 120));
  return Math.round(400 + (100 / 100) * (pm25 - 250));
};

// Reverse Geocoding helper to fetch live city/locality name from GPS coordinates
const fetchCityNameFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const place = data.locality || data.city || data.principalSubdivision;
      if (place) {
        const state = data.principalSubdivision && data.principalSubdivision !== place ? `, ${data.principalSubdivision}` : '';
        return `${place}${state}`;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }
  return `Live Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
};

export const LiveAQIWidget: React.FC<LiveAQIWidgetProps> = ({ className = '', compact = false, onNavigateToShop }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [searchCity, setSearchCity] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [standard, setStandard] = useState<'IN' | 'US'>('IN');

  // Preset Indian cities
  const presetCities = [
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 }
  ];

  useEffect(() => {
    detectLocationAndFetchAQI();

    // Live background auto-reload every 60 seconds
    const interval = setInterval(() => {
      if (aqiData?.lat && aqiData?.lon) {
        fetchAQIByCoords(aqiData.lat, aqiData.lon, aqiData.cityName, true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const detectLocationAndFetchAQI = () => {
    setLoading(true);
    setError(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const livePlaceName = await fetchCityNameFromCoords(lat, lon);
          await fetchAQIByCoords(lat, lon, livePlaceName);
        },
        async (geoErr) => {
          console.warn('Geolocation fallback to Bangalore:', geoErr);
          await fetchAQIByCoords(12.9716, 77.5946, 'Bangalore, Karnataka');
        },
        { timeout: 8000 }
      );
    } else {
      fetchAQIByCoords(12.9716, 77.5946, 'Bangalore, Karnataka');
    }
  };

  const fetchAQIByCoords = async (lat: number, lon: number, locationLabel: string, isAutoReload = false) => {
    if (!isAutoReload) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(
        `https air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,us_aqi&forecast_days=1`
          .replace('https ', 'https://')
      );

      if (!res.ok) throw new Error('Failed to fetch live air quality data');

      const data = await res.json();
      const current = data.current || {};
      const hourlyRaw = data.hourly || {};

      const currentPM25 = Number((current.pm2_5 || 10).toFixed(1));
      const currentInAQI = calcIndianAQIFromPM25(currentPM25);
      const currentUsAQI = Math.round(current.us_aqi || 40);

      // Process 24-Hour Hourly Points
      const hourlyPoints: HourlyAQIPoint[] = [];
      let below50 = 0;
      let below100 = 0;
      let below150 = 0;
      let above150 = 0;

      if (hourlyRaw.time && Array.isArray(hourlyRaw.time)) {
        for (let i = 0; i < Math.min(24, hourlyRaw.time.length); i++) {
          const timeStr = hourlyRaw.time[i];
          const dateObj = new Date(timeStr);
          const timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          const hourLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', hour12: true });

          const pm25Val = Number((hourlyRaw.pm2_5[i] || 0).toFixed(1));
          const inAqiVal = calcIndianAQIFromPM25(pm25Val);
          const usAqiVal = Math.round(hourlyRaw.us_aqi[i] || 0);

          hourlyPoints.push({
            time: timeLabel,
            hourLabel,
            fullTime: timeStr,
            inAqi: inAqiVal,
            usAqi: usAqiVal,
            pm25: pm25Val,
            pm10: Number((hourlyRaw.pm10[i] || 0).toFixed(1)),
            no2: Number((hourlyRaw.nitrogen_dioxide[i] || 0).toFixed(1)),
            ozone: Number((hourlyRaw.ozone[i] || 0).toFixed(1))
          });

          // Categorize hours based on Indian AQI
          if (inAqiVal <= 50) below50++;
          else if (inAqiVal <= 100) below100++;
          else if (inAqiVal <= 150) below150++;
          else above150++;
        }
      }

      const parsedAQIData: AQIData = {
        inAqi: currentInAQI,
        usAqi: currentUsAQI,
        pm25: currentPM25,
        pm10: Number((current.pm10 || 0).toFixed(1)),
        no2: Number((current.nitrogen_dioxide || 0).toFixed(1)),
        ozone: Number((current.ozone || 0).toFixed(1)),
        cityName: locationLabel,
        lat,
        lon,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hourly: hourlyPoints,
        hoursBelow50: below50,
        hoursBelow100: below100,
        hoursBelow150: below150,
        hoursAbove150: above150
      };

      setAqiData(parsedAQIData);
    } catch (err: any) {
      console.error('Error fetching AQI:', err);
      setError('Unable to load live AQI data. Tap refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity.trim())}&count=1`
          .replace('https ', 'https://')
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const label = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}`;
        await fetchAQIByCoords(result.latitude, result.longitude, label);
        setSearchCity('');
      } else {
        alert('City not found. Please try another location.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Indian Air Quality Categories & User-Friendly Styling
  const getIndianAQIInfo = (score: number) => {
    if (score <= 50) {
      return {
        label: 'Good',
        badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        accentBg: 'bg-emerald-500',
        ringColor: 'border-emerald-500',
        gradientStart: '#10b981',
        advice: 'Minimal impact. Air quality is clean and safe for deep breathing and outdoor activity.'
      };
    }
    if (score <= 100) {
      return {
        label: 'Satisfactory',
        badgeBg: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700',
        accentBg: 'bg-emerald-600',
        ringColor: 'border-emerald-600',
        gradientStart: '#059669',
        advice: 'Minor breathing discomfort to sensitive individuals. Generally safe for daily activities.'
      };
    }
    if (score <= 200) {
      return {
        label: 'Moderate',
        badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        accentBg: 'bg-amber-500',
        ringColor: 'border-amber-500',
        gradientStart: '#f59e0b',
        advice: 'Breathing discomfort to asthmatics or people with lung/heart disease.'
      };
    }
    if (score <= 300) {
      return {
        label: 'Poor',
        badgeBg: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        accentBg: 'bg-orange-500',
        ringColor: 'border-orange-500',
        gradientStart: '#f97316',
        advice: 'Breathing discomfort to most people on prolonged exposure. Wear an N95 mask outdoors.'
      };
    }
    if (score <= 400) {
      return {
        label: 'Very Poor',
        badgeBg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        accentBg: 'bg-rose-500',
        ringColor: 'border-rose-500',
        gradientStart: '#f43f5e',
        advice: 'Respiratory illness on prolonged exposure. Minimize outdoor exercise and run HEPA purifiers.'
      };
    }
    return {
      label: 'Severe',
      badgeBg: 'bg-red-950/20 text-red-800 dark:text-red-300 border-red-600',
      accentBg: 'bg-red-700',
      ringColor: 'border-red-700',
      gradientStart: '#b91c1c',
      advice: 'Affects healthy people and seriously impacts those with existing medical conditions.'
    };
  };

  const currentScore = aqiData ? (standard === 'IN' ? aqiData.inAqi : aqiData.usAqi) : 35;
  const currentInfo = getIndianAQIInfo(currentScore);

  // Transform hourly points for Recharts
  const chartData = aqiData ? aqiData.hourly.map(p => ({
    time: p.hourLabel,
    aqi: standard === 'IN' ? p.inAqi : p.usAqi,
    pm25: p.pm25,
    pm10: p.pm10,
    no2: p.no2
  })) : [];

  if (compact && aqiData) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-2xs ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white ${currentInfo.accentBg}`}>
            {currentScore}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Indian Standard</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${currentInfo.badgeBg}`}>
                {currentInfo.label}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-indigo-500" /> {aqiData.cityName}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAQIByCoords(aqiData.lat, aqiData.lon, aqiData.cityName)}
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm relative overflow-hidden font-sans antialiased ${className}`}>
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Wind className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">Live Air Quality</span>
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.2 rounded-md border border-emerald-200/60 dark:border-emerald-800">LIVE</span>
            </div>
          </div>
        </div>

        {/* Controls: Standard Switcher & Refresh Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex gap-0.5 border border-slate-200/70 dark:border-slate-700 text-[10px] font-extrabold">
            <button
              onClick={() => setStandard('IN')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                standard === 'IN'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Indian 🇮🇳
            </button>
            <button
              onClick={() => setStandard('US')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                standard === 'US'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              US 🇺🇸
            </button>
          </div>

          <button
            onClick={() => detectLocationAndFetchAQI()}
            disabled={loading || refreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200/70 dark:border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
            title="Refresh Live Location & AQI Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading || refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 space-y-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-400">Detecting live GPS location & air quality data...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 text-center space-y-2">
          <AlertTriangle className="h-6 w-6 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={detectLocationAndFetchAQI}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-extrabold shadow-2xs cursor-pointer"
          >
            Retry Live GPS
          </button>
        </div>
      ) : aqiData ? (
        <div className="space-y-4">
          
          {/* Main Hero Card */}
          <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl border ${currentInfo.ringColor} ${currentInfo.accentBg} text-white flex flex-col items-center justify-center shadow-xs shrink-0`}>
                  <span className="text-2xl font-black leading-none">{currentScore}</span>
                  <span className="text-[8px] font-black uppercase tracking-wider mt-0.5 opacity-90">
                    {standard === 'IN' ? 'IN-AQI' : 'US-AQI'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentInfo.badgeBg}`}>
                      {currentInfo.label}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {standard === 'IN' ? 'Indian Standard' : 'US Standard'}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>{aqiData.cityName}</span>
                  </h4>
                  
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                    Updated live at {aqiData.updatedAt} • Auto-syncing
                  </p>
                </div>
              </div>

              {/* Pollutants Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[8px] font-black text-slate-400 block uppercase">PM2.5</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{aqiData.pm25}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[8px] font-black text-slate-400 block uppercase">PM10</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{aqiData.pm10}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[8px] font-black text-slate-400 block uppercase">NO₂</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{aqiData.no2}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[8px] font-black text-slate-400 block uppercase">Ozone</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{aqiData.ozone}</span>
                </div>
              </div>
            </div>

            {/* Health Advice Line */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-2.5 rounded-xl flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-normal">
                <strong>Health Guidance: </strong>{currentInfo.advice}
              </p>
            </div>
          </div>

          {/* Elevated AQI Recommendations & Personal Air Protection Suggestions */}
          {currentScore > 50 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-indigo-950/30 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-black text-xs">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Elevated Air Pollution — Personalized Protection Recommendations</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Use HEPA Air Purifier:</strong> Run an indoor HEPA air purifier to continuously filter micro PM2.5 particles and clean your room's air.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Pocket Personal AQI Tracker:</strong> Get a portable pocket AQI monitor for high-precision, personalized micro-climate air quality tracking wherever you go.</span>
                </li>
              </ul>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToShop?.('Air Purifier')}
                  className="py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-800 dark:text-slate-100 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Buy Air Purifier</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToShop?.('Pocket AQI Tracker')}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-white" />
                  <span>Buy Pocket AQI Tracker</span>
                </button>
              </div>
            </div>
          )}

          {/* Today's 24-Hour Summary Breakdown Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-500" /> Today's 24-Hour Exposure Hours
              </h4>
              <span className="text-[10px] font-bold text-slate-400">Total 24 Hours</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-xl p-2.5 text-center">
                <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">Below 50 (Good)</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 block leading-tight mt-0.5">{aqiData.hoursBelow50} <span className="text-xs font-normal">hrs</span></span>
              </div>
              <div className="bg-emerald-600/10 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-700 rounded-xl p-2.5 text-center">
                <span className="text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-200 block">51 - 100 (Satisfactory)</span>
                <span className="text-lg font-black text-emerald-800 dark:text-emerald-200 block leading-tight mt-0.5">{aqiData.hoursBelow100} <span className="text-xs font-normal">hrs</span></span>
              </div>
              <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 rounded-xl p-2.5 text-center">
                <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-300 block">101 - 150 (Moderate)</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-300 block leading-tight mt-0.5">{aqiData.hoursBelow150} <span className="text-xs font-normal">hrs</span></span>
              </div>
              <div className="bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800 rounded-xl p-2.5 text-center">
                <span className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-300 block">Above 150 (Unhealthy)</span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-300 block leading-tight mt-0.5">{aqiData.hoursAbove150} <span className="text-xs font-normal">hrs</span></span>
              </div>
            </div>
          </div>

          {/* High-End Recharts 24-Hour AQI Trend Chart */}
          <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> 24-Hour Interactive AQI Curve
              </h4>
              <span className="text-[9px] font-extrabold text-slate-400">Hourly Trend (Today)</span>
            </div>

            {/* Recharts Area Chart */}
            <div className="w-full h-44 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aqiColorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentInfo.gradientStart} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={currentInfo.gradientStart} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] p-2 rounded-xl shadow-lg border border-slate-700 space-y-0.5">
                            <p className="font-extrabold">{d.time}</p>
                            <p className="font-black text-indigo-300 dark:text-indigo-600">AQI: {d.aqi}</p>
                            <p className="text-[9px] opacity-80">PM2.5: {d.pm25} µg/m³ • PM10: {d.pm10}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" />
                  <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Area 
                    type="monotone" 
                    dataKey="aqi" 
                    stroke={currentInfo.gradientStart} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#aqiColorGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Threshold Legend */}
            <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 0-50 Good</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> 51-100 Satisfactory</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 101-200 Moderate</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 200+ Poor</span>
            </div>
          </div>

          {/* City Search Form & Presets */}
          <div className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 space-y-2">
            <form onSubmit={handleCitySearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Indian or global city (e.g. Delhi, Mumbai)..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {searching ? 'Searching...' : 'Check AQI'}
              </button>
            </form>

            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[9px] font-black uppercase text-slate-400 mr-1">Presets:</span>
              {presetCities.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => fetchAQIByCoords(c.lat, c.lon, `${c.name}, India`)}
                  className="text-[9px] font-extrabold px-2.5 py-0.5 bg-white hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg transition-all cursor-pointer"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Data Source Attribution & Medical Disclaimer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium flex flex-col sm:flex-row items-center justify-between gap-1">
            <p className="flex items-center gap-1">
              <span>Data Reference:</span>
              <a
                href="https://www.aqi.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                AQI Air Quality Index (aqi.in) <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
            <p className="italic text-[9px] text-slate-400">
              Provided for lifestyle guidance; not formal medical advice.
            </p>
          </div>

        </div>
      ) : null}

    </div>
  );
};
