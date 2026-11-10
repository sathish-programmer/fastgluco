import { Schema, model, Document } from 'mongoose';

export interface ICronLock extends Document {
  key: string;
  lockedAt: Date;
  expiresAt: Date;
  instanceId?: string;
}

const cronLockSchema = new Schema<ICronLock>(
  {
    key: { type: String, required: true, unique: true },
    lockedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index to automatically prune expired locks
cronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 });

export const CronLock = model<ICronLock>('CronLock', cronLockSchema);

