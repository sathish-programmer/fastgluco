import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active';
  goal?: 'Lose weight' | 'Maintain weight' | 'Gain weight';
  dailyCalorieTarget?: number;
  fcmToken?: string;
  spikeThreshold: number; // default: 90 mg/dL
  currency?: 'INR' | 'USD';
  isBlocked: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    age: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    activityLevel: { 
      type: String, 
      enum: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'] 
    },
    goal: { 
      type: String, 
      enum: ['Lose weight', 'Maintain weight', 'Gain weight'] 
    },
    dailyCalorieTarget: { type: Number },
    fcmToken: { type: String },
    spikeThreshold: { type: Number, default: 90 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Query middleware to filter out soft deleted records
userSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
userSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const User = model<IUser>('User', userSchema);
