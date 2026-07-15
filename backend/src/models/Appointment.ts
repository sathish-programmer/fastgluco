import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  doctorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reason: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  prescriptionUrl?: string;
  reminders?: { '30min'?: boolean; '10min'?: boolean };
  patientNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    meetingLink: { type: String },
    notes: { type: String },
    prescriptionUrl: { type: String },
    reminders: {
      '30min': { type: Boolean, default: false },
      '10min': { type: Boolean, default: false }
    },
    patientNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
