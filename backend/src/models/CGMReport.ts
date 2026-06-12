import { Schema, model, Document } from 'mongoose';

export interface ICGMReport extends Document {
  userId: Schema.Types.ObjectId;
  fileName: string;
  fileUrl: string; // disk storage folder or S3 bucket URL
  fileType: 'csv' | 'pdf';
  status: 'Uploaded' | 'Processing' | 'Processed' | 'Failed';
  parsedReadingsCount: number;
  errorMessage?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cgmReportSchema = new Schema<ICGMReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['csv', 'pdf'], required: true },
    status: { 
      type: String, 
      enum: ['Uploaded', 'Processing', 'Processed', 'Failed'], 
      default: 'Uploaded' 
    },
    parsedReadingsCount: { type: Number, default: 0 },
    errorMessage: { type: String },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

cgmReportSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
cgmReportSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const CGMReport = model<ICGMReport>('CGMReport', cgmReportSchema);
