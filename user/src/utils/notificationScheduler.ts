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

export const CHECKIN_CHANNEL_ID = 'mito_daily_checkin_channel';
export const REPORTS_CHANNEL_ID = 'mito_reports_channel';
export const HEALTH_HABITS_CHANNEL_ID = 'mito_health_habits_channel';

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
 * Ensure high-importance notification channels exist on Android 8+
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
        lightColor: '#3B82F6'
      });

      await LocalNotifications.createChannel({
        id: REPORTS_CHANNEL_ID,
        name: 'Lab & Medical Report Upload Reminders',
        description: 'Reminders at 10:00 AM and 5:00 PM to upload lab test and biomarker reports',
        importance: 4,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#10B981'
      });

      await LocalNotifications.createChannel({
        id: HEALTH_HABITS_CHANNEL_ID,
        name: 'Fasting, Stress & Sleep Health Alerts',
        description: 'Timely reminders for circadian fasting, midday stillness, and sleep recovery',
        importance: 4,
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
 * Trigger web browser notification, sound & custom in-app event
 */
export const fireWebNotification = (title: string, body: string, type: string = 'DAILY_CHECKIN') => {
  const todayStr = new Date().toDateString();

  // Dynamic Suppression: If user already uploaded glucose CSV/PDF or medical report today, suppress report reminders
  if (type === 'REPORT_UPLOAD') {
    const lastReport = localStorage.getItem('mito_last_report_upload_date');
    if (lastReport === todayStr) {
      console.log('[NotificationScheduler] Report reminder suppressed - user already uploaded today');
      return;
    }
  }

  // Dynamic Suppression: If user already completed habit checkin today, suppress checkin reminders
  if (type === 'DAILY_CHECKIN') {
    const lastHabit = localStorage.getItem('mito_last_habit_log_date');
    if (lastHabit === todayStr) {
      console.log('[NotificationScheduler] Daily check-in reminder suppressed - user already logged today');
      return;
    }
  }

  // Dynamic Suppression: If user already logged fasting today
  if (type === 'FASTING') {
    const lastFasting = localStorage.getItem('mito_fasting_logged_today');
    if (lastFasting === todayStr) return;
  }

  // Dynamic Suppression: If user already logged stillness today
  if (type === 'STILLNESS') {
    const lastStillness = localStorage.getItem('mito_stillness_logged_today');
    if (lastStillness === todayStr) return;
  }

  playNotificationChime();
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: true,
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
  // Also dispatch in-app window event so running app can pop up or highlight
  window.dispatchEvent(new CustomEvent('mito_reminder_triggered', { detail: { title, body, type } }));
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
      body: 'Your notification and chime system is working perfectly!',
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
      'Your notification and chime system is working perfectly!',
      'DAILY_CHECKIN'
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
 * Trigger an immediate, high-priority clinical health insight notification
 * (e.g. Glucose spike from report, PCOS cycle irregularity, high BP, or Parkinson's off-period)
 */
export const triggerHealthInsightNotification = async (payload: HealthInsightPayload) => {
  let title = payload.title;
  let body = payload.body;
  const channelId = payload.category === 'GLUCOSE_SPIKE' || payload.category === 'HYPERTENSION_HIGH' ? REPORTS_CHANNEL_ID : HEALTH_HABITS_CHANNEL_ID;

  if (!title || !body) {
    switch (payload.category) {
      case 'GLUCOSE_SPIKE':
        title = 'Glucose Alert • Dietary Recommendation';
        body = `Elevated glucose detected (${payload.metricValue || '140+'} mg/dL). Tomorrow, prioritize high-fiber vegetables, a 15-minute post-meal walk, and reduce refined carbohydrates and sugars.`;
        break;
      case 'PCOS_IRREGULAR':
        title = 'PCOS Cycle Support • Hormonal Balance';
        body = `Irregular cycle pattern logged (${payload.metricValue || '35+'} days). Tomorrow, incorporate spearmint tea, inositol-rich legumes, anti-inflammatory whole foods, and 20 mins of low-impact walking.`;
        break;
      case 'HYPERTENSION_HIGH':
        title = 'Blood Pressure Alert • Sodium & Nitric Oxide';
        body = `Elevated blood pressure logged (${payload.metricValue || '130'}/${payload.secondaryValue || '85'} mmHg). Limit dietary sodium, increase potassium-rich leafy greens and beets, and practice 10 mins of deep breathing.`;
        break;
      case 'PARKINSON_OFF':
        title = 'Parkinson\'s Alert • Medication & Mobility';
        body = 'Off-period logged. Separate medication from high-protein meals, stay well-hydrated, and practice gentle mobility stretches.';
        break;
      case 'METABOLIC_DAMAGE':
        title = 'Cellular Health Alert • Recovery Protocol';
        body = 'Elevated oxidative load detected today. Activate cellular autophagy tomorrow with a 14-hour overnight fast and antioxidant-rich foods.';
        break;
    }
  }

  // Throttle to avoid repeated triggers within 30 minutes for the same category
  const throttleKey = `mito_insight_throttle_${payload.category}`;
  const lastFired = Number(sessionStorage.getItem(throttleKey) || 0);
  if (Date.now() - lastFired < 30 * 60 * 1000) {
    return;
  }
  sessionStorage.setItem(throttleKey, String(Date.now()));

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
 * Schedule a daily recurring AI Check-in reminder
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
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      msUntilTrigger = scheduledDate.getTime() - now.getTime();
    }

    console.log(`[NotificationScheduler] Web reminder will trigger in ${Math.round(msUntilTrigger / 1000)}s at ${scheduledDate.toLocaleTimeString()}`);

    webCheckinTimer = setTimeout(() => {
      fireWebNotification(
        'Mito Reboot • Daily Health Check-in',
        'Time for your daily metabolic & oncology check-in! Log your habits to keep your cellular defense active.',
        'DAILY_CHECKIN'
      );
      scheduleDailyCheckinReminder(timeStr);
    }, msUntilTrigger);

    return true;
  }
};

/**
 * Schedule recurring Lab / Health Report Upload reminders at 10:00 AM and 5:00 PM
 */
export const scheduleReportUploadReminders = async (): Promise<boolean> => {
  const isEnabled = localStorage.getItem('mito_report_reminder_enabled') !== 'false';
  if (!isEnabled) return false;

  await requestNotificationPermission();

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();

      // Cancel previous report reminders
      await LocalNotifications.cancel({
        notifications: [
          { id: REPORT_UPLOAD_AM_NOTIFICATION_ID },
          { id: REPORT_UPLOAD_PM_NOTIFICATION_ID }
        ]
      }).catch(() => {});

      const now = new Date();

      // 10:00 AM Morning Reminder
      const amDate = new Date();
      amDate.setHours(10, 0, 0, 0);
      if (amDate.getTime() <= now.getTime()) {
        amDate.setDate(amDate.getDate() + 1);
      }

      // 5:00 PM Evening Reminder
      const pmDate = new Date();
      pmDate.setHours(17, 0, 0, 0);
      if (pmDate.getTime() <= now.getTime()) {
        pmDate.setDate(pmDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: REPORT_UPLOAD_AM_NOTIFICATION_ID,
            title: 'Medical Report • Lab Biomarkers',
            body: 'Have new blood test or pathology results today? Upload your lab report to sync biomarker analytics.',
            schedule: {
              at: amDate,
              repeats: true,
              every: 'day',
              allowWhileIdle: true
            },
            channelId: REPORTS_CHANNEL_ID,
            extra: {
              type: 'REPORT_UPLOAD',
              slot: 'AM'
            }
          },
          {
            id: REPORT_UPLOAD_PM_NOTIFICATION_ID,
            title: 'Health Report Reminder',
            body: 'Keep your clinical health records updated. Upload recent diagnostic reports for AI biomarker review.',
            schedule: {
              at: pmDate,
              repeats: true,
              every: 'day',
              allowWhileIdle: true
            },
            channelId: REPORTS_CHANNEL_ID,
            extra: {
              type: 'REPORT_UPLOAD',
              slot: 'PM'
            }
          }
        ]
      });

      console.log('[NotificationScheduler] Scheduled 10 AM and 5 PM report upload reminders');
      return true;
    } catch (err) {
      console.warn('[NotificationScheduler] Failed to schedule report reminders:', err);
      return false;
    }
  }
  return true;
};

