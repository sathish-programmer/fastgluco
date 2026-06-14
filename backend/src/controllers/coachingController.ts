import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CoachingSession } from '../models/CoachingSession';
import { FoodLog } from '../models/FoodLog';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

/**
 * Backfills foodName for sessions that don't have it stored.
 * Uses the native MongoDB collection to bypass the soft-delete pre-find hook.
 */
async function backfillFoodNames(sessions: any[]): Promise<any[]> {
  const result = [];
  for (const session of sessions) {
    const plain = session.toObject ? session.toObject() : { ...session };

    // If foodName already set, nothing to do
    if (plain.foodName) {
      result.push(plain);
      continue;
    }

    // Try to get the food name from the populated foodLogId
    const populatedName = plain.foodLogId?.name;
    if (populatedName) {
      plain.foodName = populatedName;
      // Persist so future fetches don't need this lookup
      await CoachingSession.updateOne({ _id: plain._id }, { $set: { foodName: populatedName } });
      result.push(plain);
      continue;
    }

    // foodLogId populate returned null (food log soft-deleted) — use native driver to bypass middleware
    if (session.foodLogId || plain.foodLogId) {
      const rawFoodLogId = plain.foodLogId?._id || plain.foodLogId;
      if (rawFoodLogId) {
        try {
          const raw = await FoodLog.collection.findOne(
            { _id: rawFoodLogId },
            { projection: { name: 1 } }
          );
          if (raw?.name) {
            plain.foodName = raw.name;
            // Persist backfilled name
            await CoachingSession.updateOne({ _id: plain._id }, { $set: { foodName: raw.name } });
          }
        } catch (_) {
          // ignore lookup error
        }
      }
    }

    result.push(plain);
  }
  return result;
}

export class CoachingController {
  /**
   * Get all coaching sessions for a user
   */
  public static async getSessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const sessions = await CoachingSession.find({ userId })
        .populate('foodLogId', 'name loggedAt')
        .sort({ createdAt: -1 });

