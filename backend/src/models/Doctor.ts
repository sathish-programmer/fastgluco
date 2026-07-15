import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  passwordHash: string;
  specialty: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    specialty: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    avatar: { type: String }
  },
  { timestamps: true }
);

DoctorSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
DoctorSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
