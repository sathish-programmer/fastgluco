import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  mobileNumber: string;
  email: string;
  otpHash: string;
  attemptCount: number;
  resendCount: number;
  lastSentAt: Date;
  blockedUntil: Date | null;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    mobileNumber: { type: String, required: true, index: true, trim: true },
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    attemptCount: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    blockedUntil: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
  },
  {
    timestamps: false // Manually managing createdAt/lastSentAt
  }
);

// TTL index to automatically delete documents after 10 minutes (600 seconds)
// This strictly enforces the 10 minute OTP expiry at the database level.
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const Otp = model<IOtp>('Otp', otpSchema);
