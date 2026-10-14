import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: Schema.Types.ObjectId; // Reference to AdminUser who did the action
  adminName?: string;
  adminEmail?: string;
  action: string; // e.g., "BLOCK_USER", "ORDER_STATUS_UPDATE", "REFUND_INITIATED", etc.
  details: string; // Human readable description of action
  entityType?: 'Order' | 'Refund' | 'Cancellation' | 'Return' | 'SupportTicket' | 'Vendor' | 'Settings' | 'Communication' | string;
  entityId?: string;
  orderNumber?: string;
  previousStatus?: string;
  newStatus?: string;
  amount?: number;
  reason?: string;
  gatewayRef?: string;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    adminName: { type: String },
    adminEmail: { type: String },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    entityType: { type: String, index: true },
    entityId: { type: String, index: true },
    orderNumber: { type: String, index: true },
    previousStatus: { type: String },
    newStatus: { type: String },
    amount: { type: Number },
    reason: { type: String },
    gatewayRef: { type: String },
    ipAddress: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // only needs createdAt
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

