import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/User';
import { AuthController } from './authController';
import { LibreSyncService } from '../services/libreSyncService';

export class ProfileController {
  /**
   * Get Profile Details
   */
  public static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const user = await User.findById(userId).select('-passwordHash');

      if (!user) {
        return res.status(404).json({ message: 'User profile not found.' });
      }

      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching profile.' });
    }
  }

  /**
   * Update Profile Details and Recalculate Calorie Target
   */
  public static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { 
        name, email, mobile, gender, age, height, weight, activityLevel, goal, fcmToken, spikeThreshold, currency,
        libreEmail, librePassword, libreRegion, libreActive
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User profile not found.' });
      }

      // Update fields if provided
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (mobile !== undefined) user.mobile = mobile;
      if (gender !== undefined) user.gender = gender;
      if (age !== undefined) user.age = age;
      if (height !== undefined) user.height = height;
      if (weight !== undefined) user.weight = weight;
      if (activityLevel !== undefined) user.activityLevel = activityLevel;
      if (goal !== undefined) user.goal = goal;
      if (fcmToken !== undefined) user.fcmToken = fcmToken;
      if (spikeThreshold !== undefined) user.spikeThreshold = spikeThreshold;
      if (currency !== undefined) user.currency = currency;

      if (libreEmail !== undefined) user.libreEmail = libreEmail;
      if (librePassword !== undefined) user.librePassword = librePassword;
      if (libreRegion !== undefined) user.libreRegion = libreRegion;
      if (libreActive !== undefined) user.libreActive = libreActive;

      // If active and credentials changed, verify them
      if (user.libreActive && user.libreEmail && user.librePassword) {
        const isValid = await LibreSyncService.verifyCredentials(
          user.libreEmail,
          user.librePassword,
          user.libreRegion || 'ap'
        );
        if (!isValid) {
          return res.status(400).json({ message: 'Failed to authenticate with LibreLinkUp. Please check your email, password, and region settings.' });
        }
      }

      // Recalculate caloric targets if demographics are set
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

      await user.save();

      // Trigger immediate sync in background if active
      if (user.libreActive) {
        LibreSyncService.syncUserReadings(user).catch(err => {
          console.error('Initial background sync on profile update failed:', err);
        });
      }

      const updatedUser = await User.findById(userId).select('-passwordHash');

      return res.status(200).json({
        message: 'Profile updated successfully.',
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating profile.' });
    }
  }

  /**
   * Manual trigger sync
   */
  public static async triggerSync(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      if (!user.libreActive || !user.libreEmail || !user.librePassword) {
        return res.status(400).json({ message: 'LibreLinkUp is not configured or active for your profile.' });
      }

      const syncResult = await LibreSyncService.syncUserReadings(user);
      if (syncResult.success) {
        return res.status(200).json({
          message: `Sync completed successfully. Retrieved ${syncResult.count} readings.`,
          count: syncResult.count
        });
      } else {
        return res.status(400).json({
          message: syncResult.error || 'Failed to sync measurements from LibreLinkUp.'
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error triggering sync.' });
    }
  }
}
