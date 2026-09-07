import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationCoords {
  lat: number;
  lon: number;
}

/**
 * Request device location permission and retrieve current coordinates.
 * Works seamlessly on native Android, iOS, and Web/PWA.
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
          timeout: 10000,
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
          console.warn('Browser geolocation fallback failed:', err);
          resolve(null);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      resolve(null);
    }
  });
};
