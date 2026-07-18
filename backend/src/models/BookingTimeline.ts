import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingTimeline extends Document {
  bookingId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'CONFIRMED' | 'SAMPLE_ASSIGNED' | 'SAMPLE_COLLECTED' | 'IN_PROCESSING' | 'REPORT_READY' | 'COMPLETED' | 'CANCELLED';
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingTimelineSchema: Schema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'LabBooking', required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'SAMPLE_ASSIGNED', 'SAMPLE_COLLECTED', 'IN_PROCESSING', 'REPORT_READY', 'COMPLETED', 'CANCELLED'], required: true },
  note: { type: String }
}, { timestamps: true });

export default mongoose.model<IBookingTimeline>('BookingTimeline', BookingTimelineSchema);
