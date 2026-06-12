import { Schema, model, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate?: Date;
  maxRedemptions?: number;
  redemptionsCount: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    maxRedemptions: { type: Number, min: 0 },
    redemptionsCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

couponSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

couponSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Coupon = model<ICoupon>('Coupon', couponSchema);
