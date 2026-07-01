import mongoose, { Schema, Document } from 'mongoose';

export interface IShopProduct extends Document {
  name: string;
  description: string;
  price: number;
  image: string; // Emoji or URL
  category: 'Antioxidants' | 'SaferProducts';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, enum: ['Antioxidants', 'SaferProducts'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IShopProduct>('ShopProduct', ShopProductSchema);
