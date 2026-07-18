import mongoose, { Schema, Document } from 'mongoose';

export interface ILaboratory extends Document {
  name: string;
  logo: string;
  address: string;
  isNablCertified: boolean;
  rating: number;
  isHomeCollectionAvailable: boolean;
  availableSlots: string[];
  holidays: string[];
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratorySchema: Schema = new Schema({
  name: { type: String, required: true },
  logo: { type: String, required: false, default: '' },
  address: { type: String, required: true },
  isNablCertified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  isHomeCollectionAvailable: { type: Boolean, default: false },
  availableSlots: [{ type: String }],
  holidays: [{ type: String }],
  commissionType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  commissionValue: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ILaboratory>('Laboratory', LaboratorySchema);
