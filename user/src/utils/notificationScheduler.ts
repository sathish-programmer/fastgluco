import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const CHECKIN_NOTIFICATION_ID = 1001;
export const STILLNESS_NOTIFICATION_ID = 1002;
export const REPORT_UPLOAD_AM_NOTIFICATION_ID = 1003;
export const REPORT_UPLOAD_PM_NOTIFICATION_ID = 1004;
export const FASTING_WINDOW_NOTIFICATION_ID = 1005;
export const MIDDAY_STRESS_RESET_NOTIFICATION_ID = 1006;
export const EVENING_SLEEP_WINDDOWN_NOTIFICATION_ID = 1007;
export const INACTIVE_DAY_NOTIFICATION_ID = 1008;
export const BREATHWORK_NOTIFICATION_ID = 1009;

export const CHECKIN_CHANNEL_ID = 'mito_daily_checkin_channel';
export const REPORTS_CHANNEL_ID = 'mito_reports_channel';
export const HEALTH_HABITS_CHANNEL_ID = 'mito_health_habits_channel';

// Web timer references
let webCheckinTimer: any = null;
let webIntervalChecker: any = null;

// Minimum spacing of 2 hours between ANY automated notifications to protect user peace of mind
const MIN_GAP_BETWEEN_ANY_NOTIFICATIONS_MS = 2 * 60 * 60 * 1000;

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
    console.warn('Audio chime notice:', e);
  }
};

/**
 * Ensure high-importance notification channels exist on Android 8+
 */
