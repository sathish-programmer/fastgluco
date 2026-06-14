import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ActivityLog } from '../models/ActivityLog';

export class ActivityController {
  /**
   * Log manual or synced physical activity
   */
  public static async logActivity(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, durationMinutes, steps, caloriesBurned, loggedAt, source } = req.body;

      if (!type) {
        return res.status(400).json({ message: 'Activity type is required.' });
      }
      if (!durationMinutes || isNaN(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({ message: 'A valid duration in minutes is required.' });
      }

      const logTime = loggedAt ? new Date(loggedAt) : new Date();

      const activity = new ActivityLog({
        userId,
        type,
        durationMinutes,
        steps: steps ? parseInt(steps, 10) : undefined,
        caloriesBurned: caloriesBurned ? parseInt(caloriesBurned, 10) : undefined,
        loggedAt: logTime,
        source: source || 'Manual'
      });

      await activity.save();

      return res.status(201).json({
        message: 'Activity logged successfully.',
        activity
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error logging activity.' });
    }
  }

  /**
   * Get activity logs for current user (optionally filtered by range)
   */
  public static async getActivities(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { range, startDate, endDate } = req.query;

      const filter: any = { userId };
      const now = new Date();
      let limitDate = new Date();

      if (startDate || endDate) {
        filter.loggedAt = {};
        if (startDate) filter.loggedAt.$gte = new Date(startDate as string);
        if (endDate) filter.loggedAt.$lte = new Date(endDate as string);
      } else {
        if (range === 'day') {
          limitDate.setHours(0, 0, 0, 0);
          filter.loggedAt = { $gte: limitDate };
        } else if (range === 'week') {
          limitDate.setDate(now.getDate() - 7);
          filter.loggedAt = { $gte: limitDate };
        } else if (range === 'month') {
          limitDate.setMonth(now.getMonth() - 1);
          filter.loggedAt = { $gte: limitDate };
        }
      }

      const activities = await ActivityLog.find(filter).sort({ loggedAt: 1 });
      return res.status(200).json(activities);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching activity logs.' });
    }
  }
}
