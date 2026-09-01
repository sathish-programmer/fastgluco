import { Schema, model, Document } from 'mongoose';

export interface IUserFeedback extends Document {
  userId?: Schema.Types.ObjectId;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  category: string; // App Experience, Feature Request, Metabolic Results, Bug Report, General
  comment: string;
  status: 'Pending' | 'Reviewed' | 'Featured' | 'Archived';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userFeedbackSchema = new Schema<IUserFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    category: { type: String, default: 'General Feedback', trim: true },
    comment: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Featured', 'Archived'], default: 'Pending' },
    adminNotes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

export const UserFeedback = model<IUserFeedback>('UserFeedback', userFeedbackSchema);