export const ensureNotificationChannel = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: CHECKIN_CHANNEL_ID,
        name: 'Daily Health Check-in Reminders',
        description: 'Scheduled reminders for your daily metabolic & habit check-in',
        importance: 4,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#3B82F6'
      });

      await LocalNotifications.createChannel({
        id: REPORTS_CHANNEL_ID,
        name: 'Lab & Medical Report Reminders',
        description: 'Optional reminders to upload new blood test or diagnostic reports',
        importance: 3,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#10B981'
      });

      await LocalNotifications.createChannel({
        id: HEALTH_HABITS_CHANNEL_ID,
        name: 'Preventive Health & Habit Alerts',
        description: 'Scheduled reminders for personalized habits, stillness, and breathwork',
        importance: 3,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#8B5CF6'
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
 * Anti-Spam & Intelligent Spacing Guard:
 * 1. Global Cooldown: No notifications within 2 hours of ANY previous notification.
 * 2. Daily Cap: At most ONCE per calendar day per notification category.
 * 3. User Completion: Suppress if user already performed the corresponding action today.
 */
export const canFireNotification = (type: string, isManualTest: boolean = false): boolean => {
  if (isManualTest) return true;

  const now = Date.now();
  const todayStr = new Date().toDateString();

  // 1. Check Global Spacing (at least 2 hours between ANY automated notifications)
  const lastGlobalTs = Number(localStorage.getItem('mito_global_last_notif_ts') || 0);
  if (now - lastGlobalTs < MIN_GAP_BETWEEN_ANY_NOTIFICATIONS_MS) {
    const minsLeft = Math.round((MIN_GAP_BETWEEN_ANY_NOTIFICATIONS_MS - (now - lastGlobalTs)) / 60000);
    console.log(`[NotificationScheduler] Suppressed ${type} — Global cooldown active (${minsLeft}m remaining)`);
    return false;
  }

  // 2. Check Daily Cap (max 1 notification per category per calendar day)
  const lastFiredDate = localStorage.getItem(`mito_notif_fired_date_${type}`);
  if (lastFiredDate === todayStr) {
    console.log(`[NotificationScheduler] Suppressed ${type} — Already fired today (${todayStr})`);
    return false;
  }

  // 3. Dynamic User Preferences Check (Push Channel)
  const prefsStr = localStorage.getItem('mito_notification_preferences');
  let prefs: any = null;
  if (prefsStr) {
    try { prefs = JSON.parse(prefsStr); } catch (e) {}
  }

  if (prefs?.push) {
    if (type === 'DAILY_CHECKIN' && prefs.push.dailyCheckin === false) {
      console.log('[NotificationScheduler] Suppressed DAILY_CHECKIN — Push disabled in user preferences');
      return false;
    }
    if ((type === 'FASTING' || type === 'STILLNESS' || type === 'BREATH' || type === 'HABIT_REMINDER') && prefs.push.habitReminders === false) {
      console.log('[NotificationScheduler] Suppressed habit reminder — Push disabled in user preferences');
      return false;
    }
    if (type === 'REPORT_UPLOAD' && prefs.push.reportUpload === false) {
      console.log('[NotificationScheduler] Suppressed REPORT_UPLOAD — Push disabled in user preferences');
      return false;
    }
    if ((type.includes('SPIKE') || type.includes('HYPERTENSION') || type.includes('PCOS') || type.includes('PARKINSON') || type.includes('DAMAGE')) && prefs.push.healthInsights === false) {
      console.log('[NotificationScheduler] Suppressed health insight — Push disabled in user preferences');
      return false;
    }
  }

  // 4. Check Action Completion Suppression
  if (type === 'REPORT_UPLOAD') {
    const isEnabled = prefs?.push ? prefs.push.reportUpload === true : localStorage.getItem('mito_report_reminder_enabled') === 'true';
    if (!isEnabled) {
      console.log('[NotificationScheduler] Suppressed REPORT_UPLOAD — User has not opted into report reminders');
      return false;
    }
    const lastReport = localStorage.getItem('mito_last_report_upload_date');
    if (lastReport === todayStr) {
      console.log('[NotificationScheduler] Suppressed REPORT_UPLOAD — Report already uploaded today');
      return false;
    }
  }

  if (type === 'DAILY_CHECKIN') {
    const isEnabled = prefs?.push ? prefs.push.dailyCheckin !== false : localStorage.getItem('mito_checkin_reminder_enabled') !== 'false';
    if (!isEnabled) return false;
    const lastHabit = localStorage.getItem('mito_last_habit_log_date');
    if (lastHabit === todayStr) {
      console.log('[NotificationScheduler] Suppressed DAILY_CHECKIN — User already completed check-in today');
      return false;
    }
  }

  if (type === 'FASTING') {
    const lastFasting = localStorage.getItem('mito_fasting_logged_today');
    if (lastFasting === todayStr) return false;
  }

  if (type === 'STILLNESS' || type === 'BREATH') {
    const lastStillness = localStorage.getItem('mito_stillness_logged_today');
    const lastBreath = localStorage.getItem('mito_breath_logged_today');
    if (lastStillness === todayStr || lastBreath === todayStr) return false;
  }

  return true;
};

/**
 * Record that a notification was fired to lock daily cap & global cooldown
 */
export const markNotificationFired = (type: string) => {
  const todayStr = new Date().toDateString();
  localStorage.setItem(`mito_notif_fired_date_${type}`, todayStr);
  localStorage.setItem('mito_global_last_notif_ts', String(Date.now()));
};

/**
 * Trigger web browser notification, sound & custom in-app event with anti-spam protection
 */
export const fireWebNotification = (
  title: string, 
  body: string, 
  type: string = 'DAILY_CHECKIN',
  isManualTest: boolean = false
) => {
  if (!canFireNotification(type, isManualTest)) {
    return;
  }

  markNotificationFired(type);
  playNotificationChime();

  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: false,
        tag: `mito-${type.toLowerCase()}`
      });
      notif.onclick = () => {
        window.focus();
        if (type === 'REPORT_UPLOAD') {
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Reports' }));
        } else if (type === 'FASTING') {
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Dashboard' }));
        } else {
          window.dispatchEvent(new CustomEvent('openDailyCheckinChatbot'));
        }
      };
    }
  } catch (e) {
    console.warn('[NotificationScheduler] Web notification fire error:', e);
  }

  // Dispatch in-app window event so running app can pop up or highlight smoothly
  window.dispatchEvent(new CustomEvent('mito_reminder_triggered', { detail: { title, body, type } }));
};

/**
 * Trigger an immediate test notification to verify audio & display (bypasses throttles)
 */
