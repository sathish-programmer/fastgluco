import { User } from '../models/User';
import HabitLog from '../models/HabitLog';
import { FoodLog } from '../models/FoodLog';
import { FCMService } from '../services/fcmService';
import { EmailService } from '../services/emailService';

export class DailyCheckinReminderCron {
  /**
   * Run hourly or every 15 mins to check for users due for their daily metabolic check-in reminder
   */
  public static async sendDailyCheckinReminders() {
    try {
      const now = new Date();
      // Calculate Indian Standard Time (UTC + 5 hours 30 mins)
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const currentHour = istTime.getUTCHours();

      // Start of day in UTC corresponding to midnight IST today
      const startOfDayIst = new Date(istTime);
      startOfDayIst.setUTCHours(0, 0, 0, 0);
      const startOfDayUtc = new Date(startOfDayIst.getTime() - 5.5 * 60 * 60 * 1000);

      // Find active users
      const users = await User.find({
        isBlocked: false,
        isDeleted: false
      }).select('_id name email mobileNumber notificationPreferences checkinReminderTime lastCheckinReminderSentAt');

      for (const user of users) {
        try {
          const userTimeStr = user.checkinReminderTime || user.notificationPreferences?.checkinReminderTime || '20:00';
          const [userHour] = userTimeStr.split(':').map(Number);

          // Only fire during user's target hour
          if (userHour !== currentHour) {
            continue;
          }

          // Check if reminder was already sent today
          if (user.lastCheckinReminderSentAt) {
            const lastSentIst = new Date(user.lastCheckinReminderSentAt.getTime() + 5.5 * 60 * 60 * 1000);
            if (
              lastSentIst.getUTCDate() === istTime.getUTCDate() &&
              lastSentIst.getUTCMonth() === istTime.getUTCMonth() &&
              lastSentIst.getUTCFullYear() === istTime.getUTCFullYear()
            ) {
              continue;
            }
          }

          // Check if user already completed check-in or food log today
          const [hasHabit, hasFood] = await Promise.all([
            HabitLog.findOne({ userId: user._id, timestamp: { $gte: startOfDayUtc } }),
            FoodLog.findOne({ userId: user._id, loggedAt: { $gte: startOfDayUtc } })
          ]);

          if (hasHabit || hasFood) {
            // Already active today; avoid unwanted reminder
            continue;
          }

          const prefs = user.notificationPreferences || {};
          const pushEnabled = prefs.push?.dailyCheckin !== false;
          const emailEnabled = prefs.email?.dailyCheckin === true;

          let didSend = false;

          // 1. Remote Firebase FCM Push
          if (pushEnabled) {
            FCMService.sendNotificationToUser(user._id.toString(), {
              title: 'Mito Reboot • Daily Health Check-in',
              body: 'Time for your daily metabolic check-in! Log your habits to keep your cellular defense active.',
              type: 'LogReminder',
              data: { route: 'DailyCheckin' }
            }).catch(console.error);
            didSend = true;
          }

          // 2. Email Reminder
          if (emailEnabled && user.email) {
            EmailService.sendDailyCheckinEmail(user.email, user.name || 'Valued Patient').catch(console.error);
            didSend = true;
          }

          if (didSend) {
            user.lastCheckinReminderSentAt = now;
            await user.save();
          }
        } catch (userErr) {
          console.error(`[DailyCheckinReminderCron] Error processing user ${user._id}:`, userErr);
        }
      }
    } catch (err) {
      console.error('[DailyCheckinReminderCron] Cron execution error:', err);
    }
  }
}
