import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/User';
import { AuthController } from './authController';

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
      const { name, email, gender, age, height, weight, activityLevel, goal, fcmToken, spikeThreshold, currency } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User profile not found.' });
      }

      // Update fields if provided
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (gender !== undefined) user.gender = gender;
      if (age !== undefined) user.age = age;
      if (height !== undefined) user.height = height;
      if (weight !== undefined) user.weight = weight;
      if (activityLevel !== undefined) user.activityLevel = activityLevel;
      if (goal !== undefined) user.goal = goal;
      if (fcmToken !== undefined) user.fcmToken = fcmToken;
      if (spikeThreshold !== undefined) user.spikeThreshold = spikeThreshold;
      if (currency !== undefined) user.currency = currency;

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
      const updatedUser = await User.findById(userId).select('-passwordHash');

      return res.status(200).json({
        message: 'Profile updated successfully.',
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating profile.' });
    }
  }
}
