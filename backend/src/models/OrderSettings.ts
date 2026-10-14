import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderSettings extends Document {
  cancellationWindowHours: number;
  autoCancelUnpaidHours: number;
  returnWindowDays: number;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enableInAppNotifications: boolean;
  supportEmail: string;
  defaultCourier: string;
  autoNotifyOnShipment: boolean;
  autoNotifyOnRefund: boolean;
  requireRefundConfirmation: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderSettingsSchema = new Schema<IOrderSettings>(
  {
    cancellationWindowHours: { type: Number, default: 24 },
    autoCancelUnpaidHours: { type: Number, default: 48 },
    returnWindowDays: { type: Number, default: 7 },
    enableEmailNotifications: { type: Boolean, default: true },
    enableSmsNotifications: { type: Boolean, default: false },
    enableInAppNotifications: { type: Boolean, default: true },
    supportEmail: { type: String, default: 'support@mitoreboot.in' },
    defaultCourier: { type: String, default: 'Blue Dart' },
    autoNotifyOnShipment: { type: Boolean, default: true },
    autoNotifyOnRefund: { type: Boolean, default: true },
    requireRefundConfirmation: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true
  }
);

export const OrderSettings = model<IOrderSettings>('OrderSettings', orderSettingsSchema);
