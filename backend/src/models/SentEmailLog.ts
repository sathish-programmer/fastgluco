import mongoose, { Document, Schema } from 'mongoose';

export interface ISentEmailLog extends Document {
  recipient: string;
  recipientName?: string;
  userId?: mongoose.Types.ObjectId;
  sender: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: 'OTP' | 'SUBSCRIPTION' | 'AUTOPAY' | 'APPOINTMENT' | 'LAB' | 'SHOP_ORDER' | 'ACCOUNT_SECURITY' | 'WELCOME' | 'SYSTEM' | 'GENERAL';
  status: 'SENT' | 'FAILED' | 'QUEUED';
  messageId?: string;
  gatewayResponse?: string;
  errorMessage?: string;
  attempts: number;
  hasAttachments: boolean;
  attachmentNames?: string[];
  metadata?: Record<string, any>;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sentEmailLogSchema = new Schema<ISentEmailLog>(
  {
    recipient: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    recipientName: {
      type: String,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sender: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    htmlBody: {
      type: String,
      required: true
    },
    textBody: {
      type: String
    },
    category: {
      type: String,
      enum: ['OTP', 'SUBSCRIPTION', 'AUTOPAY', 'APPOINTMENT', 'LAB', 'SHOP_ORDER', 'ACCOUNT_SECURITY', 'WELCOME', 'SYSTEM', 'GENERAL'],
      default: 'GENERAL',
      index: true
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'QUEUED'],
      default: 'SENT',
      index: true
    },
    messageId: {
      type: String,
      index: true
    },
    gatewayResponse: {
      type: String
    },
    errorMessage: {
      type: String
    },
    attempts: {
      type: Number,
      default: 1
    },
    hasAttachments: {
      type: Boolean,
      default: false
    },
    attachmentNames: {
      type: [String],
      default: []
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast admin querying and filtering
sentEmailLogSchema.index({ sentAt: -1, status: 1 });
sentEmailLogSchema.index({ recipient: 1, sentAt: -1 });
sentEmailLogSchema.index({ category: 1, sentAt: -1 });

export const SentEmailLog = mongoose.model<ISentEmailLog>('SentEmailLog', sentEmailLogSchema);

