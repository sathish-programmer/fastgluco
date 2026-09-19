import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlementLineItem {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  listedProductPrice: number;
  platformCommissionRate: number;
  platformCommission: number;
  gstOnCommission: number;
  totalPlatformRetention: number;
  vendorProductShare: number;
  shippingCollected: number;
  customerGatewayFee: number;
  netVendorPayable: number;
  deliveryStatus: string;
}

export interface IVendorSettlement extends Document {
  vendorId: mongoose.Types.ObjectId;
  settlementCode: string; // e.g. SET-ARIVU-2026-09-01
  startDate: Date;
  endDate: Date;
  cycleDays: number; // 15 or 30
  status: 'DRAFT' | 'FINALIZED' | 'PAID' | 'DISPUTED';
  totalOrdersCount: number;
  eligibleOrdersCount: number;
  grossSales: number;
  commissionableAmount: number;
  appliedCommissionRate: number; // e.g. 30%
  totalPlatformCommission: number;
  gstOnCommission: number;
  totalPlatformRetention: number;
  shippingPassThrough: number;
  vendorBasePayable: number;
  refundsAndDeductions: number;
  finalSettlementAmount: number;
  lineItems: ISettlementLineItem[];
  orderIds: mongoose.Types.ObjectId[];
  notes?: string;
  finalizedBy?: mongoose.Types.ObjectId;
  finalizedAt?: Date;
  paidAt?: Date;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementLineItemSchema: Schema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'ShopOrder', required: true },
  orderNumber: { type: String, required: true },
  orderDate: { type: Date, required: true },
  customerName: { type: String, default: '' },
  listedProductPrice: { type: Number, required: true },
  platformCommissionRate: { type: Number, required: true },
  platformCommission: { type: Number, required: true },
  gstOnCommission: { type: Number, required: true },
  totalPlatformRetention: { type: Number, required: true },
  vendorProductShare: { type: Number, required: true },
  shippingCollected: { type: Number, default: 0 },
  customerGatewayFee: { type: Number, default: 0 },
  netVendorPayable: { type: Number, required: true },
  deliveryStatus: { type: String, default: 'delivered' }
}, { _id: false });

const VendorSettlementSchema: Schema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  settlementCode: { type: String, required: true, unique: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cycleDays: { type: Number, default: 30 },
  status: { 
    type: String, 
    enum: ['DRAFT', 'FINALIZED', 'PAID', 'DISPUTED'], 
    default: 'DRAFT',
    index: true 
  },
  totalOrdersCount: { type: Number, default: 0 },
  eligibleOrdersCount: { type: Number, default: 0 },
  grossSales: { type: Number, default: 0 },
  commissionableAmount: { type: Number, default: 0 },
  appliedCommissionRate: { type: Number, default: 30 },
  totalPlatformCommission: { type: Number, default: 0 },
  gstOnCommission: { type: Number, default: 0 },
  totalPlatformRetention: { type: Number, default: 0 },
  shippingPassThrough: { type: Number, default: 0 },
  vendorBasePayable: { type: Number, default: 0 },
  refundsAndDeductions: { type: Number, default: 0 },
  finalSettlementAmount: { type: Number, default: 0 },
  lineItems: [SettlementLineItemSchema],
  orderIds: [{ type: Schema.Types.ObjectId, ref: 'ShopOrder' }],
  notes: { type: String, default: '' },
  finalizedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  finalizedAt: { type: Date },
  paidAt: { type: Date },
  paymentReference: { type: String, default: '' }
}, { timestamps: true });

export const VendorSettlement = mongoose.model<IVendorSettlement>('VendorSettlement', VendorSettlementSchema);
