import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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

      const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });

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
        EmailService.sendLoginNotificationEmail(admin.email, admin.name || 'FastGluco Admin', { time, location, device }).catch(console.error);
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

      return res.status(200).json({
        totalUsers,
        activeUsers,
        reportsUploaded,
        foodLogs,
        categoryBreakdown: categoryStats
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error compiling dashboard statistics.' });
    }
  }

  /**
   * List Users (Paginated & Searchable)
   */
  public static async getUsers(req: AuthRequest, res: Response) {
    try {
      const { q, page = '1', limit = '10' } = req.query;
      const filter: any = {};

      if (q) {
        filter.$or = [
          { name: { $regex: q as string, $options: 'i' } },
          { email: { $regex: q as string, $options: 'i' } }
        ];
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;

      const users = await User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l);

      const total = await User.countDocuments(filter);

      return res.status(200).json({
        users,
        pagination: {
          total,
          page: p,
          limit: l,
          pages: Math.ceil(total / l)
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error listing users.' });
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
        EmailService.sendBlockNotificationEmail(user.email, user.name, blockReason).catch(console.error);
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
      const { title, description, url, thumbnailUrl, category, targetPlatform } = req.body;
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
        targetPlatform: targetPlatform || 'Both' 
      });
      await video.save();

      await AuditLog.create({
        adminId: req.user?.id,
        action: 'ADD_VIDEO',
        details: `Uploaded educational video: ${title}`,
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
      const { title, description, url, thumbnailUrl, category, targetPlatform } = req.body;
      const video = await Video.findById(id);
      if (!video) return res.status(404).json({ message: 'Video not found.' });

      if (title !== undefined) video.title = title;
      if (description !== undefined) video.description = description;
      if (category !== undefined) video.category = category;
      if (targetPlatform !== undefined) video.targetPlatform = targetPlatform;
      
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

      const foodLogs = await FoodLog.find({ userId: id }).sort({ loggedAt: -1 }).limit(100);
      const glucoseReadings = await mongoose.model('GlucoseReading').find({ userId: id }).sort({ timestamp: -1 }).limit(100);
      const cgmReports = await mongoose.model('CGMReport').find({ userId: id }).sort({ createdAt: -1 }).limit(10);

      return res.status(200).json({
        user,
        foodLogs,
        glucoseReadings,
        cgmReports
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching user activity details.' });
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
        const user = await User.findById(userId);
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
      const doc = await LegalDocument.findOne({ type });
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
      let doc = await LegalDocument.findOne({ type });
      if (!doc) {
        doc = new LegalDocument({ type, content });
      } else {
        doc.content = content;
      }
      await doc.save();
      return res.status(200).json({ message: 'Legal document updated successfully.', doc });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error updating legal doc' });
    }
  }
}
