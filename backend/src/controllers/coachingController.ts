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

      const config = await PaymentGatewayConfig.findOne();
      const aiQuestions = config?.aiQuestions && config.aiQuestions.length > 0
        ? config.aiQuestions
        : ["Why did you consume this?", "Did you walk afterwards?"];

      const nextIndex = session.currentQuestionIndex + 1;

      if (nextIndex < aiQuestions.length) {
        // Ask the next question
        session.messages.push({
          role: 'assistant',
          content: aiQuestions[nextIndex],
          createdAt: new Date()
        });
        session.currentQuestionIndex = nextIndex;
      } else {
        // All questions asked, complete the session
        const completionMsg = config?.aiCompletionMessage || "Thank you for the context. We have recorded your activity.";
        session.messages.push({
          role: 'assistant',
          content: completionMsg,
          createdAt: new Date()
        });
        session.status = 'resolved';
      }

      await session.save();

      // Enrich the response with foodName too
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
