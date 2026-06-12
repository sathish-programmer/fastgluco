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
    trialEndDate: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    razorpaySubscriptionId: { type: String },
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
