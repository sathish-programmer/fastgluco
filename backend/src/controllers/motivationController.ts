import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/User';
import { getDailyMotivationForUser, getDailyMotivationByDay } from '../data/dailyMotivationData';

export class MotivationController {
  /**
   * GET /api/motivation/today
   * Fetches the daily motivation one-liner for the authenticated user's current day in sequence.
   */
  public static async getToday(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const now = new Date();
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

      // If user hasn't started daily motivation yet, initialize their start date to today (so both old and new users start on Day 1)
      if (!user.dailyMotivationStartDate) {
        user.dailyMotivationStartDate = now;
        await user.save();
      }

      const { dayNumber, text } = getDailyMotivationForUser(
        user.dailyMotivationStartDate,
        user.dailyMotivationDayOffset || 0
      );

      // Check if user already viewed today's motivation in-app
      let hasViewedToday = false;
      if (user.lastDailyMotivationViewedAt) {
        const lastViewedIst = new Date(user.lastDailyMotivationViewedAt.getTime() + 5.5 * 60 * 60 * 1000);
        if (
          lastViewedIst.getUTCDate() === istTime.getUTCDate() &&
          lastViewedIst.getUTCMonth() === istTime.getUTCMonth() &&
          lastViewedIst.getUTCFullYear() === istTime.getUTCFullYear()
        ) {
          hasViewedToday = true;
        }
      }

      // Check if push notification was sent today
      let notificationSentToday = false;
      if (user.lastDailyMotivationSentAt) {
        const lastSentIst = new Date(user.lastDailyMotivationSentAt.getTime() + 5.5 * 60 * 60 * 1000);
        if (
          lastSentIst.getUTCDate() === istTime.getUTCDate() &&
          lastSentIst.getUTCMonth() === istTime.getUTCMonth() &&
          lastSentIst.getUTCFullYear() === istTime.getUTCFullYear()
        ) {
          notificationSentToday = true;
        }
      }

      const pushEnabled = user.dailyMotivationEnabled !== false &&
        user.notificationPreferences?.push?.dailyMotivation !== false;

      return res.json({
        success: true,
        data: {
          dayNumber,
          message: text,
          totalDays: 365,
          hasViewedToday,
          notificationSentToday,
          scheduledTime: user.dailyMotivationTime || '08:00',
          pushEnabled
        }
      });
    } catch (err: any) {
      console.error('[MotivationController.getToday] Error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * POST /api/motivation/viewed
   * Informs the backend that the user viewed today's daily motivation popup,
   * which suppresses today's scheduled push notification.
   */
  public static async markViewed(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.lastDailyMotivationViewedAt = new Date();
      await user.save();

      return res.json({
        success: true,
        message: 'Daily motivation acknowledged; push notification suppressed for today'
      });
    } catch (err: any) {
      console.error('[MotivationController.markViewed] Error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * PUT /api/motivation/preferences
   * Updates user preferences for daily motivation time and push notifications.
   */
  public static async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { dailyMotivationTime, dailyMotivationEnabled, dayOffset } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (dailyMotivationTime && typeof dailyMotivationTime === 'string') {
        user.dailyMotivationTime = dailyMotivationTime;
      }
      if (typeof dailyMotivationEnabled === 'boolean') {
        user.dailyMotivationEnabled = dailyMotivationEnabled;
        if (!user.notificationPreferences) user.notificationPreferences = {};
        if (!user.notificationPreferences.push) user.notificationPreferences.push = {};
        user.notificationPreferences.push.dailyMotivation = dailyMotivationEnabled;
      }
      if (typeof dayOffset === 'number') {
        user.dailyMotivationDayOffset = dayOffset;
      }

      await user.save();

      return res.json({
        success: true,
        message: 'Daily motivation preferences updated successfully',
        data: {
          dailyMotivationTime: user.dailyMotivationTime,
          dailyMotivationEnabled: user.dailyMotivationEnabled,
          dayOffset: user.dailyMotivationDayOffset
        }
      });
    } catch (err: any) {
      console.error('[MotivationController.updatePreferences] Error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * GET /api/motivation/day/:dayNumber
   * Preview a specific day's motivation message (1 to 365).
   */
  public static async getByDay(req: AuthRequest, res: Response) {
    try {
      const dayNum = parseInt(req.params.dayNumber, 10);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 365) {
        return res.status(400).json({ success: false, message: 'dayNumber must be between 1 and 365' });
      }

      const item = getDailyMotivationByDay(dayNum);
      return res.json({
        success: true,
        data: item
      });
    } catch (err: any) {
      console.error('[MotivationController.getByDay] Error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
