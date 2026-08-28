import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const CHECKIN_NOTIFICATION_ID = 1001;
export const STILLNESS_NOTIFICATION_ID = 1002;
export const CHECKIN_CHANNEL_ID = 'mito_daily_checkin_channel';

// Web timer reference
let webCheckinTimer: any = null;
let webIntervalChecker: any = null;
let lastFiredMinuteStr = '';

/**
 * Play a pleasant audio chime using Web Audio API
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6
    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.8);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
};

/**
 * Ensure high-importance notification channel exists on Android 8+
 */
export const ensureNotificationChannel = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: CHECKIN_CHANNEL_ID,
        name: 'Daily Health Check-in Reminders',
        description: 'Recurring alerts for daily oncology & metabolic habit check-ins',
        importance: 5, // High importance (heads-up banner + sound)
        visibility: 1, // Public on lockscreen
        vibration: true,
        lights: true,
        lightColor: '#6366F1'
      });
    } catch (channelErr) {
      console.warn('[NotificationScheduler] Channel creation notice:', channelErr);
    }
  }
};

/**
 * Request notification permissions across native Capacitor and Web
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return true;
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } else if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    }
  } catch (err) {
    console.warn('[NotificationScheduler] Permission request error:', err);
  }
  return false;
};

/**
 * Trigger web browser notification, sound & custom in-app event
 */
export const fireWebNotification = (title: string, body: string) => {
  playNotificationChime();
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: true,
        tag: 'mito-checkin-reminder'
      });
      notif.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('openDailyCheckinChatbot'));
      };
    }
  } catch (e) {
    console.warn('[NotificationScheduler] Web notification fire error:', e);
  }
  // Also dispatch in-app window event so running app can pop up or highlight
  window.dispatchEvent(new CustomEvent('mito_reminder_triggered', { detail: { title, body } }));
};

/**
 * Trigger an immediate test notification to verify audio & display
 */
export const triggerTestNotification = async () => {
  // Always trigger sound & in-app visual feedback
  playNotificationChime();
  window.dispatchEvent(new CustomEvent('mito_reminder_triggered', {
    detail: {
      title: 'Test Notification • Mito Reboot',
      body: 'Your notification and chime system is working perfectly!'
    }
  }));

  await requestNotificationPermission();
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: 'Test Notification • Mito Reboot',
            body: 'Your notification system is working perfectly!',
            schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
            channelId: CHECKIN_CHANNEL_ID,
            extra: {
              type: 'DAILY_CHECKIN'
            }
          }
        ]
      });
    } catch (e) {
      console.warn('Native test notification error:', e);
    }
  } else {
    fireWebNotification(
      'Test Notification • Mito Reboot',
      'Your notification and chime system is working perfectly!'
    );
  }
};

/**
 * Schedule a daily recurring AI Check-in reminder
 * @param timeStr string in "HH:mm" 24-hour format (e.g. "12:30" or "20:56")
 */
