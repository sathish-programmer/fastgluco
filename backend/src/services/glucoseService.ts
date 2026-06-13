import { GlucoseReading } from '../models/GlucoseReading';
import { FoodLog } from '../models/FoodLog';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { User } from '../models/User';
import { EmailService } from './emailService';
import { CoachingSession } from '../models/CoachingSession';
import { Notification } from '../models/Notification';
import { UserSubscription } from '../models/UserSubscription';

export class GlucoseService {
  /**
   * Correlates a specific food log with glucose readings to detect spikes.
   */
  public static async analyzeFoodLog(foodLogId: string): Promise<any> {
    const foodLog = await FoodLog.findById(foodLogId);
    if (!foodLog) throw new Error('Food log entry not found.');

    const mealTime = foodLog.loggedAt;
    const userId = foodLog.userId;

    // 1. Find Before Glucose: Closest reading in range [mealTime - 45 min, mealTime]
    const fortyFiveMinutesAgo = new Date(mealTime.getTime() - 45 * 60 * 1000);
    const beforeReading = await GlucoseReading.findOne({
      userId,
      timestamp: { $gte: fortyFiveMinutesAgo, $lte: mealTime }
    }).sort({ timestamp: -1 }); // Closest to mealTime

    // 2. Find Peak Glucose: Maximum reading in range [mealTime, mealTime + 2 hours]
    const twoHoursLater = new Date(mealTime.getTime() + 2 * 60 * 60 * 1000);
    const postReadings = await GlucoseReading.find({
      userId,
      timestamp: { $gte: mealTime, $lte: twoHoursLater }
    });

    if (postReadings.length === 0) {
      // No readings after meal, unable to analyze spikes yet
      return null;
    }

    let peakReading = postReadings[0];
    for (const r of postReadings) {
      if (r.value > peakReading.value) {
        peakReading = r;
      }
    }

    const beforeGlucose = beforeReading ? beforeReading.value : 80; // Fallback default baseline if missing
    const peakGlucose = peakReading.value;
    const difference = parseFloat((peakGlucose - beforeGlucose).toFixed(1));

    // The net rise is how much glucose actually rose after this meal.
    // If glucose went DOWN or stayed flat, there was no spike from this food.
    const netRise = peakGlucose - beforeGlucose;

    const config = await PaymentGatewayConfig.findOne();
    const safeLimit = config?.safeGlucoseThreshold ?? 90;      // mg/dL rise threshold for Safe
    const moderateLimit = config?.moderateGlucoseThreshold ?? 110; // mg/dL rise threshold for Moderate

    // Spike status is based on net glucose RISE from before-meal baseline.
    // A negative difference (glucose fell) = Safe, no spike.
    // The thresholds compare peakGlucose against absolute levels (not rise).
    // We use BOTH: must have risen AND exceed absolute level.
    let status: 'Safe' | 'Moderate' | 'Avoid' = 'Safe';
    if (netRise > 0) {
      // Only classify as spike if glucose actually rose after the meal
      if (peakGlucose > moderateLimit && netRise > 20) {
        status = 'Avoid';
      } else if (peakGlucose > safeLimit && netRise > 10) {
        status = 'Moderate';
      }
    }
    // If netRise <= 0: glucose dropped or stayed same → status stays 'Safe'

    const analysis = {
      beforeGlucose,
      peakGlucose,
      difference,
      status
    };

    // Store in food log
    foodLog.glucoseAnalysis = analysis;
    await foodLog.save();

    if (status === 'Avoid') {
      const user = await User.findById(userId);
      if (user && user.email) {
        EmailService.sendHighSpikeAlert(
          user.email,
          user.name || 'FastGluco User',
          peakGlucose,
          moderateLimit,
          peakReading.timestamp.toISOString()
        ).catch(console.error);
      }
    }

    // AI Coaching Trigger — only when glucose actually spiked above threshold DUE TO this meal
    const aiSpikeThreshold = config?.aiSpikeThreshold ?? 110;
    if (peakGlucose >= aiSpikeThreshold && netRise > 10) {
      // Must have: (1) peak is high AND (2) glucose actually rose meaningfully after eating
      // 1. Check if user has AI Coaching feature enabled
      const activeSub = await UserSubscription.findOne({ 
        userId, 
        status: 'active',
        endDate: { $gt: new Date() }
      }).populate('planId');

      const plan: any = activeSub?.planId;
      const hasAiCoaching = plan?.features?.aiCoaching === true;

      if (hasAiCoaching) {
        // 2. Check if a coaching session already exists for this food log
        const existingSession = await CoachingSession.findOne({ foodLogId: foodLog.id });
        if (!existingSession) {
          const aiQuestions = config?.aiQuestions && config.aiQuestions.length > 0 
            ? config.aiQuestions 
            : ["You recently logged a food that spiked your glucose. Why did you consume this when it's advised to avoid it?"];
          
          await CoachingSession.create({
            userId,
            foodLogId: foodLog.id,
            foodName: foodLog.name,
            peakGlucose,
            messages: [{ role: 'assistant', content: aiQuestions[0] }],
            currentQuestionIndex: 0,
            status: 'active'
          });

          // Send Notification
          await Notification.create({
            userId,
            title: 'AI Coaching Question',
            body: `We noticed your glucose spiked to ${peakGlucose} mg/dL after ${foodLog.name}. Tap here to respond.`,
            type: 'General',
            isSent: true
          });
        }
      }
    }

    return analysis;
  }

