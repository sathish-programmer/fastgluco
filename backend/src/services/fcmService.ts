import admin from '../config/firebaseAdmin';
import { Notification, NotificationType, INotificationMetadata } from '../models/Notification';
import { User } from '../models/User';

export interface SendPushOptions {
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, string>;
  metadata?: INotificationMetadata;
}

export class FCMService {
  /**
   * Send a rich push notification to a specific user across all registered devices
   */
  public static async sendNotificationToUser(
    userId: string,
    options: SendPushOptions
  ): Promise<boolean> {
    const { title, body, type = 'General', data = {}, metadata = {} } = options;

    try {
      // 1. Create in-app notification record in Database
      const notifDoc = await Notification.create({
        userId,
        title,
        body,
        type,
        metadata: {
          ...metadata,
          route: data.route || metadata.route,
          appointmentId: data.appointmentId || metadata.appointmentId,
          orderId: data.orderId || metadata.orderId,
          status: data.status || metadata.status
        },
        isRead: false,
        sentAt: new Date(),
        isSent: true
      });

      // 2. Fetch User and device tokens
      const user = await User.findById(userId);
      if (!user) {
        console.warn(`[FCM] User ${userId} not found, saved in-app notification only.`);
        return false;
      }

      // Collect all valid tokens from fcmTokens array and legacy fcmToken field
      const tokenSet = new Set<string>();
      if (Array.isArray(user.fcmTokens)) {
        user.fcmTokens.forEach((dt) => {
          if (dt && dt.token && typeof dt.token === 'string' && dt.token.trim()) {
            tokenSet.add(dt.token.trim());
          }
        });
      }
      if (user.fcmToken && typeof user.fcmToken === 'string' && user.fcmToken.trim()) {
        tokenSet.add(user.fcmToken.trim());
      }

      const tokens = Array.from(tokenSet);

      if (tokens.length === 0) {
        console.log(`[FCM] No active device tokens registered for user ${userId}. In-app notification saved.`);
        return false;
      }

      // 3. Count unread notifications for iOS badge
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false,
        isDeleted: false
      });

      // 4. Construct payload ensuring strictly string values in data map
      const payloadData: Record<string, string> = {
        notificationType: type,
        notificationId: notifDoc._id.toString(),
        timestamp: new Date().toISOString(),
        ...data
      };

      // Ensure all values are strings
      Object.keys(payloadData).forEach((key) => {
        if (typeof payloadData[key] !== 'string') {
          payloadData[key] = String(payloadData[key]);
        }
      });

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body
        },
        data: payloadData,
        android: {
          priority: 'high',
          notification: {
            channelId: 'mitoreboot_notifications',
            sound: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              sound: 'default',
              badge: unreadCount
            }
          }
        }
      };

      // 5. Send via Firebase Admin Multicast
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Sent notification to user ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed.`);

      // 6. Prune dead or invalid tokens automatically
      if (response.failureCount > 0) {
        const deadTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            console.warn(`[FCM] Token delivery error for token [${tokens[idx].substring(0, 10)}...]:`, errorCode);
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/invalid-argument'
            ) {
              deadTokens.push(tokens[idx]);
            }
          }
        });

        if (deadTokens.length > 0) {
          console.log(`[FCM] Pruning ${deadTokens.length} dead tokens for user ${userId}`);
          await User.updateOne(
            { _id: userId },
            {
              $pull: { fcmTokens: { token: { $in: deadTokens } } },
              ...(deadTokens.includes(user.fcmToken || '') ? { $unset: { fcmToken: 1 } } : {})
            }
          );
        }
      }

      return response.successCount > 0;
    } catch (error) {
      console.error('[FCM] Error dispatching push notification:', error);
      return false;
    }
  }

  /**
   * Backwards-compatible method used across existing controllers
   */
  public static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    type: any = 'General',
    extraData?: Record<string, string>
  ): Promise<boolean> {
    return this.sendNotificationToUser(userId, {
      title,
      body,
      type,
      data: extraData
    });
  }

  /**
   * Broadcast push notification to all active users
   */
  public static async broadcastNotification(
    title: string,
    body: string,
    extraData?: Record<string, string>
  ): Promise<number> {
    try {
      // 1. Create broadcast in-app notification record
      await Notification.create({
        title,
        body,
        type: 'General',
        isRead: false,
        sentAt: new Date(),
        isSent: true
      });

      // 2. Fetch all unique tokens across all active users
      const users = await User.find({
        $or: [
          { 'fcmTokens.0': { $exists: true } },
          { fcmToken: { $exists: true, $ne: '' } }
        ],
        isBlocked: false,
        isDeleted: false
      }).select('fcmTokens fcmToken');

      const allTokens = new Set<string>();
      users.forEach((u) => {
        if (Array.isArray(u.fcmTokens)) {
          u.fcmTokens.forEach((dt) => {
            if (dt && dt.token && dt.token.trim()) allTokens.add(dt.token.trim());
          });
        }
        if (u.fcmToken && u.fcmToken.trim()) {
          allTokens.add(u.fcmToken.trim());
        }
      });

      const tokenList = Array.from(allTokens);
      if (tokenList.length === 0) {
        console.log('[FCM Broadcast] No registered tokens found.');
        return 0;
      }

      console.log(`[FCM Broadcast] Broadcasting to ${tokenList.length} devices...`);

      // 3. Batch dispatch in chunks of 500 (Firebase Multicast limit)
      const batchSize = 500;
      let totalSuccess = 0;

      for (let i = 0; i < tokenList.length; i += batchSize) {
        const batchTokens = tokenList.slice(i, i + batchSize);
        const message: admin.messaging.MulticastMessage = {
          tokens: batchTokens,
          notification: { title, body },
          data: {
            notificationType: 'General',
            route: 'Notifications',
            timestamp: new Date().toISOString(),
            ...(extraData || {})
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'mitoreboot_notifications',
              sound: 'default'
            }
          },
          apns: {
            headers: { 'apns-priority': '10' },
            payload: { aps: { sound: 'default' } }
          }
        };

        const res = await admin.messaging().sendEachForMulticast(message);
        totalSuccess += res.successCount;
      }

      return totalSuccess;
    } catch (error) {
      console.error('[FCM Broadcast] Error broadcasting notification:', error);
      return 0;
    }
  }
}