/**
 * Schedule essential daily health alerts (Fasting, Stress Reset, Sleep)
 */
export const scheduleEssentialHealthReminders = async (): Promise<boolean> => {
  await requestNotificationPermission();

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();

      // Cancel previous health habit notifications
      await LocalNotifications.cancel({
        notifications: [
          { id: MIDDAY_STRESS_RESET_NOTIFICATION_ID },
          { id: FASTING_WINDOW_NOTIFICATION_ID },
          { id: EVENING_SLEEP_WINDDOWN_NOTIFICATION_ID }
        ]
      }).catch(() => {});

      const now = new Date();

      // 2:00 PM Midday Stress Reset
      const stressDate = new Date();
      stressDate.setHours(14, 0, 0, 0);
      if (stressDate.getTime() <= now.getTime()) stressDate.setDate(stressDate.getDate() + 1);

      // 8:00 PM Circadian Fasting Window Begins
      const fastingDate = new Date();
      fastingDate.setHours(20, 0, 0, 0);
      if (fastingDate.getTime() <= now.getTime()) fastingDate.setDate(fastingDate.getDate() + 1);

      // 9:30 PM Sleep Debt Prevention
      const sleepDate = new Date();
      sleepDate.setHours(21, 30, 0, 0);
      if (sleepDate.getTime() <= now.getTime()) sleepDate.setDate(sleepDate.getDate() + 1);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: MIDDAY_STRESS_RESET_NOTIFICATION_ID,
            title: 'Midday Stillness & Stress Reset',
            body: 'Take 5-10 minutes for mindful stillness or deep breathing to lower cortisol and protect cellular repair.',
            schedule: { at: stressDate, repeats: true, every: 'day', allowWhileIdle: true },
            channelId: HEALTH_HABITS_CHANNEL_ID,
            extra: { type: 'STILLNESS' }
          },
          {
            id: FASTING_WINDOW_NOTIFICATION_ID,
            title: 'Circadian Fasting Window',
            body: 'Start your overnight fast to trigger cellular autophagy and mitochondrial rejuvenation.',
            schedule: { at: fastingDate, repeats: true, every: 'day', allowWhileIdle: true },
            channelId: HEALTH_HABITS_CHANNEL_ID,
            extra: { type: 'FASTING' }
          },
          {
            id: EVENING_SLEEP_WINDDOWN_NOTIFICATION_ID,
            title: 'Sleep & Cellular Recovery',
            body: 'Dim screen lights and wind down for 7-8 hours of restorative sleep to prevent DNA damage.',
            schedule: { at: sleepDate, repeats: true, every: 'day', allowWhileIdle: true },
            channelId: HEALTH_HABITS_CHANNEL_ID,
            extra: { type: 'SLEEP' }
          }
        ]
      });
      return true;
    } catch (err) {
      console.warn('[NotificationScheduler] Failed to schedule essential health alerts:', err);
      return false;
    }
  }
  return true;
};

