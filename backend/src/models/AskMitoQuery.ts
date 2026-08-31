import mongoose, { Schema, Document } from 'mongoose';

export interface IAskMitoQuery extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  question: string;
  status: 'pending' | 'answered';
  isPaid: boolean;
  amountPaid: number;
  isFreeQuotaUsed: boolean;
  paymentTransactionId?: mongoose.Types.ObjectId;
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AskMitoQuerySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    subject: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'answered'], default: 'pending', index: true },
    isPaid: { type: Boolean, default: false },
    amountPaid: { type: Number, default: 0 },
    isFreeQuotaUsed: { type: Boolean, default: false },
    paymentTransactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
    adminReply: { type: String, default: '' },
    repliedBy: { type: String, default: '' },
    repliedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IAskMitoQuery>('AskMitoQuery', AskMitoQuerySchema);
