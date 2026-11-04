import { Schema, model, Document } from 'mongoose';

export type OtpEventType = 'REQUEST' | 'VERIFY';
export type OtpEventStatus = 'SUCCESS' | 'FAILED' | 'RATE_LIMITED';
export type OtpChannel = 'sms' | 'email' | 'both' | 'mock' | 'firebase';
export type OtpVerificationStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED' | 'CANCELLED';

export interface IAppOtpTelemetry extends Document {
  timestamp: Date;
  eventType: OtpEventType;
  channel: OtpChannel;
  status: OtpEventStatus;
  errorCategory?: string | null;
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
  buildNumber: string;
  osVersion: string;
  deviceModel: string;
  maskedTarget: string; // e.g. "+91*****4210" or "s***@gmail.com"
  durationMs?: number; // Duration taken to verify in milliseconds

  // Rich Tracking Fields for Admin Portal
  phoneNumber?: string; // Full unmasked phone number (e.g. "+919876543210")
  email?: string; // Full recipient email (e.g. "user@example.com")
  smsProvider?: string; // 'firebase' | 'fast2sms_quick' | 'fast2sms_otp' | 'none'
  smsStatus?: string; // 'DELIVERED' | 'FAILED' | 'SKIPPED' | 'NOT_ATTEMPTED'
  smsGatewayResponse?: any; // Gateway status/requestId/error message
  emailProvider?: string; // 'titan_godaddy_smtp' | 'brevo_smtp' | 'google_smtp' | 'custom_smtp' | 'none'
  emailStatus?: string; // 'DELIVERED' | 'FAILED' | 'PENDING' | 'SKIPPED'
  emailGatewayResponse?: any; // MessageID / SMTP response / error detail
  verificationStatus?: OtpVerificationStatus; // 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'FAILED'
  verifiedAt?: Date | null;
  attemptsCount?: number;
  ipAddress?: string;
  userAgent?: string;
  fallbackReason?: string;
  failureCategory?: string;
  verifiedVia?: string; // 'FIREBASE_PHONE' | 'FAST2SMS_SMS' | 'BREVO_EMAIL' | 'MOCK'
  apnsStatus?: string; // 'DELIVERED' | 'FAILED' | 'FALLBACK_TO_RECAPTCHA'
  recaptchaStatus?: string; // 'SUCCESS' | 'NOT_LINKED' | 'FAILED' | 'SKIPPED'

  createdAt: Date;
  updatedAt?: Date;
}

const appOtpTelemetrySchema = new Schema<IAppOtpTelemetry>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    eventType: { type: String, enum: ['REQUEST', 'VERIFY'], required: true, index: true },
    channel: { type: String, enum: ['sms', 'email', 'both', 'mock', 'firebase'], required: true, index: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'RATE_LIMITED'], required: true, index: true },
    errorCategory: { type: String, default: null, index: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android', index: true },
    appVersion: { type: String, default: '5.28.0' },
    buildNumber: { type: String, default: '92' },
    osVersion: { type: String, default: 'Unknown' },
    deviceModel: { type: String, default: 'Unknown' },
    maskedTarget: { type: String, required: true },
    durationMs: { type: Number, default: 0 },

    // Enriched fields for Admin tracking
    phoneNumber: { type: String, default: null, index: true, trim: true },
    email: { type: String, default: null, index: true, lowercase: true, trim: true },
    smsProvider: { type: String, default: 'none', index: true },
    smsStatus: { type: String, default: 'NOT_ATTEMPTED', index: true },
    smsGatewayResponse: { type: Schema.Types.Mixed, default: null },
    emailProvider: { type: String, default: 'none', index: true },
    emailStatus: { type: String, default: 'NOT_ATTEMPTED', index: true },
    emailGatewayResponse: { type: Schema.Types.Mixed, default: null },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'EXPIRED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    verifiedAt: { type: Date, default: null },
    attemptsCount: { type: Number, default: 0 },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    fallbackReason: { type: String, default: null },
    failureCategory: { type: String, default: null },
    verifiedVia: { type: String, default: null },
    apnsStatus: { type: String, default: null },
    recaptchaStatus: { type: String, default: null }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge old OTP telemetry logs after 90 days
appOtpTelemetrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AppOtpTelemetry = model<IAppOtpTelemetry>('AppOtpTelemetry', appOtpTelemetrySchema);
