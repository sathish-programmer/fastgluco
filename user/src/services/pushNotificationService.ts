import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

class PushNotificationService {
  private isInitialized = false;
  private currentFcmToken: string | null = null;
  private cleanupListeners: (() => void)[] = [];

  /**
   * Initializes FCM push notifications on native devices (Android & iOS).
   * Safe to call multiple times; ignores web / non-native environments gracefully.
   */
  public async init(apiUrl: string, authToken: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[FCM] Non-native platform detected, push notification registration bypassed.');
      return;
    }

    if (this.isInitialized) {
      console.log('[FCM] Push notifications already initialized for active session.');
      return;
    }

    try {
      // 1. Request notification permissions
      const permStatus = await FirebaseMessaging.requestPermissions();
      if (permStatus.receive !== 'granted') {
        console.warn('[FCM] Notification permissions were not granted:', permStatus.receive);
        return;
      }

      // 2. Create notification channel on Android
      if (Capacitor.getPlatform() === 'android') {
        try {
          await FirebaseMessaging.createChannel({
            id: 'mitoreboot_notifications',
            name: 'Mito Reboot Notifications',
            description: 'Appointments, orders, and personalized health guidance',
            importance: 4, // High
            visibility: 1, // Public
            sound: 'default',
            vibration: true
          });
          console.log('[FCM] Android notification channel "mitoreboot_notifications" configured.');
        } catch (channelErr) {
          console.warn('[FCM] Note on Android channel creation:', channelErr);
        }
      }

      // 3. Obtain FCM device token
      const tokenResult = await FirebaseMessaging.getToken();
      if (tokenResult && tokenResult.token) {
        this.currentFcmToken = tokenResult.token;
        console.log(`[FCM] Device FCM token obtained: ${this.currentFcmToken.substring(0, 12)}...`);
        await this.syncTokenWithBackend(apiUrl, authToken, this.currentFcmToken);
      }

      // 4. Listen for token refresh events
      const tokenSub = await FirebaseMessaging.addListener('tokenReceived', async (event) => {
        if (event && event.token) {
          console.log(`[FCM] Device token refreshed: ${event.token.substring(0, 12)}...`);
          this.currentFcmToken = event.token;
          await this.syncTokenWithBackend(apiUrl, authToken, event.token);
        }
      });
      this.cleanupListeners.push(() => tokenSub.remove());

      // 5. Handle foreground notifications
      const notifReceivedSub = await FirebaseMessaging.addListener('notificationReceived', (event) => {
        console.log('[FCM] Foreground notification received:', event.notification);
        // Dispatch local event so NotificationBell and in-app toasts can update immediately
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fcm_notification_received', {
            detail: event.notification
          }));
        }
      });
      this.cleanupListeners.push(() => notifReceivedSub.remove());

      // 6. Handle notification tap / action performed
      const actionSub = await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
        console.log('[FCM] Notification action performed / tapped:', event);
        this.handleNotificationTap(event.notification);
      });
      this.cleanupListeners.push(() => actionSub.remove());

      this.isInitialized = true;
    } catch (error) {
      console.error('[FCM] Error during push notification initialization:', error);
    }
  }

  /**
   * Dispatches navigation when user taps a push notification
   */
  private handleNotificationTap(notification: any): void {
    if (!notification) return;

    const data = notification.data || {};
    const route = data.route || '';
    const notificationType = data.notificationType || '';
    const appointmentId = data.appointmentId || '';
    const orderId = data.orderId || '';

    console.log(`[FCM Navigation] Routing notification tap: route=${route}, type=${notificationType}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcm_navigate_to_route', {
        detail: {
          route,
          notificationType,
          appointmentId,
          orderId,
          data
        }
      }));
    }
  }

  /**
   * Synchronizes device token with the authenticated backend
   */
  private async syncTokenWithBackend(apiUrl: string, authToken: string, fcmToken: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform(); // 'android' | 'ios'
      const response = await fetch(`${apiUrl}/notifications/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: fcmToken,
          platform
        })
      });

      if (response.ok) {
        console.log('[FCM] Device token successfully registered with backend.');
      } else {
        console.warn('[FCM] Backend responded with non-200 for token registration:', response.status);
      }
    } catch (err) {
      console.error('[FCM] Failed to sync token with backend:', err);
    }
  }

  /**
   * Cleanup on user logout: removes token from backend and clears local listeners
   */
  public async logout(apiUrl: string, authToken?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      if (this.currentFcmToken && authToken) {
        await fetch(`${apiUrl}/notifications/fcm-token`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            token: this.currentFcmToken
          })
        }).catch(() => {});
      }

      await FirebaseMessaging.deleteToken().catch(() => {});
    } catch (e) {
      console.error('[FCM] Error cleaning up device token on logout:', e);
    } finally {
      this.cleanupListeners.forEach((cleanup) => {
        try { cleanup(); } catch (_) {}
      });
      this.cleanupListeners = [];
      this.isInitialized = false;
      this.currentFcmToken = null;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
