import { Schema, model, Document } from 'mongoose';

export interface IAppCrashReport extends Document {
  platform: 'android' | 'ios';
  issueId: string; // e.g. error report issue ID from Google or signature from Apple
  title: string;
  subtitle?: string;
  errorType: 'CRASH' | 'ANR' | 'NON_FATAL';
  crashCount: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedVersions: string[];
  affectedDevices: string[];
  affectedOsVersions: string[];
  sampleStackTrace?: string;
  rawCrashLog?: string; // Complete raw diagnostic report string (.crash / .txt format)
  diagnosticUrl?: string; // Link to Google Play Console or Apple App Store Connect Xcode organizer
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
  source: 'GOOGLE_PLAY_REPORTING' | 'APPLE_APP_STORE_CONNECT' | 'CLIENT_TELEMETRY';
  createdAt: Date;
  updatedAt: Date;
}

const appCrashReportSchema = new Schema<IAppCrashReport>(
  {
    platform: { type: String, enum: ['android', 'ios'], required: true, index: true },
    issueId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    errorType: { type: String, enum: ['CRASH', 'ANR', 'NON_FATAL'], default: 'CRASH', index: true },
    crashCount: { type: Number, default: 1 },
    affectedUsers: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now, index: true },
    affectedVersions: [{ type: String }],
    affectedDevices: [{ type: String }],
    affectedOsVersions: [{ type: String }],
    sampleStackTrace: { type: String, default: '' },
    rawCrashLog: { type: String, default: '' },
    diagnosticUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED'],
      default: 'OPEN',
      index: true
    },
    source: {
      type: String,
      enum: ['GOOGLE_PLAY_REPORTING', 'APPLE_APP_STORE_CONNECT', 'CLIENT_TELEMETRY'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

appCrashReportSchema.index({ platform: 1, issueId: 1 }, { unique: true });

export const AppCrashReport = model<IAppCrashReport>('AppCrashReport', appCrashReportSchema);