      const enriched = await backfillFoodNames(sessions);
      return res.status(200).json(enriched);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching coaching sessions.' });
    }
  }

  /**
   * Get all coaching sessions for a user (Admin View)
   */
  public static async getSessionsForUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const sessions = await CoachingSession.find({ userId })
        .populate('foodLogId', 'name loggedAt')
        .sort({ createdAt: -1 });

      const enriched = await backfillFoodNames(sessions);
      return res.status(200).json(enriched);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching coaching sessions for user.' });
    }
  }

  /**
   * Reply to a coaching session
   */
  public static async replyToSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: 'Reply content is required.' });
      }

      const session = await CoachingSession.findOne({ _id: id, userId });
      if (!session) {
        return res.status(404).json({ message: 'Coaching session not found.' });
      }

      if (session.status === 'resolved') {
        return res.status(400).json({ message: 'This coaching session is already resolved.' });
      }

      // Add user reply
      session.messages.push({
        role: 'user',
        content,
        createdAt: new Date()
      });

      // Get associated food log info for hyper-personalization
      let foodData: any = null;
      if (session.foodLogId) {
        try {
          foodData = await FoodLog.findById(session.foodLogId);
          if (!foodData) {
            foodData = await FoodLog.collection.findOne({ _id: session.foodLogId });
          }
        } catch (_) {}
      }

      const foodName = foodData?.name || session.foodName || 'this meal';
      const quantity = foodData?.quantity ?? 1;
      const carbs = Math.round((foodData?.carbs ?? 0) * quantity);
      const protein = Math.round((foodData?.protein ?? 0) * quantity);
      const fiber = Math.round((foodData?.fiber ?? 0) * quantity);
      const peakGlucose = session.peakGlucose;

      const config = await PaymentGatewayConfig.findOne();
      const aiQuestions = config?.aiQuestions && config.aiQuestions.length > 0
        ? config.aiQuestions
        : ["You recently logged a food that spiked your glucose. Why did you consume this when it's advised to avoid it?", "Did you take a walk afterwards?"];

      const nextIndex = session.currentQuestionIndex + 1;

      if (nextIndex < aiQuestions.length) {
        // Stage 1: Ask the next admin question, but prefix it with our hyper-personalized analysis of their last reply
        const activityKeywords = ['walk', 'run', 'gym', 'workout', 'steps', 'active', 'exercise', 'moved', 'moving', 'cardio', 'cycling', 'stairs', 'stretch'];
        const stressKeywords = ['stress', 'anxious', 'sleep', 'tired', 'worry', 'work', 'deadline', 'busy', 'exhausted', 'restless'];
        const hungerKeywords = ['hungry', 'starving', 'empty', 'fast', 'craving', 'sweet', 'skip', 'sugar', 'habit'];
        const sequenceKeywords = ['first', 'order', 'before', 'vegetable', 'salad', 'protein', 'sequence', 'carb'];

        const text = content.toLowerCase();
        const hasActivity = activityKeywords.some(kw => text.includes(kw));
        const hasStress = stressKeywords.some(kw => text.includes(kw));
        const hasHunger = hungerKeywords.some(kw => text.includes(kw));
        const hasSequence = sequenceKeywords.some(kw => text.includes(kw));

        // 1. Analyze Food Macros
        let macroAdvice = '';
        if (carbs > 40) {
          macroAdvice = `Your **${foodName}** was high in carbohydrates (${carbs}g carbs), which breaks down rapidly into glucose.`;
          if (fiber < 4) {
            macroAdvice += ` Since it had low fiber (${fiber}g), there was no physical barrier to slow down absorption in your gut, leading to a steep rise.`;
          } else {
            macroAdvice += ` Although it had ${fiber}g fiber, the overall glycemic load was high enough to spike your levels.`;
          }
        } else {
          macroAdvice = `Even though **${foodName}** had moderate carbs (${carbs}g), other metabolic factors or insulin sensitivity levels might have amplified the glucose response.`;
        }

        // 2. Build Contextual Analysis
        let contextAnalysis = '';
        const detectedContexts: string[] = [];

        if (hasActivity) {
          contextAnalysis += `🏃 **Movement Impact**: You mentioned being active or walking! That's wonderful. Light activity activates GLUT4 receptors in skeletal muscle, allowing them to clear glucose from your blood without needing extra insulin. Since it still spiked, it's possible the carbohydrate load exceeded your current muscle clearance rate.`;
          detectedContexts.push('activity');
        } else {
          contextAnalysis += `🛋️ **Movement Impact**: Since there was no post-meal activity, glucose remained in circulation longer. A simple 10-15 min light walk within 30 minutes of eating acts as a glucose sink, shaving up to 30% off your peak.`;
        }

        if (hasStress) {
          contextAnalysis += `\n\n🧠 **Stress/Sleep Factor**: You mentioned stress, work pressure, or tiredness. Cortisol and adrenaline act as insulin antagonists and trigger the liver to release stored glycogen as glucose, compounding your food spike.`;
          detectedContexts.push('stress');
        }

        if (hasHunger) {
          contextAnalysis += `\n\n🍽️ **Hunger/Satiety**: Feeling very hungry or fasting beforehand can lead to faster eating. This dumps glucose into your duodenum rapidly, causing a sharper peak compared to eating slowly.`;
          detectedContexts.push('hunger');
        }

        if (hasSequence) {
          contextAnalysis += `\n\n🥗 **Sequencing**: You mentioned food ordering. Eating fiber/veggies first, then protein/fats, and carbohydrates last can flatten a glucose spike by up to 73% by delaying gastric emptying.`;
          detectedContexts.push('sequence');
        }

        // 3. Propose Meal Substitutions
        let substitutionTip = '';
        const foodLower = foodName.toLowerCase();
        if (foodLower.includes('white rice') || foodLower.includes('biryani') || foodLower.includes('tamarind rice') || foodLower.includes('rice')) {
          substitutionTip = `💡 **Meal Substitution**: White rice spikes your glucose to ${peakGlucose} mg/dL. Try substituting with **Brown Basmati Rice** or **Cauliflower Rice** next time, or add 20g of fiber/protein to flatten the glycemic curve.`;
        } else if (foodLower.includes('chappati') || foodLower.includes('roti') || foodLower.includes('naan') || foodLower.includes('bread')) {
          substitutionTip = `💡 **Meal Substitution**: Refined flour bread/roti spikes your glucose rapidly. Try swapping it with **Almond Flour Roti** or **Coconut Flour Roti** next time to blunt the curve.`;
        } else if (foodLower.includes('pizza') || foodLower.includes('burger') || foodLower.includes('pasta')) {
          substitutionTip = `💡 **Meal Substitution**: Fast food combinations of simple carbs and fats delay clearance. Swap with a **Whole Wheat or Almond Flour base**, or pair with a double portion of green salad.`;
        } else if (foodLower.includes('sweet') || foodLower.includes('cake') || foodLower.includes('ice cream') || foodLower.includes('sugar') || foodLower.includes('chocolate')) {
          substitutionTip = `💡 **Meal Substitution**: Sugar spikes your levels instantly. Swap with **Stevia-sweetened desserts** or **Dark Chocolate (85%+)**, or eat sweet portions immediately after protein/fiber.`;
        } else if (foodLower.includes('soda') || foodLower.includes('juice') || foodLower.includes('cola') || foodLower.includes('beverage')) {
          substitutionTip = `💡 **Meal Substitution**: Liquid sugars hit the liver immediately. Try swapping with **Sparkling Lemon Water** or **Unsweetened Green Tea**.`;
        }

        // 4. Propose Experiments
        let experimentOption = '';
        if (detectedContexts.length === 0) {
          experimentOption = `Let's test one of these **Metabolic Hacks** next time:\n` +
            `🔹 **Experiment A (Fiber First)**: Eat a salad or green veggies 5 minutes *before* the carbohydrates in your meal.\n` +
            `🔹 **Experiment B (The Glucose Walk)**: Walk at a moderate pace for 10-15 minutes immediately after eating.`;
        } else if (detectedContexts.includes('activity')) {
          experimentOption = `Since you are already active, let's test **Experiment A (Fiber First)**: Eat your fiber/veggies first (or have a handful of almonds before eating carbs) to see if we can flatten the curve further.`;
        } else {
          experimentOption = `Let's commit to **Experiment B (The Glucose Walk)**: Can you commit to a quick 10-minute walk after your next high-carb meal?`;
        }

        const coachResponse = `🤖 **Hyper-Personalized Coach Analysis**\n\n` +
          `${macroAdvice}\n\n` +
          (substitutionTip ? `${substitutionTip}\n\n` : '') +
          `${contextAnalysis}\n\n` +
          `💡 **Proposed Metabolic Experiment:**\n` +
          `${experimentOption}\n\n` +
          `${aiQuestions[nextIndex]}`;

        session.messages.push({
          role: 'assistant',
          content: coachResponse,
          createdAt: new Date()
        });
        session.currentQuestionIndex = nextIndex;
      } else {
        // Stage 2: Finalize the session with their commitment and output the admin-set completion message
        const lowerContent = content.toLowerCase();
        const choseWalk = lowerContent.includes('walk') || lowerContent.includes('b') || lowerContent.includes('exercise');
        const committedHack = choseWalk 
          ? 'The Glucose Walk (10-15m post-meal)' 
          : 'Fiber First (veggies before carbs)';

        const completionMsg = config?.aiCompletionMessage || "Thank you for the context. We have recorded your activity.";

        const finalResponse = `🤖 **Final Coach Summary**\n\n` +
          `${completionMsg}\n\n` +
          `📊 **Metabolic Coach Summary:**\n` +
          `• **Trigger Meal**: ${foodName}\n` +
          `• **Peak Glucose**: ${peakGlucose} mg/dL\n` +
          `• **Macronutrients**: ${carbs}g Carbs | ${protein}g Protein | ${fiber}g Fiber\n` +
          `• **Committed Hack**: ${committedHack}`;

        session.messages.push({
          role: 'assistant',
          content: finalResponse,
          createdAt: new Date()
        });
        session.status = 'resolved';
      }

      await session.save();

      // Enrich response
      const plain = session.toObject();
      if (!plain.foodName && plain.foodLogId) {
        try {
          const raw = await FoodLog.collection.findOne(
            { _id: plain.foodLogId },
            { projection: { name: 1 } }
          );
          if (raw?.name) plain.foodName = raw.name;
        } catch (_) {}
      }

      return res.status(200).json(plain);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error replying to coaching session.' });
    }
  }

  /**
   * Dismiss/resolve a coaching session (user closes the popup without answering)
   */
  public static async dismissSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const session = await CoachingSession.findOne({ _id: id, userId });
      if (!session) {
        return res.status(404).json({ message: 'Coaching session not found.' });
      }

      session.status = 'resolved';
      await session.save();

      return res.status(200).json({ message: 'Session dismissed.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error dismissing session.' });
    }
  }
}
