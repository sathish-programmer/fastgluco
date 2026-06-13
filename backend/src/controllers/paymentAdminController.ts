import { Response } from 'express';
import Razorpay from 'razorpay';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { UserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { FCMService } from '../services/fcmService';
import { EmailService } from '../services/emailService';

export class PaymentAdminController {
  /**
   * Get Payment Configurations (Admin)
   */
  public static async getConfig(req: AuthRequest, res: Response) {
    try {
      let config = await PaymentGatewayConfig.findOne();
      if (!config) {
        // Create initial default configurations
        config = new PaymentGatewayConfig({
          isSandbox: true,
          enablePayments: false,
          enableSubscriptions: false
        });
        await config.save();
      }
      return res.status(200).json(config);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching payment configurations.' });
    }
  }

  /**
   * Save Payment Configurations (Admin)
   */
  public static async updateConfig(req: AuthRequest, res: Response) {
    try {
      const { razorpayKeyId, razorpayKeySecret, isSandbox, enablePayments, enableSubscriptions, gstPercentage, safeGlucoseThreshold, moderateGlucoseThreshold, aiSpikeThreshold, aiQuestions, aiCompletionMessage } = req.body;

      let config = await PaymentGatewayConfig.findOne();
      if (!config) {
        config = new PaymentGatewayConfig({});
      }

      config.razorpayKeyId = razorpayKeyId !== undefined ? razorpayKeyId : config.razorpayKeyId;
      config.razorpayKeySecret = razorpayKeySecret !== undefined ? razorpayKeySecret : config.razorpayKeySecret;
      if (isSandbox !== undefined) config.isSandbox = isSandbox;
      if (enablePayments !== undefined) config.enablePayments = enablePayments;
      if (enableSubscriptions !== undefined) config.enableSubscriptions = enableSubscriptions;
      if (gstPercentage !== undefined) config.gstPercentage = gstPercentage;
      if (safeGlucoseThreshold !== undefined) config.safeGlucoseThreshold = safeGlucoseThreshold;
      if (moderateGlucoseThreshold !== undefined) config.moderateGlucoseThreshold = moderateGlucoseThreshold;
      if (aiSpikeThreshold !== undefined) config.aiSpikeThreshold = aiSpikeThreshold;
      if (aiQuestions !== undefined) config.aiQuestions = aiQuestions;
      if (aiCompletionMessage !== undefined) config.aiCompletionMessage = aiCompletionMessage;
      config.updatedBy = req.user?.id as any;

      await config.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'UPDATE_PAYMENT_CONFIG',
        details: `Updated payment gateway settings. Subscriptions Required = ${config.enableSubscriptions}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Configurations saved successfully.', config });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error saving payment configurations.' });
    }
  }

  /**
   * Compiled Payment Dashboard Analytics (Admin)
   */
  public static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      
      // 1. Core Revenue Calculations
      const transactions = await PaymentTransaction.find({ status: 'success' });
      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      const todayTransactions = transactions.filter(t => t.createdAt >= startOfToday);
      const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);
      const monthTransactions = transactions.filter(t => t.createdAt >= startOfMonth);
      const monthlyRevenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

      // 2. Active / Expired Subscribers Counters
      const activeSubscribers = await UserSubscription.countDocuments({
        status: { $in: ['active', 'trialing', 'cancelled'] },
        $or: [
          { endDate: { $gte: now } },
          { trialEndDate: { $gte: now } }
        ]
      });

      const expiredSubscribers = await UserSubscription.countDocuments({
        status: { $in: ['expired', 'cancelled'] },
        endDate: { $lt: now }
      });

      // 3. Transactions states breakdown
      const pendingPayments = await PaymentTransaction.countDocuments({ status: 'pending' });
      const failedPayments = await PaymentTransaction.countDocuments({ status: 'failed' });
      const refundedPayments = await PaymentTransaction.countDocuments({ status: 'refunded' });

      // 4. Aggregates for Plan-wise Revenue distribution
      const plans = await SubscriptionPlan.find();
      const planWiseRevenue = await Promise.all(plans.map(async (plan) => {
        const planTrans = await PaymentTransaction.find({ planId: plan._id, status: 'success' });
        const revenue = planTrans.reduce((sum, t) => sum + t.amount, 0);
        return {
          name: plan.name,
          value: revenue
        };
      }));

      // 5. Generate Revenue Trend over last 6 months
      const revenueTrend: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const mTrans = transactions.filter(t => t.createdAt >= mStart && t.createdAt <= mEnd);
        const rev = mTrans.reduce((sum, t) => sum + t.amount, 0);

        revenueTrend.push({
          month: monthName,
          revenue: rev
        });
      }

      return res.status(200).json({
        totalRevenue,
        todayRevenue,
        monthlyRevenue,
        activeSubscribers,
        expiredSubscribers,
        pendingPayments,
        failedPayments,
        refundedPayments,
        planWiseRevenue,
        revenueTrend
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error compiles payment analytics stats.' });
    }
  }

  /**
   * List Transactions (Search, Page, Filter by Status)
   */
  public static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const { q, status, page = '1', limit = '10' } = req.query;
      const filter: any = {};

      if (status) {
        filter.status = status as string;
      }

      if (q) {
        // Search on order ID, payment ID
        filter.$or = [
          { gatewayOrderId: { $regex: q as string, $options: 'i' } },
          { gatewayPaymentId: { $regex: q as string, $options: 'i' } }
        ];

        // Also search user details
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: q as string, $options: 'i' } },
            { email: { $regex: q as string, $options: 'i' } }
          ]
        });

        if (matchingUsers.length > 0) {
          const userIds = matchingUsers.map(u => u._id);
          filter.$or.push({ userId: { $in: userIds } });
        }
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;

      const transactions = await PaymentTransaction.find(filter)
        .populate('userId', 'name email')
        .populate('planId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      const total = await PaymentTransaction.countDocuments(filter);

      return res.status(200).json({
        transactions,
        pagination: {
          total,
          page: p,
          limit: l,
          pages: Math.ceil(total / l)
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error listing payments.' });
    }
  }

  /**
   * View transaction Details
   */
  public static async getTransactionById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const transaction = await PaymentTransaction.findById(id)
        .populate('userId', 'name email age gender height weight')
        .populate('planId')
        .populate('subscriptionId');

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found.' });
      }

      return res.status(200).json(transaction);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching payment details.' });
    }
  }

  /**
   * Refund Transaction (Admin)
   */
  public static async refundTransaction(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { amount } = req.body; // Refund amount

      const transaction = await PaymentTransaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found.' });
      }

      if (transaction.status !== 'success') {
        return res.status(400).json({ message: 'Only successful transactions can be refunded.' });
      }

      const refundValue = amount !== undefined ? parseFloat(amount) : transaction.amount;
      if (refundValue <= 0 || refundValue > transaction.amount) {
        return res.status(400).json({ message: 'Invalid refund amount requested.' });
      }

      const config = await PaymentGatewayConfig.findOne();
      const isSandbox = config ? config.isSandbox : true;
      const useRazorpay = !!(
        config && config.enablePayments && config.razorpayKeyId && config.razorpayKeySecret && 
        transaction.gateway === 'razorpay' && !isSandbox
      );

      if (useRazorpay) {
        try {
          // Initialize Razorpay SDK client
          const instance = new Razorpay({
            key_id: config.razorpayKeyId!,
            key_secret: config.razorpayKeySecret!
          });

          // Trigger refund via API SDK
          await instance.payments.refund(transaction.gatewayPaymentId!, {
            amount: refundValue * 100 // paise
          });
        } catch (rzpErr: any) {
          console.warn('Razorpay API refund failed:', rzpErr);
          const rzpMsg = rzpErr?.error?.description || rzpErr?.message || 'Razorpay refund API call failed.';
          throw new Error(rzpMsg);
        }
      }

      // Record refund in DB transaction logs
      transaction.status = 'refunded';
      transaction.refundedAmount = refundValue;
      transaction.refundedAt = new Date();
      await transaction.save();

      // Deactivate associated user subscription
      if (transaction.subscriptionId) {
        const sub = await UserSubscription.findById(transaction.subscriptionId);
        if (sub) {
          sub.status = 'expired';
          await sub.save();
        }
      }

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'REFUND_TRANSACTION',
        details: `Refunded transaction of INR ${refundValue} for user: ${transaction.userId}`,
        ipAddress: req.ip
      });

      // Pushes alert
      await FCMService.sendPushNotification(
        transaction.userId.toString(),
        'Refund Processed',
        `A refund of INR ${refundValue} has been successfully credited to your account.`,
        'RefundProcessed' as any
      );

      // Send refund email confirmation
      const user = await User.findById(transaction.userId);
      if (user && user.email) {
        EmailService.sendRefundEmail(user.email, user.name || 'FastGluco Patient', refundValue).catch(err => console.error('Error sending refund email:', err));
      }

      return res.status(200).json({ message: 'Refund processed successfully.', transaction });
    } catch (error: any) {
      console.error('Refund processing error:', error);
      return res.status(500).json({ message: error.message || 'Error occurred during refund.' });
    }
  }

  /**
   * Cancel User Subscription Manual Overrides (Admin)
   */
  public static async forceCancelSubscription(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // Subscription ID
      const subscription = await UserSubscription.findById(id);

      if (!subscription) {
        return res.status(404).json({ message: 'User subscription record not found.' });
      }

      subscription.status = 'expired';
      subscription.cancelAtPeriodEnd = true;
      await subscription.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'FORCE_CANCEL_SUBSCRIPTION',
        details: `Cancelled active subscription plan for user: ${subscription.userId}`,
        ipAddress: req.ip
      });

      await FCMService.sendPushNotification(
        subscription.userId.toString(),
        'Subscription Cancelled',
        'Your subscription plan has been cancelled by an administrator.',
        'SubscriptionExpired' as any
      );

      // Send email notification
      const user = await User.findById(subscription.userId);
      if (user && user.email) {
        EmailService.sendSubscriptionOverrideEmail(
          user.email,
          user.name || 'FastGluco Patient',
          'cancelled',
          'Your active premium subscription plan has been cancelled by a FastGluco system administrator.'
        ).catch(err => console.error('Error sending cancellation override email:', err));
      }

      return res.status(200).json({ message: 'Subscription cancelled successfully.', subscription });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error occurred during cancellation.' });
    }
  }

  /**
   * Extend User Subscription Interval (Admin)
   */
  public static async extendSubscription(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // Subscription ID
      const { days } = req.body;

      if (!days || isNaN(days) || parseInt(days, 10) <= 0) {
        return res.status(400).json({ message: 'A valid number of days to extend is required.' });
      }

      const subscription = await UserSubscription.findById(id);
      if (!subscription) {
        return res.status(404).json({ message: 'User subscription record not found.' });
      }

      const currentEnd = new Date(subscription.endDate);
      currentEnd.setDate(currentEnd.getDate() + parseInt(days, 10));
      subscription.endDate = currentEnd;
      subscription.status = 'active'; // ensure active status
      await subscription.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'EXTEND_SUBSCRIPTION',
        details: `Extended subscription by ${days} days for user: ${subscription.userId}`,
        ipAddress: req.ip
      });

      await FCMService.sendPushNotification(
        subscription.userId.toString(),
        'Subscription Period Extended!',
        `Your subscription validation period has been extended by ${days} days! Enjoy premium features!`,
        'SubscriptionActivated' as any
      );

      // Send email notification
      const user = await User.findById(subscription.userId);
      if (user && user.email) {
        EmailService.sendSubscriptionOverrideEmail(
          user.email,
          user.name || 'FastGluco Patient',
          'extended',
          `Your subscription validation period has been extended by ${days} days! Enjoy premium features!`
        ).catch(err => console.error('Error sending extension override email:', err));
      }

      return res.status(200).json({ message: `Subscription extended by ${days} days successfully.`, subscription });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error occurred during extension.' });
    }
  }

  /**
   * Upgrade / Downgrade User Plan Manual Override (Admin)
   */
  public static async changeUserPlan(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // Subscription ID
      const { planId, billingCycle } = req.body;

      if (!planId || !billingCycle) {
        return res.status(400).json({ message: 'Plan ID and billing cycle are required.' });
      }

      const subscription = await UserSubscription.findById(id);
      if (!subscription) {
        return res.status(404).json({ message: 'User subscription record not found.' });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan || !plan.isActive) {
        return res.status(404).json({ message: 'Subscription plan template not found.' });
      }

      // Update fields
      subscription.planId = plan._id;
      subscription.billingCycle = billingCycle;
      
      const now = new Date();
      let end = new Date();
      if (billingCycle === 'yearly') {
        end.setDate(now.getDate() + 365);
      } else {
        end.setDate(now.getDate() + 30);
      }
      subscription.endDate = end;
      subscription.status = 'active';
      await subscription.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'CHANGE_USER_PLAN_OVERRIDE',
        details: `Manually altered subscription plan tier to: ${plan.name} (${plan.code}) for user: ${subscription.userId}`,
        ipAddress: req.ip
      });

      await FCMService.sendPushNotification(
        subscription.userId.toString(),
        'Plan Tier Adjusted',
        `Your subscription tier has been adjusted to: ${plan.name}.`,
        'SubscriptionActivated' as any
      );

      // Send email notification
      const user = await User.findById(subscription.userId);
      if (user && user.email) {
        EmailService.sendSubscriptionOverrideEmail(
          user.email,
          user.name || 'FastGluco Patient',
          'changed',
          `Your subscription plan tier has been adjusted to: ${plan.name} (${billingCycle} billing cycle).`
        ).catch(err => console.error('Error sending change override email:', err));
      }

      return res.status(200).json({ message: `Subscription plan manual override succeeded.`, subscription });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error occurred during override.' });
    }
  }
}
