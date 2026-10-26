import { getDailyMotivationForUser } from '../data/dailyMotivationData';

export interface DailyMotivationResponse {
  dayNumber: number;
  message: string;
  totalDays: number;
  hasViewedToday: boolean;
  notificationSentToday: boolean;
  scheduledTime: string;
  pushEnabled: boolean;
}

export class MotivationService {
  /**
   * Retrieves today's daily motivation message.
   * Calls backend API if online and authenticated, falling back to local calculation.
   */
  public static async getTodayMotivation(
    apiUrl: string,
    token?: string | null,
    _userCreatedAt?: string | Date | null
  ): Promise<DailyMotivationResponse> {
    if (apiUrl && token) {
      try {
        const res = await fetch(`${apiUrl}/motivation/today`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('[MotivationService] Backend fetch failed, falling back to local calculation:', err);
      }
    }

    // Local calculation fallback: Ensure Day 1 starts from today for old users, and on first adoption for new users
    const FEATURE_LAUNCH_DATE_STR = '2026-10-26T00:00:00.000Z';
    let userStartDate = localStorage.getItem('mito_daily_motivation_start_date');
    if (!userStartDate || new Date(userStartDate) < new Date(FEATURE_LAUNCH_DATE_STR)) {
      userStartDate = new Date().toISOString();
      localStorage.setItem('mito_daily_motivation_start_date', userStartDate);
    }
    const { dayNumber, text } = getDailyMotivationForUser(userStartDate);
    const todayStr = new Date().toDateString();
    const lastViewed = localStorage.getItem('mito_last_daily_motivation_viewed_date');
    const hasViewedToday = lastViewed === todayStr;

    return {
      dayNumber,
      message: text,
      totalDays: 365,
      hasViewedToday,
      notificationSentToday: false,
      scheduledTime: localStorage.getItem('mito_daily_motivation_time') || '08:00',
      pushEnabled: true
    };
  }

  /**
   * Informs backend that the user viewed today's motivation popup,
   * suppressing that day's scheduled push notification.
   */
  public static async markMotivationViewed(
    apiUrl?: string,
    token?: string | null
  ): Promise<void> {
    const todayStr = new Date().toDateString();
    localStorage.setItem('mito_last_daily_motivation_viewed_date', todayStr);

    if (apiUrl && token) {
      try {
        await fetch(`${apiUrl}/motivation/viewed`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.warn('[MotivationService] Failed to notify backend of viewed motivation:', err);
      }
    }
  }

  /**
   * Updates user daily motivation notification preferences (time and push toggle).
   */
  public static async updatePreferences(
    apiUrl: string,
    token: string,
    prefs: {
      dailyMotivationTime?: string;
      dailyMotivationEnabled?: boolean;
    }
  ): Promise<boolean> {
    if (prefs.dailyMotivationTime) {
      localStorage.setItem('mito_daily_motivation_time', prefs.dailyMotivationTime);
    }

    try {
      const res = await fetch(`${apiUrl}/motivation/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      });
      return res.ok;
    } catch (err) {
      console.warn('[MotivationService] Failed to update preferences on backend:', err);
      return false;
    }
  }
}
