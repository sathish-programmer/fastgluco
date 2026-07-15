import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  appointmentId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  feedbackText: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedbackText: { type: String, required: true }
  },
  { timestamps: true }
);

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
