import { Schema, model, Document, Types } from 'mongoose';

export interface ISupportTicketMessage {
  id?: string;
  sender: 'customer' | 'admin';
  senderName: string;
  senderId?: Types.ObjectId;
  message: string;
  timestamp: Date;
  isInternalNote: boolean;
}

export interface ISupportTicket extends Document {
  ticketId?: string; // e.g., TKT-10294
  userId?: Types.ObjectId; // Optional, might be from public website or app user
  name: string;
  email: string;
  mobile?: string;
  subject?: string;
  question: string;
  answer?: string;
  category?: 'Order Status' | 'Payment Issue' | 'Refund' | 'Cancellation' | 'Return' | 'Delivery' | 'Product Issue' | 'Account/Login' | 'OTP Problem' | 'Technical Issue' | 'Other' | string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Waiting for Customer' | 'Waiting for Vendor' | 'Resolved' | 'Closed' | 'Answered' | string;
  assignedAdmin?: Types.ObjectId;
  orderId?: Types.ObjectId;
  relatedId?: string; // Order ID or Booking ID
  type?: 'PRODUCT' | 'LAB_TEST' | 'GENERAL' | string;
  messages?: ISupportTicketMessage[];
  adminNotes?: string;
  lastResponseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  answeredAt?: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    subject: { type: String, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, trim: true },
    category: { 
      type: String, 
      enum: [
        'Order Status', 'Payment Issue', 'Refund', 'Cancellation', 'Return', 
        'Delivery', 'Product Issue', 'Account/Login', 'OTP Problem', 'Technical Issue', 'Other'
      ], 
      default: 'General' 
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: { 
      type: String, 
      enum: ['Open', 'In Progress', 'Waiting for Customer', 'Waiting for Vendor', 'Resolved', 'Closed', 'Answered'], 
      default: 'Open' 
    },
    assignedAdmin: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    orderId: { type: Schema.Types.ObjectId, ref: 'ShopOrder' },
    relatedId: { type: String },
    type: { type: String, default: 'GENERAL' },
    messages: [{
      sender: { type: String, enum: ['customer', 'admin'], default: 'customer' },
      senderName: { type: String, default: '' },
      senderId: { type: Schema.Types.ObjectId },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      isInternalNote: { type: Boolean, default: false }
    }],
    adminNotes: { type: String, default: '' },
    lastResponseAt: { type: Date },
    answeredAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);