export const scheduleDailyCheckinReminder = async (timeStr: string): Promise<boolean> => {
  if (!timeStr) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return false;

  localStorage.setItem('mito_checkin_reminder_time', timeStr);

  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn('[NotificationScheduler] Notification permission not granted');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Ensure high-importance notification channel exists on Android 8+
      await ensureNotificationChannel();

      // 2. Cancel previous check-in notification to prevent duplicate rings
      await LocalNotifications.cancel({ notifications: [{ id: CHECKIN_NOTIFICATION_ID }] }).catch(() => {});

      // 3. Calculate next trigger time
      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      // If scheduled time today has already passed, schedule for tomorrow
      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: CHECKIN_NOTIFICATION_ID,
            title: 'Mito Reboot • Daily Health Check-in',
            body: 'Time for your daily metabolic & oncology check-in! Log your habits to keep your cellular defense active.',
            schedule: {
              at: scheduledDate,
              repeats: true,
              every: 'day',
              allowWhileIdle: true
            },
            channelId: CHECKIN_CHANNEL_ID,
            extra: {
              type: 'DAILY_CHECKIN',
              timeStr
            }
          }
        ]
      });

      console.log(`[NotificationScheduler] Native check-in notification scheduled for ${scheduledDate.toLocaleString()}`);
      return true;
    } catch (err) {
      console.error('[NotificationScheduler] Failed to schedule native local notification:', err);
      return false;
    }
  } else {
    // ── WEB BROWSER SCHEDULING ──
    if (webCheckinTimer) clearTimeout(webCheckinTimer);

    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    let msUntilTrigger = scheduledDate.getTime() - now.getTime();
    if (msUntilTrigger <= 0) {
      // Set for next day
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      msUntilTrigger = scheduledDate.getTime() - now.getTime();
    }

    console.log(`[NotificationScheduler] Web reminder will trigger in ${Math.round(msUntilTrigger / 1000)}s at ${scheduledDate.toLocaleTimeString()}`);

    webCheckinTimer = setTimeout(() => {
      fireWebNotification(
        'Mito Reboot • Daily Health Check-in',
        'Time for your daily metabolic & oncology check-in! Log your habits to keep your cellular defense active.'
      );
      // Recursively schedule next day
      scheduleDailyCheckinReminder(timeStr);
    }, msUntilTrigger);

    return true;
  }
};

/**
 * Schedule a habit reminder (e.g. Stillness)
 */
export const scheduleHabitReminder = async (
  notificationId: number,
  title: string,
  body: string,
  timeStr: string
): Promise<boolean> => {
  if (!timeStr) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return false;

  await requestNotificationPermission();

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] }).catch(() => {});

      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title,
            body,
            schedule: {
              at: scheduledDate,
              repeats: true,
              every: 'day',
              allowWhileIdle: true
            },
            channelId: CHECKIN_CHANNEL_ID,
            extra: {
              type: 'HABIT_REMINDER',
              timeStr
            }
          }
        ]
      });
      return true;
    } catch (err) {
      console.error('[NotificationScheduler] Failed to schedule habit notification:', err);
      return false;
    }
  } else {
    return true;
  }
};

/**
 * Initialize and verify active reminders upon app startup
 */
export const initNotificationScheduler = async () => {
  const savedCheckinTime = localStorage.getItem('mito_checkin_reminder_time') || '20:30';

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();

      // Register notification click listener to open the AI Checkin Modal
      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        const extra = notificationAction.notification.extra;
        if (extra?.type === 'DAILY_CHECKIN') {
          window.dispatchEvent(new CustomEvent('openDailyCheckinChatbot'));
        }
      });

      // Register foreground notification listener for in-app alert & chime
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        playNotificationChime();
        window.dispatchEvent(new CustomEvent('mito_reminder_triggered', {
          detail: {
            title: notification.title,
            body: notification.body
          }
        }));
      });

      const pending = await LocalNotifications.getPending();
      const hasCheckin = pending.notifications.some(n => n.id === CHECKIN_NOTIFICATION_ID);
      if (!hasCheckin) {
        await scheduleDailyCheckinReminder(savedCheckinTime);
      }
    } catch (err) {
      console.warn('[NotificationScheduler] Init check error:', err);
    }
  } else {
    // Web periodic ticker (checks every 5 seconds if current time matches saved check-in time)
    if (!webIntervalChecker) {
      webIntervalChecker = setInterval(() => {
        const time = localStorage.getItem('mito_checkin_reminder_time');
        if (!time) return;
        const now = new Date();
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHH}:${currentMM}`;
        const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()} ${currentTimeStr}`;

        if (currentTimeStr === time && lastFiredMinuteStr !== minuteKey) {
          lastFiredMinuteStr = minuteKey;
          fireWebNotification(
            'Mito Reboot • Daily Health Check-in',
            'Time for your daily metabolic & oncology check-in! Log your habits to keep your cellular defense active.'
          );
        }
      }, 5000);
    }
    scheduleDailyCheckinReminder(savedCheckinTime);
  }
};