/**
 * Schedule full-day inactivity / missed log reminder at 7:30 PM
 */
export const scheduleInactivityReminder = async (): Promise<boolean> => {
  await requestNotificationPermission();

  if (Capacitor.isNativePlatform()) {
    try {
      await ensureNotificationChannel();

      await LocalNotifications.cancel({
        notifications: [{ id: INACTIVE_DAY_NOTIFICATION_ID }]
      }).catch(() => {});

      const now = new Date();
      const eveningCheckDate = new Date();
      eveningCheckDate.setHours(19, 30, 0, 0);
      if (eveningCheckDate.getTime() <= now.getTime()) {
        eveningCheckDate.setDate(eveningCheckDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: INACTIVE_DAY_NOTIFICATION_ID,
            title: 'Daily Health Check-in • Incomplete Log',
            body: 'You have not logged your health habits today. Take 60 seconds to complete your check-in and protect your metabolic defense streak.',
            schedule: {
              at: eveningCheckDate,
              repeats: true,
              every: 'day',
              allowWhileIdle: true
            },
            channelId: CHECKIN_CHANNEL_ID,
            extra: {
              type: 'DAILY_CHECKIN'
            }
          }
        ]
      });
      return true;
    } catch (err) {
      console.warn('[NotificationScheduler] Failed to schedule inactivity reminder:', err);
      return false;
    }
  }
  return true;
};

