import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  value: any;
  timestamp: Date;
  reviewed?: boolean;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
}

const habitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  { timestamps: true }
);

export default mongoose.model<IHabitLog>('HabitLog', habitLogSchema);
