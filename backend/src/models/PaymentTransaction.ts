import { Schema, model, Document, Types } from 'mongoose';

export interface IPaymentTransaction extends Document {
  userId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  planId: Types.ObjectId;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode?: string;
  currency: string;
  gateway: 'razorpay' | 'mock';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  failureReason?: string;
  refundedAmount: number;
  refundedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'UserSubscription' },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    amount: { type: Number, required: true, min: 0 },
    originalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    currency: { type: String, required: true, default: 'INR' },
    gateway: { type: String, enum: ['razorpay', 'mock'], default: 'razorpay', required: true },
    gatewayOrderId: { type: String, required: true, index: true },
    gatewayPaymentId: { type: String, index: true },
    gatewaySignature: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'success', 'failed', 'refunded'], 
      default: 'pending', 
      required: true,
      index: true
    },
    failureReason: { type: String },
    refundedAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

paymentTransactionSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
paymentTransactionSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const PaymentTransaction = model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);
