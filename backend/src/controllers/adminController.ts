import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthController } from './authController';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { AdminUser } from '../models/AdminUser';
import { User } from '../models/User';
import { FoodLog } from '../models/FoodLog';
import { FoodMaster } from '../models/FoodMaster';
import { CGMReport } from '../models/CGMReport';
import { Video } from '../models/Video';
import { Guide } from '../models/Guide';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { FAQ } from '../models/FAQ';
import { SupportTicket } from '../models/SupportTicket';
import { LegalDocument } from '../models/LegalDocument';
import { EmailService } from '../services/emailService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { FCMService } from '../services/fcmService';
import { Doctor } from '../models/Doctor';
import { Vendor } from '../models/Vendor';
import { Appointment } from '../models/Appointment';
import ShopOrder from '../models/ShopOrder';
import ShopProduct from '../models/ShopProduct';
import { AppOtpTelemetry } from '../models/AppOtpTelemetry';
import { UserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { Coupon } from '../models/Coupon';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { Invoice } from '../models/Invoice';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export class AdminController {
  /**
   * Admin Login
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const admin = await AdminUser.findOne({ email });
      if (!admin) {
        return res.status(401).json({ message: 'Invalid admin credentials.' });
      }

      if (admin.isBlocked) {
        return res.status(403).json({ message: 'This administrative account is suspended.' });
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid admin credentials.' });
      }

      const payload: any = { id: admin._id, email: admin.email, role: admin.role };
      if (admin.laboratoryId) {
        payload.laboratoryId = admin.laboratoryId;
      }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      // Determine platform context (location/device/time)
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      let location = 'Unknown Location';
      if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        location = `Localhost/Local Network (${ip})`;
      } else {
        location = `${ip} (Estimated Location)`;
      }

      const userAgent = req.headers['user-agent'] || '';
      let device = 'Browser / Web App';
      if (/okhttp|retrofit|dart|flutter|react-native|expo|android|iphone|ipad/i.test(userAgent)) {
        device = 'Mobile App';
      }
      if (userAgent) {
        let browser = 'Unknown Browser';
        if (userAgent.includes('Firefox')) {
          browser = 'Firefox';
        } else if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
          browser = 'Chrome';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
          browser = 'Safari';
        } else if (userAgent.includes('Edge')) {
          browser = 'Edge';
        } else if (userAgent.includes('Postman')) {
          browser = 'Postman API Client';
        }
        device = `${device} (${browser})`;
      }

      const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }) + ' (IST)';

      // Dispatch security notification email with 2-hour rate-limiting
      const now = new Date();
      const loginAlertIntervalMs = 2 * 60 * 60 * 1000; // 2 hours
      let shouldSendEmail = true;
      if (admin.lastLoginAlertSentAt) {
        const timeDiff = now.getTime() - new Date(admin.lastLoginAlertSentAt).getTime();
        if (timeDiff < loginAlertIntervalMs) {
          shouldSendEmail = false;
        }
      }

      if (shouldSendEmail) {
        admin.lastLoginAlertSentAt = now;
        await admin.save();
        // Disabled sending admin login emails to avoid noise
      }

      return res.status(200).json({
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during admin login.' });
    }
  }

  /**
   * Admin Registration
   */
  public static async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }

      // Check if admin already exists
      const existingAdmin = await AdminUser.findOne({ email });
      if (existingAdmin) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const admin = new AdminUser({
        name,
        email,
        passwordHash,
        role: role || 'Admin'
      });

      await admin.save();

      const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'Admin account created successfully.',
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during admin registration.' });
    }
  }

  /**
   * Get Dashboard Statistics
   */
  public static async getStats(req: AuthRequest, res: Response) {
    try {
      const totalUsers = await User.countDocuments();
      
      // Active Users: logged food or uploaded reports in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activeUserIds = await FoodLog.distinct('userId', { loggedAt: { $gte: sevenDaysAgo } });
      const activeReportUserIds = await CGMReport.distinct('userId', { createdAt: { $gte: sevenDaysAgo } });
      
      const combinedActiveIds = new Set([...activeUserIds.map(id => id.toString()), ...activeReportUserIds.map(id => id.toString())]);
      const activeUsers = combinedActiveIds.size;

      const reportsUploaded = await CGMReport.countDocuments();
      const foodLogs = await FoodLog.countDocuments();

      // Simple category breakdown for stats
      const categoryStats = await FoodLog.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      // NEW DASHBOARD CARDS CALCULATIONS
      const totalPatients = totalUsers;
      const totalDoctors = await Doctor.countDocuments({ isDeleted: false });
      
      // Today's Date String: YYYY-MM-DD in local time
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;
      
      const todayAppointments = await Appointment.countDocuments({ date: todayString, status: { $ne: 'cancelled' } });
      
      const pendingOrders = await ShopOrder.countDocuments({ 
        deliveryStatus: { $in: ['pending', 'assigned', 'accepted', 'packed', 'shipped'] } 
      });

      const ordersRevenue = await ShopOrder.aggregate([
        { $match: { deliveryStatus: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const revenue = ordersRevenue[0]?.total || 0;

      const lowStockProducts = await ShopProduct.countDocuments({
        $or: [
          { stock: { $lte: 5 } },
          { 'variants.stock': { $lte: 5 } }
        ]
      });

      const activeVendors = await Vendor.countDocuments({ isActive: true });

      // Most recently registered doctor (for notification center)
      const recentDoctor = await Doctor.findOne({ isDeleted: false })
        .sort({ createdAt: -1 })
        .select('name specialty createdAt')
        .lean();

      const deliveredOrders = await ShopOrder.countDocuments({ deliveryStatus: 'delivered' });

      return res.status(200).json({
        totalUsers,
        activeUsers,
        reportsUploaded,
        foodLogs,
        categoryBreakdown: categoryStats,
        
        // Extended layout KPIs
        totalPatients,
        totalDoctors,
        todayAppointments,
        pendingOrders,
        revenue,
        lowStockProducts,
        activeVendors,
        recentDoctor,
        deliveredOrders
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error compiling dashboard statistics.' });
    }
  }

  /**
   * List Users (Paginated & Searchable with Subscription Status)
   */
  public static async getUsers(req: AuthRequest, res: Response) {
    try {
      const { q, page = '1', limit = '10', cancerJourney, subStatus } = req.query;
      const filter: any = {};

      if (cancerJourney) {
        filter.cancerJourney = cancerJourney;
      }

      if (q) {
        filter.$or = [
          { name: { $regex: q as string, $options: 'i' } },
          { email: { $regex: q as string, $options: 'i' } },
          { phoneNumber: { $regex: q as string, $options: 'i' } }
        ];
      }

      const p = Math.max(1, parseInt(page as string, 10) || 1);
      const l = Math.max(1, parseInt(limit as string, 10) || 10);
      const skip = (p - 1) * l;
      const now = new Date();

      // Subscription status filtering
      if (subStatus && subStatus !== 'all') {
        let matchingUserIds: any[] = [];
        if (subStatus === 'active') {
          const subs = await UserSubscription.find({
            status: 'active',
            endDate: { $gte: now },
            isDeleted: false
          }).select('userId');
          matchingUserIds = subs.map(s => s.userId);
        } else if (subStatus === 'trialing') {
          const subs = await UserSubscription.find({
            status: 'trialing',
            trialEndDate: { $gte: now },
            isDeleted: false
          }).select('userId');
          matchingUserIds = subs.map(s => s.userId);
        } else if (subStatus === 'trial_expired') {
          const activeSubs = await UserSubscription.find({
            status: 'active',
            endDate: { $gte: now },
            isDeleted: false
          }).select('userId');
          const activeUserIds = new Set(activeSubs.map(s => s.userId.toString()));

          const trialSubs = await UserSubscription.find({
            trialStartDate: { $exists: true, $ne: null },
            $or: [
              { trialEndDate: { $lt: now } },
              { status: { $in: ['trialing', 'expired'] } }
            ],
            isDeleted: false
          }).select('userId');

          matchingUserIds = trialSubs
            .map(s => s.userId)
            .filter(id => !activeUserIds.has(id.toString()));
        } else if (subStatus === 'cancelled') {
          const subs = await UserSubscription.find({
            status: 'cancelled',
            isDeleted: false
          }).select('userId');
          matchingUserIds = subs.map(s => s.userId);
        } else if (subStatus === 'none') {
          const anySubs = await UserSubscription.find({
            isDeleted: false
          }).select('userId');
          const subUserIds = anySubs.map(s => s.userId);
          filter._id = { $nin: subUserIds };
        }

        if (subStatus !== 'none') {
          if (filter._id) {
            filter._id = { $in: matchingUserIds, ...filter._id };
          } else {
            filter._id = { $in: matchingUserIds };
          }
        }
      }

      const users = await User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      const total = await User.countDocuments(filter);

      // Attach populated subscription details for each listed user
      const userIds = users.map(u => u._id);
      const subscriptions = await UserSubscription.find({
        userId: { $in: userIds },
        isDeleted: false
      }).populate('planId', 'name yearlyPrice code trialHours trialDays badge color').sort({ createdAt: -1 });

      const subMap = new Map();
      for (const sub of subscriptions) {
        if (!subMap.has(sub.userId.toString())) {
          subMap.set(sub.userId.toString(), sub);
        }
      }

      const usersWithSub = users.map(u => {
        const sub: any = subMap.get(u._id.toString());
        const uObj = u.toObject();
        let status = 'none';
        let statusLabel = 'Free User';
        let remainingText = '';

        if (sub) {
          if (sub.status === 'active' && new Date(sub.endDate) > now) {
            status = 'active';
            const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            statusLabel = 'Active Paid';
            remainingText = `${daysLeft} days left`;
          } else if (sub.status === 'trialing' && sub.trialEndDate && new Date(sub.trialEndDate) > now) {
            status = 'trialing';
            const hoursLeft = Math.max(0, Math.ceil((new Date(sub.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60)));
            statusLabel = 'Free Trial';
            remainingText = `${hoursLeft}h left`;
          } else if (sub.status === 'trialing' || (sub.trialStartDate && (!sub.endDate || new Date(sub.endDate) <= now))) {
            status = 'trial_expired';
            statusLabel = 'Trial Expired';
          } else if (sub.status === 'cancelled') {
            const isActivePeriod = new Date(sub.endDate) > now;
            status = isActivePeriod ? 'cancelled_active' : 'cancelled';
            statusLabel = isActivePeriod ? 'Cancelled (Active)' : 'Cancelled';
            if (isActivePeriod) {
              const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
              remainingText = `${daysLeft} days left`;
            }
          } else {
            status = 'expired';
            statusLabel = 'Expired';
          }
        }

        return {
          ...uObj,
          subscription: sub ? {
            _id: sub._id,
            planName: sub.planId?.name || 'Annual Plan',
            planCode: sub.planId?.code || 'yearly',
            status: sub.status,
            billingCycle: sub.billingCycle,
            startDate: sub.startDate,
            endDate: sub.endDate,
            trialStartDate: sub.trialStartDate,
            trialEndDate: sub.trialEndDate,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd
          } : null,
          subscriptionSummary: {
            status,
            statusLabel,
            remainingText,
            planName: sub?.planId?.name || (status === 'none' ? 'None' : 'Standard')
          }
        };
      });

      const pages = Math.ceil(total / l) || 1;

      return res.status(200).json({
        users: usersWithSub,
        total,
        page: p,
        limit: l,
        pages,
        pagination: {
          total,
          page: p,
          limit: l,
          pages
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error listing users.' });
    }
  }

  /**
   * Cancel User Subscription as Admin
   */
  public static async cancelUserSubscription(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { immediate = false, reason = 'Cancelled by Admin' } = req.body;
      const adminEmail = req.user?.email || 'admin';
      const now = new Date();

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const subscription = await UserSubscription.findOne({
        userId: id,
        status: { $in: ['active', 'trialing'] },
        $or: [
          { status: 'trialing', trialEndDate: { $gte: now } },
          { status: 'active', endDate: { $gte: now } }
        ],
        isDeleted: false
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No active or trialing subscription found for this user.' });
      }

      if (immediate) {
        subscription.status = 'cancelled';
        subscription.cancelAtPeriodEnd = true;
        subscription.endDate = now;
        if (subscription.trialEndDate) {
          subscription.trialEndDate = now;
        }
      } else {
        subscription.status = 'cancelled';
        subscription.cancelAtPeriodEnd = true;
      }

      await subscription.save();

      let adminId = req.user?.id;
      if (!adminId) {
        const fallbackAdmin = await AdminUser.findOne().select('_id');
        adminId = fallbackAdmin?._id?.toString();
      }

      if (adminId) {
        await AuditLog.create({
          adminId,
          adminEmail,
          adminName: (req.user as any)?.name || 'Admin',
          action: 'CANCEL_USER_SUBSCRIPTION',
          entityType: 'Settings',
          entityId: user._id.toString(),
          details: `Cancelled subscription. Immediate: ${immediate}. Reason: ${reason || 'N/A'}`
        }).catch((err) => console.warn('[AuditLog Error]:', err.message));
      }

      return res.status(200).json({
        message: immediate ? 'Subscription cancelled immediately.' : 'Subscription cancelled. Access remains active until billing period ends.',
        subscription
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error cancelling subscription.' });
    }
  }

  /**
   * Add / Grant / Extend User Subscription as Admin
   */
  public static async addUserSubscription(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { planId, durationDays = 365, type = 'paid', note = 'Granted by Admin', customEndDate } = req.body;
      const adminEmail = req.user?.email || 'admin';
      const now = new Date();

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      let plan = null;
      if (planId) {
        plan = await SubscriptionPlan.findById(planId);
      }
      if (!plan) {
        plan = await SubscriptionPlan.findOne({ isActive: true, isDeleted: false }).sort({ displayOrder: 1 });
      }
      if (!plan) {
        return res.status(404).json({ message: 'No active subscription plan found in system.' });
      }

      // Mark any prior active or trialing records as expired
      await UserSubscription.updateMany(
        { userId: id, status: { $in: ['active', 'trialing'] } },
        { $set: { status: 'expired' } }
      );

      let endDate: Date;
      if (customEndDate) {
        endDate = new Date(customEndDate);
        if (isNaN(endDate.getTime()) || endDate.getTime() <= now.getTime()) {
          return res.status(400).json({ message: 'Custom end date must be a valid future date and time.' });
        }
      } else {
        const days = parseInt(durationDays as any, 10) || (type === 'trial' ? 2 : 365);
        endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      }

      const effectiveDays = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

      const newSub = new UserSubscription({
        userId: user._id,
        planId: plan._id,
        billingCycle: effectiveDays >= 365 ? 'yearly' : 'monthly',
        status: type === 'trial' ? 'trialing' : 'active',
        startDate: now,
        endDate,
        trialStartDate: type === 'trial' ? now : undefined,
        trialEndDate: type === 'trial' ? endDate : undefined,
        cancelAtPeriodEnd: false
      });

      await newSub.save();

      let adminId = req.user?.id;
      if (!adminId) {
        const fallbackAdmin = await AdminUser.findOne().select('_id');
        adminId = fallbackAdmin?._id?.toString();
      }

      if (adminId) {
        await AuditLog.create({
          adminId,
          adminEmail,
          adminName: (req.user as any)?.name || 'Admin',
          action: 'GRANT_USER_SUBSCRIPTION',
          entityType: 'Settings',
          entityId: user._id.toString(),
          details: `Granted ${type} subscription until ${endDate.toISOString()} (${effectiveDays} days, ${plan.name}). Note: ${note}`
        }).catch((err) => console.warn('[AuditLog Error]:', err.message));
      }

      return res.status(200).json({
        message: `Successfully granted ${type === 'trial' ? 'free trial' : 'subscription'} until ${endDate.toLocaleDateString()} (${effectiveDays} days)!`,
        subscription: newSub
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error granting subscription.' });
    }
  }

  /**
   * Send Exclusive Subscription Coupon to User via Email
   */
  public static async sendCouponToUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        code,
        discountType = 'percentage',
        discountValue = 100,
        expiryDate,
        message
      } = req.body;
      const adminEmail = req.user?.email || 'admin';

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      if (!user.email) {
        return res.status(400).json({ message: 'Target user does not have an email address.' });
      }

      // Clean or auto-generate unique coupon code
      let cleanCode = (code || '').toString().trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (!cleanCode) {
        cleanCode = `MITO-VIP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      }

      const numValue = Math.max(0, parseFloat(discountValue) || 100);
      const type = discountType === 'fixed' ? 'fixed' : 'percentage';

      let parsedExpiry: Date | undefined = undefined;
      if (expiryDate) {
        parsedExpiry = new Date(expiryDate);
        if (isNaN(parsedExpiry.getTime())) {
          return res.status(400).json({ message: 'Invalid expiry date format.' });
        }
      }

      // Create or update coupon in DB
      const coupon = await Coupon.findOneAndUpdate(
        { code: cleanCode },
        {
          code: cleanCode,
          discountType: type,
          discountValue: numValue,
          expiryDate: parsedExpiry,
          maxRedemptions: 1,
          redemptionsCount: 0,
          isActive: true,
          isGlobal: true,
          isDeleted: false
        },
        { upsert: true, new: true }
      );

      const discountText = type === 'percentage'
        ? (numValue >= 100 ? '100% Free Access (Full 1-Year Membership)' : `${numValue}% OFF`)
        : `₹${numValue} OFF`;

      // Dispatch customized branded email
      await EmailService.sendIndividualCouponEmail({
        email: user.email,
        name: user.name || 'Valued Member',
        couponCode: cleanCode,
        discountText,
        expiryDate: parsedExpiry,
        customMessage: message
      });

      let adminId = req.user?.id;
      if (!adminId) {
        const fallbackAdmin = await AdminUser.findOne().select('_id');
        adminId = fallbackAdmin?._id?.toString();
      }

      if (adminId) {
        await AuditLog.create({
          adminId,
          adminEmail,
          adminName: (req.user as any)?.name || 'Admin',
          action: 'SEND_USER_COUPON',
          entityType: 'Settings',
          entityId: user._id.toString(),
          details: `Sent individual coupon ${cleanCode} (${discountText}) expiring ${parsedExpiry ? parsedExpiry.toISOString() : 'Never'}`
        }).catch((err) => console.warn('[AuditLog Error]:', err.message));
      }

      return res.status(200).json({
        message: `Coupon code '${cleanCode}' successfully emailed to ${user.email}!`,
        coupon
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error generating and sending coupon.' });
    }
  }

  /**
   * Block / Unblock User
   */
  public static async toggleUserBlock(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isBlocked, reason } = req.body; // true to block, false to unblock

      if (isBlocked === undefined) {
        return res.status(400).json({ message: 'isBlocked status is required.' });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      user.isBlocked = isBlocked;
      await user.save();

      if (isBlocked && user.email) {
        const blockReason = reason || 'Account policy violation or administrative action.';
        EmailService.sendBlockNotificationEmail(user.email, user.name || 'User', blockReason).catch(console.error);
      } else if (!isBlocked && user.email) {
        EmailService.sendUnblockNotificationEmail(user.email, user.name || 'User').catch(console.error);
      }

      // Log the activity to administrative audit logs
      await AuditLog.create({
        adminId: req.user?.id,
        action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
        details: `${isBlocked ? 'Blocked' : 'Unblocked'} user account for: ${user.email}. Reason: ${reason || 'N/A'}`,
        ipAddress: req.ip
      });

      return res.status(200).json({
        message: `User account has been successfully ${isBlocked ? 'blocked' : 'unblocked'}.`,
        user: { id: user._id, name: user.name, email: user.email, isBlocked: user.isBlocked }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating user status.' });
    }
  }

  /**
   * Delete User account and records permanently
   */
  public static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      await User.deleteOne({ _id: id });
      
      // Clean up related user records to prevent orphan data
      await FoodLog.deleteMany({ userId: id });
      await CGMReport.deleteMany({ userId: id });
      await Notification.deleteMany({ userId: id });

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'DELETE_USER',
        details: `Deleted user account and records for: ${user.email}`,
        ipAddress: req.ip
      });

      return res.status(200).json({
        message: 'User account and associated records have been successfully deleted.'
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting user.' });
    }
  }

  /**
   * Food Library - Add Food
   */
  public static async addFoodMaster(req: AuthRequest, res: Response) {
    try {
      const { name, category, calories, carbs, protein, fat, servingSize, servingUnit } = req.body;

      if (!name || !category || calories === undefined || carbs === undefined || protein === undefined || fat === undefined) {
        return res.status(400).json({ message: 'Missing fields for creating library food.' });
      }

      const food = new FoodMaster({
        name,
        category,
        calories,
        carbs,
        protein,
        fat,
        servingSize: servingSize || 100,
        servingUnit: servingUnit || 'g'
      });

      await food.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'ADD_FOOD_MASTER',
        details: `Added new food library template: ${name}`,
        ipAddress: req.ip
      });

      return res.status(201).json({ message: 'Food template added successfully.', food });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'A food with this name already exists in the master database.' });
      }
      return res.status(500).json({ message: error.message || 'Error adding food template.' });
    }
  }

  /**
   * Food Library - Bulk Import CSV
   */
  public static async bulkImportFoods(req: AuthRequest, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'CSV file is required for bulk import.' });
      }

      const filePath = file.path;
      const fileData = fs.readFileSync(filePath, 'utf-8');
      
      const rows = fileData.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) {
        return res.status(400).json({ message: 'CSV file is empty or missing headers.' });
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i].split(',').map(item => item.trim());
        if (rowData.length !== headers.length) continue;

        try {
          const item: any = {};
          headers.forEach((header, index) => {
            const val = rowData[index];
            if (header === 'name') item.name = val;
            if (header === 'category') item.category = val;
            if (header === 'calories') item.calories = parseFloat(val) || 0;
            if (header === 'carbs') item.carbs = parseFloat(val) || 0;
            if (header === 'protein') item.protein = parseFloat(val) || 0;
            if (header === 'fat') item.fat = parseFloat(val) || 0;
            if (header === 'fiber') item.fiber = parseFloat(val) || 0;
            if (header === 'servingsize' || header === 'serving size') item.servingSize = parseFloat(val) || 100;
            if (header === 'servingunit' || header === 'serving unit') item.servingUnit = val || 'g';
            if (header === 'isactive' || header === 'active') item.isActive = val.toLowerCase() === 'true';
          });

          if (!item.name || !item.category) {
            errors.push(`Row ${i + 1}: Missing name or category`);
            continue;
          }

          // Check if it exists
          const existing = await FoodMaster.findOne({ name: { $regex: new RegExp(`^${item.name}$`, 'i') } });
          if (existing) {
             Object.assign(existing, item);
             await existing.save();
          } else {
             await FoodMaster.create(item);
          }
          successCount++;
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'BULK_IMPORT_FOOD_MASTER',
        details: `Bulk imported ${successCount} food library templates`,
        ipAddress: req.ip
      });

      return res.status(200).json({ 
        message: `Bulk import completed. Successfully processed ${successCount} items.`, 
        errors: errors.length > 0 ? errors : undefined 
      });

    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error processing bulk import.' });
    }
  }

  /**
   * Food Library - Edit Food
   */
  public static async updateFoodMaster(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const food = await FoodMaster.findByIdAndUpdate(id, updateData, { new: true });
      if (!food) {
        return res.status(404).json({ message: 'Food template not found.' });
      }

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'UPDATE_FOOD_MASTER',
        details: `Updated food library template: ${food.name}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Food template updated successfully.', food });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating food template.' });
    }
  }

  /**
   * Food Library - Delete Food
   */
  public static async deleteFoodMaster(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const food = await FoodMaster.findById(id);

      if (!food) {
        return res.status(404).json({ message: 'Food template not found.' });
      }

      food.isDeleted = true;
      await food.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'DELETE_FOOD_MASTER',
        details: `Deleted food library template: ${food.name}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Food template deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting food template.' });
    }
  }

  /**
   * Manage Videos - Add
   */
  public static async addVideo(req: AuthRequest, res: Response) {
    try {
      const { title, description, url, thumbnailUrl, category, targetPlatform, isPaidOnly } = req.body;
      if (!title || !url || !category) {
        return res.status(400).json({ message: 'Title, URL, and category are required.' });
      }

      let processedUrl = url;
      let processedThumbnail = thumbnailUrl;
      const ytId = getYoutubeId(url);
      if (ytId) {
        processedUrl = `https://www.youtube.com/embed/${ytId}`;
        if (!processedThumbnail) {
          processedThumbnail = `https://img.youtube.com/vi/${ytId}/0.jpg`;
        }
      }

      const video = new Video({ 
        title, 
        description, 
        url: processedUrl, 
        thumbnailUrl: processedThumbnail, 
        category, 
        targetPlatform: targetPlatform || 'Both',
        isPaidOnly: isPaidOnly !== undefined ? Boolean(isPaidOnly) : false
      });
      await video.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'ADD_VIDEO',
        details: `Uploaded educational video: ${title} (Paid Only: ${Boolean(isPaidOnly)})`,
        ipAddress: req.ip
      });

      return res.status(201).json({ message: 'Educational video created successfully.', video });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error creating video.' });
    }
  }

  /**
   * Manage Videos - Edit
   */
  public static async updateVideo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, url, thumbnailUrl, category, targetPlatform, isPaidOnly } = req.body;
      const video = await Video.findById(id);
      if (!video) return res.status(404).json({ message: 'Video not found.' });

      if (title !== undefined) video.title = title;
      if (description !== undefined) video.description = description;
      if (category !== undefined) video.category = category;
      if (targetPlatform !== undefined) video.targetPlatform = targetPlatform;
      if (isPaidOnly !== undefined) video.isPaidOnly = Boolean(isPaidOnly);
      
      if (url !== undefined) {
        video.url = url;
        const ytId = getYoutubeId(url);
        if (ytId) {
          video.url = `https://www.youtube.com/embed/${ytId}`;
          if (!thumbnailUrl) {
            video.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/0.jpg`;
          }
        }
      }

      if (thumbnailUrl !== undefined) {
        video.thumbnailUrl = thumbnailUrl || video.thumbnailUrl;
      }

      await video.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'UPDATE_VIDEO',
        details: `Updated video: ${video.title}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Video updated.', video });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating video.' });
    }
  }

  /**
   * Manage Videos - Delete
   */
  public static async deleteVideo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const video = await Video.findById(id);
      if (!video) return res.status(404).json({ message: 'Video not found.' });

      video.isDeleted = true;
      await video.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'DELETE_VIDEO',
        details: `Deleted video: ${video.title}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Video soft deleted.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting video.' });
    }
  }

  /**
   * Manage Guides - Add
   */
  public static async addGuide(req: AuthRequest, res: Response) {
    try {
      const { title, content, category, readTime } = req.body;
      if (!title || !content || !category) {
        return res.status(400).json({ message: 'Title, content, and category are required.' });
      }

      const guide = new Guide({ title, content, category, readTime });
      await guide.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'ADD_GUIDE',
        details: `Created guide article: ${title}`,
        ipAddress: req.ip
      });

      return res.status(201).json({ message: 'Guide created successfully.', guide });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error creating guide.' });
    }
  }

  /**
   * Manage Guides - Edit
   */
  public static async updateGuide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const guide = await Guide.findByIdAndUpdate(id, req.body, { new: true });
      if (!guide) return res.status(404).json({ message: 'Guide not found.' });

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'UPDATE_GUIDE',
        details: `Updated guide article: ${guide.title}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Guide updated.', guide });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating guide.' });
    }
  }

  /**
   * Manage Guides - Delete
   */
  public static async deleteGuide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const guide = await Guide.findById(id);
      if (!guide) return res.status(404).json({ message: 'Guide not found.' });

      guide.isDeleted = true;
      await guide.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'DELETE_GUIDE',
        details: `Deleted guide article: ${guide.title}`,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Guide soft deleted.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting guide.' });
    }
  }

  public static async sendPush(req: AuthRequest, res: Response) {
    try {
      const { userId, title, body } = req.body;
      if (!title || !body) {
        return res.status(400).json({ message: 'Notification title and body are required.' });
      }

      if (userId && userId.trim()) {
        const trimmed = userId.trim();
        let resolvedUserId = '';

        if (trimmed.includes('@')) {
          // Resolve by Email
          const user = await User.findOne({ email: trimmed });
          if (!user) {
            return res.status(404).json({ message: `User with email "${trimmed}" not found.` });
          }
          resolvedUserId = user._id.toString();
        } else if (mongoose.Types.ObjectId.isValid(trimmed)) {
          // Resolve by exact ObjectId
          resolvedUserId = trimmed;
        } else {
          // Resolve by Name
          const user = await User.findOne({ name: trimmed });
          if (!user) {
            return res.status(400).json({ message: `Could not resolve user identifier "${trimmed}" to a valid Email or ID.` });
          }
          resolvedUserId = user._id.toString();
        }

        const sent = await FCMService.sendPushNotification(resolvedUserId, title, body, 'General');
        return res.status(200).json({ message: sent ? 'Notification sent.' : 'Mock sent (user lacks device token).' });
      } else {
        // Broadcast to all (handled internally by FCMService, creating a single broadcast record)
        const count = await FCMService.broadcastNotification(title, body);
        return res.status(200).json({ message: `Broadcasted notification to ${count} devices.` });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error sending push.' });
    }
  }

  /**
   * Schedule Notification
   */
  public static async scheduleNotification(req: AuthRequest, res: Response) {
    try {
      const { userId, title, body, scheduledFor } = req.body;
      if (!title || !body || !scheduledFor) {
        return res.status(400).json({ message: 'Title, body, and schedule date are required.' });
      }

      const notification = new Notification({
        userId,
        title,
        body,
        type: 'General',
        scheduledFor: new Date(scheduledFor),
        isSent: false
      });

      await notification.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'SCHEDULE_PUSH',
        details: `Scheduled push notification: "${title}" for user: ${userId || 'All'}`,
        ipAddress: req.ip
      });

      return res.status(201).json({ message: 'Notification scheduled successfully.', notification });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error scheduling notification.' });
    }
  }

  /**
   * Get User Activity Details (Admin)
   */
  public static async getUserActivity(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const [foodLogs, glucoseReadings, cgmReports, habitLogs, subscriptions, paymentTransactions, invoices] = await Promise.all([
        FoodLog.find({ userId: id }).sort({ loggedAt: -1 }).limit(100),
        mongoose.model('GlucoseReading').find({ userId: id }).sort({ timestamp: -1 }).limit(100),
        mongoose.model('CGMReport').find({ userId: id }).sort({ createdAt: -1 }).limit(10),
        mongoose.model('HabitLog').find({ userId: id }).sort({ timestamp: -1 }).limit(100),
        UserSubscription.find({ userId: id, isDeleted: false })
          .populate('planId', 'name yearlyPrice code trialHours trialDays')
          .sort({ createdAt: -1 }),
        PaymentTransaction.find({ userId: id, isDeleted: false })
          .populate('planId', 'name yearlyPrice code')
          .sort({ createdAt: -1 })
          .limit(50),
        Invoice.find({ userId: id, isDeleted: false })
          .populate('planId', 'name code')
          .sort({ createdAt: -1 })
          .limit(50)
      ]);

      return res.status(200).json({
        user,
        foodLogs,
        glucoseReadings,
        cgmReports,
        habitLogs,
        subscriptions,
        paymentTransactions,
        invoices
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching user activity details.' });
    }
  }

  // --- Profile Edits ---
  public static async getPendingProfileEdits(req: AuthRequest, res: Response) {
    try {
      const users = await User.find({ pendingProfileEdits: { $ne: null } }).select('-passwordHash').sort({ updatedAt: -1 });
      return res.status(200).json(users);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching pending profile edits' });
    }
  }

  public static async approveProfileEdit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user || !user.pendingProfileEdits) {
        return res.status(404).json({ message: 'User or pending edits not found' });
      }

      // Merge edits
      const edits = user.pendingProfileEdits;
      Object.assign(user, edits);

      // Recalculate TDEE if demographics changed
      if (user.age && user.height && user.weight && user.activityLevel && user.goal) {
        user.dailyCalorieTarget = AuthController.calculateTDEE(
          user.gender || 'Male',
          user.age,
          user.height,
          user.weight,
          user.activityLevel,
          user.goal
        );
      }

      // Clear pending edits
      user.pendingProfileEdits = null;
      await user.save();

      if (user.email && user.name) {
        EmailService.sendProfileEditApprovedEmail(user.email, user.name).catch(console.error);
      }

      return res.status(200).json({ message: 'Profile edits approved successfully.', user });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error approving profile edit' });
    }
  }

  public static async rejectProfileEdit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user || !user.pendingProfileEdits) {
        return res.status(404).json({ message: 'User or pending edits not found' });
      }

      // Clear pending edits
      user.pendingProfileEdits = null;
      await user.save();

      if (user.email && user.name) {
        EmailService.sendProfileEditRejectedEmail(user.email, user.name).catch(console.error);
      }

      return res.status(200).json({ message: 'Profile edits rejected successfully.', user });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error rejecting profile edit' });
    }
  }

  // --- FAQs ---
  public static async getFAQs(req: AuthRequest, res: Response) {
    try {
      const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 });
      return res.status(200).json(faqs);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching FAQs' });
    }
  }

  public static async addFAQ(req: AuthRequest, res: Response) {
    try {
      const faq = new FAQ(req.body);
      await faq.save();
      return res.status(201).json({ message: 'FAQ added.', faq });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error adding FAQ' });
    }
  }

  public static async updateFAQ(req: AuthRequest, res: Response) {
    try {
      const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.status(200).json({ message: 'FAQ updated.', faq });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error updating FAQ' });
    }
  }

  public static async deleteFAQ(req: AuthRequest, res: Response) {
    try {
      await FAQ.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: 'FAQ deleted.' });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error deleting FAQ' });
    }
  }

  public static async getFoods(req: AuthRequest, res: Response) {
    try {
      const { q, page = '1', limit = '10' } = req.query;
      const filter: any = {};

      if (q) {
        filter.name = { $regex: q as string, $options: 'i' };
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;

      const foods = await FoodMaster.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      const total = await FoodMaster.countDocuments(filter);

      return res.status(200).json({
        foods,
        pagination: {
          total,
          page: p,
          limit: l,
          pages: Math.ceil(total / l)
        }
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching foods' });
    }
  }

  // --- ACTIVITY STATS ---
  // --- SUPPORT TICKETS ---
  public static async getTickets(req: AuthRequest, res: Response) {
    try {
      const tickets = await SupportTicket.find().sort({ createdAt: -1 });
      return res.status(200).json(tickets);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching tickets' });
    }
  }

  public static async answerTicket(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { answer } = req.body;
      const ticket = await SupportTicket.findById(id);
      
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      
      ticket.answer = answer;
      ticket.status = 'Answered';
      ticket.answeredAt = new Date();
      await ticket.save();

      // Send Email
      await EmailService.sendSupportAnswerEmail(ticket.email, ticket.name, ticket.question, answer);

      return res.status(200).json({ message: 'Ticket answered and email sent.', ticket });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error answering ticket' });
    }
  }

  // --- MANUAL EMAIL ---
  public static async sendManualEmail(req: AuthRequest, res: Response) {
    try {
      const { userId, title, body } = req.body;
      if (!title || !body) return res.status(400).json({ message: 'Title and body are required.' });

      if (userId) {
        // Determine if userId looks like an email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let user = null;
        if (emailRegex.test(userId)) {
          // Find by email when an email string is provided
          user = await User.findOne({ email: userId });
        } else {
          // Assume ObjectId otherwise
          user = await User.findById(userId);
        }
        if (user && user.email) {
          await EmailService.sendManualAdminEmail(user.email, title, body);
        }
      } else {
        const users = await User.find({ email: { $exists: true, $ne: '' } });
        for (const u of users) {
          if (u.email) {
            await EmailService.sendManualAdminEmail(u.email, title, body);
          }
        }
      }

      return res.status(200).json({ message: 'Email(s) sent successfully.' });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error sending manual email' });
    }
  }

  // --- LEGAL DOCUMENTS ---
  public static async getLegalDocument(req: Request, res: Response) {
    try {
      const { type } = req.params;
      let doc = await LegalDocument.findOne({
        type: { $regex: new RegExp(`^${type.replace(/[\s_-]/g, '')}$`, 'i') }
      });
      if (!doc && type.toLowerCase().includes('terms')) {
        doc = await LegalDocument.findOne({ type: 'TermsOfService' });
      }
      if (!doc) return res.status(404).json({ message: 'Legal document not found.' });
      return res.status(200).json(doc);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching legal doc' });
    }
  }

  public static async updateLegalDocument(req: AuthRequest, res: Response) {
    try {
      const { type } = req.params;
      const { content } = req.body;
      const docType = type.toLowerCase().includes('terms') ? 'TermsOfService' : type;
      let doc = await LegalDocument.findOne({
        type: { $regex: new RegExp(`^${docType.replace(/[\s_-]/g, '')}$`, 'i') }
      });
      if (!doc) {
        doc = new LegalDocument({ type: docType, content });
      } else {
        doc.content = content;
      }
      await doc.save();
      return res.status(200).json(doc);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error updating legal doc' });
    }
  }

  public static async getAppointments(req: AuthRequest, res: Response) {
    try {
      const appointments = await Appointment.find()
        .populate('doctorId', 'name specialty')
        .populate('userId', 'name email mobileNumber')
        .sort({ date: -1, time: -1 });
      return res.status(200).json(appointments);
    } catch (err: any) {
      return res.status(500).json({ message: 'Error fetching appointments.' });
    }
  }

  public static async globalSearch(req: AuthRequest, res: Response) {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) {
        return res.status(200).json({ patients: [], doctors: [], vendors: [], products: [], appointments: [], orders: [] });
      }
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const [patients, doctors, vendors, products, appointments, orders] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }, { mobileNumber: regex }, { mobile: regex }] }).select('_id name email mobileNumber subscription role createdAt').limit(8).lean(),
        Doctor.find({ $or: [{ name: regex }, { specialty: regex }, { email: regex }] }).limit(8).lean(),
        Vendor.find({ $or: [{ name: regex }, { email: regex }, { businessName: regex }] }).limit(8).lean(),
        ShopProduct.find({ $or: [{ name: regex }, { category: regex }] }).limit(8).lean(),
        Appointment.find({ $or: [{ reason: regex }, { status: regex }] }).populate('userId', 'name email mobileNumber').populate('doctorId', 'name specialty').limit(8).lean(),
        ShopOrder.find({ $or: [{ orderId: regex }, { paymentStatus: regex }, { status: regex }] }).limit(8).lean(),
      ]);
      return res.status(200).json({ patients, doctors, vendors, products, appointments, orders });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error processing global search' });
    }
  }

  public static async getReportsAnalytics(req: AuthRequest, res: Response) {
    try {
      // 1. Monthly Revenue & Orders (Last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      
      const last6Months: { year: number; monthIndex: number; month: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          month: months[d.getMonth()]
        });
      }

      const sixMonthsAgoStart = new Date(last6Months[0].year, last6Months[0].monthIndex, 1);

      const orders = await ShopOrder.find({
        createdAt: { $gte: sixMonthsAgoStart }
      }).lean();

      const revenueTrends = last6Months.map(m => {
        const ordersInMonth = orders.filter(o => {
          const od = new Date(o.createdAt);
          return od.getFullYear() === m.year && od.getMonth() === m.monthIndex;
        });
        const revenue = ordersInMonth
          .filter(o => o.status === 'completed' || o.deliveryStatus === 'delivered')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          month: m.month,
          revenue: Math.round(revenue * 100) / 100,
          orders: ordersInMonth.length
        };
      });

      // 2. Weekly Appointment Status Trends (Mon - Sun of current week)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = now.getDay();
      const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const mondayStr = monday.toISOString().split('T')[0];
      const sundayStr = sunday.toISOString().split('T')[0];

      const appointments = await Appointment.find({
        $or: [
          { createdAt: { $gte: monday, $lte: sunday } },
          { date: { $gte: mondayStr, $lte: sundayStr } }
        ]
      }).lean();

      const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyAppointments = orderedDays.map(dayName => {
        const dayAppts = appointments.filter(a => {
          let d: Date;
          if (a.date && typeof a.date === 'string' && a.date.includes('-')) {
            d = new Date(a.date);
          } else {
            d = new Date(a.createdAt);
          }
          return dayNames[d.getDay()] === dayName;
        });

        const completed = dayAppts.filter(a => a.status === 'completed').length;
        const cancelled = dayAppts.filter(a => a.status === 'cancelled').length;
        const pending = dayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

        return { day: dayName, completed, cancelled, pending };
      });

      // 3. Partner Vendor Performance / Efficiency (%)
      const vendors = await Vendor.find().lean();
      const allOrders = await ShopOrder.find().lean();

      const vendorEfficiency = vendors.map(v => {
        const vOrders = allOrders.filter(o => o.vendorId && o.vendorId.toString() === v._id.toString());
        const totalAssigned = vOrders.length;
        const delivered = vOrders.filter(o => o.deliveryStatus === 'delivered' || o.status === 'completed').length;
        const efficiency = totalAssigned > 0 ? Math.round((delivered / totalAssigned) * 100) : 0;
        return {
          name: v.name || v.businessName || 'Vendor',
          businessName: v.businessName || v.name,
          totalAssigned,
          delivered,
          efficiency
        };
      }).slice(0, 8);

      return res.status(200).json({
        revenueTrends,
        monthlyOrders: revenueTrends.map(r => ({ month: r.month, orders: r.orders })),
        weeklyAppointments,
        vendorEfficiency: vendorEfficiency.length > 0 ? vendorEfficiency : [
          { name: 'No Vendors', efficiency: 0 }
        ]
      });
    } catch (err: any) {
      console.error('Error in getReportsAnalytics:', err);
      return res.status(500).json({ message: err.message || 'Error fetching reports analytics' });
    }
  }

  /**
   * Dedicated OTP & Authentication Audit Logs
   * Supports comprehensive search, provider filters (Titan Mail GoDaddy SMTP, Brevo, Fast2SMS Quick, Fast2SMS OTP, Firebase),
   * real-time delivery and verification status tracking, and latency analytics.
   */
  public static async getOtpLogs(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
      const q = ((req.query.q as string) || '').trim();
      const provider = (req.query.provider as string) || 'all';
      const status = (req.query.status as string) || 'all';
      const verificationStatus = (req.query.verificationStatus as string) || 'all';
      const channel = (req.query.channel as string) || 'all';
      const platform = (req.query.platform as string) || 'all';
      const dateRange = (req.query.dateRange as string) || 'all';

      const filter: any = {
        eventType: 'REQUEST'
      };

      // Auto-cleanup: Prune historical precursor INITIAL_DISPATCH rows that were superseded by a fallback dispatch within 120s
      try {
        const precursorRows = await AppOtpTelemetry.find({
          eventType: 'REQUEST',
          fallbackReason: 'INITIAL_DISPATCH',
          verificationStatus: { $in: ['PENDING', 'EXPIRED'] }
        }).select('_id phoneNumber email timestamp').limit(50).lean();

        for (const row of precursorRows) {
          const rowTime = new Date(row.timestamp).getTime();
          const hasCompanionSession = await AppOtpTelemetry.exists({
            _id: { $ne: row._id },
            $or: [
              ...(row.phoneNumber ? [{ phoneNumber: row.phoneNumber }] : []),
              ...(row.email ? [{ email: row.email }] : [])
            ],
            timestamp: {
              $gte: new Date(rowTime - 5000),
              $lte: new Date(rowTime + 120000)
            }
          });
          if (hasCompanionSession) {
            await AppOtpTelemetry.deleteOne({ _id: row._id }).catch(() => {});
          }
        }
      } catch (_) {}

      const activeProviderName = EmailService.getSmtpProviderName();
      const isBrevoActive = activeProviderName === 'brevo_smtp';

      // Date Range Filter
      const now = new Date();
      if (dateRange === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filter.timestamp = { $gte: startOfDay };
      } else if (dateRange === '24h') {
        filter.timestamp = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
      } else if (dateRange === '7d') {
        filter.timestamp = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      } else if (dateRange === '30d') {
        filter.timestamp = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }

      // Channel Filter
      if (channel !== 'all') {
        filter.channel = channel;
      }

      // Delivery Status Filter
      if (status !== 'all') {
        filter.status = status;
      }

      // Platform Filter
      if (platform !== 'all') {
        filter.platform = platform;
      }

      // Provider Filter
      if (provider !== 'all') {
        if (provider === 'firebase') {
          filter.$or = [{ smsProvider: 'firebase' }, { channel: 'firebase' }];
        } else if (provider === 'fast2sms_quick') {
          filter.smsProvider = 'fast2sms_quick';
        } else if (provider === 'fast2sms_otp') {
          filter.smsProvider = 'fast2sms_otp';
        } else if (provider === 'titan_godaddy_smtp') {
          filter.$or = [
            { emailProvider: 'titan_godaddy_smtp' },
            ...(!isBrevoActive ? [{ emailProvider: { $in: [null, 'none'] }, channel: { $in: ['email', 'both'] } }] : [])
          ];
        } else if (provider === 'brevo_smtp') {
          filter.$or = [
            { emailProvider: 'brevo_smtp' },
            ...(isBrevoActive ? [{ emailProvider: { $in: [null, 'none'] }, channel: { $in: ['email', 'both'] } }] : [])
          ];
        }
      }

      // Verification Status Filter
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (verificationStatus === 'VERIFIED') {
        filter.verificationStatus = 'VERIFIED';
      } else if (verificationStatus === 'PENDING') {
        filter.verificationStatus = 'PENDING';
        filter.timestamp = filter.timestamp
          ? { ...filter.timestamp, $gte: tenMinutesAgo }
          : { $gte: tenMinutesAgo };
      } else if (verificationStatus === 'EXPIRED') {
        filter.$or = [
          { verificationStatus: 'EXPIRED' },
          { verificationStatus: 'PENDING', timestamp: { $lt: tenMinutesAgo } }
        ];
      } else if (verificationStatus === 'FAILED') {
        filter.verificationStatus = 'FAILED';
      }

      // Search Query (phone number, email, or masked target)
      if (q) {
        const cleanDigits = q.replace(/[^0-9]/g, '');
        const searchConditions: any[] = [
          { email: { $regex: q, $options: 'i' } },
          { maskedTarget: { $regex: q, $options: 'i' } }
        ];
        if (cleanDigits.length >= 3) {
          searchConditions.push({ phoneNumber: { $regex: cleanDigits, $options: 'i' } });
        }
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
          delete filter.$or;
        } else {
          filter.$or = searchConditions;
        }
      }

      const totalLogs = await AppOtpTelemetry.countDocuments(filter);
      const rawLogs = await AppOtpTelemetry.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Enrich logs with dynamic expiration detection and fallback provider inference
      const logs = rawLogs.map((log: any) => {
        const isExpired = log.verificationStatus === 'PENDING' &&
          (Date.now() - new Date(log.timestamp).getTime() > 10 * 60 * 1000);

        let resolvedEmailProvider = log.emailProvider;
        if (!resolvedEmailProvider || resolvedEmailProvider === 'none') {
          if (log.channel === 'email' || log.channel === 'both') {
            resolvedEmailProvider = activeProviderName;
          }
        }

        let resolvedEmailStatus = log.emailStatus;
        if (!resolvedEmailStatus || resolvedEmailStatus === 'NOT_ATTEMPTED') {
          if (log.channel === 'email' || log.channel === 'both') {
            resolvedEmailStatus = log.status === 'SUCCESS' ? 'DELIVERED' : log.status;
          }
        }

        let resolvedEmailGatewayResponse = log.emailGatewayResponse;
        if (!resolvedEmailGatewayResponse && resolvedEmailStatus === 'DELIVERED') {
          resolvedEmailGatewayResponse = `Queued and delivered via ${resolvedEmailProvider === 'brevo_smtp' ? 'Brevo SMTP Relay' : 'Titan GoDaddy SMTP'}`;
        }

        let resolvedSmsGatewayResponse = log.smsGatewayResponse;
        if (!resolvedSmsGatewayResponse) {
          if (log.smsStatus === 'DELIVERED') {
            resolvedSmsGatewayResponse = 'Delivered successfully via SMS Gateway';
          } else if (log.smsStatus === 'NOT_ATTEMPTED' || log.smsProvider === 'none') {
            resolvedSmsGatewayResponse = 'SMS route not requested for this client platform';
          }
        }

        const effectiveStatus = isExpired ? 'EXPIRED' : (log.verificationStatus || 'PENDING');
        let resolvedVerifiedVia = log.verifiedVia;
        if (!resolvedVerifiedVia && effectiveStatus === 'VERIFIED') {
          if (log.fallbackReason) {
            resolvedVerifiedVia = 'FAST2SMS_FALLBACK';
          } else if (log.channel === 'firebase') {
            resolvedVerifiedVia = 'FIREBASE_PHONE';
          } else {
            resolvedVerifiedVia = 'BACKEND_OTP';
          }
        }

        return {
          ...log,
          emailProvider: resolvedEmailProvider,
          emailStatus: resolvedEmailStatus,
          emailGatewayResponse: resolvedEmailGatewayResponse,
          smsGatewayResponse: resolvedSmsGatewayResponse,
          effectiveVerificationStatus: effectiveStatus,
          verifiedVia: resolvedVerifiedVia,
          apnsStatus: log.apnsStatus || (log.platform === 'ios' && log.fallbackReason ? 'TIMEOUT_OR_UNAVAILABLE' : null),
          recaptchaStatus: log.recaptchaStatus || (log.fallbackReason === 'FIREBASE_VERIFICATION_FAILED' ? 'SDK_NOT_LINKED_OR_FAILED' : null)
        };
      });

      // KPI Aggregations (Strictly counting unique dispatch sessions)
      const totalRequests = await AppOtpTelemetry.countDocuments({ eventType: 'REQUEST' });
      const totalVerifications = await AppOtpTelemetry.countDocuments({ eventType: 'REQUEST', verificationStatus: 'VERIFIED' });
      const totalVerified = await AppOtpTelemetry.countDocuments({ eventType: 'REQUEST', verificationStatus: 'VERIFIED' });
      const totalPendingActive = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        verificationStatus: 'PENDING',
        timestamp: { $gte: tenMinutesAgo }
      });
      const totalFailed = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        $or: [
          { status: 'FAILED' },
          { verificationStatus: 'FAILED' }
        ]
      });

      // Provider counts (Including inferred historical records)
      const firebaseCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        $or: [{ smsProvider: 'firebase' }, { channel: 'firebase' }]
      });
      const fast2smsQuickCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        smsProvider: 'fast2sms_quick'
      });
      const fast2smsOtpCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        smsProvider: 'fast2sms_otp'
      });
      const titanGodaddyCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        $or: [
          { emailProvider: 'titan_godaddy_smtp' },
          ...(!isBrevoActive ? [{ emailProvider: { $in: [null, 'none'] }, channel: { $in: ['email', 'both'] } }] : [])
        ]
      });
      const brevoCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        $or: [
          { emailProvider: 'brevo_smtp' },
          ...(isBrevoActive ? [{ emailProvider: { $in: [null, 'none'] }, channel: { $in: ['email', 'both'] } }] : [])
        ]
      });

      // Delivery channel breakdown
      const smsDeliveryCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        $or: [
          { smsStatus: 'DELIVERED' },
          { channel: 'sms', status: 'SUCCESS' },
          { channel: 'both', status: 'SUCCESS' },
          { channel: 'firebase', status: 'SUCCESS' }
        ]
      });
      const emailDeliveryCount = await AppOtpTelemetry.countDocuments({
        eventType: 'REQUEST',
        $or: [
          { emailStatus: 'DELIVERED' },
          { channel: 'email', status: 'SUCCESS' },
          { channel: 'both', status: 'SUCCESS' }
        ]
      });

      const verificationRate = totalRequests > 0
        ? Number(((totalVerified / totalRequests) * 100).toFixed(1))
        : 100;

      const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
      const smtpUser = process.env.SMTP_USER || '';

      return res.status(200).json({
        success: true,
        logs,
        pagination: {
          total: totalLogs,
          page,
          limit,
          totalPages: Math.ceil(totalLogs / limit) || 1
        },
        kpis: {
          totalRequests,
          totalVerifications,
          totalVerified,
          totalPendingActive,
          totalFailed,
          verificationRate,
          emailDeliveryCount,
          smsDeliveryCount,
          providerStats: {
            firebase: firebaseCount,
            fast2smsQuick: fast2smsQuickCount,
            fast2smsOtp: fast2smsOtpCount,
            titanGodaddySmtp: titanGodaddyCount,
            brevoSmtp: brevoCount
          },
          smtpConfig: {
            host: smtpHost,
            user: smtpUser ? (smtpUser.includes('@') ? smtpUser.replace(/^(.)(.*)(@.*)$/, '$1***$3') : smtpUser.slice(0, 4) + '***') : 'Not Set',
            activeProvider: activeProviderName
          }
        }
      });
    } catch (err: any) {
      console.error('Error in getOtpLogs:', err);
      return res.status(500).json({ message: err.message || 'Error fetching OTP logs' });
    }
  }
}
