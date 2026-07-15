import mongoose, { Schema, Document } from 'mongoose';

export interface IShopOrder extends Document {
  userId: mongoose.Types.ObjectId;
  products: {
    productId: mongoose.Types.ObjectId;
    name: string;
    variantName?: string;
    price: number;
    qty: number;
  }[];
  totalAmount: number;
  gstAmount: number;
  discountAmount: number;
  couponCode?: string;
  currency: 'INR' | 'USD';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  vendorId?: mongoose.Types.ObjectId;
  deliveryStatus?: 'pending' | 'assigned' | 'accepted' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  status: 'pending' | 'completed' | 'failed';
  
  // New Fields
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxAmount?: number;
  shippingCharge?: number;
  trackingDetails?: {
    courierName: string;
    trackingId: string;
    trackingUrl?: string;
  };
  invoiceUrl?: string;
  deliveryDate?: Date;
  orderTimeline?: {
    status: string;
    timestamp: Date;
    comment?: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const ShopOrderSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'ShopProduct', required: true },
    name: { type: String, required: true },
    variantName: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  deliveryStatus: { type: String, enum: ['pending', 'assigned', 'accepted', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], default: 'pending' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

  // New fields
  patientName: { type: String, default: '' },
  patientEmail: { type: String, default: '' },
  patientPhone: { type: String, default: '' },
  shippingAddress: {
    line1: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  billingAddress: {
    line1: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  taxAmount: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  trackingDetails: {
    courierName: { type: String, default: '' },
    trackingId: { type: String, default: '' },
    trackingUrl: { type: String, default: '' }
  },
  invoiceUrl: { type: String, default: '' },
  deliveryDate: { type: Date },
  orderTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String, default: '' }
  }]
}, { timestamps: true });

export default mongoose.model<IShopOrder>('ShopOrder', ShopOrderSchema);