export const triggerTestNotification = async () => {
  playNotificationChime();
  window.dispatchEvent(new CustomEvent('mito_reminder_triggered', {
    detail: {
      title: 'Test Notification • Mito Reboot',
      body: 'Your notification and chime system is working smoothly without spam!',
      type: 'DAILY_CHECKIN'
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
      'Your notification and chime system is working smoothly!',
      'DAILY_CHECKIN',
      true // isManualTest = true
    );
  }
};

export interface HealthInsightPayload {
  category: 'GLUCOSE_SPIKE' | 'PCOS_IRREGULAR' | 'HYPERTENSION_HIGH' | 'PARKINSON_OFF' | 'METABOLIC_DAMAGE';
  title?: string;
  body?: string;
  metricValue?: string | number;
  secondaryValue?: string | number;
}

/**
 * Trigger a clinical health insight notification (throttled to max once every 4 hours)
 */
export const triggerHealthInsightNotification = async (payload: HealthInsightPayload) => {
  let title = payload.title;
  let body = payload.body;
  const channelId = payload.category === 'GLUCOSE_SPIKE' || payload.category === 'HYPERTENSION_HIGH' ? REPORTS_CHANNEL_ID : HEALTH_HABITS_CHANNEL_ID;

  if (!title || !body) {
    switch (payload.category) {
      case 'GLUCOSE_SPIKE':
        title = 'Glucose Alert • Dietary Recommendation';
        body = `Elevated glucose detected (${payload.metricValue || '140+'} mg/dL). Prioritize high-fiber vegetables, a 15-minute post-meal walk, and reduce refined sugars.`;
        break;
      case 'PCOS_IRREGULAR':
        title = 'PCOS Cycle Support • Hormonal Balance';
        body = `Irregular cycle pattern logged (${payload.metricValue || '35+'} days). Consider spearmint tea, inositol-rich legumes, anti-inflammatory whole foods, and 20 mins of walking.`;
        break;
      case 'HYPERTENSION_HIGH':
        title = 'Blood Pressure Alert • Sodium & Nitric Oxide';
        body = `Elevated blood pressure logged (${payload.metricValue || '130'}/${payload.secondaryValue || '85'} mmHg). Limit dietary sodium, increase leafy greens, and practice 10 mins of deep breathing.`;
        break;
      case 'PARKINSON_OFF':
        title = 'Parkinson\'s Alert • Medication & Mobility';
        body = 'Off-period logged. Separate medication from high-protein meals, stay well-hydrated, and practice gentle mobility stretches.';
        break;
      case 'METABOLIC_DAMAGE':
        title = 'Cellular Health Alert • Recovery Protocol';
        body = 'Elevated oxidative load detected today. Activate cellular autophagy with an overnight fast and antioxidant-rich foods.';
        break;
    }
  }

  // Throttle to avoid repeated triggers within 4 hours for the same category
  const throttleKey = `mito_insight_throttle_${payload.category}`;
  const lastFired = Number(localStorage.getItem(throttleKey) || 0);
  if (Date.now() - lastFired < 4 * 60 * 60 * 1000) {
    return;
  }
  localStorage.setItem(throttleKey, String(Date.now()));

  if (!canFireNotification(payload.category)) {
    return;
  }
  markNotificationFired(payload.category);

  playNotificationChime();
  window.dispatchEvent(new CustomEvent('mito_reminder_triggered', {
    detail: {
      title,
      body,
      type: payload.category
    }
  }));

  await requestNotificationPermission();
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();
      const notifId = Math.floor(2000 + Math.random() * 8000);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            schedule: { at: new Date(Date.now() + 600), allowWhileIdle: true },
            channelId,
            extra: {
              type: payload.category
            }
          }
        ]
      });
    } catch (e) {
      console.warn('[NotificationScheduler] Insight notification schedule error:', e);
    }
  } else {
    fireWebNotification(title, body, payload.category);
  }
};

/**
 * Schedule a single daily recurring AI Check-in reminder
 * @param timeStr string in "HH:mm" 24-hour format (e.g. "12:30" or "20:56")
 */
