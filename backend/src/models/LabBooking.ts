import mongoose, { Schema, Document } from 'mongoose';

export interface ILabBooking extends Document {
  userId: mongoose.Types.ObjectId;
  laboratoryId: mongoose.Types.ObjectId;
  labTestId: mongoose.Types.ObjectId;
  collectionType: 'HOME' | 'LAB_VISIT';
  collectionAddress?: string;
  preferredDate: Date;
  preferredTime: string;
  specialInstructions?: string;
  testPrice: number;
  homeCollectionFee: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SAMPLE_ASSIGNED' | 'SAMPLE_COLLECTED' | 'IN_PROCESSING' | 'REPORT_READY' | 'COMPLETED' | 'CANCELLED';
  commissionCalculated: boolean;
  platformShare?: number;
  labShare?: number;
  assignedDoctorId?: mongoose.Types.ObjectId;
  doctorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabBookingSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  laboratoryId: { type: Schema.Types.ObjectId, ref: 'Laboratory', required: true },
  labTestId: { type: Schema.Types.ObjectId, ref: 'LabTest', required: true },
  collectionType: { type: String, enum: ['HOME', 'LAB_VISIT'], required: true },
  collectionAddress: { type: String },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  specialInstructions: { type: String },
  testPrice: { type: Number, required: true },
  homeCollectionFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'SAMPLE_ASSIGNED', 'SAMPLE_COLLECTED', 'IN_PROCESSING', 'REPORT_READY', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
  commissionCalculated: { type: Boolean, default: false },
  platformShare: { type: Number },
  labShare: { type: Number },
  assignedDoctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  doctorNotes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model<ILabBooking>('LabBooking', LabBookingSchema);
