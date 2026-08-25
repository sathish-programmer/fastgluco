import { Schema, model, Document } from 'mongoose';

export interface ICGMReport extends Document {
  userId: Schema.Types.ObjectId;
  fileName: string;
  fileUrl: string; // disk storage folder or S3 bucket URL
  fileType: 'csv' | 'pdf';
  status: 'Uploaded' | 'Processing' | 'Processed' | 'Failed';
  parsedReadingsCount: number;
  detectedReportType?: string;
  detectionConfidence?: number;
  pdfSummaryAverageGlucose?: number;
  pdfSummaryTimeInRange?: number;
  pdfSummaryGmi?: number;
  glucoseVariability?: number;
  pdfSummaryDateRange?: {
    startDate?: Date;
    endDate?: Date;
    startDateString?: string;
    endDateString?: string;
  };
  calculatedAverageGlucose?: number;
  hourlyPatternSummaries?: Array<{
    hourLabel: string;
    medianGlucose: number;
    valueSource: 'DIRECT_PDF_EXTRACTION';
    classification: 'HOURLY_MEDIAN_SUMMARY';
    timestampSource: 'NOT_AVAILABLE';
  }>;
  dailySummaries?: Array<{
    date: Date;
    dateString?: string;
    maxGlucose?: number;
    minGlucose?: number;
    averageGlucose?: number;
    valueSource?: 'DIRECT_PDF_EXTRACTION' | 'CALCULATED_FROM_EXTRACTED_DATA';
    classification?: 'DAILY_SUMMARY';
  }>;
  provenanceMetadata?: {
    valueSource?: 'DIRECT_PDF_EXTRACTION' | 'CALCULATED_FROM_EXTRACTED_DATA';
    timestampSource?: 'EXTRACTED' | 'ESTIMATED' | 'NOT_AVAILABLE';
    classification?: 'POINT_READING' | 'DAILY_SUMMARY' | 'WEEKLY_SUMMARY' | 'AGP_METRIC';
  };
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
    detectedReportType: { type: String },
    detectionConfidence: { type: Number },
    pdfSummaryAverageGlucose: { type: Number },
    calculatedAverageGlucose: { type: Number },
    pdfSummaryTimeInRange: { type: Number },
    pdfSummaryGmi: { type: Number },
    glucoseVariability: { type: Number },
    pdfSummaryDateRange: {
      startDate: { type: Date },
      endDate: { type: Date },
      startDateString: { type: String },
      endDateString: { type: String }
    },
    hourlyPatternSummaries: [
      {
        hourLabel: { type: String },
        medianGlucose: { type: Number },
        valueSource: { type: String, default: 'DIRECT_PDF_EXTRACTION' },
        classification: { type: String, default: 'HOURLY_MEDIAN_SUMMARY' },
        timestampSource: { type: String, default: 'NOT_AVAILABLE' }
      }
    ],
    dailySummaries: [
      {
        date: { type: Date },
        dateString: { type: String },
        maxGlucose: { type: Number },
        minGlucose: { type: Number },
        averageGlucose: { type: Number },
        valueSource: { type: String, default: 'DIRECT_PDF_EXTRACTION' },
        classification: { type: String, default: 'DAILY_SUMMARY' }
      }
    ],
    provenanceMetadata: {
      valueSource: { type: String, enum: ['DIRECT_PDF_EXTRACTION', 'CALCULATED_FROM_EXTRACTED_DATA'] },
      timestampSource: { type: String, enum: ['EXTRACTED', 'ESTIMATED', 'NOT_AVAILABLE'] },
      classification: { type: String, enum: ['POINT_READING', 'DAILY_SUMMARY', 'WEEKLY_SUMMARY', 'AGP_METRIC'] }
    },
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
