import { Schema, model, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  platform: 'App' | 'Website' | 'Both';
  category: string; // e.g. "Payments", "Usage", "General"
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    platform: { type: String, enum: ['App', 'Website', 'Both'], default: 'Both' },
    category: { type: String, required: true, trim: true, default: 'General' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export const FAQ = model<IFAQ>('FAQ', faqSchema);
