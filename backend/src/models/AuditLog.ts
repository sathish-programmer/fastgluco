import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: Schema.Types.ObjectId; // Reference to AdminUser who did the action
  action: string; // e.g., "BLOCK_USER", "UNBLOCK_USER", "ADD_FOOD_MASTER", "DELETE_GUIDE", "SEND_PUSH"
  details: string; // Human readable description of action
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    ipAddress: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // only needs createdAt
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
