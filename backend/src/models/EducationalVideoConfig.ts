import mongoose, { Schema, Document } from 'mongoose';

export interface IEducationalVideoConfig extends Document {
  key: string;
  title: string;
  description: string;
  youtubeUrl: string;
  isActive: boolean;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EducationalVideoConfigSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, default: 'Animated Self Breast Examination' },
    description: {
      type: String,
      default: 'Step-by-step visual animation for monthly breast self-examination and awareness'
    },
    youtubeUrl: {
      type: String,
      default: 'https://youtu.be/hymu-0jWtdM?si=n8pz91JRuhK4opin'
    },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model<IEducationalVideoConfig>(
  'EducationalVideoConfig',
  EducationalVideoConfigSchema
);
