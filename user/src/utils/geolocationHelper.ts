import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationCoords {
  lat: number;
  lon: number;
}

export interface GeocodeResult {
  pincode: string;
  locality?: string;
  city?: string;
  state?: string;
}

/**
 * Request device location permission and retrieve current coordinates.
 * Works seamlessly on native Android, iOS, and Web/PWA browsers.
 */
export const getDeviceLocation = async (): Promise<LocationCoords | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location === 'granted') {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
        if (pos?.coords) {
          return {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          };
        }
      }
    } catch (nativeErr) {
      console.warn('Native Capacitor geolocation error, trying web fallback:', nativeErr);
    }
  }

  // Web / PWA fallback via navigator.geolocation
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('Browser geolocation fallback failed or timed out:', err);
          resolve(null);
        },
        { timeout: 15000, enableHighAccuracy: true }
      );
    } else {
      resolve(null);
    }
  });
};

/**
 * Reverse geocode coordinates to an Indian 6-digit Postal Pincode.
 * Prioritizes OpenStreetMap Nominatim for high precision in India,
 * then falls back to BigDataCloud.
 */
export const reverseGeocodeCoordsToPincode = async (
  lat: number, 
  lon: number, 
  lang: string = 'en'
): Promise<GeocodeResult | null> => {
  const languageCode = lang || 'en';

  // 1. Try OpenStreetMap Nominatim first (high precision for Indian PIN codes) with explicit language
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${encodeURIComponent(languageCode)}`, {
      headers: { 
        'User-Agent': 'MitoRebootHealthApp/1.0',
        'Accept-Language': languageCode
      }
    });
    if (res.ok) {
      const data = await res.json();
      const rawCode = data.address?.postcode?.replace(/\D/g, '');
      let locality = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || data.address?.city_district;
      if (locality) {
        locality = locality.replace(/^Zone\s+\d+\s*/i, '').trim();
      }
      const city = data.address?.city || data.address?.town || data.address?.state_district;
      const state = data.address?.state;

      if (rawCode && rawCode.length === 6) {
        return {
          pincode: rawCode,
          locality: locality || city,
          city,
          state
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err);
  }

  // 2. Fallback to BigDataCloud
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${encodeURIComponent(languageCode)}`);
    if (res.ok) {
      const data = await res.json();
      const rawCode = (data.postcode || '').replace(/\D/g, '');
      const locality = data.locality || data.city;
      const city = data.city || data.principalSubdivision;
      const state = data.principalSubdivision;

      if (rawCode && rawCode.length === 6) {
        return { pincode: rawCode, locality, city, state };
      }
      // Check informative items for 6-digit postal code
      const postalItem = data.localityInfo?.informative?.find((i: any) => /^\d{6}$/.test(i.name?.trim()));
      if (postalItem?.name) {
        return {
          pincode: postalItem.name.trim(),
          locality,
          city,
          state
        };
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode error:', err);
  }

  return null;
};
