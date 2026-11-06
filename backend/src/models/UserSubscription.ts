import { Schema, model, Document, Types } from 'mongoose';

export interface IUserSubscription extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  billingCycle: 'monthly' | 'yearly';
  status: 'trialing' | 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  cancelAtPeriodEnd: boolean;
  razorpaySubscriptionId?: string;
  razorpayPlanId?: string;
  razorpayPaymentId?: string;
  autoPayEnabled: boolean;
  mandateStatus: 'none' | 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'expired';
  recurringAmount?: number;
  nextBillingDate?: Date;
  lastBillingDate?: Date;
  mandateDetails?: {
    method?: string;
    authType?: string;
    bank?: string;
    last4?: string;
    cardNetwork?: string;
  };
  lastPaymentStatus?: 'success' | 'failed' | 'pending';
  lastFailureReason?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  couponCode?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: { 
      type: String, 
      enum: ['trialing', 'active', 'expired', 'cancelled'], 
      default: 'trialing',
      required: true,
      index: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date, index: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    autoPayEnabled: { type: Boolean, default: false, index: true },
    mandateStatus: { 
      type: String, 
      enum: ['none', 'created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'expired'], 
      default: 'none',
      index: true 
    },
    razorpaySubscriptionId: { type: String, index: true },
    razorpayPlanId: { type: String },
    razorpayPaymentId: { type: String, index: true },
    recurringAmount: { type: Number },
    nextBillingDate: { type: Date, index: true },
    lastBillingDate: { type: Date },
    mandateDetails: {
      method: { type: String },
      authType: { type: String },
      bank: { type: String },
      last4: { type: String },
      cardNetwork: { type: String }
    },
    lastPaymentStatus: { type: String, enum: ['success', 'failed', 'pending'] },
    lastFailureReason: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    couponCode: { type: String },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

userSubscriptionSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
userSubscriptionSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const UserSubscription = model<IUserSubscription>('UserSubscription', userSubscriptionSchema);
