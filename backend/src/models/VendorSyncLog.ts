import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorSyncLog extends Document {
  vendorId: mongoose.Types.ObjectId;
  vendorSlug: string;
  action: 'CATALOG_SYNC' | 'ORDER_SUBMISSION' | 'ORDER_STATUS_POLL' | 'TRACKING_UPDATE' | 'WEBHOOK_UPDATE' | 'TEST_CONNECTION';
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  isMock: boolean;
  requestEndpoint?: string;
  requestPayload?: any;
  responsePayload?: any;
  itemsProcessed?: number;
  durationMs: number;
  errorMessage?: string;
  createdAt: Date;
}

const VendorSyncLogSchema: Schema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  vendorSlug: { type: String, required: true, index: true },
  action: { 
    type: String, 
    enum: ['CATALOG_SYNC', 'ORDER_SUBMISSION', 'ORDER_STATUS_POLL', 'TRACKING_UPDATE', 'WEBHOOK_UPDATE', 'TEST_CONNECTION'], 
    required: true, 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['SUCCESS', 'FAILED', 'WARNING'], 
    required: true, 
    index: true 
  },
  isMock: { type: Boolean, default: true },
  requestEndpoint: { type: String, default: '' },
  requestPayload: { type: Schema.Types.Mixed },
  responsePayload: { type: Schema.Types.Mixed },
  itemsProcessed: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  errorMessage: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

export const VendorSyncLog = mongoose.model<IVendorSyncLog>('VendorSyncLog', VendorSyncLogSchema);
