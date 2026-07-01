import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  value: any;
  timestamp: Date;
}

const habitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IHabitLog>('HabitLog', habitLogSchema);
