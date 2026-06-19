import { Schema, model, Document } from 'mongoose';

export interface IPaymentGatewayConfig extends Document {
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  isSandbox: boolean;
  enablePayments: boolean;
  enableSubscriptions: boolean; // Subscription Required ON/OFF
  gstPercentage: number; // GST Percentage configured by admin (e.g. 18)
  safeGlucoseThreshold: number; // Safe limit (default 90)
  moderateGlucoseThreshold: number; // Moderate limit (default 110)
  aiSpikeThreshold: number; // AI triggers coaching above this
  aiQuestions: string[]; // Array of questions to ask sequentially
  aiCompletionMessage: string; // Final message when all answered
  glucoseAlertMinIntervalHours: number; // Minimum hours between consecutive alert emails to prevent spamming
  enableHydrationTracker: boolean; // Hydration Tracker ON/OFF
  hydrationDailyLimitMl: number; // Daily hydration goal limit in ml
  enableWorkoutTracker: boolean; // Workout Tracker ON/OFF
  appName?: string;
  appTagline?: string;
  appLogoUrl?: string;
  cancerTreatmentDisclaimer?: string;
  cancerSecondaryDisclaimer?: string;
  updatedBy?: Schema.Types.ObjectId; // ref: AdminUser
  createdAt: Date;
  updatedAt: Date;
}

const paymentGatewayConfigSchema = new Schema<IPaymentGatewayConfig>(
  {
    razorpayKeyId: { type: String, trim: true },
    razorpayKeySecret: { type: String, trim: true },
    isSandbox: { type: Boolean, default: true, required: true },
    enablePayments: { type: Boolean, default: false, required: true },
    enableSubscriptions: { type: Boolean, default: false, required: true },
    gstPercentage: { type: Number, default: 18, min: 0, required: true },
    safeGlucoseThreshold: { type: Number, default: 90, required: true },
    moderateGlucoseThreshold: { type: Number, default: 110, required: true },
    aiSpikeThreshold: { type: Number, default: 110 },
    enableHydrationTracker: { type: Boolean, default: true, required: true },
    hydrationDailyLimitMl: { type: Number, default: 3000, required: true },
    enableWorkoutTracker: { type: Boolean, default: true, required: true },
    appName: { type: String, default: 'Mito_Reboot' },
    appTagline: { type: String, default: 'The circadian fasting app' },
    appLogoUrl: { type: String, default: '' },
    cancerTreatmentDisclaimer: { type: String, default: 'Disclaimer: This app is for informational purposes only. If you are undergoing active cancer treatment, please consult with your oncologist before starting any circadian fasting protocols.' },
    cancerSecondaryDisclaimer: { type: String, default: 'Disclaimer: This app is for informational purposes only. If you have a previous history of cancer (secondary prevention), please consult with your medical team before starting any circadian fasting protocols.' },
    aiQuestions: { 
      type: [String], 
      default: ["You recently logged a food that spiked your glucose. Why did you consume this when it's advised to avoid it?", "Did you take a walk afterwards?"] 
    },
    aiCompletionMessage: { type: String, default: "Thank you for sharing this context. We have recorded your activity. Remember to stay hydrated and walk 15 mins after heavy meals!" },
    glucoseAlertMinIntervalHours: { type: Number, default: 2, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true
  }
);

export const PaymentGatewayConfig = model<IPaymentGatewayConfig>('PaymentGatewayConfig', paymentGatewayConfigSchema);
