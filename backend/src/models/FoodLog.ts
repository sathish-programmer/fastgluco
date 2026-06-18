import { Schema, model, Document } from 'mongoose';

export interface IFoodLog extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  category: 'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Beverages' | 'Vegetables' | 'Dairy' | 'Non-Veg' | 'Sweets' | 'Custom';
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  quantity: number;
  unit: string;
  loggedAt: Date;
  notes?: string;
  feedback?: {
    isAccurate: boolean;
    respondedAt: Date;
  };
  glucoseAnalysis?: {
    beforeGlucose: number;
    peakGlucose: number;
    difference: number;
    status: 'Safe' | 'Moderate' | 'Avoid';
    walkReminderSent?: boolean;
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const foodLogSchema = new Schema<IFoodLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['South Indian', 'North Indian', 'Snacks', 'Fruits', 'Vegetables', 'Beverages', 'Dairy', 'Non-Veg', 'Sweets', 'Custom'],
      required: true 
    },
    mealType: { 
      type: String, 
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
      required: true 
    },
    calories: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    fiber: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, required: true },
    loggedAt: { type: Date, required: true, index: true },
    notes: { type: String },
    feedback: {
      isAccurate: { type: Boolean },
      respondedAt: { type: Date }
    },
    glucoseAnalysis: {
      beforeGlucose: { type: Number },
      peakGlucose: { type: Number },
      difference: { type: Number },
      status: { type: String, enum: ['Safe', 'Moderate', 'Avoid'] },
      walkReminderSent: { type: Boolean, default: false }
    },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

foodLogSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
foodLogSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const FoodLog = model<IFoodLog>('FoodLog', foodLogSchema);
