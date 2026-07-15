import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface IShopProduct extends Document {
  name: string;
  description: string;
  price: number;
  image: string; // Emoji or URL
  category: string; // Changed to string to allow predefined or custom categories
  stock: number;
  isActive: boolean;
  
  // New Fields
  brand?: string;
  images?: string[];
  shortDescription?: string;
  detailedDescription?: string;
  keyBenefits?: string[];
  healthBenefits?: string[];
  ingredients?: string[];
  usageInstructions?: string;
  suitableFor?: string;
  warnings?: string;
  storageInstructions?: string;
  doctorRecommended?: boolean;
  prescriptionRequired?: boolean;
  productTags?: string[];
  manufacturer?: string;
  countryOfOrigin?: string;
  productWeight?: string;
  sku?: string;
  productStatus?: 'active' | 'inactive';
  availableStock?: number;
  variants?: IProductVariant[];
  discountPercent?: number;
  offerPrice?: number;
  regularPrice?: number;
  offerStartDate?: Date;
  offerEndDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ShopProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // New fields
  brand: { type: String, default: '' },
  images: [{ type: String }],
  shortDescription: { type: String, default: '' },
  detailedDescription: { type: String, default: '' },
  keyBenefits: [{ type: String }],
  healthBenefits: [{ type: String }],
  ingredients: [{ type: String }],
  usageInstructions: { type: String, default: '' },
  suitableFor: { type: String, default: '' },
  warnings: { type: String, default: '' },
  storageInstructions: { type: String, default: '' },
  doctorRecommended: { type: Boolean, default: false },
  prescriptionRequired: { type: Boolean, default: false },
  productTags: [{ type: String }],
  manufacturer: { type: String, default: '' },
  countryOfOrigin: { type: String, default: '' },
  productWeight: { type: String, default: '' },
  sku: { type: String, default: '' },
  productStatus: { type: String, enum: ['active', 'inactive'], default: 'active' },
  availableStock: { type: Number, default: 0 },
  variants: [{
    sku: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }
  }],
  discountPercent: { type: Number, default: 0 },
  offerPrice: { type: Number, default: 0 },
  regularPrice: { type: Number, default: 0 },
  offerStartDate: { type: Date },
  offerEndDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<IShopProduct>('ShopProduct', ShopProductSchema);
