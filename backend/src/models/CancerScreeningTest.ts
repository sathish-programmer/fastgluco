import mongoose, { Schema, Document } from 'mongoose';

export interface ICancerScreeningTest extends Document {
  name: string;
  description: string;
  frequency: string;
  category: 'Male' | 'Female' | 'Universal';
  whyItIsNeeded: string;
  recommendedAge: string;
  generalPreparationInstructions: string;
  hospitalUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CancerScreeningTestSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  frequency: { type: String, required: true },
  category: { type: String, enum: ['Male', 'Female', 'Universal'], required: true },
  whyItIsNeeded: { type: String, default: '' },
  recommendedAge: { type: String, default: '' },
  generalPreparationInstructions: { type: String, default: '' },
  hospitalUrl: { type: String, default: 'https://www.hcgoncology.com/hcg-in-news/cancer-patients-find-virtual-consultation-a-boon-in-these-times-of-crisis/' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ICancerScreeningTest>('CancerScreeningTest', CancerScreeningTestSchema);
