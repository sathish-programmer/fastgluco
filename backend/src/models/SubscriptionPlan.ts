import { Schema, model, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  code: string; // e.g. "basic", "premium"
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  displayOrder: number;
  badge?: 'Popular' | 'Recommended' | 'Best Value' | 'None';
  color?: string; // Hex code, e.g. "#2563EB"
  isActive: boolean;
  features: {
    unlimitedReports: boolean;
    advancedAnalysis: boolean;
    premiumVideos: boolean;
    foodInsights: boolean;
    exportReports: boolean;
    notifications: boolean;
    aiCoaching: boolean;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    monthlyPrice: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    trialDays: { type: Number, required: true, default: 0, min: 0 },
    displayOrder: { type: Number, required: true, default: 0 },
    badge: { 
      type: String, 
      enum: ['Popular', 'Recommended', 'Best Value', 'None'], 
      default: 'None' 
    },
    color: { type: String, default: '#2563EB' },
    isActive: { type: Boolean, default: true },
    features: {
      unlimitedReports: { type: Boolean, default: false },
      advancedAnalysis: { type: Boolean, default: false },
      premiumVideos: { type: Boolean, default: false },
      foodInsights: { type: Boolean, default: false },
      exportReports: { type: Boolean, default: false },
      notifications: { type: Boolean, default: false },
      aiCoaching: { type: Boolean, default: false }
    },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

subscriptionPlanSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
subscriptionPlanSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const SubscriptionPlan = model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
