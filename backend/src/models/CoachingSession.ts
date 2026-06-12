import { Schema, model, Document } from 'mongoose';

export interface IMessage {
  role: 'assistant' | 'user';
  content: string;
  createdAt: Date;
}

export interface ICoachingSession extends Document {
  userId: Schema.Types.ObjectId;
  foodLogId?: Schema.Types.ObjectId;
  foodName?: string;
  peakGlucose: number;
  messages: IMessage[];
  currentQuestionIndex: number;
  status: 'active' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const coachingSessionSchema = new Schema<ICoachingSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    foodLogId: { type: Schema.Types.ObjectId, ref: 'FoodLog' },
    foodName: { type: String },
    peakGlucose: { type: Number, required: true },
    messages: [
      {
        role: { type: String, enum: ['assistant', 'user'], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    currentQuestionIndex: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true }
  },
  {
    timestamps: true
  }
);

export const CoachingSession = model<ICoachingSession>('CoachingSession', coachingSessionSchema);
