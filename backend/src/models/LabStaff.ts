import mongoose, { Schema, Document } from 'mongoose';

export interface ILabStaff extends Document {
  laboratoryId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'COLLECTOR' | 'TECHNICIAN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabStaffSchema: Schema = new Schema({
  laboratoryId: { type: Schema.Types.ObjectId, ref: 'Laboratory', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'COLLECTOR', 'TECHNICIAN'], default: 'TECHNICIAN' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<ILabStaff>('LabStaff', LabStaffSchema);
