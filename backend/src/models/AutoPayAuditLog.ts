import { Schema, model, Document, Types } from 'mongoose';

export interface IAutoPayAuditLog extends Document {
  userId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  event: string;
  status: string;
  amount?: number;
  billingCycle?: 'monthly' | 'yearly';
  details: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const autoPayAuditLogSchema = new Schema<IAutoPayAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'UserSubscription', index: true },
    razorpaySubscriptionId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    event: { type: String, required: true, index: true },
    status: { type: String, required: true },
    amount: { type: Number },
    billingCycle: { type: String, enum: ['monthly', 'yearly'] },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const AutoPayAuditLog = model<IAutoPayAuditLog>('AutoPayAuditLog', autoPayAuditLogSchema);

