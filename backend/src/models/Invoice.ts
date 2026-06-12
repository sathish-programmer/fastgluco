import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoice extends Document {
  userId: Types.ObjectId;
  transactionId: Types.ObjectId;
  planId: Types.ObjectId;
  invoiceNumber: string; // e.g. INV-2026-0001
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number; // e.g. 18% GST included or added
  totalAmount: number;
  billingName: string;
  billingEmail: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    originalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    taxAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    billingName: { type: String, required: true, trim: true },
    billingEmail: { type: String, required: true, lowercase: true, trim: true },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

invoiceSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
invoiceSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
