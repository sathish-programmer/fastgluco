import { Schema, model, Document } from 'mongoose';

export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'SuperAdmin' | 'Admin' | 'Editor' | 'LabPartner' | 'LabAdmin' | 'Technician' | 'Collector' | string;
  laboratoryId?: string;
  isBlocked: boolean;
  isDeleted: boolean;
  lastLoginAlertSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Laboratory' },
    role: { 
      type: String, 
      default: 'Admin' 
    },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    lastLoginAlertSentAt: { type: Date }
  },
  {
    timestamps: true
  }
);

adminUserSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
adminUserSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const AdminUser = model<IAdminUser>('AdminUser', adminUserSchema);
