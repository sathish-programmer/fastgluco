import { Schema, model, Document } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  description?: string;
  url: string; // YouTube or other hosted video streaming links
  thumbnailUrl?: string;
  category: string; // e.g. "DAMAGE – REDUCE THE LOAD", "REPAIR – BUILD THE DEFENCE", "CGM Guide", etc.
  topic?: string; // e.g. "Stress", "Sleep Debt", "Intermittent Fasting"
  topicNumber?: number; // 1 to 19
  focus?: string; // Scientific focus areas (e.g. Cortisol, sympathetic activation...)
  speaker?: string; // Clinician, researcher, podcast name
  duration?: string; // e.g. "25 min"
  takeaways?: string[]; // 3 Key takeaways
  practicalAction?: string; // 1 actionable takeaway
  order?: number;
  isCollection?: boolean; // When true, links to a curated topic collection / search rather than a single video
  targetPlatform: 'App' | 'Website' | 'Both';
  isPaidOnly?: boolean; // When true, accessible only to active paid subscribers (not free or trial)
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
    topic: { type: String, trim: true },
    topicNumber: { type: Number },
    focus: { type: String, trim: true },
    speaker: { type: String, trim: true },
    duration: { type: String, trim: true },
    takeaways: [{ type: String, trim: true }],
    practicalAction: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isCollection: { type: Boolean, default: false },
    targetPlatform: { type: String, enum: ['App', 'Website', 'Both'], default: 'Both' },
    isPaidOnly: { type: Boolean, default: false },
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
