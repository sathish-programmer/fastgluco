import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorCapabilities {
  productType: 'SINGLE' | 'MULTIPLE';
  productSyncMethod: 'MANUAL' | 'API';
  checkoutType: 'INTERNAL' | 'EXTERNAL_AMAZON';
  fulfillmentType: 'API' | 'MANUAL' | 'VENDOR_PORTAL';
  deliveryManagedBy: 'VENDOR' | 'PLATFORM';
  trackingMethod: 'API_POLLING' | 'WEBHOOK' | 'MANUAL';
}

export interface IVendorCommissionConfig {
  rate: number; // e.g., 30 for 30%
  type: 'PERCENTAGE' | 'FIXED';
  gstOnCommissionRate: number; // 18%
  settlementCycleDays: number; // 15 or 30 days (default 30 per Schedule A)
  customerPaysGatewayFee: boolean; // true
  passThroughShipping: boolean; // true
  minFreeShippingOrderValue?: number; // 599 for Arivu
  standardShippingFee?: number; // 90 for Arivu
}

export interface IVendorApiConfig {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  endpoints?: {
    catalogSync?: string;
    orderSubmit?: string;
    orderStatus?: string;
    shipmentTracking?: string;
    cancelOrder?: string;
  };
  mockMode: boolean; // default true until live API docs received
  lastSyncStatus: 'IDLE' | 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  lastSyncAt?: Date;
  lastSyncError?: string;
  healthStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
}

export interface IVendor extends Document {
  name: string;
  slug: string; // e.g. 'arivu-foods', 'babu', 'oncocur', 'wig', 'genomics', 'pure-and-pure', 'swasa-products'
  email: string;
  passwordHash: string;
  isActive: boolean;
  isDeleted: boolean;
  phone?: string;
  logo?: string;
  website?: string;
  address?: string;
  businessName?: string;
  licenseNumber?: string;
  taxId?: string;
  businessAddress?: string;
  assignedProducts?: mongoose.Types.ObjectId[];
  commissionType?: 'PERCENTAGE' | 'FIXED';
  commissionValue?: number;
  capabilities?: IVendorCapabilities;
  commissionConfig?: IVendorCommissionConfig;
  apiConfig?: IVendorApiConfig;
  externalStoreUrl?: string; // Amazon affiliate/store link
  agreementNotes?: string;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    businessName: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    taxId: { type: String, default: '' },
    businessAddress: { type: String, default: '' },
    assignedProducts: [{ type: Schema.Types.ObjectId, ref: 'ShopProduct' }],
    commissionType: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
    commissionValue: { type: Number, default: 30 },
    capabilities: {
      productType: { type: String, enum: ['SINGLE', 'MULTIPLE'], default: 'MULTIPLE' },
      productSyncMethod: { type: String, enum: ['MANUAL', 'API'], default: 'API' },
      checkoutType: { type: String, enum: ['INTERNAL', 'EXTERNAL_AMAZON'], default: 'INTERNAL' },
      fulfillmentType: { type: String, enum: ['API', 'MANUAL', 'VENDOR_PORTAL'], default: 'API' },
      deliveryManagedBy: { type: String, enum: ['VENDOR', 'PLATFORM'], default: 'VENDOR' },
      trackingMethod: { type: String, enum: ['API_POLLING', 'WEBHOOK', 'MANUAL'], default: 'API_POLLING' }
    },
    commissionConfig: {
      rate: { type: Number, default: 30 },
      type: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
      gstOnCommissionRate: { type: Number, default: 18 },
      settlementCycleDays: { type: Number, default: 30 },
      customerPaysGatewayFee: { type: Boolean, default: true },
      passThroughShipping: { type: Boolean, default: true },
      minFreeShippingOrderValue: { type: Number, default: 599 },
      standardShippingFee: { type: Number, default: 90 }
    },
    apiConfig: {
      baseUrl: { type: String, default: 'https://api.arivufoods.com/v1' },
      apiKey: { type: String, default: '' },
      apiSecret: { type: String, default: '' },
      webhookSecret: { type: String, default: '' },
      endpoints: {
        catalogSync: { type: String, default: '/catalog/products' },
        orderSubmit: { type: String, default: '/orders/submit' },
        orderStatus: { type: String, default: '/orders/:id/status' },
        shipmentTracking: { type: String, default: '/orders/:id/tracking' },
        cancelOrder: { type: String, default: '/orders/:id/cancel' }
      },
      mockMode: { type: Boolean, default: true },
      lastSyncStatus: { type: String, enum: ['IDLE', 'SUCCESS', 'FAILED', 'IN_PROGRESS'], default: 'IDLE' },
      lastSyncAt: { type: Date },
      lastSyncError: { type: String, default: '' },
      healthStatus: { type: String, enum: ['HEALTHY', 'WARNING', 'ERROR'], default: 'HEALTHY' }
    },
    externalStoreUrl: { type: String, default: '' },
    agreementNotes: { type: String, default: '' },
    deactivatedAt: { type: Date }
  },
  { timestamps: true }
);

VendorSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
VendorSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);

