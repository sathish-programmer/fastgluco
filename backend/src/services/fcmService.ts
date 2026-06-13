import { Notification } from '../models/Notification';
import { User } from '../models/User';

export class FCMService {
  /**
   * Send push notification to a specific user
   */
  public static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    type: 'General' | 'SpikeAlert' | 'LogReminder' | 'ReportProcessed'
  ): Promise<boolean> {
    try {
      // 1. Log to Database for in-app logs
      await Notification.create({
        userId,
        title,
        body,
        type,
        isRead: false,
        sentAt: new Date(),
        isSent: true
      });

      // 2. Fetch User Token
      const user = await User.findById(userId);
      const token = user?.fcmToken;

      console.log(`\n--- [PUSH NOTIFICATION MOCK] ---`);
      console.log(`To User ID: ${userId}`);
      console.log(`FCM Token : ${token || 'NONE_CONFIGURED'}`);
      console.log(`Title     : ${title}`);
      console.log(`Body      : ${body}`);
      console.log(`Category  : ${type}`);
      console.log(`--------------------------------\n`);

      if (!token) {
        return false;
      }

      // TODO: Implement actual firebase-admin FCM sending block here for production:
      // admin.messaging().send({ token, notification: { title, body } })

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Broadcast push notification to all users
   */
  public static async broadcastNotification(title: string, body: string): Promise<number> {
    try {
      // Create notification log in database for each user
      const allUsers = await User.find({});
      for (const u of allUsers) {
        await Notification.create({
          userId: u._id,
          title,
          body,
          type: 'General',
          isRead: false,
          sentAt: new Date(),
          isSent: true
        });
      }

      const users = await User.find({ fcmToken: { $exists: true, $ne: '' } });
      console.log(`\n--- [BROADCAST NOTIFICATION MOCK] ---`);
      console.log(`Sending to ${users.length} registered device tokens...`);
      console.log(`Title: ${title}`);
      console.log(`Body : ${body}`);
      console.log(`-------------------------------------\n`);

      return users.length;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return 0;
    }
  }
}
