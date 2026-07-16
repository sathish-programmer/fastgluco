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
  qualification?: string;
  experience?: number;
  hospitalName?: string;
  registrationNumber?: string;
  consultationFee?: number;
  onlineConsultationFee?: number;
  offlineConsultationFee?: number;
  phone?: string;
  address?: string;
  languagesKnown?: string[];
  workingHours?: string;
  availableDays?: string[];
  slotDuration?: number;
  holidays?: string[];
  visibility?: boolean;
  notificationPreferences?: string;
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
    avatar: { type: String },
    qualification: { type: String },
    experience: { type: Number },
    hospitalName: { type: String },
    registrationNumber: { type: String },
    consultationFee: { type: Number },
    onlineConsultationFee: { type: Number, default: 0 },
    offlineConsultationFee: { type: Number, default: 0 },
    phone: { type: String },
    address: { type: String },
    languagesKnown: { type: [String], default: [] },
    workingHours: { type: String, default: "09:00 - 17:00" },
    availableDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    slotDuration: { type: Number, default: 30 },
    holidays: { type: [String], default: [] },
    visibility: { type: Boolean, default: true },
    notificationPreferences: { type: String, default: "{}" }
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
