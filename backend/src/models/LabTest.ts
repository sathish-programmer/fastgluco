import mongoose, { Schema, Document } from 'mongoose';

export interface ILabTest extends Document {
  laboratoryId: mongoose.Types.ObjectId;
  cancerScreeningTestId: mongoose.Types.ObjectId;
  price: number;
  turnaroundTimeHours: number;
  preparationInstructions: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabTestSchema: Schema = new Schema({
  laboratoryId: { type: Schema.Types.ObjectId, ref: 'Laboratory', required: true },
  cancerScreeningTestId: { type: Schema.Types.ObjectId, ref: 'CancerScreeningTest', required: true },
  price: { type: Number, required: true },
  turnaroundTimeHours: { type: Number, required: true },
  preparationInstructions: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ILabTest>('LabTest', LabTestSchema);
