import { Request, Response } from 'express';
import { HealthInsight } from '../models/HealthInsight';
import { AuthRequest } from '../middlewares/authMiddleware';

const TEMPLATE_INSIGHTS = [
  "Walking for 10-15 minutes after major meals helps clear circulating glucose, reducing the severity of peak spikes. Try swapping white rice for millets.",
  "Staying hydrated is key! Drinking water before meals can help reduce post-meal glucose spikes and support metabolism.",
  "Pair your carbohydrates with healthy fats or proteins (like nuts, avocado, or eggs) to slow down absorption and blunt the glucose curve.",
  "Getting 7-8 hours of quality sleep per night improves insulin sensitivity and helps stabilize fasting glucose levels.",
  "High stress releases cortisol, which can raise glucose levels even without food. Practice deep breathing for 5 minutes when stressed.",
  "Try to eat your meals in this order: vegetables first, then protein and fats, and carbohydrates last to minimize spike peaks."
];

export class HealthInsightController {
  /** Ensure templates exist in database */
  private static async seedIfNeeded() {
    const count = await HealthInsight.countDocuments();
    if (count === 0) {
      // Seed templates
      const templates = TEMPLATE_INSIGHTS.map(content => ({
        content,
        isTemplate: true,
        isActive: false
      }));
      // Set the first one as active default
      templates[0].isActive = true;
      await HealthInsight.insertMany(templates);
    }
  }

  /** Get the currently active health insight */
  public static async getCurrentInsight(req: Request, res: Response) {
    try {
      await HealthInsightController.seedIfNeeded();
      let insight = await HealthInsight.findOne({ isActive: true });
      if (!insight) {
        insight = await HealthInsight.findOne();
      }
      return res.status(200).json(insight);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to get current insight' });
    }
  }

  /** List all insights (templates & active) for admin */
  public static async listInsights(req: AuthRequest, res: Response) {
    try {
      await HealthInsightController.seedIfNeeded();
      const insights = await HealthInsight.find().sort({ createdAt: -1 });
      return res.status(200).json(insights);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to list insights' });
    }
  }

  /** Set active insight or create a new active one */
  public static async updateActiveInsight(req: AuthRequest, res: Response) {
    try {
      const { content, id } = req.body;

      if (!content && !id) {
        return res.status(400).json({ message: 'Either content or id is required' });
      }

      // Deactivate all first
      await HealthInsight.updateMany({}, { $set: { isActive: false } });

      if (id) {
        // Activate an existing insight/template
        const updated = await HealthInsight.findByIdAndUpdate(
          id,
          { $set: { isActive: true } },
          { new: true }
        );
        return res.status(200).json(updated);
      } else {
        // Create a new custom active insight
        const newInsight = await HealthInsight.create({
          content,
          isActive: true,
          isTemplate: false
        });
        return res.status(201).json(newInsight);
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to update insight' });
    }
  }
}
