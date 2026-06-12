import { Schema, model, Document } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description?: string;
  url: string; // YouTube or other hosted video streaming links
  thumbnailUrl?: string;
  category: string; // e.g. "CGM Guide", "Dietary Tips", "Exercise Tips"
  targetPlatform: 'App' | 'Website' | 'Both';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    category: { type: String, required: true, trim: true },
    targetPlatform: { type: String, enum: ['App', 'Website', 'Both'], default: 'Both' },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

videoSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
videoSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Video = model<IVideo>('Video', videoSchema);
