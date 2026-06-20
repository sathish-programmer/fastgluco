import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { EmailService } from '../services/emailService';
import admin from '../config/firebaseAdmin';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_67890!';

export class AuthController {
  /**
   * Verify Firebase Phone Auth ID Token (Production — no mock)
   */
  public static async verifyFirebaseToken(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ message: 'Firebase ID token is required.' });
      }

      let phone: string;

      // Verify ID token using Firebase Admin SDK
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (err: any) {
        return res.status(401).json({ message: 'Firebase token verification failed. Please try again.', error: err.message });
      }

      phone = decodedToken.phone_number || '';
      if (!phone) {
        return res.status(400).json({ message: 'Token does not contain a verified phone number.' });
      }

      // Normalize phone number to E.164 (strip whitespace/dashes just in case)
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format (must be E.164).' });
      }

      // Find user by mobileNumber
      let user = await User.findOne({ mobileNumber: cleanPhone });
      let isNewUser = false;

      if (!user) {
        // Brand new user — create minimal record
        user = new User({
          mobileNumber: cleanPhone,
          isPhoneVerified: true,
          spikeThreshold: 90,
          currency: 'INR'
        });
        await user.save();
        isNewUser = true;
      } else {
        // Existing user — if profile is incomplete send back to onboarding
        if (!user.name) {
          isNewUser = true;
        }
        // Always mark phone as verified on login
        user.isPhoneVerified = true;
        await user.save();
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      // Generate App JWT (valid for 365 days)
      const accessToken = jwt.sign({ id: user._id, email: user.email || '', role: 'User' }, JWT_SECRET, { expiresIn: '365d' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email || '', role: 'User' }, JWT_REFRESH_SECRET, { expiresIn: '365d' });

      return res.status(200).json({
        accessToken,
        refreshToken,
        isNewUser,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
          activityLevel: user.activityLevel,
          goal: user.goal,
          spikeThreshold: user.spikeThreshold,
          dailyCalorieTarget: user.dailyCalorieTarget,
          cancerJourney: user.cancerJourney,
          cancerDisclaimerAccepted: user.cancerDisclaimerAccepted
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during verification.' });
    }
  }

  /**
   * Onboard New User
   */
  public static async onboardNewUser(req: Request, res: Response) {
    try {
      const authReq = req as any;
      if (!authReq.user || !authReq.user.id) {
        return res.status(401).json({ message: 'Unauthorized. User ID not found in token.' });
      }

      const { name, email, gender, age, height, weight, activityLevel, goal, cancerJourney, cancerDisclaimerAccepted, cancerDisclaimerAcceptedAt } = req.body;

      if (!name || !gender || !age || !height || !weight || !activityLevel || !goal) {
        return res.status(400).json({ message: 'Name, gender, age, height, weight, activityLevel, and goal are required for onboarding.' });
      }

      if ((cancerJourney === 'TREATMENT' || cancerJourney === 'SECONDARY_PREVENTION') && !cancerDisclaimerAccepted) {
        return res.status(400).json({ message: 'You must accept the medical disclaimer to select active/secondary treatment journeys.' });
      }

      // Find user
      const user = await User.findById(authReq.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Update fields
      user.name = name;
      if (email) {
        user.email = email.toLowerCase();
      }
      user.gender = gender;
      user.age = age;
      user.height = height;
      user.weight = weight;
      user.activityLevel = activityLevel;
      user.goal = goal;
      user.cancerJourney = cancerJourney || 'PREVENTION';
      user.cancerDisclaimerAccepted = !!cancerDisclaimerAccepted;
      user.cancerDisclaimerAcceptedAt = cancerDisclaimerAcceptedAt ? new Date(cancerDisclaimerAcceptedAt) : new Date();

      // Calculate calorie targets
      user.dailyCalorieTarget = AuthController.calculateTDEE(gender, age, height, weight, activityLevel, goal);

      await user.save();

      // Send Welcome Email asynchronously if email is provided
      if (user.email) {
        EmailService.sendWelcomeEmail(user.email, user.name || 'User').catch(console.error);
      }

      return res.status(200).json({
        message: 'Onboarding completed successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
          activityLevel: user.activityLevel,
          goal: user.goal,
          spikeThreshold: user.spikeThreshold,
          dailyCalorieTarget: user.dailyCalorieTarget,
          cancerJourney: user.cancerJourney,
          cancerDisclaimerAccepted: user.cancerDisclaimerAccepted
        }
      });
    } catch (error: any) {
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: 'This email address is already in use by another account.' });
      }
      return res.status(500).json({ message: error.message || 'An error occurred during onboarding.' });
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
