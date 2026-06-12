import { Schema, model, Document } from 'mongoose';

export interface IGuide extends Document {
  title: string;
  content: string; // HTML/Markdown article content
  category: string; // e.g. "Diet", "CGM Basics", "Fasting Guides"
  readTime: number; // estimated reading time in minutes
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const guideSchema = new Schema<IGuide>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    readTime: { type: Number, required: true, default: 5 },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

guideSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
guideSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Guide = model<IGuide>('Guide', guideSchema);
