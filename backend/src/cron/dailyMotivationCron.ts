import { User } from '../models/User';
import { FCMService } from '../services/fcmService';
import { getDailyMotivationForUser } from '../data/dailyMotivationData';

export class DailyMotivationCron {
  /**
   * Run every 15 minutes to evaluate whether users are due for their daily motivation notification.
   * Compares time against user's configured dailyMotivationTime in Indian Standard Time (IST).
   *
   * Suppression rules:
   * 1. If user already opened the app and viewed today's motivation popup, suppress push notification.
   * 2. If user already received today's notification, prevent duplicate push.
   * 3. Respect user push preferences and notification permissions.
   */
  public static async sendDailyMotivationPush(): Promise<void> {
    try {
      const now = new Date();
      // Indian Standard Time (UTC + 5.5 hours)
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const currentHour = istTime.getUTCHours();
      const currentMinute = istTime.getUTCMinutes();

      // Find active, eligible users
      const users = await User.find({
        isBlocked: false,
        isDeleted: false,
        dailyMotivationEnabled: { $ne: false }
      }).select(
        '_id name createdAt notificationPreferences dailyMotivationTime dailyMotivationEnabled ' +
        'lastDailyMotivationSentAt lastDailyMotivationViewedAt dailyMotivationDayOffset dailyMotivationStartDate'
      );

      for (const user of users) {
        try {
          // Check push preference
          const pushPrefs = user.notificationPreferences?.push;
          if (pushPrefs && pushPrefs.dailyMotivation === false) {
            continue;
          }

          // User configured motivation time (default: 08:00 AM)
          const targetTimeStr = user.dailyMotivationTime || user.notificationPreferences?.dailyMotivationTime || '08:00';
          const [targetHour, targetMinute = 0] = targetTimeStr.split(':').map(Number);

          // Allow a matching window (current hour matches, and minute within 15 mins block)
          if (currentHour !== targetHour) {
            continue;
          }
          if (Math.abs(currentMinute - targetMinute) > 15) {
            continue;
          }

          // 1. DUPLICATE CHECK: Did user already receive push notification today (IST)?
          if (user.lastDailyMotivationSentAt) {
            const lastSentIst = new Date(user.lastDailyMotivationSentAt.getTime() + 5.5 * 60 * 60 * 1000);
            if (
              lastSentIst.getUTCDate() === istTime.getUTCDate() &&
              lastSentIst.getUTCMonth() === istTime.getUTCMonth() &&
              lastSentIst.getUTCFullYear() === istTime.getUTCFullYear()
            ) {
              // Already sent today
              continue;
            }
          }

          // 2. SUPPRESSION RULE: Did user already view today's daily motivation in-app?
          if (user.lastDailyMotivationViewedAt) {
            const lastViewedIst = new Date(user.lastDailyMotivationViewedAt.getTime() + 5.5 * 60 * 60 * 1000);
            if (
              lastViewedIst.getUTCDate() === istTime.getUTCDate() &&
              lastViewedIst.getUTCMonth() === istTime.getUTCMonth() &&
              lastViewedIst.getUTCFullYear() === istTime.getUTCFullYear()
            ) {
              console.log(`[DailyMotivationCron] User ${user._id} already viewed Day's motivation in app. Push notification suppressed.`);
              continue;
            }
          }

          // 3. Calculate user's 365-day sequential message
          if (!user.dailyMotivationStartDate) {
            user.dailyMotivationStartDate = now;
            await user.save();
          }
          const { dayNumber, text } = getDailyMotivationForUser(
            user.dailyMotivationStartDate,
            user.dailyMotivationDayOffset || 0
          );

          // 4. Send rich FCM Push Notification
          const sent = await FCMService.sendNotificationToUser(user._id.toString(), {
            title: `Mito Reboot • Day ${dayNumber}`,
            body: text,
            type: 'DailyMotivation',
            data: {
              route: 'DailyMotivation',
              notificationType: 'DailyMotivation',
              dayNumber: String(dayNumber),
              message: text
            }
          });

          if (sent) {
            user.lastDailyMotivationSentAt = now;
            await user.save();
            console.log(`[DailyMotivationCron] Sent Day ${dayNumber} motivation push to user ${user._id}`);
          }
        } catch (userErr) {
          console.error(`[DailyMotivationCron] Error processing user ${user._id}:`, userErr);
        }
      }
    } catch (err) {
      console.error('[DailyMotivationCron] Cron execution error:', err);
    }
  }
}
