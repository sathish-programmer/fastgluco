import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultationRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  sourceModule: string;
  reason: string;
  triggerCondition: string;
  riskLevel: string;
  assessmentAnswers: any;
  recommendedSpecialty: string;
  recommendationVersion: string;
  status: 'Generated' | 'Viewed' | 'Clicked' | 'Booked' | 'Completed' | 'Cancelled';
  expiresAt: Date;
  appointmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationRecommendationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceModule: { type: String, required: true },
    reason: { type: String, required: true },
    triggerCondition: { type: String },
    riskLevel: { type: String },
    assessmentAnswers: { type: Schema.Types.Mixed },
    recommendedSpecialty: { type: String, required: true },
    recommendationVersion: { type: String, default: '1.0' },
    status: {
      type: String,
      enum: ['Generated', 'Viewed', 'Clicked', 'Booked', 'Completed', 'Cancelled'],
      default: 'Generated'
    },
    expiresAt: { type: Date, required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  },
  { timestamps: true }
);

// Index for quick deduplication checks within 24h
ConsultationRecommendationSchema.index({ userId: 1, sourceModule: 1, status: 1 });

export const ConsultationRecommendation = mongoose.model<IConsultationRecommendation>('ConsultationRecommendation', ConsultationRecommendationSchema);
