import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  isDeleted: boolean;
  phone?: string;
  address?: string;
  businessName?: string;
  licenseNumber?: string;
  taxId?: string;
  businessAddress?: string;
  assignedProducts?: mongoose.Types.ObjectId[];
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    businessName: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    taxId: { type: String, default: '' },
    businessAddress: { type: String, default: '' },
    assignedProducts: [{ type: Schema.Types.ObjectId, ref: 'ShopProduct' }],
    deactivatedAt: { type: Date }
  },
  { timestamps: true }
);

VendorSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
VendorSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
