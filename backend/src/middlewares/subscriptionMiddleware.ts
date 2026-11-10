import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { UserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

// High-performance in-memory cache for subscription permissions to prevent 3 DB queries per request
interface CachedUserSub {
  hasAccess: Record<string, boolean>;
  planName: string;
  planCode: string;
  expiresAt: number;
}

let cachedGlobalSubEnabled: { enabled: boolean; expiresAt: number } | null = null;
const userSubCache = new Map<string, CachedUserSub>();

// Cache TTLs
const GLOBAL_CONFIG_TTL_MS = 60 * 1000; // 60 seconds
const USER_SUB_TTL_MS = 90 * 1000; // 90 seconds

/**
 * Invalidate cached subscription state for a user (call on payment/plan change/webhook)
 */
export const invalidateUserSubscriptionCache = (userId?: string) => {
  if (userId) {
    userSubCache.delete(userId.toString());
  } else {
    userSubCache.clear();
    cachedGlobalSubEnabled = null;
  }
};

/**
 * Access Control middleware to verify if a user holds an active subscription
 * containing access rights to a specific plan feature key.
 */
export const requireSubscriptionFeature = (featureKey: 'unlimitedReports' | 'advancedAnalysis' | 'premiumVideos' | 'foodInsights' | 'exportReports' | 'notifications' | 'foodScanner') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      const nowMs = Date.now();

      // 1. Check cached Global Settings
      if (!cachedGlobalSubEnabled || cachedGlobalSubEnabled.expiresAt < nowMs) {
        const config = await PaymentGatewayConfig.findOne().select('enableSubscriptions').lean();
        cachedGlobalSubEnabled = {
          enabled: !!config?.enableSubscriptions,
          expiresAt: nowMs + GLOBAL_CONFIG_TTL_MS
        };
      }

      // If subscription required is toggled OFF globally, bypass checks immediately
      if (!cachedGlobalSubEnabled.enabled) {
        return next();
      }

      // 2. Check cached user plan access
      const cached = userSubCache.get(userId.toString());
      if (cached && cached.expiresAt > nowMs) {
        if (cached.hasAccess[featureKey]) {
          return next();
        } else {
          return res.status(403).json({
            message: `Your current plan (${cached.planName}) does not include access to this feature. Please upgrade your plan.`,
            featureBlocked: true,
            planCode: cached.planCode
          });
        }
      }

      // 3. Cache miss: Fetch User Active/Trialing Subscription from MongoDB
      const now = new Date();
      const activeSubscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] },
        $or: [
          { status: 'trialing', trialEndDate: { $gte: now } },
          { status: 'active', endDate: { $gte: now } }
        ]
      }).select('planId').lean();

      if (!activeSubscription) {
        return res.status(402).json({
          message: 'An active subscription is required to access this feature.',
          subscriptionRequired: true
        });
      }

      // 4. Fetch Subscription Plan Details
      const plan = await SubscriptionPlan.findById(activeSubscription.planId).select('name code isActive features').lean();
      if (!plan || !plan.isActive) {
        return res.status(402).json({
          message: 'Your active subscription plan is no longer valid. Please choose a new plan.',
          subscriptionRequired: true
        });
      }

      // 5. Cache the resolved features map
      const features: Record<string, boolean> = (plan.features as any) || {};
      userSubCache.set(userId.toString(), {
        hasAccess: features,
        planName: plan.name,
        planCode: plan.code,
        expiresAt: nowMs + USER_SUB_TTL_MS
      });

      // Evict old entries if cache grows large
      if (userSubCache.size > 5000) {
        userSubCache.clear();
      }

      if (!features[featureKey]) {
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
