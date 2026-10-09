import mongoose, { Schema, Document } from 'mongoose';

export interface IAmazonStorefront extends Document {
  brandName: string;
  category: string;
  badge: string;
  title: string;
  description: string;
  storeUrl: string;
  shortlink?: string;
  highlights: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const AmazonStorefrontSchema: Schema = new Schema(
  {
    brandName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, default: 'All' },
    badge: { type: String, default: '100% Certified Partner' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    storeUrl: { type: String, required: true, trim: true },
    shortlink: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const AmazonStorefront = mongoose.model<IAmazonStorefront>('AmazonStorefront', AmazonStorefrontSchema);
export default AmazonStorefront;
