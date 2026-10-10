import { Schema, model, Document } from 'mongoose';

export interface IAppTelemetrySession extends Document {
  userId?: Schema.Types.ObjectId;
  deviceId: string;
  platform: 'android' | 'ios' | 'web';
  appVersion: string;
  buildNumber: string;
  osVersion: string;
  deviceModel: string;
  sessionDate: string; // YYYY-MM-DD
  requestCount: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appTelemetrySessionSchema = new Schema<IAppTelemetrySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
    deviceId: { type: String, required: true, index: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], required: true, index: true },
    appVersion: { type: String, required: true, index: true, default: '5.26.0' },
    buildNumber: { type: String, default: '90' },
    osVersion: { type: String, default: 'Unknown' },
    deviceModel: { type: String, default: 'Unknown' },
    sessionDate: { type: String, required: true, index: true }, // Format: YYYY-MM-DD for fast aggregation
    requestCount: { type: Number, default: 1 },
    lastActiveAt: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee one session per device per day
appTelemetrySessionSchema.index({ deviceId: 1, sessionDate: 1 }, { unique: true });
appTelemetrySessionSchema.index({ platform: 1, sessionDate: 1 });
appTelemetrySessionSchema.index({ appVersion: 1, sessionDate: 1 });

export const AppTelemetrySession = model<IAppTelemetrySession>('AppTelemetrySession', appTelemetrySessionSchema);
