import mongoose, { Schema, Document } from 'mongoose';

export interface IShopCategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ShopCategory = mongoose.model<IShopCategory>('ShopCategory', ShopCategorySchema);
