import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

export class NotificationController {
  /** Get count of unread notifications for the logged‑in user */
  public static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const count = await Notification.countDocuments({
        $or: [{ userId: req.user!.id }, { userId: null }, { userId: { $exists: false } }],
        isRead: false,
        isDeleted: false
      });
      return res.status(200).json({ unreadCount: count });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to get unread count' });
    }
  }

  /** List recent notifications (latest 10) */
  public static async listRecent(req: AuthRequest, res: Response) {
    try {
      const notifications = await Notification.find({
        $or: [{ userId: req.user!.id }, { userId: null }, { userId: { $exists: false } }],
        isDeleted: false
      })
        .sort({ createdAt: -1 })
        .limit(10);
      return res.status(200).json(notifications);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to list notifications' });
    }
  }

  /** Mark a notification as read */
  public static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await Notification.updateOne(
        { _id: id, $or: [{ userId: req.user!.id }, { userId: null }, { userId: { $exists: false } }], isDeleted: false },
        { $set: { isRead: true } }
      );
      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to mark as read' });
    }
  }

  /** Mark all notifications as read */
  public static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await Notification.updateMany(
        { $or: [{ userId: req.user!.id }, { userId: null }, { userId: { $exists: false } }], isRead: false, isDeleted: false },
        { $set: { isRead: true } }
      );
      return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to mark notifications as read' });
    }
  }

  /** Delete a notification */
  public static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await Notification.updateOne(
        { _id: id, $or: [{ userId: req.user!.id }, { userId: null }, { userId: { $exists: false } }] },
        { $set: { isDeleted: true } }
      );
      return res.status(200).json({ message: 'Notification deleted' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to delete notification' });
    }
  }

  /** Clear all notifications for the user */
  public static async clearAll(req: AuthRequest, res: Response) {
    try {
      await Notification.updateMany(
        { $or: [{ userId: req.user!.id }, { userId: null }, { userId: { $exists: false } }], isDeleted: false },
        { $set: { isDeleted: true } }
      );
      return res.status(200).json({ message: 'All notifications cleared' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to clear notifications' });
    }
  }

  /**
   * Register or update an FCM device token for the authenticated user
   */
  public static async registerFCMToken(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { token, platform = 'android', deviceId } = req.body;

      if (!token || typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ message: 'A valid FCM token is required.' });
      }

      const trimmedToken = token.trim();
      const validPlatform = ['android', 'ios', 'web'].includes(platform) ? platform : 'android';

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      user.fcmTokens = user.fcmTokens || [];

      // Check if this token already exists for this user
      const existingIdx = user.fcmTokens.findIndex((t) => t.token === trimmedToken);
      if (existingIdx >= 0) {
        user.fcmTokens[existingIdx].platform = validPlatform as any;
        if (deviceId) user.fcmTokens[existingIdx].deviceId = deviceId;
        user.fcmTokens[existingIdx].updatedAt = new Date();
      } else {
        user.fcmTokens.push({
          token: trimmedToken,
          platform: validPlatform as any,
          deviceId: deviceId || undefined,
          updatedAt: new Date()
        });
      }

      // Also maintain legacy single fcmToken field for backward compatibility
      user.fcmToken = trimmedToken;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'FCM token registered successfully.',
        activeTokensCount: user.fcmTokens.length
      });
    } catch (error: any) {
      console.error('Error registering FCM token:', error);
      return res.status(500).json({ message: error.message || 'Failed to register device token.' });
    }
  }

  /**
   * Remove/disassociate an FCM device token on user logout
   */
  public static async removeFCMToken(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Device token is required.' });
      }

      const trimmedToken = token.trim();

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      if (Array.isArray(user.fcmTokens)) {
        user.fcmTokens = user.fcmTokens.filter((t) => t.token !== trimmedToken);
      }

      // If legacy fcmToken matched the removed token, update it to another remaining token or clear it
      if (user.fcmToken === trimmedToken) {
        user.fcmToken = user.fcmTokens && user.fcmTokens.length > 0
          ? user.fcmTokens[user.fcmTokens.length - 1].token
          : undefined;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'FCM token removed successfully.'
      });
    } catch (error: any) {
      console.error('Error removing FCM token:', error);
      return res.status(500).json({ message: error.message || 'Failed to remove device token.' });
    }
  }
}
