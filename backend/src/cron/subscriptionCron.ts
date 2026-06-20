import { UserSubscription } from '../models/UserSubscription';
import { User } from '../models/User';
import { EmailService } from '../services/emailService';

export class SubscriptionCron {
  /**
   * Run daily to check for subscriptions expiring soon (7, 2, 1 days)
   * and process subscriptions that have expired.
   */
  public static async checkExpiringSubscriptions() {
    try {
      console.log('[SubscriptionCron] Running Subscription Cron checks...');

      // 1. Send warning alerts for 7, 2, and 1 days before expiry
      const notified7 = await SubscriptionCron.notifyExpiring(7);
      const notified2 = await SubscriptionCron.notifyExpiring(2);
      const notified1 = await SubscriptionCron.notifyExpiring(1);

      console.log(`[SubscriptionCron] Expiry notifications sent: 7 days (${notified7}), 2 days (${notified2}), 1 day (${notified1}).`);

      // 2. Scan and block/expire subscriptions whose end dates have passed
      const expiredCount = await SubscriptionCron.processExpiredSubscriptions();
      console.log(`[SubscriptionCron] Deactivated and notified ${expiredCount} expired subscriptions.`);

    } catch (error) {
      console.error('[SubscriptionCron] Subscription Cron Error:', error);
    }
  }

  /**
   * Helper to identify and notify subscriptions expiring in exactly N days
   */
  private static async notifyExpiring(days: number): Promise<number> {
    const today = new Date();
    const targetStart = new Date(today);
    targetStart.setDate(today.getDate() + days);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(targetStart);
    targetEnd.setHours(23, 59, 59, 999);

    // Find active/trialing subscriptions expiring in exactly the target day
    const expiringSubs = await UserSubscription.find({
      status: { $in: ['active', 'Active', 'trialing', 'Trialing', 'cancelled', 'Cancelled'] },
      endDate: {
        $gte: targetStart,
        $lte: targetEnd
      }
    }).populate('userId');

    let notifiedCount = 0;

    for (const sub of expiringSubs) {
      if (sub.userId) {
        const user: any = sub.userId;
        if (user.email) {
          await EmailService.sendExpiryWarningEmail(user.email, user.name || 'Valued Patient', days);
          notifiedCount++;
        }
      }
    }

    return notifiedCount;
  }

  /**
   * Helper to scan active/trialing subscriptions whose end date is past the current time,
   * transition them to 'expired', and email a confirmation to the user.
   */
  private static async processExpiredSubscriptions(): Promise<number> {
    const now = new Date();

    // Find subscriptions that have passed their expiration date but are still marked active/trialing/cancelled
    const expiredSubs = await UserSubscription.find({
      status: { $in: ['active', 'Active', 'trialing', 'Trialing', 'cancelled', 'Cancelled'] },
      endDate: { $lt: now }
    }).populate('userId');

    let expiredCount = 0;

    for (const sub of expiredSubs) {
      sub.status = 'expired';
      await sub.save();
      expiredCount++;

      if (sub.userId) {
        const user: any = sub.userId;
        if (user.email) {
          await EmailService.sendSubscriptionExpiredEmail(user.email, user.name || 'Valued Patient');
        }
      }
    }

    return expiredCount;
  }
}
