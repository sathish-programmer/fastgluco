import { UserSubscription } from '../models/UserSubscription';
import { User } from '../models/User';
import { EmailService } from '../services/emailService';

export class SubscriptionCron {
  /**
   * Run daily to check for subscriptions expiring in exactly 3 days.
   * Send a warning email to the user.
   */
  public static async checkExpiringSubscriptions() {
    try {
      console.log('Running Subscription Cron: Checking for expiring plans...');
      
      const today = new Date();
      const threeDaysFromNowStart = new Date(today);
      threeDaysFromNowStart.setDate(today.getDate() + 3);
      threeDaysFromNowStart.setHours(0, 0, 0, 0);

      const threeDaysFromNowEnd = new Date(threeDaysFromNowStart);
      threeDaysFromNowEnd.setHours(23, 59, 59, 999);

      // Find active subscriptions expiring between the start and end of the day 3 days from now
      const expiringSubs = await UserSubscription.find({
        status: 'Active',
        endDate: {
          $gte: threeDaysFromNowStart,
          $lte: threeDaysFromNowEnd
        }
      }).populate('userId');

      let notifiedCount = 0;

      for (const sub of expiringSubs) {
        if (sub.userId) {
          const user: any = sub.userId;
          if (user.email) {
            await EmailService.sendExpiryWarningEmail(user.email, user.name || 'Valued Patient', 3);
            notifiedCount++;
          }
        }
      }

      console.log(`Subscription Cron: Sent ${notifiedCount} expiry warnings.`);
    } catch (error) {
      console.error('Subscription Cron Error:', error);
    }
  }
}
