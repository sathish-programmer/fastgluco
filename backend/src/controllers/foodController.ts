import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { FoodLog } from '../models/FoodLog';
import { FoodMaster } from '../models/FoodMaster';
import { GlucoseService } from '../services/glucoseService';

export class FoodController {
  /**
   * Search Pre-seeded Food Library
   */
  public static async searchLibrary(req: AuthRequest, res: Response) {
    try {
      const { q, category } = req.query;
      const filter: any = {};

      if (q) {
        filter.name = { $regex: q as string, $options: 'i' };
      }
      if (category) {
        filter.category = category as string;
      }

      const foods = await FoodMaster.find(filter).limit(50);
      return res.status(200).json(foods);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error searching food library.' });
    }
  }

  /**
   * Get User's Diet Log History
   */
  public static async getLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, mealType } = req.query;

      const query: any = { userId };

      // Optional date range filtering
      if (startDate || endDate) {
        query.loggedAt = {};
        if (startDate) {
          query.loggedAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.loggedAt.$lte = new Date(endDate as string);
        }
      }

      if (mealType) {
        query.mealType = mealType as string;
      }

      const logs = await FoodLog.find(query).sort({ loggedAt: -1 });
      return res.status(200).json(logs);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching food logs.' });
    }
  }

  /**
   * Create new Food Log
   */
  public static async createLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, category, mealType, calories, carbs, protein, fat, fiber, quantity, unit, loggedAt } = req.body;

      if (!name || !category || !mealType || calories === undefined || carbs === undefined || protein === undefined || fat === undefined || !quantity || !unit) {
        return res.status(400).json({ message: 'Missing required fields for meal logging.' });
      }

      const logTime = loggedAt ? new Date(loggedAt) : new Date();

      const log = new FoodLog({
        userId,
        name,
        category,
        mealType,
        calories,
        carbs,
        protein,
        fat,
        fiber: fiber || 0,
        quantity,
        unit,
        loggedAt: logTime
      });

      await log.save();

      // Trigger asynchronous analysis to check if glucose readings overlap
      // We run this immediately in the background so the user gets real-time spikes if readings are already uploaded.
      try {
        await GlucoseService.analyzeFoodLog(log.id);
      } catch (err) {
        console.error('Spike analyzer parsing warning:', err);
      }

      const savedLog = await FoodLog.findById(log.id);
      return res.status(201).json({
        message: 'Meal logged successfully.',
        log: savedLog
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error logging food.' });
    }
  }

  /**
   * Record User Accuracy Feedback (Thumbs Up / Thumbs Down)
   */
  public static async recordFeedback(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { isAccurate } = req.body; // true = 👍, false = 👎

      if (isAccurate === undefined) {
        return res.status(400).json({ message: 'Feedback value (isAccurate) is required.' });
      }

      const log = await FoodLog.findOne({ _id: id, userId });
      if (!log) {
        return res.status(404).json({ message: 'Meal log entry not found.' });
      }

      if (!log.glucoseAnalysis) {
        return res.status(400).json({ message: 'Cannot record feedback on logs with no glucose analysis.' });
      }

      log.feedback = {
        isAccurate,
        respondedAt: new Date()
      };

      await log.save();

      return res.status(200).json({
        message: 'Feedback submitted successfully.',
        log
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating log feedback.' });
    }
  }

  /**
   * Soft Delete Food Log
   */
  public static async deleteLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const log = await FoodLog.findOne({ _id: id, userId });
      if (!log) {
        return res.status(404).json({ message: 'Food log not found.' });
      }

      log.isDeleted = true;
      await log.save();

      return res.status(200).json({ message: 'Food log entry deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting log.' });
    }
  }
}
