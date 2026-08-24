import { Schema, model, Document } from 'mongoose';

export interface IGlucoseReading extends Document {
  userId: Schema.Types.ObjectId;
  reportId?: Schema.Types.ObjectId; // ref: CGMReport, optional for manual logging
  value: number; // blood glucose level in mg/dL
  timestamp: Date;
  source: 'CGM' | 'Manual';
  isTimestampEstimated?: boolean;
  isExtractedValue?: boolean;
  metadata?: Record<string, any>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const glucoseReadingSchema = new Schema<IGlucoseReading>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportId: { type: Schema.Types.ObjectId, ref: 'CGMReport', index: true },
    value: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
    source: { type: String, enum: ['CGM', 'Manual'], default: 'CGM', required: true },
    isTimestampEstimated: { type: Boolean, default: false },
    isExtractedValue: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate readings for a single user at the exact same timestamp
glucoseReadingSchema.index({ userId: 1, timestamp: 1 }, { unique: true });

glucoseReadingSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
glucoseReadingSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const GlucoseReading = model<IGlucoseReading>('GlucoseReading', glucoseReadingSchema);
