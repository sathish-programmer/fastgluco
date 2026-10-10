import { Schema, model, Document } from 'mongoose';

export interface IVersionRule {
  latestReleasedVersion: string;
  latestBuildNumber: string;
  minSupportedVersion: string;
  recommendedVersion: string;
  forceUpdate: boolean;
  updateUrl: string;
  releaseNotes?: string;
  lastReleaseDate?: Date;
}

export interface IAppHealthConfig extends Document {
  // Google Play Console / Reporting API credentials
  googlePackageName: string;
  googleServiceAccountEmail?: string;
  googlePrivateKey?: string; // Stored securely on backend
  googleKeyFileUploaded: boolean;
  googleReportingEnabled: boolean;
  googleStatus: 'NOT_CONFIGURED' | 'CONFIGURED' | 'AUTHENTICATED' | 'ERROR';
  googleLastSyncAt?: Date;
  googleLastError?: string;

  // Apple App Store Connect API credentials
  appleBundleId: string;
  appleAppId?: string; // Numerical App ID
  appleIssuerId?: string; // UUID from Apple API Keys
  appleKeyId?: string; // 10-char Key ID
  applePrivateKey?: string; // .p8 private key content
  appleReportingEnabled: boolean;
  appleStatus: 'NOT_CONFIGURED' | 'CONFIGURED' | 'AUTHENTICATED' | 'ERROR';
  appleLastSyncAt?: Date;
  appleLastError?: string;

  // Platform Version Rules
  androidVersionRules: IVersionRule;
  iosVersionRules: IVersionRule;

  // Synchronization settings
  syncIntervalHours: number;
  autoSyncEnabled: boolean;
  telemetryRetentionDays: number;

  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const versionRuleSchema = new Schema<IVersionRule>(
  {
    latestReleasedVersion: { type: String, default: '5.26.0' },
    latestBuildNumber: { type: String, default: '90' },
    minSupportedVersion: { type: String, default: '5.20.0' },
    recommendedVersion: { type: String, default: '5.26.0' },
    forceUpdate: { type: Boolean, default: false },
    updateUrl: { type: String, default: 'https://play.google.com/store/apps/details?id=com.mitoreboot.app' },
    releaseNotes: { type: String, default: 'Performance improvements, metabolic telemetry, and stability updates.' },
    lastReleaseDate: { type: Date, default: Date.now }
  },
  { _id: false }
);

const appHealthConfigSchema = new Schema<IAppHealthConfig>(
  {
    // Google Play Reporting
    googlePackageName: { type: String, default: 'com.mitoreboot.app' },
    googleServiceAccountEmail: { type: String, default: '' },
    googlePrivateKey: { type: String, default: '' },
    googleKeyFileUploaded: { type: Boolean, default: false },
    googleReportingEnabled: { type: Boolean, default: false },
    googleStatus: {
      type: String,
      enum: ['NOT_CONFIGURED', 'CONFIGURED', 'AUTHENTICATED', 'ERROR'],
      default: 'NOT_CONFIGURED'
    },
    googleLastSyncAt: { type: Date, default: null },
    googleLastError: { type: String, default: '' },

    // Apple App Store Connect
    appleBundleId: { type: String, default: 'com.mitoreboot.app' },
    appleAppId: { type: String, default: '' },
    appleIssuerId: { type: String, default: '' },
    appleKeyId: { type: String, default: '' },
    applePrivateKey: { type: String, default: '' },
    appleReportingEnabled: { type: Boolean, default: false },
    appleStatus: {
      type: String,
      enum: ['NOT_CONFIGURED', 'CONFIGURED', 'AUTHENTICATED', 'ERROR'],
      default: 'NOT_CONFIGURED'
    },
    appleLastSyncAt: { type: Date, default: null },
    appleLastError: { type: String, default: '' },

    // Version Rules
    androidVersionRules: {
      type: versionRuleSchema,
      default: () => ({
        latestReleasedVersion: '5.26.0',
        latestBuildNumber: '90',
        minSupportedVersion: '5.20.0',
        recommendedVersion: '5.26.0',
        forceUpdate: false,
        updateUrl: 'https://play.google.com/store/apps/details?id=com.mitoreboot.app',
        releaseNotes: 'Stability updates, clinical coaching, and telemetry tracking'
      })
    },
    iosVersionRules: {
      type: versionRuleSchema,
      default: () => ({
        latestReleasedVersion: '5.26.0',
        latestBuildNumber: '90',
        minSupportedVersion: '5.20.0',
        recommendedVersion: '5.26.0',
        forceUpdate: false,
        updateUrl: 'https://apps.apple.com/app/mitoreboot/id6470000000',
        releaseNotes: 'Stability updates, clinical coaching, and telemetry tracking'
      })
    },

    // Sync settings
    syncIntervalHours: { type: Number, default: 6 },
    autoSyncEnabled: { type: Boolean, default: true },
    telemetryRetentionDays: { type: Number, default: 90 },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true
  }
);

export const AppHealthConfig = model<IAppHealthConfig>('AppHealthConfig', appHealthConfigSchema);
