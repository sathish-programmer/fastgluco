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
import { UserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { AppHealthSyncService } from '../services/appHealthSyncService';
import { AppHealthController } from './appHealthController';

const maskPhoneOrEmail = (identifier: string): string => {
  if (!identifier) return '***';
  if (identifier.includes('@')) {
    const [local, domain] = identifier.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }
  return identifier.length > 4 ? `${identifier.slice(0, 3)}****${identifier.slice(-4)}` : '****';
};

const extractTelemetryMeta = (req: Request) => {
  const platform = (req.headers['x-app-platform'] as string) || req.body?.platform;
  const rawVersion = (req.headers['x-app-version'] as string) || req.body?.appVersion;
  const appVersion = (rawVersion && rawVersion !== '5.28.0') ? rawVersion : undefined;
  const buildNumber = (req.headers['x-app-build'] as string) || req.body?.buildNumber;
  const osVersion = (req.headers['x-os-version'] as string) || req.body?.osVersion || 'Unknown';
  const deviceModel = (req.headers['x-device-model'] as string) || req.body?.deviceModel || 'Unknown';
  return {
    platform: (['android', 'ios', 'web'].includes(platform) ? platform : undefined) as 'android' | 'ios' | 'web' | undefined,
    appVersion,
    buildNumber,
    osVersion,
    deviceModel
  };
};

const checkForceUpdate = async (req: Request): Promise<{ isBlocked: boolean; message?: string } | null> => {
  try {
    const meta = extractTelemetryMeta(req);
    // Never block if version is not explicitly reported by client
    if (!meta.platform || meta.platform === 'web' || !meta.appVersion) return null;

    const config = await AppHealthSyncService.getOrCreateConfig();
    const rules = meta.platform === 'ios' ? config.iosVersionRules : config.androidVersionRules;

    if (rules?.forceUpdate && rules.minSupportedVersion && AppHealthController.compareVersions(rules.minSupportedVersion, meta.appVersion) > 0) {
      return {
        isBlocked: true,
        message: `App Update Required: Your app version (${meta.appVersion}) is outdated. Please update to version ${rules.minSupportedVersion} or higher from the ${meta.platform === 'ios' ? 'Apple App Store' : 'Google Play Store'} to continue.`
      };
    }
    return null;
  } catch {
    return null;
  }
};

interface SafeOtpTelemetryDetails {
  phoneNumber?: string;
  email?: string;
  smsProvider?: string;
  smsStatus?: string;
  smsGatewayResponse?: any;
  emailProvider?: string;
  emailStatus?: string;
  emailGatewayResponse?: any;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  verifiedAt?: Date;
  attemptsCount?: number;
  durationMs?: number;
  fallbackReason?: string;
  failureCategory?: string;
}

const recordSafeOtpTelemetry = (
  req: Request,
  eventType: 'REQUEST' | 'VERIFY',
  channel: OtpChannel,
  status: OtpEventStatus,
  target: string,
  errorCategory?: string,
  details?: Partial<SafeOtpTelemetryDetails>
) => {
  try {
    const meta = extractTelemetryMeta(req);
    const ipAddress = ((req.headers['x-forwarded-for'] as string) || req.ip || '').split(',')[0].trim();
    const userAgent = (req.headers['user-agent'] as string) || '';

    const cleanPhone = details?.phoneNumber || (target && !target.includes('@') ? SMSService.normalizePhoneNumber(target) : undefined);
    const cleanEmail = details?.email || (target && target.includes('@') ? target.toLowerCase().trim() : undefined);

    AppOtpTelemetry.create({
      eventType,
      channel,
      status,
      errorCategory: errorCategory || null,
      maskedTarget: maskPhoneOrEmail(target || cleanPhone || cleanEmail || 'unknown'),
      timestamp: new Date(),
      phoneNumber: cleanPhone || null,
      email: cleanEmail || null,
      smsProvider: details?.smsProvider || 'none',
      smsStatus: details?.smsStatus || 'NOT_ATTEMPTED',
      smsGatewayResponse: details?.smsGatewayResponse || null,
      emailProvider: details?.emailProvider || 'none',
      emailStatus: details?.emailStatus || 'NOT_ATTEMPTED',
      emailGatewayResponse: details?.emailGatewayResponse || null,
      verificationStatus: details?.verificationStatus || (eventType === 'REQUEST' ? 'PENDING' : 'VERIFIED'),
      verifiedAt: details?.verifiedAt || null,
      attemptsCount: details?.attemptsCount || 0,
      durationMs: details?.durationMs || 0,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.slice(0, 255) : null,
      fallbackReason: details?.fallbackReason || (req.body?.fallbackReason || null),
      failureCategory: details?.failureCategory || (req.body?.failureCategory || null),
      ...meta
    }).catch(e => console.warn('[OTP Telemetry] Log failed:', e));
  } catch (e) {
    // Non-blocking telemetry
  }
};

const OTP_ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback_secret_key_12345!').digest();

function encryptOtp(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', OTP_ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptOtp(text: string): string | null {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', OTP_ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

export class AuthController {
  public static async sendOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email } = req.body;
      if (!mobileNumber || !email) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'FAILED', 'unknown', 'MISSING_REQUIRED_FIELDS');
        return res.status(400).json({ message: 'Mobile number and email are required.' });
      }

      // Check minimum app version enforcement
      const updateCheck = await checkForceUpdate(req);
      if (updateCheck?.isBlocked) {
        return res.status(403).json({
          success: false,
          message: updateCheck.message,
          isUpdateRequired: true
        });
      }

      // Normalize phone number to E.164 (+91 for 10-digit Indian numbers)
      const cleanPhone = SMSService.normalizePhoneNumber(mobileNumber);

      // APPLE APP STORE OFFICIAL REVIEWER ACCOUNT BYPASS (Matches App Store Review Notes)
      const digits = (cleanPhone || '').replace(/[^0-9]/g, '');
      const rawEmail = (email || '').toLowerCase().trim();
      const isOfficialReviewer = (process.env.ENABLE_APPLE_REVIEW_BYPASS !== 'false') &&
        ((digits.endsWith('9597042107') && rawEmail === 'sathishkumarksk007@gmail.com') ||
          digits.endsWith('9999999999') ||
          digits.endsWith('15555555555') ||
          digits === '5555555555' ||
          rawEmail === 'review@mitoreboot.in' ||
          rawEmail.endsWith('@apple.com'));

      if (isOfficialReviewer) {
        recordSafeOtpTelemetry(req, 'REQUEST', 'mock', 'SUCCESS', cleanPhone);
        // Also deliver code via email if Brevo is available
        EmailService.sendOtpEmail(rawEmail, '123456').catch(err => {
          console.warn('[Background] Reviewer OTP email dispatch notice:', err?.message || err);
        });
        return res.status(200).json({
          success: true,
          message: `Verification code sent to ${rawEmail}.`,
          method: 'both',
          smsDelivered: true
        });
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

      const clientPlatform = (req.body.platform || req.headers['x-platform'] || '').toString().toLowerCase().trim();
      const isIOS = clientPlatform === 'ios';
      const fallbackReason = (req.body.fallbackReason || 'DIRECT').toString().slice(0, 100);
      const failureCategory = (req.body.failureCategory || 'NONE').toString().slice(0, 250);
      const isFallbackSms = req.body.fallbackSms === true;

      // ─── SPECIAL CASE: iOS Fast2SMS Fallback (Reuse existing active OTP without duplicate email) ───
      if (isFallbackSms && isIOS && otpRecord && otpRecord.encryptedOtp) {
        const existingPlainOtp = decryptOtp(otpRecord.encryptedOtp);
        const isNotExpired = (now.getTime() - otpRecord.createdAt.getTime()) < 10 * 60 * 1000;

        if (existingPlainOtp && isNotExpired) {
          console.log(`[Auth /send-otp] iOS Fast2SMS fallback triggered | Reason: "${fallbackReason}" | Failure: "${failureCategory}" | Reusing active OTP (suppressing duplicate email)`);
          const smsResult = await SMSService.sendSMS(cleanPhone, existingPlainOtp, clientPlatform);
          const channelUsed: OtpChannel = smsResult.success ? 'both' : 'email';
          
          const smsProviderName = smsResult.success
            ? (smsResult.routeUsed === 'q' ? 'fast2sms_quick' : 'fast2sms_otp')
            : 'fast2sms_quick';
          const smsStatusVal = smsResult.success ? 'DELIVERED' : 'FAILED';
          const smsGatewayResp = smsResult.rawResponse || smsResult.reason || (smsResult.success ? 'Delivered via Quick Route' : 'Delivery Failed');

          // CRITICAL DEDUPLICATION FIX: Find existing pending telemetry created during initial dispatch
          // and update it in-place instead of creating a second duplicate row in the Admin Telemetry Log.
          const existingTelemetry = await AppOtpTelemetry.findOne({
            $or: [
              { phoneNumber: cleanPhone },
              { email: cleanEmail }
            ],
            verificationStatus: 'PENDING',
            timestamp: { $gte: new Date(now.getTime() - 3 * 60 * 1000) }
          }).sort({ timestamp: -1 });

          if (existingTelemetry) {
            existingTelemetry.channel = channelUsed;
            existingTelemetry.smsProvider = smsProviderName;
            existingTelemetry.smsStatus = smsStatusVal;
            existingTelemetry.smsGatewayResponse = smsGatewayResp;
            existingTelemetry.fallbackReason = fallbackReason;
            existingTelemetry.failureCategory = failureCategory;
            if (!existingTelemetry.phoneNumber) existingTelemetry.phoneNumber = cleanPhone;
            if (!existingTelemetry.email) existingTelemetry.email = cleanEmail;
            await existingTelemetry.save().catch(() => {});
          } else {
            recordSafeOtpTelemetry(
              req,
              'REQUEST',
              channelUsed,
              smsResult.success ? 'SUCCESS' : 'FAILED',
              cleanPhone,
              smsResult.reason,
              {
                phoneNumber: cleanPhone,
                email: cleanEmail,
                smsProvider: smsProviderName,
                smsStatus: smsStatusVal,
                smsGatewayResponse: smsGatewayResp,
                emailProvider: EmailService.getSmtpProviderName(),
                emailStatus: 'DELIVERED',
                emailGatewayResponse: 'Reused active OTP session (duplicate email suppressed)',
                verificationStatus: 'PENDING',
                fallbackReason,
                failureCategory
              }
            );
          }

          return res.status(200).json({
            success: true,
            message: smsResult.success
              ? 'Verification code sent via SMS fallback.'
              : 'SMS delivery unavailable (DLT template required). Please use the verification code sent to your email.',
            method: channelUsed,
            smsDelivered: smsResult.success,
            duplicateEmailSuppressed: true
          });
        }
      }

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
      const encryptedOtp = encryptOtp(plainOtp);

      if (!otpRecord) {
        otpRecord = new Otp({
          mobileNumber: cleanPhone,
          email: cleanEmail,
          otpHash,
          encryptedOtp,
          attemptCount: 0,
          resendCount: 1,
          lastSentAt: now,
          createdAt: now
        });
      } else {
        otpRecord.mobileNumber = cleanPhone;
        otpRecord.email = cleanEmail;
        otpRecord.otpHash = otpHash;
        otpRecord.encryptedOtp = encryptedOtp;
        otpRecord.attemptCount = 0;
        otpRecord.resendCount += 1;
        otpRecord.lastSentAt = now;
        otpRecord.createdAt = now; // Reset TTL timer
      }
      await otpRecord.save();

      let methodUsed: OtpChannel = 'email';

      // Always log in development or mock mode for easy debugging
      if (process.env.OTP_MOCK_MODE === 'true' || process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP] OTP for ${cleanPhone} / ${cleanEmail} is: ${plainOtp}`);
      }

      console.log(`[Auth /send-otp] Provider selection request | Platform: "${clientPlatform || 'unknown'}" | Fallback Reason: "${fallbackReason}" | Failure Category: "${failureCategory}"`);

      // STRICT POLICY: Fast2SMS fallback is exclusively allowed for iOS login/signup.
      // Android, Web, and other platforms NEVER receive SMS via Fast2SMS.
      const shouldSendSms = req.body.sendSms !== false && isIOS;
      let smsResult: { success: boolean; routeUsed?: string; reason?: string; rawResponse?: any } = { success: false, reason: 'NOT_ATTEMPTED' };

      if (shouldSendSms) {
        console.log(`[Auth /send-otp] Triggering iOS Fast2SMS fallback | Provider: Fast2SMS (low-cost route first, Quick route fallback)`);
        smsResult = await SMSService.sendSMS(cleanPhone, plainOtp, clientPlatform);
        if (smsResult.success) {
          methodUsed = 'both';
          console.log(`[Auth /send-otp] Fast2SMS OTP delivered via route "${smsResult.routeUsed || 'otp'}"`);
        } else {
          methodUsed = 'email';
          console.log(`[Auth /send-otp] Fast2SMS OTP routes failed (${smsResult.reason}). Fallback to Email OTP.`);
        }
      } else {
        methodUsed = 'email';
        if (req.body.sendSms !== false && !isIOS) {
          console.log(`[SMS Service] Fast2SMS explicitly BLOCKED for non-iOS platform ("${clientPlatform || 'unknown'}"). Fast2SMS fallback is strictly restricted to iOS login/signup.`);
        }
      }

      // 2. ALWAYS send Email via Titan Mail / GoDaddy / Brevo SMTP
      const emailResult: {
        success: boolean;
        provider: string;
        messageId?: string;
        response?: string;
        error?: string;
      } = await EmailService.sendOtpEmail(cleanEmail, plainOtp).catch(err => ({
        success: false,
        provider: EmailService.getSmtpProviderName(),
        error: err?.message || String(err)
      }));

      const resolvedSmsProvider = smsResult.success
        ? (smsResult.routeUsed === 'q' ? 'fast2sms_quick' : 'fast2sms_otp')
        : (shouldSendSms ? (smsResult.routeUsed === 'q' ? 'fast2sms_quick' : 'fast2sms_otp') : 'none');
      const resolvedSmsStatus = smsResult.success
        ? 'DELIVERED'
        : (shouldSendSms ? 'FAILED' : 'SKIPPED');

      recordSafeOtpTelemetry(
        req,
        'REQUEST',
        methodUsed,
        'SUCCESS',
        cleanPhone,
        undefined,
        {
          phoneNumber: cleanPhone,
          email: cleanEmail,
          smsProvider: resolvedSmsProvider,
          smsStatus: resolvedSmsStatus,
          smsGatewayResponse: smsResult.rawResponse || smsResult.reason || (smsResult.success ? 'Delivered' : null),
          emailProvider: emailResult?.provider || EmailService.getSmtpProviderName(),
          emailStatus: emailResult?.success ? 'DELIVERED' : 'FAILED',
          emailGatewayResponse: emailResult?.messageId
            ? `MessageId: ${emailResult.messageId} (${emailResult.response || 'SMTP OK'})`
            : (emailResult?.error || 'Delivered'),
          verificationStatus: 'PENDING',
          fallbackReason,
          failureCategory
        }
      );

      const userMessage = methodUsed === 'both'
        ? `Verification code sent to your mobile and ${cleanEmail}.`
        : `Verification code sent to ${cleanEmail}.`;

      return res.status(200).json({
        success: true,
        message: userMessage,
        method: methodUsed,
        smsDelivered: methodUsed === 'both'
      });
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

      // Check minimum app version enforcement
      const updateCheck = await checkForceUpdate(req);
      if (updateCheck?.isBlocked) {
        return res.status(403).json({
          success: false,
          message: updateCheck.message,
          isUpdateRequired: true
        });
      }

      const cleanPhone = SMSService.normalizePhoneNumber(mobileNumber);

      // APPLE APP STORE REVIEWER BYPASS
      const digits = (cleanPhone || '').replace(/[^0-9]/g, '');
      const rawEmail = (email || '').toLowerCase().trim();
      const cleanEmail = rawEmail;
      const isReviewAccount = (process.env.ENABLE_APPLE_REVIEW_BYPASS !== 'false') &&
        (digits.endsWith('9597042107') ||
          digits.endsWith('9597042108') ||
          digits.endsWith('9999999999') ||
          digits.endsWith('15555555555') ||
          digits === '5555555555' ||
          rawEmail === 'review@mitoreboot.in' ||
          rawEmail === 'sathishkumarsk007@gmail.com' ||
          rawEmail === 'sathishkumarksk007@gmail.com' ||
          rawEmail === 'sathishkumar@gmail.com' ||
          rawEmail.endsWith('@apple.com')) &&
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

          // Update pending telemetry attempts count
          const pendingTelemetry = await AppOtpTelemetry.findOne({
            $or: [
              { phoneNumber: cleanPhone },
              ...(rawEmail ? [{ email: rawEmail }] : [])
            ],
            verificationStatus: 'PENDING'
          }).sort({ timestamp: -1 });
          if (pendingTelemetry) {
            pendingTelemetry.attemptsCount = (pendingTelemetry.attemptsCount || 0) + 1;
            if (otpRecord.attemptCount >= 3) {
              pendingTelemetry.verificationStatus = 'FAILED';
            }
            await pendingTelemetry.save().catch(() => {});
          } else {
            recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'FAILED', cleanPhone, 'INVALID_OTP_CODE', {
              phoneNumber: cleanPhone,
              email: rawEmail,
              attemptsCount: otpRecord.attemptCount
            });
          }
          return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Valid OTP, delete record
        await Otp.deleteOne({ _id: otpRecord._id });
      }

      // Find user by mobileNumber or email
      let user = await User.findOne({
        $or: [
          { mobileNumber: cleanPhone },
          ...(email ? [{ email: email.toLowerCase().trim() }] : [])
        ]
      });
      let isNewUser = false;

      const isAppleReviewer = rawEmail.endsWith('@apple.com') || rawEmail === 'review@mitoreboot.in';

      if (!user) {
        // Brand new user — create record (auto-populate for Apple reviewers to bypass onboarding steps)
        user = new User({
          mobileNumber: cleanPhone,
          email: email.toLowerCase().trim(),
          name: isAppleReviewer ? 'Apple Reviewer' : undefined,
          isPhoneVerified: true,
          spikeThreshold: 90,
          currency: 'INR',
          gender: isAppleReviewer ? 'Other' : undefined,
          age: isAppleReviewer ? 30 : undefined,
          height: isAppleReviewer ? 170 : undefined,
          weight: isAppleReviewer ? 70 : undefined,
          activityLevel: isAppleReviewer ? 'Moderately active' : undefined,
          goal: isAppleReviewer ? 'Maintain weight' : undefined,
          cancerJourney: isAppleReviewer ? 'PREVENTION' : undefined,
          cancerDisclaimerAccepted: isAppleReviewer ? true : false,
          termsAccepted: isAppleReviewer ? true : false,
          termsAcceptedAt: isAppleReviewer ? new Date() : undefined
        });
        await user.save();
        isNewUser = isAppleReviewer ? false : true;
      } else {
        // Existing user — if profile is incomplete send back to onboarding unless reviewer
        if (!user.name && !isAppleReviewer) {
          isNewUser = true;
        }
        user.isPhoneVerified = true;
        await user.save();
      }

      if (user.isBlocked) {
        recordSafeOtpTelemetry(req, 'VERIFY', 'both', 'FAILED', cleanPhone, 'ACCOUNT_BLOCKED_BY_ADMIN', {
          phoneNumber: cleanPhone,
          email: rawEmail
        });
        return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      }

      // Update the active OTP request telemetry session to VERIFIED
      const pendingTelemetry = await AppOtpTelemetry.findOne({
        $or: [
          { phoneNumber: cleanPhone },
          ...(rawEmail ? [{ email: rawEmail }] : [])
        ],
        verificationStatus: { $in: ['PENDING', 'EXPIRED'] }
      }).sort({ timestamp: -1 });

      let timeTakenMs = 0;
      if (pendingTelemetry) {
        timeTakenMs = Date.now() - pendingTelemetry.timestamp.getTime();
        pendingTelemetry.verificationStatus = 'VERIFIED';
        pendingTelemetry.verifiedAt = new Date();
        pendingTelemetry.durationMs = timeTakenMs;
        pendingTelemetry.verifiedVia = pendingTelemetry.fallbackReason ? 'FAST2SMS_FALLBACK' : 'BACKEND_OTP';
        if (rawEmail && !pendingTelemetry.email) pendingTelemetry.email = rawEmail;
        if (cleanPhone && !pendingTelemetry.phoneNumber) pendingTelemetry.phoneNumber = cleanPhone;
        await pendingTelemetry.save().catch(() => {});

        // CRITICAL CLEANUP: Also update any other pending telemetry records for this recipient created in the last 15 minutes
        // so no orphaned record remains "PENDING" and later incorrectly displays as "Expired (>10m)" in Admin logs.
        await AppOtpTelemetry.updateMany(
          {
            $or: [
              { phoneNumber: cleanPhone },
              ...(cleanEmail ? [{ email: cleanEmail }] : [])
            ],
            _id: { $ne: pendingTelemetry._id },
            verificationStatus: 'PENDING',
            timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
          },
          {
            $set: {
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              durationMs: timeTakenMs
            }
          }
        ).catch(() => {});
      } else {
        // Fallback for reviewer accounts or direct verified logins
        recordSafeOtpTelemetry(req, 'REQUEST', 'both', 'SUCCESS', cleanPhone, undefined, {
          phoneNumber: cleanPhone,
          email: rawEmail,
          emailProvider: EmailService.getSmtpProviderName(),
          emailStatus: 'DELIVERED',
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          durationMs: timeTakenMs
        });
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

      // Check minimum app version enforcement
      const updateCheck = await checkForceUpdate(req);
      if (updateCheck?.isBlocked) {
        return res.status(403).json({
          success: false,
          message: updateCheck.message,
          isUpdateRequired: true
        });
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

      // Update pending telemetry session if any, or record Firebase Auth single session
      try {
        const pendingTelemetry = await AppOtpTelemetry.findOne({
          $or: [
            ...(cleanPhone ? [{ phoneNumber: cleanPhone }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : [])
          ],
          verificationStatus: { $in: ['PENDING', 'EXPIRED'] }
        }).sort({ timestamp: -1 });

        let timeTakenMs = 0;
        if (pendingTelemetry) {
          timeTakenMs = Date.now() - pendingTelemetry.timestamp.getTime();
          pendingTelemetry.verificationStatus = 'VERIFIED';
          pendingTelemetry.verifiedAt = new Date();
          pendingTelemetry.durationMs = timeTakenMs;
          pendingTelemetry.smsProvider = 'firebase';
          pendingTelemetry.smsStatus = 'DELIVERED';
          pendingTelemetry.verifiedVia = 'FIREBASE_PHONE';
          pendingTelemetry.smsGatewayResponse = `Firebase Phone Auth token verified (UID: ${firebaseUid})`;
          if (cleanPhone && !pendingTelemetry.phoneNumber) pendingTelemetry.phoneNumber = cleanPhone;
          if (cleanEmail && !pendingTelemetry.email) pendingTelemetry.email = cleanEmail;
          await pendingTelemetry.save().catch(() => {});

        // CRITICAL CLEANUP: Also update any other pending telemetry records for this recipient created in the last 15 minutes
        // so no orphaned record remains "PENDING" and later incorrectly displays as "Expired (>10m)" in Admin logs.
        await AppOtpTelemetry.updateMany(
          {
            $or: [
              { phoneNumber: cleanPhone },
              ...(cleanEmail ? [{ email: cleanEmail }] : [])
            ],
            _id: { $ne: pendingTelemetry._id },
            verificationStatus: 'PENDING',
            timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
          },
          {
            $set: {
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              durationMs: timeTakenMs
            }
          }
        ).catch(() => {});
        } else {
          recordSafeOtpTelemetry(
            req,
            'REQUEST',
            'firebase',
            'SUCCESS',
            cleanPhone || cleanEmail,
            undefined,
            {
              phoneNumber: cleanPhone,
              email: cleanEmail,
              smsProvider: 'firebase',
              smsStatus: 'DELIVERED',
              emailProvider: 'none',
              emailStatus: 'SKIPPED',
              smsGatewayResponse: `Firebase Phone Auth token verified (UID: ${firebaseUid})`,
              verificationStatus: 'VERIFIED',
              verifiedAt: new Date(),
              durationMs: timeTakenMs,
              attemptsCount: 1
            }
          );
        }
      } catch (telemetryErr) {
        console.warn('[Firebase Login Telemetry Error]:', telemetryErr);
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

      // Automatically provision 48-hour free trial if new user has no subscription yet
      try {
        const existingSub = await UserSubscription.findOne({ userId: user._id });
        if (!existingSub) {
          const plan = await SubscriptionPlan.findOne({ isActive: true, isDeleted: false }).sort({ displayOrder: 1 });
          if (plan) {
            const now = new Date();
            const trialHours = (plan as any).trialHours || (plan.trialDays ? plan.trialDays * 24 : 48);
            const trialEndDate = new Date(now.getTime() + trialHours * 60 * 60 * 1000);
            await UserSubscription.create({
              userId: user._id,
              planId: plan._id,
              billingCycle: 'yearly',
              status: 'trialing',
              startDate: now,
              endDate: trialEndDate,
              trialStartDate: now,
              trialEndDate,
              cancelAtPeriodEnd: false
            });
          }
        }
      } catch (subErr) {
        console.warn('[Onboarding] Auto-trial provisioning failed:', subErr);
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
