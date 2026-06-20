import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendedFood extends Document {
  category: string;
  productName: string;
  image?: string;
  nutritionDetails: string;
  ingredients: string;
  pesticideInfo: string;
  certifications?: string;
  doctorNotes?: string;
  status: 'active' | 'inactive';
}

const RecommendedFoodSchema: Schema = new Schema({
  category: { type: String, required: true },
  productName: { type: String, required: true },
  image: { type: String },
  nutritionDetails: { type: String, required: true },
  ingredients: { type: String, required: true },
  pesticideInfo: { type: String, required: true },
  certifications: { type: String },
  doctorNotes: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export default mongoose.model<IRecommendedFood>('RecommendedFood', RecommendedFoodSchema);