export const scheduleDailyCheckinReminder = async (timeStr: string): Promise<boolean> => {
  if (!timeStr) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return false;

  localStorage.setItem('mito_checkin_reminder_enabled', 'true');
  localStorage.setItem('mito_checkin_reminder_time', timeStr);

  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn('[NotificationScheduler] Notification permission not granted');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();

      // Cancel previous check-in notification to prevent duplicate rings
      await LocalNotifications.cancel({ notifications: [{ id: CHECKIN_NOTIFICATION_ID }] }).catch(() => {});

      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (scheduledDate.getTime() <= now.getTime()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: CHECKIN_NOTIFICATION_ID,
            title: 'Mito Reboot • Daily Health Check-in',
            body: 'Time for your daily metabolic check-in! Log your habits to keep your cellular defense active.',
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
    if (webCheckinTimer) {
      clearTimeout(webCheckinTimer);
      webCheckinTimer = null;
    }

    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    let msUntilTrigger = scheduledDate.getTime() - now.getTime();
    if (msUntilTrigger <= 0) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      msUntilTrigger = scheduledDate.getTime() - now.getTime();
    }

    console.log(`[NotificationScheduler] Web reminder will trigger in ${Math.round(msUntilTrigger / 1000)}s at ${scheduledDate.toLocaleTimeString()}`);

    webCheckinTimer = setTimeout(() => {
      fireWebNotification(
        'Mito Reboot • Daily Health Check-in',
        'Time for your daily metabolic check-in! Log your habits to keep your cellular defense active.',
        'DAILY_CHECKIN'
      );
      // Re-schedule for next day
      scheduleDailyCheckinReminder(timeStr);
    }, msUntilTrigger);

    return true;
  }
};

/**
 * Schedule recurring Lab / Health Report Upload reminders
 * ONLY active if explicitly opted in by user (prevents unsolicited spam)
 */
export const scheduleReportUploadReminders = async (): Promise<boolean> => {
  const isEnabled = localStorage.getItem('mito_report_reminder_enabled') === 'true';

  if (Capacitor.isNativePlatform()) {
    try {
      // Always cancel previous unprompted report reminders first
      await LocalNotifications.cancel({
        notifications: [
          { id: REPORT_UPLOAD_AM_NOTIFICATION_ID },
          { id: REPORT_UPLOAD_PM_NOTIFICATION_ID }
        ]
      }).catch(() => {});

      if (!isEnabled) {
        return false;
      }

      await ensureNotificationChannel();
      const now = new Date();

      // 5:00 PM Evening Reminder only if enabled
      const pmDate = new Date();
      pmDate.setHours(17, 0, 0, 0);
      if (pmDate.getTime() <= now.getTime()) {
        pmDate.setDate(pmDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: REPORT_UPLOAD_PM_NOTIFICATION_ID,
            title: 'Health Report Reminder',
            body: 'Have new diagnostic reports? Upload them to sync AI biomarker analytics.',
            schedule: {
              at: pmDate,
              repeats: true,
              every: 'week',
              allowWhileIdle: true
            },
            channelId: REPORTS_CHANNEL_ID,
            extra: {
              type: 'REPORT_UPLOAD'
            }
          }
        ]
      });

      return true;
    } catch (err) {
      console.warn('[NotificationScheduler] Failed to schedule report reminders:', err);
      return false;
    }
  }
  return true;
};

/**
 * Schedule user-configured generic habit reminder (e.g. Stillness, Breathwork, Fasting)
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
            channelId: HEALTH_HABITS_CHANNEL_ID,
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
    // For Web, save habit reminder time to localStorage
    localStorage.setItem(`mito_habit_reminder_${notificationId}`, timeStr);
  }
  return true;
};

/**
 * Cancel and disable the daily recurring AI Check-in reminder
 */
export const cancelDailyCheckinReminder = async (): Promise<boolean> => {
  localStorage.setItem('mito_checkin_reminder_enabled', 'false');
  localStorage.removeItem('mito_checkin_reminder_time');

  if (webCheckinTimer) {
    clearTimeout(webCheckinTimer);
    webCheckinTimer = null;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: CHECKIN_NOTIFICATION_ID }] });
      console.log('[NotificationScheduler] Native check-in notification cancelled');
      return true;
    } catch (err) {
      console.warn('[NotificationScheduler] Failed to cancel native notification:', err);
      return false;
    }
  }
  return true;
};

