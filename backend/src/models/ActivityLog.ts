import { Schema, model, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: Schema.Types.ObjectId;
  type: string; // 'Walk' | 'Run' | 'Cycling' | 'Gym' | 'Yoga' | 'Swimming' | 'Other'
  durationMinutes: number;
  steps?: number;
  caloriesBurned?: number;
  loggedAt: Date;
  source: 'AppleHealth' | 'GoogleFit' | 'Manual';
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    steps: { type: Number, min: 0 },
    caloriesBurned: { type: Number, min: 0 },
    loggedAt: { type: Date, required: true, index: true },
    source: { type: String, enum: ['AppleHealth', 'GoogleFit', 'Manual'], default: 'Manual', required: true }
  },
  {
    timestamps: true
  }
);

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
