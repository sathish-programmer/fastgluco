import { IVendor } from '../../models/Vendor';
import { IShopOrder } from '../../models/ShopOrder';

export interface ISyncedProductItem {
  vendorExternalId: string;
  vendorSku: string;
  name: string;
  description: string;
  price: number; // Listed product price (MRP / Selling price)
  image: string;
  category: string;
  brand: string;
  images?: string[];
  shortDescription?: string;
  detailedDescription?: string;
  ingredients?: string[];
  healthBenefits?: string[];
  keyBenefits?: string[];
  usageInstructions?: string;
  storageInstructions?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  productWeight?: string;
  fssaiNumber?: string;
  stock: number;
  availableStock: number;
  isActive: boolean;
  nutritionFacts?: Record<string, any>;
  allergens?: string[];
}

export interface IProductSyncResult {
  success: boolean;
  isMock: boolean;
  totalFetched: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
  durationMs: number;
}

export interface IOrderSubmissionResult {
  success: boolean;
  isMock: boolean;
  vendorOrderId?: string;
  vendorOrderStatus?: string;
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  statusMessage?: string;
  errorMessage?: string;
}

export interface IOrderStatusResult {
  success: boolean;
  isMock: boolean;
  vendorOrderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  deliveryStatus: 'pending' | 'assigned' | 'accepted' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  statusMessage?: string;
}

export interface IVendorDeliveryEstimate {
  serviceable: boolean;
  pincode: string;
  localityName?: string;
  city?: string;
  state?: string;
  zone?: string;
  courierPartner: string;
  transitDays: number;
  estimatedDeliveryDate: string; // Formatted date: "Tuesday, 22 Sep 2026"
  estimatedDeliveryDateIso?: Date;
  estimatedDeliveryTime: string; // "2 Business Days"
  shippingFee: number; // 0 or 90
  isFreeShipping: boolean;
  freeShippingThreshold: number; // 599
  vendorName: string;
  vendorOrigin: string; // "Bangalore Central Warehouse"
  message: string;
}

export interface IVendorAdapter {
  readonly vendorSlug: string;
  syncProducts(vendor: IVendor): Promise<IProductSyncResult>;
  submitOrder(vendor: IVendor, order: IShopOrder): Promise<IOrderSubmissionResult>;
  getOrderStatus(vendor: IVendor, vendorOrderId: string): Promise<IOrderStatusResult>;
  checkDeliveryEstimate(
    vendor: IVendor, 
    pincode: string, 
    address?: { line1?: string; city?: string; state?: string }, 
    cartAmount?: number
  ): Promise<IVendorDeliveryEstimate>;
  cancelOrder?(vendor: IVendor, vendorOrderId: string, reason?: string): Promise<{ success: boolean; message?: string }>;
}
