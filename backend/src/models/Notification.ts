import { Schema, model, Document } from 'mongoose';

export type NotificationType = 
  | 'General'
  | 'SpikeAlert'
  | 'LogReminder'
  | 'ReportProcessed'
  | 'SubscriptionActivated'
  | 'SubscriptionExpired'
  | 'RefundProcessed'
  | 'AppointmentBooked'
  | 'AppointmentConfirmed'
  | 'AppointmentRescheduled'
  | 'AppointmentCancelled'
  | 'AppointmentReminder'
  | 'OrderPlaced'
  | 'OrderPaid'
  | 'OrderProcessing'
  | 'OrderShipped'
  | 'OrderDelivered'
  | 'OrderCancelled'
  | 'DoctorConsultation';

export interface INotificationMetadata {
  appointmentId?: string;
  orderId?: string;
  route?: string;
  status?: string;
  [key: string]: any;
}

export interface INotification extends Document {
  userId?: Schema.Types.ObjectId; // Reference to specific user, or null/undefined for broadcast to all users
  title: string;
  body: string;
  type: NotificationType;
  metadata?: INotificationMetadata;
  isRead: boolean;
  scheduledFor?: Date;
  sentAt?: Date;
  isSent: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: [
        'General', 'SpikeAlert', 'LogReminder', 'ReportProcessed', 
        'SubscriptionActivated', 'SubscriptionExpired', 'RefundProcessed',
        'AppointmentBooked', 'AppointmentConfirmed', 'AppointmentRescheduled', 
        'AppointmentCancelled', 'AppointmentReminder',
        'OrderPlaced', 'OrderPaid', 'OrderProcessing', 'OrderShipped', 
        'OrderDelivered', 'OrderCancelled', 'DoctorConsultation'
      ], 
      required: true 
    },
    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    isSent: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

notificationSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
notificationSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Notification = model<INotification>('Notification', notificationSchema);
