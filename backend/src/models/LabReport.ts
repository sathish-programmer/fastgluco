import mongoose, { Schema, Document } from 'mongoose';

export interface ILabReport extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  laboratoryId: mongoose.Types.ObjectId;
  pdfUrl?: string;
  imageUrls?: string[];
  structuredData?: any; // JSON for exact test values if entered manually
  createdAt: Date;
  updatedAt: Date;
}

const LabReportSchema: Schema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'LabBooking', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  laboratoryId: { type: Schema.Types.ObjectId, ref: 'Laboratory', required: true },
  pdfUrl: { type: String },
  imageUrls: [{ type: String }],
  structuredData: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model<ILabReport>('LabReport', LabReportSchema);