/**
 * Schedule a generic habit reminder
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

      // Register foreground notification listener with dynamic condition checks
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        const type = notification.extra?.type || 'DAILY_CHECKIN';
        const todayStr = new Date().toDateString();

        if (type === 'REPORT_UPLOAD') {
          const lastReport = localStorage.getItem('mito_last_report_upload_date');
          if (lastReport === todayStr) return; // Suppress if already uploaded
        }
        if (type === 'DAILY_CHECKIN') {
          const lastHabit = localStorage.getItem('mito_last_habit_log_date');
          if (lastHabit === todayStr) return; // Suppress if already logged
        }
        if (type === 'FASTING') {
          const lastFasting = localStorage.getItem('mito_fasting_logged_today');
          if (lastFasting === todayStr) return;
        }
        if (type === 'STILLNESS') {
          const lastStillness = localStorage.getItem('mito_stillness_logged_today');
          if (lastStillness === todayStr) return;
        }

        playNotificationChime();
        window.dispatchEvent(new CustomEvent('mito_reminder_triggered', {
          detail: {
            title: notification.title,
            body: notification.body,
            type
          }
        }));
      });

      // Schedule report upload, health habits, and inactivity protection
      await scheduleReportUploadReminders();
      await scheduleEssentialHealthReminders();
      await scheduleInactivityReminder();

      if (!isEnabled || !savedCheckinTime) {
        // User turned off reminders or never configured - ensure cancelled
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
    // Schedule essential reminders for web
    await scheduleReportUploadReminders();
    await scheduleEssentialHealthReminders();
    await scheduleInactivityReminder();

    if (!isEnabled || !savedCheckinTime) {
      if (webCheckinTimer) {
        clearTimeout(webCheckinTimer);
        webCheckinTimer = null;
      }
    } else {
      scheduleDailyCheckinReminder(savedCheckinTime);
    }

    // Web periodic ticker for all recurring checkpoints
    if (!webIntervalChecker) {
      webIntervalChecker = setInterval(() => {
        const now = new Date();
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHH}:${currentMM}`;
        const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()} ${currentTimeStr}`;

        if (lastFiredMinuteStr === minuteKey) return;

        // 1. Check-in reminder
        const checkinEnabled = localStorage.getItem('mito_checkin_reminder_enabled') !== 'false';
        const checkinTime = localStorage.getItem('mito_checkin_reminder_time');
        if (checkinEnabled && checkinTime && currentTimeStr === checkinTime) {
          lastFiredMinuteStr = minuteKey;
          fireWebNotification(
            'Mito Reboot • Daily Health Check-in',
            'Time for your daily metabolic & oncology check-in! Log your habits to keep your cellular defense active.',
            'DAILY_CHECKIN'
          );
          return;
        }

        // 2. Report Upload Reminders (10:00 AM & 5:00 PM)
        if (currentTimeStr === '10:00') {
          lastFiredMinuteStr = minuteKey;
          fireWebNotification(
            'Medical Report • Lab Biomarkers',
            'Have new blood test or pathology results today? Upload your lab report to sync biomarker analytics.',
            'REPORT_UPLOAD'
          );
          return;
        }
        if (currentTimeStr === '17:00') {
          lastFiredMinuteStr = minuteKey;
          fireWebNotification(
            'Health Report Reminder',
            'Keep your clinical health records updated. Upload recent diagnostic reports for AI biomarker review.',
            'REPORT_UPLOAD'
          );
          return;
        }

        // 3. Full-day Inactivity / Missed Log (7:30 PM)
        if (currentTimeStr === '19:30') {
          const lastLogged = localStorage.getItem('mito_last_habit_log_date');
          const todayStr = new Date().toDateString();
          if (lastLogged !== todayStr) {
            lastFiredMinuteStr = minuteKey;
            fireWebNotification(
              'Daily Health Check-in • Incomplete Log',
              'You have not logged your health habits today. Take 60 seconds to complete your check-in and protect your metabolic defense streak.',
              'DAILY_CHECKIN'
            );
            return;
          }
        }

        // 4. Fasting Window (8:00 PM)
        if (currentTimeStr === '20:00') {
          lastFiredMinuteStr = minuteKey;
          fireWebNotification(
            'Circadian Fasting Window',
            'Start your overnight fast to trigger cellular autophagy and mitochondrial rejuvenation.',
            'FASTING'
          );
          return;
        }

        // 5. Midday Stillness (2:00 PM)
        if (currentTimeStr === '14:00') {
          lastFiredMinuteStr = minuteKey;
          fireWebNotification(
            'Midday Stillness & Stress Reset',
            'Take 5-10 minutes for mindful stillness or deep breathing to lower cortisol.',
            'STILLNESS'
          );
          return;
        }
      }, 5000);
    }
  }
};
