import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { EmailService } from '../services/emailService';
import admin from '../config/firebaseAdmin';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_67890!';

import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

export class AuthController {
  public static async sendOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email } = req.body;
      if (!mobileNumber || !email) {
        return res.status(400).json({ message: 'Mobile number and email are required.' });
      }

      // Normalize phone number to E.164
      const cleanPhone = mobileNumber.replace(/[\s\-\(\)]/g, '');

      // APPLE APP STORE REVIEWER BYPASS
      const isReviewAccount = process.env.ENABLE_APPLE_REVIEW_BYPASS === 'true' && 
        (cleanPhone === '+15555555555' || cleanPhone === '+919999999999' || email?.toLowerCase() === 'review@mitoreboot.in');
        
      if (isReviewAccount) {
        return res.status(200).json({ success: true, message: 'OTP sent successfully (Apple Reviewer Account)' });
      }

      if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format (must be E.164).' });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check if user exists with this phone but different email
      const existingUserByPhone = await User.findOne({ mobileNumber: cleanPhone });
      if (existingUserByPhone && existingUserByPhone.email?.toLowerCase().trim() !== cleanEmail) {
        return res.status(400).json({ message: 'This mobile number is already associated with a different email address.' });
      }

      // Check if user exists with this email but different phone
      const existingUserByEmail = await User.findOne({ email: cleanEmail });
      if (existingUserByEmail && existingUserByEmail.mobileNumber !== cleanPhone) {
        return res.status(400).json({ message: 'This email address is already associated with a different mobile number.' });
      }

      let otpRecord = await Otp.findOne({ 
        mobileNumber: cleanPhone,
        email: cleanEmail 
      });
      const now = new Date();

      if (otpRecord) {
        if (otpRecord.blockedUntil && otpRecord.blockedUntil > now) {
          return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
        }
        
        // Reset resendCount after 1 hour
        if (now.getTime() - otpRecord.lastSentAt.getTime() > 60 * 60 * 1000) {
          otpRecord.resendCount = 0;
        }

        // Rate limit: 30 seconds cooldown
        if (now.getTime() - otpRecord.lastSentAt.getTime() < 30 * 1000) {
          return res.status(429).json({ message: 'Please wait 30 seconds before requesting another OTP.' });
        }

        // Max 5 sends per hour
        if (otpRecord.resendCount >= 5) {
          otpRecord.blockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // block for 1 hour
          await otpRecord.save();
          return res.status(429).json({ message: 'Maximum OTP requests reached. Try again in an hour.' });
        }
      }

      // Generate random 6-digit OTP
      const plainOtp = crypto.randomInt(100000, 999999).toString();
      const otpHash = crypto.createHash('sha256').update(plainOtp).digest('hex');

      if (!otpRecord) {
        otpRecord = new Otp({
          mobileNumber: cleanPhone,
          email: email.toLowerCase().trim(),
          otpHash,
          attemptCount: 0,
          resendCount: 1,
          lastSentAt: now,
        });
      } else {
        otpRecord.otpHash = otpHash;
        otpRecord.attemptCount = 0;
        otpRecord.resendCount += 1;
        otpRecord.lastSentAt = now;
      }
      await otpRecord.save();

      let methodUsed = 'email';

      // Check mock mode
      if (process.env.OTP_MOCK_MODE === 'true') {
        console.log(`[MOCK OTP] OTP for ${cleanPhone} / ${email} is: ${plainOtp}`);
        methodUsed = 'mock';
      } else {
        const config = await PaymentGatewayConfig.findOne();
        const useTwilio = config?.enableTwilioOtp || false;

        if (useTwilio) {
          methodUsed = 'sms';
          const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
          const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
          const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
          
          if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
            console.error("Twilio credentials missing in environment variables!", { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER });
            return res.status(500).json({ message: "SMS configuration error." });
          }
          
          // Call Twilio API using standard fetch
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          
          const params = new URLSearchParams();
          params.append('To', cleanPhone);
          params.append('From', TWILIO_PHONE_NUMBER);
          params.append('Body', `Your Mito Reboot verification code is: ${plainOtp}. Valid for 10 minutes.`);

          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
          });
          
          const twilioData = await twilioResponse.json();
          
          if (!twilioResponse.ok) {
            console.error(`Twilio Error (${twilioResponse.status}):`, twilioData);
            return res.status(500).json({ message: 'Failed to send SMS via provider.' });
          }
        } else {
          // Send via Email (SMTP) asynchronously to avoid blocking the API response
          EmailService.sendOtpEmail(email, plainOtp).catch(err => {
            console.error('[Background] Failed to send OTP email:', err);
          });
        }
      }

      return res.status(200).json({ success: true, message: 'OTP sent successfully', method: methodUsed });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error sending OTP' });
    }
  }

  /**
   * Verify MSG91 OTP
   */
  public static async verifyOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email, otp } = req.body;
      if (!mobileNumber || !email || !otp) {
        return res.status(400).json({ message: 'Mobile number, email and OTP are required.' });
      }

      const cleanPhone = mobileNumber.replace(/[\s\-\(\)]/g, '');
      
      // APPLE APP STORE REVIEWER BYPASS
      const isReviewAccount = process.env.ENABLE_APPLE_REVIEW_BYPASS === 'true' && 
        (cleanPhone === '+15555555555' || cleanPhone === '+919999999999' || email?.toLowerCase() === 'review@mitoreboot.in') && 
        otp === '123456';

      if (isReviewAccount) {
        // Skip OTP verification, proceed directly to JWT generation
      } else {
        const otpRecord = await Otp.findOne({ 
          mobileNumber: cleanPhone,
          email: email.toLowerCase().trim()
        });

        if (!otpRecord) {
          return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
        }

        const now = new Date();
        
        if (now.getTime() - otpRecord.createdAt.getTime() > 10 * 60 * 1000) {
           await Otp.deleteOne({ _id: otpRecord._id });
           return res.status(400).json({ message: 'OTP expired.' });
        }

        if (otpRecord.blockedUntil && otpRecord.blockedUntil > now) {
          return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
        }

        const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
        if (otpRecord.otpHash !== inputHash) {
          otpRecord.attemptCount += 1;
          if (otpRecord.attemptCount >= 3) {
             otpRecord.blockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // Block for 15 mins
          }
          await otpRecord.save();
          return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Valid OTP, delete record
        await Otp.deleteOne({ _id: otpRecord._id });
      }

      // Find user by mobileNumber
      let user = await User.findOne({ mobileNumber: cleanPhone });
      let isNewUser = false;

      if (!user) {
        // Brand new user — create minimal record
        user = new User({
          mobileNumber: cleanPhone,
          email: email.toLowerCase().trim(),
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
