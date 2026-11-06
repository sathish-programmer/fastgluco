import { Schema, model, Document } from 'mongoose';

export interface IWebhookEventLog extends Document {
  eventId: string;
  eventType: string;
  entityId?: string;
  processed: boolean;
  status: 'processed' | 'skipped' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventLogSchema = new Schema<IWebhookEventLog>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    processed: { type: Boolean, default: true },
    status: { type: String, enum: ['processed', 'skipped', 'failed'], default: 'processed' },
    errorMessage: { type: String }
  },
  {
    timestamps: true
  }
);

export const WebhookEventLog = model<IWebhookEventLog>('WebhookEventLog', webhookEventLogSchema);

