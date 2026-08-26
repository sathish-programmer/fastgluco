import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  value: any;
  timestamp: Date;
  source?: 'manual' | 'chatbot' | string;
  reviewed?: boolean;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  assignedDoctorId?: mongoose.Types.ObjectId;
  doctorNotes?: string;
}

const habitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
    source: { type: String, default: 'manual' },  // 'manual' | 'chatbot'
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    assignedDoctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    doctorNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model<IHabitLog>('HabitLog', habitLogSchema);
