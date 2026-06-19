import { Schema, model, Document } from 'mongoose';

export interface IFoodMaster extends Document {
  name: string;
  aliases: string[];
  category: 'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Beverages' | 'Vegetables' | 'Dairy' | 'Non-Veg' | 'Sweets';
  calories: number; // kcal per serving
  carbs: number;    // g per serving
  protein: number;  // g per serving
  fat: number;      // g per serving
  fiber: number;    // g per serving
  servingSize: number;
  servingUnit: string; // e.g. "g", "ml", "piece", "bowl"
  isActive: boolean;
  isDeleted: boolean;
  verified: boolean;
  source: string; // e.g. 'USDA', 'IFCT', 'OpenFoodFacts', 'LocalSeed', 'AI-Fallback'
  countries: string[]; // e.g. ['India', 'USA', 'Global']
  portionType: 'count' | 'weight' | 'volume';
  createdAt: Date;
  updatedAt: Date;
}

const foodMasterSchema = new Schema<IFoodMaster>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    aliases: { type: [String], default: [], index: true },
    category: { 
      type: String, 
      enum: ['South Indian', 'North Indian', 'Snacks', 'Fruits', 'Vegetables', 'Beverages', 'Dairy', 'Non-Veg', 'Sweets'],
      required: true 
    },
    calories: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    fiber: { type: Number, required: true, min: 0, default: 0 },
    servingSize: { type: Number, required: true, default: 100 },
    servingUnit: { type: String, required: true, default: 'g' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    verified: { type: Boolean, default: false, index: true },
    source: { type: String, default: 'LocalSeed', index: true },
    countries: { type: [String], default: ['Global'], index: true },
    portionType: { type: String, enum: ['count', 'weight', 'volume'], default: 'weight', index: true }
  },
  {
    timestamps: true
  }
);

foodMasterSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
foodMasterSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const FoodMaster = model<IFoodMaster>('FoodMaster', foodMasterSchema);
