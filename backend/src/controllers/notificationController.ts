// src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
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
}
