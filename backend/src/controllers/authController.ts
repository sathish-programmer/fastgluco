import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { EmailService } from '../services/emailService';
import { SMSService } from '../services/smsService';
import admin from '../config/firebaseAdmin';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_67890!';
export const CURRENT_TERMS_VERSION = '1.0';

import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { AppOtpTelemetry, OtpChannel, OtpEventStatus } from '../models/AppOtpTelemetry';

const maskPhoneOrEmail = (identifier: string): string => {
  if (!identifier) return '***';
  if (identifier.includes('@')) {
    const [local, domain] = identifier.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }
  return identifier.length > 4 ? `${identifier.slice(0, 3)}****${identifier.slice(-4)}` : '****';
};

const extractTelemetryMeta = (req: Request) => {
  const platform = (req.headers['x-app-platform'] as string) || req.body?.platform || 'android';
  const appVersion = (req.headers['x-app-version'] as string) || req.body?.appVersion || '5.26.0';
  const buildNumber = (req.headers['x-app-build'] as string) || req.body?.buildNumber || '90';
  const osVersion = (req.headers['x-os-version'] as string) || req.body?.osVersion || 'Unknown';
  const deviceModel = (req.headers['x-device-model'] as string) || req.body?.deviceModel || 'Unknown';
  return {
    platform: (['android', 'ios', 'web'].includes(platform) ? platform : 'android') as 'android' | 'ios' | 'web',
    appVersion,
    buildNumber,
    osVersion,
    deviceModel
  };
};

const recordSafeOtpTelemetry = (
  req: Request,
  eventType: 'REQUEST' | 'VERIFY',
  channel: OtpChannel,
  status: OtpEventStatus,
  target: string,
  errorCategory?: string
) => {
  try {
    const meta = extractTelemetryMeta(req);
    AppOtpTelemetry.create({
      eventType,
      channel,
      status,
      errorCategory: errorCategory || null,
      maskedTarget: maskPhoneOrEmail(target),
      timestamp: new Date(),
      ...meta
    }).catch(e => console.warn('[OTP Telemetry] Log failed:', e));
  } catch (e) {
    // Non-blocking telemetry
  }
};

