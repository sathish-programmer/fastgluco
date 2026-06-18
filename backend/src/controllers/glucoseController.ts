import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { GlucoseReading } from '../models/GlucoseReading';
import { FoodLog } from '../models/FoodLog';
import { GlucoseService } from '../services/glucoseService';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

export class GlucoseController {
  /**
   * Log manual glucose reading
   */
  public static async logManualReading(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { value, timestamp } = req.body;

      if (!value || isNaN(value) || value <= 0) {
        return res.status(400).json({ message: 'A valid glucose value (mg/dL) is required.' });
      }

      const logTime = timestamp ? new Date(timestamp) : new Date();

      const reading = new GlucoseReading({
        userId,
        value,
        timestamp: logTime,
        source: 'Manual'
      });

      await reading.save();

      // Trigger re-analysis of all logs to check if the new manual reading fills gaps
      try {
        await GlucoseService.analyzeAllUserFoodLogs(userId!);
      } catch (err) {
        console.error('Manual reading synchronization warning:', err);
      }

      return res.status(201).json({
        message: 'Glucose reading logged successfully.',
        reading
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'A glucose reading already exists at this timestamp.' });
      }
      return res.status(500).json({ message: error.message || 'Error logging glucose.' });
    }
  }

  /**
   * Get glucose history for charts (Daily, Weekly, Monthly)
   */
  public static async getReadings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { range, startDate, endDate } = req.query; // 'day' | 'week' | 'month' | 'all' or custom dates
      
      const filter: any = { userId };
      const now = new Date();
      let limitDate = new Date();

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate as string);
        if (endDate) filter.timestamp.$lte = new Date(endDate as string);
      } else {
        if (range === 'day') {
          limitDate.setHours(0, 0, 0, 0);
          filter.timestamp = { $gte: limitDate };
        } else if (range === 'week') {
          limitDate.setDate(now.getDate() - 7);
          filter.timestamp = { $gte: limitDate };
        } else if (range === 'month') {
          limitDate.setMonth(now.getMonth() - 1);
          filter.timestamp = { $gte: limitDate };
        }
      }

      // Fetch in chronological order for graphs
      const readings = await GlucoseReading.find(filter).sort({ timestamp: 1 });
      return res.status(200).json(readings);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching glucose readings.' });
    }
  }

  public static async getSpikeAnalysis(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { range } = req.query;

      // Trigger analysis for any pending logs before returning list
      await GlucoseService.analyzeAllUserFoodLogs(userId!);

      const query: any = {
        userId,
        glucoseAnalysis: { $exists: true }
      };

      if (range && range !== 'all') {
        const now = new Date();
        let limitDate = new Date();
        if (range === 'day') {
          limitDate.setHours(0, 0, 0, 0);
          query.loggedAt = { $gte: limitDate };
        } else if (range === 'week') {
          limitDate.setDate(now.getDate() - 7);
          query.loggedAt = { $gte: limitDate };
        } else if (range === 'month') {
          limitDate.setMonth(now.getMonth() - 1);
          query.loggedAt = { $gte: limitDate };
        }
      }

      const logs = await FoodLog.find(query).sort({ loggedAt: -1 });

      return res.status(200).json(logs);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching analysis report.' });
    }
  }

  public static async getTopFoods(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { range } = req.query;
      const analysisReport = await GlucoseService.getTopFoodsReport(userId!, range as string);
      const config = await PaymentGatewayConfig.findOne();
      return res.status(200).json({
        ...analysisReport,
        safeThreshold: config?.safeGlucoseThreshold ?? 90,
        moderateThreshold: config?.moderateGlucoseThreshold ?? 110
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching top foods report.' });
    }
  }

  /**
   * Export Glucose Data as Abbott FreeStyle Libre format CSV
   */
  public static async exportAbbottFormatCSV(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { range } = req.query; // 'day' | 'week' | 'month' | 'all'
      
      const filter: any = { userId };
      const now = new Date();
      let limitDate = new Date();

      if (range === 'day') {
        limitDate.setHours(0, 0, 0, 0);
        filter.timestamp = { $gte: limitDate };
      } else if (range === 'week') {
        limitDate.setDate(now.getDate() - 7);
        filter.timestamp = { $gte: limitDate };
      } else if (range === 'month') {
        limitDate.setMonth(now.getMonth() - 1);
        filter.timestamp = { $gte: limitDate };
      }

      const readings = await GlucoseReading.find(filter).sort({ timestamp: 1 });

      const foodFilter: any = { userId };
      if (filter.timestamp) {
        foodFilter.loggedAt = filter.timestamp;
      }

      const foodLogs = await FoodLog.find(foodFilter).sort({ loggedAt: 1 });

      // Build CSV
      // Headers match Libre View
      let csv = 'Device,Serial Number,Device Timestamp,Record Type,Historic Glucose mg/dL,Scan Glucose mg/dL,Non-numeric Rapid-Acting Insulin,Rapid-Acting Insulin (units),Non-numeric Food,Carbohydrates (grams),Carbohydrates (servings),Non-numeric Long-Acting Insulin,Long-Acting Insulin (units),Notes,Strip Glucose mg/dL,Ketone mmol/L,Meal Insulin (units),Correction Insulin (units),User Change Insulin (units)\n';

      // Readings
      readings.forEach(r => {
        const timestamp = r.timestamp.toISOString().replace('T', ' ').substring(0, 19); // YYYY-MM-DD HH:mm:ss
        csv += `FreeStyle LibreLink,App_Export,${timestamp},0,${r.value},,,,,,,,,,,,,,\n`;
      });

      // Food Logs
      foodLogs.forEach(f => {
        const timestamp = f.loggedAt.toISOString().replace('T', ' ').substring(0, 19);
        csv += `FreeStyle LibreLink,App_Export,${timestamp},5,,,,,${f.name},${f.carbs},,,,,,,,,\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Mito-Reboot-Report-${now.toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csv);

    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error generating export.' });
    }
  }
}
