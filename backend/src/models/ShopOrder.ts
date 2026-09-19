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
  platformCommission?: number;
  vendorEarnings?: number;
  deliveryDate?: Date;
  orderTimeline?: {
    status: string;
    timestamp: Date;
    comment?: string;
  }[];

  // Multi-Vendor Tracking & Financial Breakdown
  vendorOrderId?: string; // External vendor order ID (e.g. Arivu Foods order #)
  vendorOrderStatus?: string; // Vendor's native order status
  vendorStatusMessage?: string; // Live status message from vendor API
  estimatedDeliveryDate?: Date; // Delivery date estimated by vendor API
  vendorSubmissionStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'SUBMITTED' | 'FAILED' | 'RETRY';
  vendorSubmissionError?: string;
  vendorSubmissionAttempts?: number;
  settlementId?: mongoose.Types.ObjectId;
  settlementStatus?: 'UNSETTLED' | 'PENDING' | 'SETTLED';
  financialBreakdown?: {
    listedProductPrice: number;
    platformCommissionRate: number; // 30%
    platformCommission: number; // 30% of listed price
    gstOnCommissionRate: number; // 18%
    gstOnCommission: number; // 18% of platform commission
    totalPlatformRetention: number; // Commission + GST
    vendorProductShare: number; // Listed price - Platform retention
    shippingCharge: number; // Pass-through to vendor (Free >599, 90 <599)
    customerGatewayCharge: number; // Borne by customer (2.36%)
    finalVendorPayable: number; // Vendor product share + shipping
  };

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
  platformCommission: { type: Number, default: 0 },
  vendorEarnings: { type: Number, default: 0 },
  deliveryDate: { type: Date },
  orderTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String, default: '' }
  }],

  // Multi-Vendor fields
  vendorOrderId: { type: String, default: '' },
  vendorOrderStatus: { type: String, default: '' },
  vendorStatusMessage: { type: String, default: '' },
  estimatedDeliveryDate: { type: Date },
  vendorSubmissionStatus: { 
    type: String, 
    enum: ['NOT_SUBMITTED', 'PENDING', 'SUBMITTED', 'FAILED', 'RETRY'], 
    default: 'NOT_SUBMITTED' 
  },
  vendorSubmissionError: { type: String, default: '' },
  vendorSubmissionAttempts: { type: Number, default: 0 },
  settlementId: { type: Schema.Types.ObjectId, ref: 'VendorSettlement' },
  settlementStatus: { 
    type: String, 
    enum: ['UNSETTLED', 'PENDING', 'SETTLED'], 
    default: 'UNSETTLED' 
  },
  financialBreakdown: {
    listedProductPrice: { type: Number, default: 0 },
    platformCommissionRate: { type: Number, default: 30 },
    platformCommission: { type: Number, default: 0 },
    gstOnCommissionRate: { type: Number, default: 18 },
    gstOnCommission: { type: Number, default: 0 },
    totalPlatformRetention: { type: Number, default: 0 },
    vendorProductShare: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    customerGatewayCharge: { type: Number, default: 0 },
    finalVendorPayable: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model<IShopOrder>('ShopOrder', ShopOrderSchema);

