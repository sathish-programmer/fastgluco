import { Schema, model, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  userId?: Schema.Types.ObjectId; // Optional, might be from public website
  name: string;
  email: string;
  question: string;
  answer?: string;
  status: 'Open' | 'Answered';
  createdAt: Date;
  updatedAt: Date;
  answeredAt?: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, trim: true },
    status: { type: String, enum: ['Open', 'Answered'], default: 'Open' },
    answeredAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
