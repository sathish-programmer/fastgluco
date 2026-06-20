import { Schema, model, Document } from 'mongoose';

export interface IFounder extends Document {
  name: string;
  role: string;
  background: string;
  workDone: string;
  achievements: string;
  tryingToSolve: string;
  videoUrl?: string; // YouTube or other hosted video streaming links
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const founderSchema = new Schema<IFounder>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    background: { type: String, required: true },
    workDone: { type: String, required: true },
    achievements: { type: String, required: true },
    tryingToSolve: { type: String, required: true },
    videoUrl: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

founderSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
founderSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Founder = model<IFounder>('Founder', founderSchema);
