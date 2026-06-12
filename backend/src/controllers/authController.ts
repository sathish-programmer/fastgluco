import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { EmailService } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_67890!';

export class AuthController {
  /**
   * User Registration
   */
  public static async register(req: Request, res: Response) {
    try {
      const { name, email, password, gender, age, height, weight, activityLevel, goal } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User({
        name,
        email,
        passwordHash,
        gender,
        age,
        height,
        weight,
        activityLevel,
        goal,
        spikeThreshold: 90
      });

      // Calculate calorie targets if physical attributes are provided
      if (age && height && weight && activityLevel && goal) {
        user.dailyCalorieTarget = AuthController.calculateTDEE(gender || 'Male', age, height, weight, activityLevel, goal);
      }

      await user.save();

      // Generate tokens
      const accessToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      // Send Welcome Email asynchronously
      EmailService.sendWelcomeEmail(user.email, user.name).catch(console.error);

      return res.status(201).json({
        message: 'Registration successful.',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          dailyCalorieTarget: user.dailyCalorieTarget
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during registration.' });
    }
  }

  /**
   * User Login
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Generate tokens
      const accessToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
          activityLevel: user.activityLevel,
          goal: user.goal,
          spikeThreshold: user.spikeThreshold,
          dailyCalorieTarget: user.dailyCalorieTarget
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during login.' });
    }
  }

  /**
   * Refresh Token
   */
  public static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required.' });
      }

      jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
        if (err) {
          return res.status(403).json({ message: 'Invalid or expired refresh token.' });
        }

        const accessToken = jwt.sign({ id: decoded.id, email: decoded.email, role: decoded.role || 'User' }, JWT_SECRET, { expiresIn: '15m' });
        return res.status(200).json({ accessToken });
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred while refreshing token.' });
    }
  }

  /**
   * Forgot Password
   */
  public static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email address is required.' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        // Return 200 for security reasons to hide email verification
        return res.status(200).json({ message: 'If the email exists, a password reset link has been dispatched.' });
      }

      // Mock reset token dispatch
      const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30m' });
      console.log(`\n--- [PASSWORD RESET MOCK LINK] ---`);
      console.log(`To: ${email}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Url: http://localhost:5173/reset-password?token=${resetToken}`);
      console.log(`----------------------------------\n`);

      return res.status(200).json({ message: 'If the email exists, a password reset link has been dispatched.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred.' });
    }
  }

  /**
   * Reset Password
   */
  public static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
      }

      jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) {
          return res.status(400).json({ message: 'Invalid or expired recovery token.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ message: 'Password reset successfully. Please log in.' });
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during password reset.' });
    }
  }

  /**
   * Helper function to calculate Total Daily Energy Expenditure (TDEE)
   */
  public static calculateTDEE(
    gender: 'Male' | 'Female' | 'Other',
    age: number,
    height: number,
    weight: number,
    activityLevel: 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active',
    goal: 'Lose weight' | 'Maintain weight' | 'Gain weight'
  ): number {
    // Mifflin-St Jeor Equation for Basal Metabolic Rate (BMR)
    let bmr = 0;
    if (gender === 'Female') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    }

    // Activity multiplier
    let multiplier = 1.2; // Sedentary
    if (activityLevel === 'Lightly active') multiplier = 1.375;
    else if (activityLevel === 'Moderately active') multiplier = 1.55;
    else if (activityLevel === 'Very active') multiplier = 1.725;

    let tdee = bmr * multiplier;

    // Caloric target adjusting for goals
    if (goal === 'Lose weight') {
      tdee -= 500; // Caloric deficit
    } else if (goal === 'Gain weight') {
      tdee += 500; // Caloric surplus
    }

    return Math.round(Math.max(tdee, 1200)); // Ensure not lower than 1200 kcal/day safety floor
  }
}
