/**
 * Native Haptic Feedback Helper
 * Uses navigator.vibrate for micro-tactile physical feedback on mobile devices
 * (Android Capacitor webview, mobile browsers, PWA) with zero overhead.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export const triggerHaptic = (type: HapticType = 'light'): void => {
  try {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) {
      return;
    }

    switch (type) {
      case 'selection':
        navigator.vibrate(8);
        break;
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'success':
        navigator.vibrate([15, 60, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 80, 30]);
        break;
      case 'error':
        navigator.vibrate([40, 60, 40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Fail silently on devices that restrict vibration permissions
  }
};

