import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { UserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

/**
 * Access Control middleware to verify if a user holds an active subscription
 * containing access rights to a specific plan feature key.
 */
export const requireSubscriptionFeature = (featureKey: 'unlimitedReports' | 'advancedAnalysis' | 'premiumVideos' | 'foodInsights' | 'exportReports' | 'notifications') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      // 1. Fetch Global Settings
      const config = await PaymentGatewayConfig.findOne();
      
      // If subscription required is toggled OFF globally, bypass checks immediately
      if (!config || !config.enableSubscriptions) {
        return next();
      }

      // 2. Fetch User Active/Trialing Subscription
      const now = new Date();
      const activeSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trialing', 'cancelled'] },
        $or: [
          { endDate: { $gte: now } },
          { trialEndDate: { $gte: now } }
        ]
      });

      if (!activeSubscription) {
        return res.status(402).json({
          message: 'An active subscription is required to access this feature.',
          subscriptionRequired: true
        });
      }

      // 3. Fetch Subscription Plan Details
      const plan = await SubscriptionPlan.findById(activeSubscription.planId);
      if (!plan || !plan.isActive) {
        return res.status(402).json({
          message: 'Your active subscription plan is no longer valid. Please choose a new plan.',
          subscriptionRequired: true
        });
      }

      // 4. Validate Feature Flag
      const features: any = plan.features || {};
      const hasAccess = !!features[featureKey];

      if (!hasAccess) {
        return res.status(403).json({
          message: `Your current plan (${plan.name}) does not include access to this feature. Please upgrade your plan.`,
          featureBlocked: true,
          planCode: plan.code
        });
      }

      // Feature is allowed, proceed
      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({ message: 'Internal server subscription check failed.' });
    }
  };
};
