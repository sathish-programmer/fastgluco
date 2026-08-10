import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctorRecommendation extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  category: string;
  relatedLogId?: mongoose.Types.ObjectId;
  recommendationText: string;
  channels: string[];
  deliveryStatus: {
    email?: { status: string; sentAt?: Date; error?: string };
    sms?: { status: string; sentAt?: Date; error?: string };
    push?: { status: string; sentAt?: Date; error?: string };
  };
  timestamp: Date;
}

const doctorRecommendationSchema = new Schema<IDoctorRecommendation>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    category: { type: String, required: true, default: 'Dental' },
    relatedLogId: { type: Schema.Types.ObjectId, ref: 'HabitLog' },
    recommendationText: { type: String, required: true },
    channels: [{ type: String }],
    deliveryStatus: {
      email: {
        status: { type: String },
        sentAt: { type: Date },
        error: { type: String }
      },
      sms: {
        status: { type: String },
        sentAt: { type: Date },
        error: { type: String }
      },
      push: {
        status: { type: String },
        sentAt: { type: Date },
        error: { type: String }
      }
    },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IDoctorRecommendation>('DoctorRecommendation', doctorRecommendationSchema);
