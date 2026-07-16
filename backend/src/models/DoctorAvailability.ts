import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorAvailability extends Document {
  doctorId: mongoose.Types.ObjectId;
  availableDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  availableTimeSlots: { start: string; end: string }[]; // e.g., [{ start: '09:00', end: '12:00' }]
  holidays: Date[];
  leaves: Date[];
  slotDuration: number; // in minutes, e.g. 30
  maxAppointmentsPerSlot?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorAvailabilitySchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
    availableDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    availableTimeSlots: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true }
      }
    ],
    holidays: { type: [Date], default: [] },
    leaves: { type: [Date], default: [] },
    slotDuration: { type: Number, default: 30 },
    maxAppointmentsPerSlot: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const DoctorAvailability = mongoose.model<IDoctorAvailability>('DoctorAvailability', DoctorAvailabilitySchema);
