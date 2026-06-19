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
      const { name, email, mobile, password, gender, age, height, weight, activityLevel, goal, cancerJourney, cancerDisclaimerAccepted, cancerDisclaimerAcceptedAt } = req.body;

      if (!name || !email || !mobile || !password) {
        return res.status(400).json({ message: 'Name, email, mobile, and password are required.' });
      }

      if ((cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && !cancerDisclaimerAccepted) {
        return res.status(400).json({ message: 'You must accept the medical disclaimer to register for cancer treatment or secondary prevention journeys.' });
      }

      // Check if user already exists by email or mobile
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { mobile: mobile.trim() }
        ]
      });
      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(409).json({ message: 'Email is already registered.' });
        }
        return res.status(409).json({ message: 'Mobile number is already registered.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User({
        name,
        email,
        mobile: mobile.trim(),
        passwordHash,
        gender,
        age,
        height,
        weight,
        activityLevel,
        goal,
        spikeThreshold: 90,
        cancerJourney: cancerJourney || 'PREVENTION',
        cancerDisclaimerAccepted: !!cancerDisclaimerAccepted,
        cancerDisclaimerAcceptedAt: cancerDisclaimerAcceptedAt ? new Date(cancerDisclaimerAcceptedAt) : undefined
      });

      // Calculate calorie targets if physical attributes are provided
      if (age && height && weight && activityLevel && goal) {
        user.dailyCalorieTarget = AuthController.calculateTDEE(gender || 'Male', age, height, weight, activityLevel, goal);
      }

      await user.save();

      // Generate tokens (long-lived — user controls logout manually)
      const accessToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_SECRET, { expiresIn: '365d' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_REFRESH_SECRET, { expiresIn: '365d' });

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
          mobile: user.mobile,
          dailyCalorieTarget: user.dailyCalorieTarget
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during registration.' });
    }
  }

  /**
   * Check Email and Mobile Availability
   */
  public static async checkAvailability(req: Request, res: Response) {
    try {
      const { email, mobile } = req.body;
      if (!email && !mobile) {
        return res.status(400).json({ message: 'Email or Mobile is required.' });
      }

      if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
          return res.status(409).json({ available: false, field: 'email', message: 'Email is already registered.' });
        }
      }

      if (mobile) {
        const existingMobile = await User.findOne({ mobile: mobile.trim() });
        if (existingMobile) {
          return res.status(409).json({ available: false, field: 'mobile', message: 'Mobile number is already registered.' });
        }
      }

      return res.status(200).json({ available: true, message: 'Available.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred checking availability.' });
    }
  }

  /**
   * User Login
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body; // email field accepts either email or mobile

      if (!email || !password) {
        return res.status(400).json({ message: 'Email/Mobile and password are required.' });
      }

      const user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { mobile: email.trim() }
        ]
      });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email, mobile number, or password.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email, mobile number, or password.' });
      }

      // Generate tokens
      const accessToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_SECRET, { expiresIn: '365d' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email, role: 'User' }, JWT_REFRESH_SECRET, { expiresIn: '365d' });

      // Determine platform context (location/device/time)
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      let location = 'Unknown Location';
      if (
        ip === '::1' || 
        ip === '127.0.0.1' || 
        ip.includes('127.0.0.1') || 
        ip.startsWith('127.') || 
        ip.startsWith('192.168.') || 
        ip.startsWith('10.') || 
        ip.startsWith('::ffff:127.') || 
        ip.startsWith('::ffff:192.168.') || 
        ip.startsWith('::ffff:10.')
      ) {
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
      if (user.lastLoginAlertSentAt) {
        const timeDiff = now.getTime() - new Date(user.lastLoginAlertSentAt).getTime();
        if (timeDiff < loginAlertIntervalMs) {
          shouldSendEmail = false;
        }
      }

      if (shouldSendEmail) {
        user.lastLoginAlertSentAt = now;
        await user.save();
        EmailService.sendLoginNotificationEmail(user.email, user.name || 'Mito_Reboot User', { time, location, device }).catch(console.error);
      }

      return res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
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

        const accessToken = jwt.sign({ id: decoded.id, email: decoded.email, role: decoded.role || 'User' }, JWT_SECRET, { expiresIn: '365d' });
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

      // Generate reset token and link
      const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30m' });
      const appBaseUrl = process.env.NODE_ENV === 'production' ? 'https://app.mitoreboot.in' : 'http://localhost:5173';
      const resetLink = `${appBaseUrl}/?token=${resetToken}`;

      // Send actual email to user
      await EmailService.sendPasswordResetEmail(user.email, user.name || 'Mito_Reboot User', resetLink);

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
