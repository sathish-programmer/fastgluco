import mongoose, { Schema, Document } from 'mongoose';

export interface ICancerScreeningTest extends Document {
  name: string;
  description: string;
  frequency: string;
  category: 'Male' | 'Female' | 'Universal';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CancerScreeningTestSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  frequency: { type: String, required: true },
  category: { type: String, enum: ['Male', 'Female', 'Universal'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ICancerScreeningTest>('CancerScreeningTest', CancerScreeningTestSchema);