/**
 * Initialize and verify active reminders upon app startup
 * Automatically cleans up any obsolete/spam background alarms
 */
export const initNotificationScheduler = async () => {
  const isEnabled = localStorage.getItem('mito_checkin_reminder_enabled') !== 'false';
  const savedCheckinTime = localStorage.getItem('mito_checkin_reminder_time');

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();

      // Register notification click listener to open the correct target tab / modal
      LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        const extra = notificationAction.notification.extra;
        if (extra?.type === 'DAILY_CHECKIN') {
          window.dispatchEvent(new CustomEvent('openDailyCheckinChatbot'));
        } else if (extra?.type === 'REPORT_UPLOAD') {
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Reports' }));
        } else if (extra?.type === 'FASTING') {
          window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'Dashboard' }));
        } else {
          window.dispatchEvent(new CustomEvent('openDailyCheckinChatbot'));
        }
      });

      // Register foreground notification listener with anti-spam check
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        const type = notification.extra?.type || 'DAILY_CHECKIN';

        if (!canFireNotification(type)) {
          return;
        }
        markNotificationFired(type);

        playNotificationChime();
        window.dispatchEvent(new CustomEvent('mito_reminder_triggered', {
          detail: {
            title: notification.title,
            body: notification.body,
            type
          }
        }));
      });

      // Clear any legacy unprompted spam reminders
      await LocalNotifications.cancel({
        notifications: [
          { id: REPORT_UPLOAD_AM_NOTIFICATION_ID },
          { id: REPORT_UPLOAD_PM_NOTIFICATION_ID },
          { id: MIDDAY_STRESS_RESET_NOTIFICATION_ID },
          { id: FASTING_WINDOW_NOTIFICATION_ID },
          { id: EVENING_SLEEP_WINDDOWN_NOTIFICATION_ID },
          { id: INACTIVE_DAY_NOTIFICATION_ID }
        ]
      }).catch(() => {});

      if (!isEnabled || !savedCheckinTime) {
        await LocalNotifications.cancel({ notifications: [{ id: CHECKIN_NOTIFICATION_ID }] }).catch(() => {});
        return;
      }

      const pending = await LocalNotifications.getPending();
      const hasCheckin = pending.notifications.some(n => n.id === CHECKIN_NOTIFICATION_ID);
      if (!hasCheckin) {
        await scheduleDailyCheckinReminder(savedCheckinTime);
      }
    } catch (err) {
      console.warn('[NotificationScheduler] Init check error:', err);
    }
  } else {
    // ── WEB ENVIRONMENT ──
    if (!isEnabled || !savedCheckinTime) {
      if (webCheckinTimer) {
        clearTimeout(webCheckinTimer);
        webCheckinTimer = null;
      }
    } else {
      scheduleDailyCheckinReminder(savedCheckinTime);
    }

    // Web periodic ticker: checks once per minute with strict spacing and daily cap
    if (webIntervalChecker) {
      clearInterval(webIntervalChecker);
      webIntervalChecker = null;
    }

    webIntervalChecker = setInterval(() => {
      const now = new Date();
      const currentHH = String(now.getHours()).padStart(2, '0');
      const currentMM = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHH}:${currentMM}`;

      const checkinEnabled = localStorage.getItem('mito_checkin_reminder_enabled') !== 'false';
      const checkinTime = localStorage.getItem('mito_checkin_reminder_time');

      // Only fire daily check-in if time matches and passes anti-spam check
      if (checkinEnabled && checkinTime && currentTimeStr === checkinTime) {
        if (canFireNotification('DAILY_CHECKIN')) {
          fireWebNotification(
            'Mito Reboot • Daily Health Check-in',
            'Time for your daily metabolic check-in! Log your habits to keep your cellular defense active.',
            'DAILY_CHECKIN'
          );
        }
      }
    }, 60000); // Check once per 60 seconds
  }
};