  /**
   * Re-analyzes all food logs for a user (e.g. after new CGM report upload)
   */
  public static async analyzeAllUserFoodLogs(userId: string): Promise<number> {
    const foodLogs = await FoodLog.find({ userId });
    let updatedCount = 0;

    for (const log of foodLogs) {
      const analysis = await this.analyzeFoodLog(log.id);
      if (analysis) updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Aggregates food logs to rank Top Safe, Moderate, and Avoid foods for the Food Analysis Screen.
   */
  public static async getTopFoodsReport(userId: string, range?: string): Promise<{
    safe: Array<{ name: string; count: number; avgPeak: number }>;
    moderate: Array<{ name: string; count: number; avgPeak: number }>;
    avoid: Array<{ name: string; count: number; avgPeak: number }>;
  }> {
    const query: any = {
      userId,
      'glucoseAnalysis.status': { $exists: true }
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

    const logs = await FoodLog.find(query);

    const foodGroups: Record<string, { name: string; peaks: number[]; status: 'Safe' | 'Moderate' | 'Avoid' }> = {};

    for (const log of logs) {
      if (!log.glucoseAnalysis) continue;
      const name = log.name.trim().toLowerCase();
      
      // Standardize casing
      const displayName = log.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      if (!foodGroups[name]) {
        foodGroups[name] = {
          name: displayName,
          peaks: [],
          status: 'Safe'
        };
      }
      foodGroups[name].peaks.push(log.glucoseAnalysis.peakGlucose);
    }

    const result = {
      safe: [] as any[],
      moderate: [] as any[],
      avoid: [] as any[]
    };

    const config = await PaymentGatewayConfig.findOne();
    const safeLimit = config?.safeGlucoseThreshold ?? 90;
    const moderateLimit = config?.moderateGlucoseThreshold ?? 110;

    for (const key in foodGroups) {
      const group = foodGroups[key];
      const avgPeak = group.peaks.reduce((a, b) => a + b, 0) / group.peaks.length;
      
      // Classify aggregated food based on average peak
      let finalStatus: 'Safe' | 'Moderate' | 'Avoid' = 'Safe';
      if (avgPeak > moderateLimit) {
        finalStatus = 'Avoid';
      } else if (avgPeak > safeLimit) {
        finalStatus = 'Moderate';
      }

      const item = {
        name: group.name,
        count: group.peaks.length,
        avgPeak: parseFloat(avgPeak.toFixed(1))
      };

      if (finalStatus === 'Safe') {
        result.safe.push(item);
      } else if (finalStatus === 'Moderate') {
        result.moderate.push(item);
      } else {
        result.avoid.push(item);
      }
    }

    // Sort lists by frequency (count) descending
    result.safe.sort((a, b) => b.count - a.count);
    result.moderate.sort((a, b) => b.count - a.count);
    result.avoid.sort((a, b) => b.count - a.count);

    return result;
  }
}
