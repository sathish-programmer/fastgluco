import mongoose, { Schema, Document } from 'mongoose';

export interface ICancerVideo extends Document {
  cancerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CancerVideoSchema: Schema = new Schema(
  {
    cancerId: { type: Schema.Types.ObjectId, ref: 'IndianCancer', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', required: true }
  },
  { timestamps: true }
);

export default mongoose.model<ICancerVideo>('CancerVideo', CancerVideoSchema);
