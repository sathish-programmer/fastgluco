import { IVendor } from '../../models/Vendor';
import { IShopOrder } from '../../models/ShopOrder';
import {
  IVendorAdapter,
  IProductSyncResult,
  IOrderSubmissionResult,
  IOrderStatusResult,
  IVendorDeliveryEstimate
} from './IVendorAdapter';

export class DefaultVendorAdapter implements IVendorAdapter {
  public readonly vendorSlug: string;

  constructor(vendorSlug: string = 'generic-vendor') {
    this.vendorSlug = vendorSlug;
  }

  public async syncProducts(vendor: IVendor): Promise<IProductSyncResult> {
    // For manual/future vendors, products are entered through admin portal or external links
    return {
      success: true,
      isMock: false,
      totalFetched: vendor.assignedProducts?.length || 0,
      createdCount: 0,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
      durationMs: 5
    };
  }

  public async submitOrder(vendor: IVendor, order: IShopOrder): Promise<IOrderSubmissionResult> {
    const isExternalCheckout = vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON';
    if (isExternalCheckout) {
      return {
        success: true,
        isMock: false,
        vendorOrderStatus: 'EXTERNAL_AMAZON_REDIRECT'
      };
    }

    // Default internal manual dispatch
    const vendorOrderId = `${(vendor.slug || 'VND').toUpperCase()}-ORD-${order._id.toString().slice(-6).toUpperCase()}`;
    return {
      success: true,
      isMock: false,
      vendorOrderId,
      vendorOrderStatus: 'PENDING_VENDOR_ACTION'
    };
  }

  public async getOrderStatus(vendor: IVendor, vendorOrderId: string): Promise<IOrderStatusResult> {
    return {
      success: true,
      isMock: false,
      vendorOrderId,
      status: 'PROCESSING',
      deliveryStatus: 'processing',
      statusMessage: 'Fulfillment managed through vendor portal.'
    };
  }

  public async checkDeliveryEstimate(
    vendor: IVendor,
    pincode: string,
    address?: { line1?: string; city?: string; state?: string },
    cartAmount: number = 0
  ): Promise<IVendorDeliveryEstimate> {
    const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');
    const isServiceable = cleanPincode.length === 6;
    const days = 3;
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateFormatted = `${dayNames[targetDate.getDay()]}, ${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;

    return {
      serviceable: isServiceable,
      pincode: cleanPincode,
      localityName: address?.city || 'Your Location',
      city: address?.city || 'India',
      state: address?.state || 'India',
      zone: 'National',
      courierPartner: 'Vendor Standard Logistics',
      transitDays: days,
      estimatedDeliveryDate: dateFormatted,
      estimatedDeliveryDateIso: targetDate,
      estimatedDeliveryTime: `${days} Business Days`,
      shippingFee: cartAmount >= 599 ? 0 : 90,
      isFreeShipping: cartAmount >= 599,
      freeShippingThreshold: 599,
      vendorName: vendor.name || 'Partner Store',
      vendorOrigin: 'Vendor Warehouse',
      message: `Standard delivery: ${dateFormatted}`
    };
  }
}
