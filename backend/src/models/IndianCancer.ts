import mongoose, { Schema, Document } from 'mongoose';

export interface IIndianCancer extends Document {
  name: string;
  gender: 'Men' | 'Women' | 'Both';
  percentage: number;
  riskFactors: string[];
  description: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const IndianCancerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ['Men', 'Women', 'Both'], default: 'Both', required: true },
    percentage: { type: Number, required: true },
    riskFactors: { type: [String], default: [] },
    description: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IIndianCancer>('IndianCancer', IndianCancerSchema);