export class AuthController {
  public static async sendOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email } = req.body;
      if (!mobileNumber || !email) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'FAILED', 'unknown', 'MISSING_REQUIRED_FIELDS');
        return res.status(400).json({ message: 'Mobile number and email are required.' });
      }

      // Normalize phone number to E.164 (+91 for 10-digit Indian numbers)
      const cleanPhone = SMSService.normalizePhoneNumber(mobileNumber);

      // APPLE APP STORE REVIEWER BYPASS
      const isReviewAccount = process.env.ENABLE_APPLE_REVIEW_BYPASS === 'true' &&
        (cleanPhone === '+15555555555' || cleanPhone === '15555555555' ||
          cleanPhone === '+919999999999' || cleanPhone === '9999999999' ||
          cleanPhone === '+919597042108' || cleanPhone === '9597042108' ||
          cleanPhone === '919597042108' || cleanPhone === '+91919597042108' || cleanPhone === '91919597042108' ||
          email?.toLowerCase() === 'review@mitoreboot.in' ||
          email?.toLowerCase() === 'sathishkumar@gmail.com' ||
          email?.toLowerCase().endsWith('@apple.com'));

      if (isReviewAccount) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'mock', 'SUCCESS', cleanPhone);
        return res.status(200).json({ success: true, message: 'OTP sent successfully (Apple Reviewer Account)' });
      }

      if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'sms', 'FAILED', cleanPhone, 'INVALID_PHONE_FORMAT');
        return res.status(400).json({ message: 'Invalid phone number format (must be E.164).' });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check if user exists with this phone but different email
      const existingUserByPhone = await User.findOne({ mobileNumber: cleanPhone });
      if (existingUserByPhone && existingUserByPhone.email?.toLowerCase().trim() !== cleanEmail) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'FAILED', cleanPhone, 'PHONE_EMAIL_MISMATCH');
        return res.status(400).json({ message: 'This mobile number is already associated with a different email address.' });
      }

      // Check if user exists with this email but different phone
      const existingUserByEmail = await User.findOne({ email: cleanEmail });
      if (existingUserByEmail && existingUserByEmail.mobileNumber !== cleanPhone) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'FAILED', cleanPhone, 'PHONE_EMAIL_MISMATCH');
        return res.status(400).json({ message: 'This email address is already associated with a different mobile number.' });
      }

      let otpRecord = await Otp.findOne({
        $or: [
          { mobileNumber: cleanPhone },
          { email: cleanEmail }
        ]
      });
      const now = new Date();

      if (otpRecord) {
        if (otpRecord.blockedUntil && otpRecord.blockedUntil > now) {
          recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'RATE_LIMITED', cleanPhone, 'ACCOUNT_COOLDOWN_BLOCKED');
          return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
        }

        // Reset resendCount after 1 hour
        if (now.getTime() - otpRecord.lastSentAt.getTime() > 60 * 60 * 1000) {
          otpRecord.resendCount = 0;
        }

        // Rate limit: 30 seconds cooldown
        if (now.getTime() - otpRecord.lastSentAt.getTime() < 30 * 1000) {
          recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'RATE_LIMITED', cleanPhone, 'RATE_LIMIT_30S_COOLDOWN');
          return res.status(429).json({ message: 'Please wait 30 seconds before requesting another OTP.' });
        }

        // Max 5 sends per hour
        if (otpRecord.resendCount >= 5) {
          otpRecord.blockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // block for 1 hour
          await otpRecord.save();
          recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'RATE_LIMITED', cleanPhone, 'HOURLY_LIMIT_EXCEEDED');
          return res.status(429).json({ message: 'Maximum OTP requests reached. Try again in an hour.' });
        }
      }

      // Generate random 6-digit OTP
      const plainOtp = crypto.randomInt(100000, 999999).toString();
      const otpHash = crypto.createHash('sha256').update(plainOtp).digest('hex');

      if (!otpRecord) {
        otpRecord = new Otp({
          mobileNumber: cleanPhone,
          email: cleanEmail,
          otpHash,
          attemptCount: 0,
          resendCount: 1,
          lastSentAt: now,
          createdAt: now
        });
      } else {
        otpRecord.mobileNumber = cleanPhone;
        otpRecord.email = cleanEmail;
        otpRecord.otpHash = otpHash;
        otpRecord.attemptCount = 0;
        otpRecord.resendCount += 1;
        otpRecord.lastSentAt = now;
        otpRecord.createdAt = now; // Reset TTL timer
      }
      await otpRecord.save();

      let methodUsed: OtpChannel = 'both';

      // Check mock mode
      if (process.env.OTP_MOCK_MODE === 'true') {
        console.log(`[MOCK OTP] OTP for ${cleanPhone} / ${cleanEmail} is: ${plainOtp}`);
        methodUsed = 'mock';
      } else {
        const shouldSendSms = req.body.sendSms !== false;
        if (shouldSendSms) {
          // 1. Send SMS via Fast2SMS
          SMSService.sendSMS(cleanPhone, `Your Mito Reboot verification code is: ${plainOtp}. Valid for 10 minutes.`, plainOtp).catch(err => {
            console.error('[SMS Service] Failed to send SMS via Fast2SMS:', err);
          });
        } else {
          methodUsed = 'email';
        }

        // 2. ALWAYS send Email via Brevo SMTP / configured email service
        EmailService.sendOtpEmail(cleanEmail, plainOtp).catch(err => {
          console.error('[Background] Failed to send OTP email:', err);
        });
      }

      recordSafeOtpTelemetry(req, 'REQUEST', methodUsed, 'SUCCESS', cleanPhone);
      return res.status(200).json({ success: true, message: 'OTP sent successfully', method: methodUsed });
    } catch (error: any) {
      recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'FAILED', req.body?.mobileNumber || 'unknown', 'INTERNAL_SERVER_ERROR');
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A verification request is already pending for this phone number or email. Please wait a moment.' });
      }
      return res.status(500).json({ message: 'An error occurred while sending the verification code. Please try again.' });
    }
  }

  /**
   * Verify OTP (sent via Fast2SMS / Email)
   */
  public static async verifyOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email, otp } = req.body;
      if (!mobileNumber || !email || !otp) {
        recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'FAILED', mobileNumber || 'unknown', 'MISSING_REQUIRED_FIELDS');
        return res.status(400).json({ message: 'Mobile number, email and OTP are required.' });
      }

      const cleanPhone = SMSService.normalizePhoneNumber(mobileNumber);

      // APPLE APP STORE REVIEWER BYPASS
      const isReviewAccount = process.env.ENABLE_APPLE_REVIEW_BYPASS === 'true' &&
        (cleanPhone === '+15555555555' || cleanPhone === '15555555555' ||
          cleanPhone === '+919999999999' || cleanPhone === '9999999999' ||
          cleanPhone === '+919597042108' || cleanPhone === '9597042108' ||
          email?.toLowerCase() === 'review@mitoreboot.in' ||
          email?.toLowerCase() === 'sathishkumar@gmail.com' ||
          email?.toLowerCase().endsWith('@apple.com')) &&
        otp === '123456';

      if (isReviewAccount) {
        // Skip OTP verification, proceed directly to JWT generation
      } else {
        const otpRecord = await Otp.findOne({
          mobileNumber: cleanPhone,
          email: email.toLowerCase().trim()
        });

        if (!otpRecord) {
          recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'FAILED', cleanPhone, 'OTP_EXPIRED_OR_NOT_FOUND');
          return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
        }

        const now = new Date();

        if (now.getTime() - otpRecord.createdAt.getTime() > 10 * 60 * 1000) {
          await Otp.deleteOne({ _id: otpRecord._id });
          recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'FAILED', cleanPhone, 'OTP_EXPIRED_TIMEOUT');
          return res.status(400).json({ message: 'OTP expired.' });
        }

        if (otpRecord.blockedUntil && otpRecord.blockedUntil > now) {
          recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'RATE_LIMITED', cleanPhone, 'TOO_MANY_FAILED_ATTEMPTS');
          return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
        }

        const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
        if (otpRecord.otpHash !== inputHash) {
          otpRecord.attemptCount += 1;
          if (otpRecord.attemptCount >= 3) {
            otpRecord.blockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // Block for 15 mins
          }
          await otpRecord.save();
          recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'FAILED', cleanPhone, 'INVALID_OTP_CODE');
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
        recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'FAILED', cleanPhone, 'ACCOUNT_BLOCKED_BY_ADMIN');
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      // Record successful verification telemetry
      recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'SUCCESS', cleanPhone);

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
          cancerDisclaimerAccepted: user.cancerDisclaimerAccepted,
          termsAccepted: user.termsAccepted || false,
          termsAcceptedAt: user.termsAcceptedAt,
          acceptedTermsVersion: user.acceptedTermsVersion || null
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred during verification.' });
    }
  }

  /**
   * Verify Firebase ID Token after successful Phone Auth on client,
   * find or create user, and issue App JWT.
   */
  public static async firebaseLogin(req: Request, res: Response) {
    try {
      const { idToken, email, mobileNumber } = req.body;
      if (!idToken) {
        return res.status(400).json({ message: 'Firebase ID Token is required.' });
      }

      // Verify the ID token using Firebase Admin SDK
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (tokenErr: any) {
        console.error('Firebase token verification error:', tokenErr);
        return res.status(401).json({ message: 'Invalid or expired Firebase verification.' });
      }

      // Extract verified credentials from decoded token
      const firebaseUid = decodedToken.uid;
      const firebasePhone = decodedToken.phone_number;

      if (!firebasePhone) {
        return res.status(400).json({ message: 'Verified phone number not found in Firebase ID token.' });
      }

      const cleanPhone = SMSService.normalizePhoneNumber(firebasePhone);
      const cleanEmail = (decodedToken.email || email || '').toLowerCase().trim();

      // Find existing user by mobileNumber or email
      let user = null;
      if (cleanPhone) {
        user = await User.findOne({ mobileNumber: cleanPhone });
      }
      if (!user && cleanEmail) {
        user = await User.findOne({ email: cleanEmail });
      }

      let isNewUser = false;
      if (!user) {
        user = new User({
          mobileNumber: cleanPhone,
          email: cleanEmail,
          isPhoneVerified: true,
          spikeThreshold: 90,
          currency: 'INR'
        });
        await user.save();
        isNewUser = true;
      } else {
        if (!user.name) {
          isNewUser = true;
        }
        user.isPhoneVerified = true;
        if (cleanEmail && !user.email) {
          user.email = cleanEmail;
        }
        if (cleanPhone && !user.mobileNumber) {
          user.mobileNumber = cleanPhone;
        }
        await user.save();
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      // Clean up any pending OTP record for this phone/email
      try {
        await Otp.deleteMany({
          $or: [
            ...(cleanPhone ? [{ mobileNumber: cleanPhone }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : [])
          ]
        });
      } catch (cleanupErr) {
        console.warn('Failed to cleanup OTP records after Firebase login:', cleanupErr);
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
          cancerDisclaimerAccepted: user.cancerDisclaimerAccepted,
          termsAccepted: user.termsAccepted || false,
          termsAcceptedAt: user.termsAcceptedAt,
          acceptedTermsVersion: user.acceptedTermsVersion || null
        }
      });
    } catch (error: any) {
      console.error('Firebase Login Controller Error:', error);
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
          cancerDisclaimerAccepted: user.cancerDisclaimerAccepted,
          termsAccepted: user.termsAccepted || false,
          termsAcceptedAt: user.termsAcceptedAt,
          acceptedTermsVersion: user.acceptedTermsVersion || null
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
   * POST /users/accept-terms
   * Authenticated user accepts Terms & Conditions
   */
  public static async acceptTerms(req: Request, res: Response) {
    try {
      const authReq = req as any;
      const userId = authReq.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized. User ID not found in token.' });
      }

      const { termsVersion } = req.body;
      if (!termsVersion) {
        return res.status(400).json({ message: 'termsVersion is required.' });
      }

      if (termsVersion !== CURRENT_TERMS_VERSION) {
        return res.status(400).json({
          message: `Submitted terms version (${termsVersion}) does not match current required version (${CURRENT_TERMS_VERSION}).`
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const now = new Date();
      user.termsAccepted = true;
      user.termsAcceptedAt = now;
      user.acceptedTermsVersion = CURRENT_TERMS_VERSION;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Terms & Conditions accepted successfully.',
        termsAccepted: true,
        termsAcceptedAt: user.termsAcceptedAt,
        acceptedTermsVersion: user.acceptedTermsVersion,
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
          cancerDisclaimerAccepted: user.cancerDisclaimerAccepted,
          termsAccepted: user.termsAccepted,
          termsAcceptedAt: user.termsAcceptedAt,
          acceptedTermsVersion: user.acceptedTermsVersion
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'An error occurred while saving terms acceptance.' });
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
