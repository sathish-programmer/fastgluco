// src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/authMiddleware';

export class NotificationController {
  /** Get count of unread notifications for the logged‑in user */
  public static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const count = await Notification.countDocuments({ userId: req.user!.id, isRead: false });
      return res.status(200).json({ unreadCount: count });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to get unread count' });
    }
  }

  /** List recent notifications (latest 10) */
  public static async listRecent(req: AuthRequest, res: Response) {
    try {
      const notifications = await Notification.find({ userId: req.user!.id })
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
      await Notification.updateOne({ _id: id, userId: req.user!.id }, { $set: { isRead: true } });
      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to mark as read' });
    }
  }
}
