import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { AuditLog } from '../models/AuditLog';

export class PlanAdminController {
  /**
   * List all plans (Admin - includes inactive)
   */
  public static async listPlans(req: AuthRequest, res: Response) {
    try {
      const plans = await SubscriptionPlan.find().sort({ displayOrder: 1 });
      return res.status(200).json(plans);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error listing subscription plans.' });
    }
  }

  /**
   * Create Plan
   */
  public static async createPlan(req: AuthRequest, res: Response) {
    try {
      const { name, code, description, monthlyPrice, yearlyPrice, trialDays, displayOrder, badge, color, features } = req.body;

      if (!name || !code || monthlyPrice === undefined || yearlyPrice === undefined) {
        return res.status(400).json({ message: 'Missing fields required to create plan.' });
      }

      const plan = new SubscriptionPlan({
        name,
        code,
        description,
        monthlyPrice,
        yearlyPrice,
        trialDays: trialDays || 0,
        displayOrder: displayOrder || 0,
        badge: badge || 'None',
        color: color || '#2563EB',
        isActive: true,
        features: {
          unlimitedReports: !!features?.unlimitedReports,
          advancedAnalysis: !!features?.advancedAnalysis,
          premiumVideos: !!features?.premiumVideos,
          foodInsights: !!features?.foodInsights,
          exportReports: !!features?.exportReports,
          notifications: !!features?.notifications,
          aiCoaching: !!features?.aiCoaching,
          foodScanner: !!features?.foodScanner
        }
      });

      await plan.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'CREATE_PLAN',
        details: `Created new subscription plan template: ${name} (${code})`,
        ipAddress: req.ip
      });

      return res.status(201).json({ message: 'Subscription plan created successfully.', plan });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'A plan with this code already exists.' });
      }
      return res.status(500).json({ message: error.message || 'Error creating subscription plan.' });
    }
  }

  /**
   * Edit Plan
   */
  public static async updatePlan(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, monthlyPrice, yearlyPrice, trialDays, displayOrder, badge, color, isActive, features } = req.body;

      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan template not found.' });
      }

      if (name !== undefined) plan.name = name;
      if (description !== undefined) plan.description = description;
      if (monthlyPrice !== undefined) plan.monthlyPrice = monthlyPrice;
      if (yearlyPrice !== undefined) plan.yearlyPrice = yearlyPrice;
      if (trialDays !== undefined) plan.trialDays = trialDays;
      if (displayOrder !== undefined) plan.displayOrder = displayOrder;
      if (badge !== undefined) plan.badge = badge;
      if (color !== undefined) plan.color = color;
      if (isActive !== undefined) plan.isActive = isActive;

      if (features) {
        plan.features = {
          unlimitedReports: features.unlimitedReports !== undefined ? !!features.unlimitedReports : plan.features.unlimitedReports,
          advancedAnalysis: features.advancedAnalysis !== undefined ? !!features.advancedAnalysis : plan.features.advancedAnalysis,
          premiumVideos: features.premiumVideos !== undefined ? !!features.premiumVideos : plan.features.premiumVideos,
          foodInsights: features.foodInsights !== undefined ? !!features.foodInsights : plan.features.foodInsights,
          exportReports: features.exportReports !== undefined ? !!features.exportReports : plan.features.exportReports,
          notifications: features.notifications !== undefined ? !!features.notifications : plan.features.notifications,
          aiCoaching: features.aiCoaching !== undefined ? !!features.aiCoaching : (plan.features as any).aiCoaching,
          foodScanner: features.foodScanner !== undefined ? !!features.foodScanner : (plan.features as any).foodScanner
        };
      }

      await plan.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'UPDATE_PLAN',
        details: `Updated subscription plan template: ${plan.name} (${plan.code})`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Subscription plan updated successfully.', plan });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating subscription plan.' });
    }
  }

  /**
   * Delete Plan
   */
  public static async deletePlan(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const plan = await SubscriptionPlan.findById(id);

      if (!plan) {
        return res.status(404).json({ message: 'Plan template not found.' });
      }

      plan.isDeleted = true;
      await plan.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'DELETE_PLAN',
        details: `Soft deleted subscription plan template: ${plan.name} (${plan.code})`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Subscription plan deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting plan.' });
    }
  }
}
