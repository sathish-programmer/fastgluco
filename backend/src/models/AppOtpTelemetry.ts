import { Schema, model, Document } from 'mongoose';

export type OtpEventType = 'REQUEST' | 'VERIFY';
export type OtpEventStatus = 'SUCCESS' | 'FAILED' | 'RATE_LIMITED';
export type OtpChannel = 'sms' | 'email' | 'both' | 'mock' | 'firebase';

export interface IAppOtpTelemetry extends Document {
  timestamp: Date;
  eventType: OtpEventType;
  channel: OtpChannel;
  status: OtpEventStatus;
  errorCategory?: string; // 'COOLDOWN_ACTIVE' | 'HOURLY_LIMIT_EXCEEDED' | 'INVALID_CODE' | 'EXPIRED_CODE' | 'USER_SUSPENDED' | 'PROVIDER_ERROR' | 'INVALID_FORMAT'
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
  buildNumber: string;
  osVersion: string;
  deviceModel: string;
  maskedTarget: string; // e.g. "+91*****4210" or "s***@gmail.com" - strictly masked, no plaintext PII
  durationMs?: number; // Duration taken to verify if known
  createdAt: Date;
}

const appOtpTelemetrySchema = new Schema<IAppOtpTelemetry>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    eventType: { type: String, enum: ['REQUEST', 'VERIFY'], required: true, index: true },
    channel: { type: String, enum: ['sms', 'email', 'both', 'mock', 'firebase'], required: true, index: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'RATE_LIMITED'], required: true, index: true },
    errorCategory: { type: String, default: null, index: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android', index: true },
    appVersion: { type: String, default: '5.26.0' },
    buildNumber: { type: String, default: '90' },
    osVersion: { type: String, default: 'Unknown' },
    deviceModel: { type: String, default: 'Unknown' },
    maskedTarget: { type: String, required: true },
    durationMs: { type: Number, default: 0 }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// TTL index to automatically purge old OTP telemetry logs after 90 days
appOtpTelemetrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AppOtpTelemetry = model<IAppOtpTelemetry>('AppOtpTelemetry', appOtpTelemetrySchema);
