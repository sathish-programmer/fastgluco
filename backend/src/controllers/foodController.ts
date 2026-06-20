import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { FoodLog } from '../models/FoodLog';
import { FoodMaster } from '../models/FoodMaster';
import { GlucoseService } from '../services/glucoseService';
import * as FatSecretService from '../services/fatSecretService';
import { GoogleVisionService } from '../services/googleVisionService';
import { determinePortionType } from '../utils/foodUtils';
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

      const foods = await FoodMaster.find(filter).sort({ verified: -1 }).limit(50);
      return res.status(200).json(foods);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error searching food library.' });
    }
  }

  /**
   * Search External Food via FatSecret (fallback when FoodMaster has no results)
   * GET /food-library/external?q=query
   */
  public static async searchFoodExternal(req: AuthRequest, res: Response) {
    try {
      const { q } = req.query;
      if (!q || !(q as string).trim()) {
        return res.status(400).json({ message: 'Search query is required.' });
      }

      const results = await FatSecretService.searchFood((q as string).trim());
      return res.status(200).json({ source: 'FatSecret', results });
    } catch (error: any) {
      console.error('FatSecret search error:', error.message);
      return res.status(500).json({ message: error.message || 'Error searching FatSecret.' });
    }
  }

  /**
   * Get User's Diet Log History
   */
  public static async getLogs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate, mealType } = req.query;

      const query: any = { userId, isDeleted: false };
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
   * If userConfirmed=true and isExternal=true, saves to FoodMaster as verified FatSecret entry.
   */
  public static async createLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        name,
        category,
        mealType,
        calories,
        carbs,
        protein,
        fat,
        fiber,
        quantity,
        unit,
        loggedAt,
        isExternal,
        userConfirmed,
        baseCalories,
        baseCarbs,
        baseProtein,
        baseFat,
        baseFiber,
        baseServingSize,
        baseServingUnit
      } = req.body;

      if (!name || !category || !mealType || calories === undefined || carbs === undefined || protein === undefined || fat === undefined || !quantity || !unit) {
        return res.status(400).json({ message: 'Missing required fields for meal logging.' });
      }

      // Save FatSecret result to FoodMaster only after explicit user confirmation
      if (isExternal && userConfirmed === true && baseCalories !== undefined) {
        try {
          const existing = await FoodMaster.findOne({ name: { $regex: new RegExp(`^${FoodController.escapeRegExp(name)}$`, 'i') } });
          if (!existing) {
            await FoodMaster.create({
              name,
              category: category && category !== 'Custom' ? category : 'Non-Veg',
              calories: baseCalories,
              carbs: baseCarbs || 0,
              protein: baseProtein || 0,
              fat: baseFat || 0,
              fiber: baseFiber || 0,
              servingSize: baseServingSize || 100,
              servingUnit: baseServingUnit || 'g',
              aliases: [name.toLowerCase()],
              verified: true,
              source: 'FatSecret',
              countries: ['Global'],
              portionType: determinePortionType(name)
            });
            console.log(`Saved FatSecret food "${name}" to FoodMaster library (user confirmed).`);
          }
        } catch (dbErr) {
          console.error('Error saving FatSecret food to FoodMaster library:', dbErr);
        }
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
   * Update Food Log
   */
  public static async updateLog(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { name, category, mealType, calories, carbs, protein, fat, fiber, quantity, unit, loggedAt } = req.body;

      if (!name || !category || !mealType || calories === undefined || carbs === undefined || protein === undefined || fat === undefined || !quantity || !unit) {
        return res.status(400).json({ message: 'Missing required fields for meal updating.' });
      }

      const log = await FoodLog.findOne({ _id: id, userId });
      if (!log) {
        return res.status(404).json({ message: 'Food log not found.' });
      }

      log.name = name;
      log.category = category;
      log.mealType = mealType;
      log.calories = calories;
      log.carbs = carbs;
      log.protein = protein;
      log.fat = fat;
      log.fiber = fiber !== undefined ? fiber : 0;
      log.quantity = quantity;
      log.unit = unit;
      if (loggedAt) {
        log.loggedAt = new Date(loggedAt);
      }

      await log.save();

      try {
        await GlucoseService.analyzeFoodLog(log.id);
      } catch (err) {
        console.error('Spike analyzer parsing warning:', err);
      }

      const savedLog = await FoodLog.findById(log.id);
      return res.status(200).json({
        message: 'Meal log updated successfully.',
        log: savedLog
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating food log.' });
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

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Search FoodMaster DB with exact → alias → fuzzy → word-split fallback.
   */
  private static async findFoodInLocalLibrary(detectedName: string) {
    const normalized = detectedName.toLowerCase().trim();

    // 1. Exact match
    let matched = await FoodMaster.findOne({
      name: { $regex: new RegExp(`^${FoodController.escapeRegExp(normalized)}$`, 'i') }
    }).sort({ verified: -1 });
    if (matched) return matched;

    // 2. Alias match
    matched = await FoodMaster.findOne({
      aliases: { $in: [normalized] }
    }).sort({ verified: -1 });
    if (matched) return matched;

    // 3. Fuzzy match: contains search or alias regex
    matched = await FoodMaster.findOne({
      $or: [
        { name: { $regex: new RegExp(FoodController.escapeRegExp(normalized), 'i') } },
        { aliases: { $elemMatch: { $regex: new RegExp(FoodController.escapeRegExp(normalized), 'i') } } }
      ]
    }).sort({ verified: -1 });
    if (matched) return matched;

    // 4. Word-split fallback
    const words = normalized.split(/\s+/).filter(w => w.length >= 3);
    for (const word of words) {
      matched = await FoodMaster.findOne({
        $or: [
          { name: { $regex: new RegExp(FoodController.escapeRegExp(word), 'i') } },
          { aliases: { $elemMatch: { $regex: new RegExp(FoodController.escapeRegExp(word), 'i') } } }
        ]
      }).sort({ verified: -1 });
      if (matched) return matched;
    }

    return null;
  }

  /**
   * Look up a food name: FoodMaster first, then FatSecret.
   * Returns a normalized result item or null.
   */
  private static async resolveFoodItem(detectedName: string, confidence: number) {
    const isLowConfidence = confidence < 0.75;

    // 1. Try FoodMaster (local, fast)
    const localFood = await FoodController.findFoodInLocalLibrary(detectedName);
    if (localFood) {
      return {
        foodName: localFood.name,
        confidence,
        calories: localFood.calories,
        carbs: localFood.carbs,
        protein: localFood.protein,
        fat: localFood.fat,
        fiber: localFood.fiber || 0,
        servingSize: localFood.servingSize,
        servingUnit: localFood.servingUnit,
        category: localFood.category,
        isExternal: false,
        isLowConfidence,
        portionType: localFood.portionType,
        source: 'FoodMaster' as const
      };
    }

    // 2. Fallback to FatSecret
    try {
      const fatSecretResults = await FatSecretService.searchFood(detectedName);
      if (fatSecretResults.length > 0) {
        const best = fatSecretResults[0];
        return {
          foodName: best.name,
          confidence,
          calories: best.calories,
          carbs: best.carbs,
          protein: best.protein,
          fat: best.fat,
          fiber: best.fiber,
          servingSize: best.servingSize,
          servingUnit: best.servingUnit,
          category: best.category,
          isExternal: true,
          isLowConfidence,
          portionType: best.portionType,
          source: 'FatSecret' as const,
          fatSecretId: best.fatSecretId,
          // Multiple variants available — frontend will show picker
          fatSecretVariants: fatSecretResults.length > 1 ? fatSecretResults : undefined
        };
      }
    } catch (fsErr: any) {
      console.error(`FatSecret lookup failed for "${detectedName}":`, fsErr.message);
    }

    // 3. No result found anywhere
    return {
      foodName: detectedName,
      confidence,
      calories: null,
      carbs: null,
      protein: null,
      fat: null,
      fiber: null,
      servingSize: null,
      servingUnit: null,
      category: 'Snacks' as const,
      isExternal: true,
      isLowConfidence: true,
      requiresManualEntry: true,
      portionType: determinePortionType(detectedName),
      source: 'Unknown' as const
    };
  }

  /**
   * Scan Food Image — Google Cloud Vision detects food names only.
   * Nutrition comes from FoodMaster → FatSecret (never AI-generated).
   */
  public static async scanFoodImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No food image file uploaded.' });
      }

      const detectedNames = await GoogleVisionService.detectFoodLabels(req.file.path);

      if (detectedNames.length === 0) {
        return res.status(200).json({
          success: false,
          requiresManualEntry: true,
          message: 'Unable to identify food from image. Please search manually.'
        });
      }

      // Resolve each detected name → FoodMaster first, then FatSecret
      const resultItems = await Promise.all(
        detectedNames
          .filter(d => d.name && d.name.toLowerCase() !== 'unknown')
          .map(d => FoodController.resolveFoodItem(d.name, d.confidence / 100))
      );

      if (resultItems.length === 0) {
        return res.status(200).json({
          success: false,
          requiresManualEntry: true,
          message: 'Unable to identify food from image. Please search manually.'
        });
      }

      return res.status(200).json({
        success: true,
        imageUrl: `/uploads/${req.file.filename}`,
        items: resultItems
      });

    } catch (error: any) {
      console.error('Food scan error:', error);
      return res.status(500).json({ message: error.message || 'Error scanning food image.' });
    }
  }


}
