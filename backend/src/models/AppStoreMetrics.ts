import { Schema, model, Document } from 'mongoose';

export interface IAppStoreMetrics extends Document {
  platform: 'android' | 'ios';
  metricDate: string; // YYYY-MM-DD
  totalInstalls?: number | null; // From store analytics if available
  firstTimeDownloads?: number | null;
  redownloads?: number | null;
  impressions?: number | null;
  pageViews?: number | null;
  conversionRate?: number | null; // Percentage, e.g. 3.74
  updates?: number | null;
  dailyInstalls?: number | null;
  dailyUninstalls?: number | null;
  activeDevices?: number | null;
  crashCount?: number | null;
  crashRate?: number | null; // e.g. 0.0015 = 0.15%
  distinctUsersWithCrashRate?: number | null;
  anrCount?: number | null;
  anrRate?: number | null; // Google Play ANR rate
  distinctUsersWithAnrRate?: number | null;
  source: 'GOOGLE_PLAY_REPORTING' | 'APPLE_APP_STORE_CONNECT';
  isStoreReported: boolean;
  notes?: string;
  rawPayload?: any;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appStoreMetricsSchema = new Schema<IAppStoreMetrics>(
  {
    platform: { type: String, enum: ['android', 'ios'], required: true, index: true },
    metricDate: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    totalInstalls: { type: Number, default: null },
    firstTimeDownloads: { type: Number, default: null },
    redownloads: { type: Number, default: null },
    impressions: { type: Number, default: null },
    pageViews: { type: Number, default: null },
    conversionRate: { type: Number, default: null },
    updates: { type: Number, default: null },
    dailyInstalls: { type: Number, default: null },
    dailyUninstalls: { type: Number, default: null },
    activeDevices: { type: Number, default: null },
    crashCount: { type: Number, default: null },
    crashRate: { type: Number, default: null },
    distinctUsersWithCrashRate: { type: Number, default: null },
    anrCount: { type: Number, default: null },
    anrRate: { type: Number, default: null },
    distinctUsersWithAnrRate: { type: Number, default: null },
    source: {
      type: String,
      enum: ['GOOGLE_PLAY_REPORTING', 'APPLE_APP_STORE_CONNECT'],
      required: true
    },
    isStoreReported: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    rawPayload: { type: Schema.Types.Mixed, default: null },
    fetchedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

appStoreMetricsSchema.index({ platform: 1, metricDate: 1 }, { unique: true });

export const AppStoreMetrics = model<IAppStoreMetrics>('AppStoreMetrics', appStoreMetricsSchema);
