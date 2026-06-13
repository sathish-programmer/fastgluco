import { Schema, model, Document } from 'mongoose';

export interface IHealthInsight extends Document {
  content: string;
  isActive: boolean;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const healthInsightSchema = new Schema<IHealthInsight>(
  {
    content: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: false },
    isTemplate: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const HealthInsight = model<IHealthInsight>('HealthInsight', healthInsightSchema);
