import { Schema, model, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  userId?: Schema.Types.ObjectId; // Optional, might be from public website
  name: string;
  email: string;
  mobile?: string;
  question: string;
  answer?: string;
  status: 'Open' | 'Answered';
  relatedId?: string; // Order ID or Booking ID
  type?: 'PRODUCT' | 'LAB_TEST' | 'GENERAL';
  createdAt: Date;
  updatedAt: Date;
  answeredAt?: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, trim: true },
    status: { type: String, enum: ['Open', 'Answered'], default: 'Open' },
    relatedId: { type: String },
    type: { type: String, enum: ['PRODUCT', 'LAB_TEST', 'GENERAL'], default: 'GENERAL' },
    answeredAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
