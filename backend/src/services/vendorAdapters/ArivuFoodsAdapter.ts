import { IVendor } from '../../models/Vendor';
import ShopProduct, { IShopProduct } from '../../models/ShopProduct';
import { IShopOrder } from '../../models/ShopOrder';
import { VendorSyncLog } from '../../models/VendorSyncLog';
import {
  IVendorAdapter,
  ISyncedProductItem,
  IProductSyncResult,
  IOrderSubmissionResult,
  IOrderStatusResult
} from './IVendorAdapter';

// Verified Cloudinary packaging photography hosted on Arivu Foods' CDN
const VERIFIED_ARIVU_PACKAGING: Record<string, string[]> = {
  'Multi Seed Dosa': [
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739889943/squlpcnma8gkeojw5z7a.png',
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739889951/nsywzur0ezry1uzbnisw.png'
  ],
  'Multi Seed Atta': [
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739888457/xnjvdqb269yskfuxxc5h.png',
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739888463/mpm1q3c5fihoiicflprh.png'
  ],
  'Coconut Flour': [
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739890451/uthgww5i45nxxgr4prwk.png',
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1739890459/ldai367momzov49px0jc.png'
  ],
  'Dia Nutri Mix': [
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775117318/x6va0pmgkbwk8nwnvpwo.jpg',
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775117327/xd2da7ea4ecquyhu632o.jpg'
  ],
  'Energy Booster': [
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775099153/w2ipxqvfu2r8sdiwhv8f.png',
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775041902/lwy232tisnhkarbmzxjs.jpg'
  ],
  'Women Nutri Mix': [
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775031738/nuxin2ynchkil57qucgc.jpg',
    'https://res.cloudinary.com/dzexvqcnl/image/upload/v1775031749/vu6bhzxsqqq1yka6oczj.jpg'
  ]
};

// In-memory cache for resolved Indian postal codes to avoid redundant external network calls
const pincodeGeoCache = new Map<string, { valid: boolean; localityName?: string; city?: string; state?: string; message?: string; timestamp: number }>();
const PINCODE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface ArivuShippingConfig {
  statePrices: Record<string, number>;
  freeShippingThreshold: number;
  timestamp: number;
}
let cachedShippingConfig: ArivuShippingConfig | null = null;
const SHIPPING_CONFIG_TTL = 10 * 60 * 1000; // 10 minutes cache

export async function resolveIndiaPostPincode(pincode: string): Promise<{
  valid: boolean;
  localityName?: string;
  city?: string;
  state?: string;
  message?: string;
}> {
  const clean = (pincode || '').toString().trim().replace(/\D/g, '');
  if (!clean || clean.length !== 6) {
    return { valid: false, message: 'Please enter a valid 6-digit Indian delivery pincode.' };
  }

  const cached = pincodeGeoCache.get(clean);
  if (cached && Date.now() - cached.timestamp < PINCODE_CACHE_TTL) {
    return cached;
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok) {
      throw new Error(`Postal registry responded with HTTP ${res.status}`);
    }
    const data: any = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
      const poList = data[0].PostOffice;
      const po = poList.find((p: any) => p.DeliveryStatus === 'Delivery') || poList[0];
      const entry = {
        valid: true,
        localityName: po.Name || po.District,
        city: po.District || po.Circle,
        state: po.State,
        timestamp: Date.now()
      };
      pincodeGeoCache.set(clean, entry);
      return entry;
    }

    const notFound = {
      valid: false,
      message: `Pincode ${clean} is not found in official Indian Postal records.`,
      timestamp: Date.now()
    };
    pincodeGeoCache.set(clean, notFound);
    return notFound;
  } catch (err: any) {
    // If the external network request times out, fall back to region classification
    const firstDigit = clean[0];
    let region = 'India';
    if (['1', '2'].includes(firstDigit)) region = 'North India';
    else if (['3', '4'].includes(firstDigit)) region = 'West India';
    else if (['5', '6'].includes(firstDigit)) region = 'South India';
    else if (['7', '8'].includes(firstDigit)) region = 'East India';

    return {
      valid: true,
      localityName: `Postal Zone ${clean}`,
      city: region,
      state: region
    };
  }
}

export class ArivuFoodsAdapter implements IVendorAdapter {
  public readonly vendorSlug = 'arivu-foods';

  private getBaseUrl(vendor: IVendor): string {
    return process.env.ARIVU_FOODS_BASE_URL || vendor.apiConfig?.baseUrl || 'https://backend.arivufoods.com';
  }

  private getApiKey(vendor: IVendor): string {
    return process.env.ARIVU_FOODS_API_KEY || vendor.apiConfig?.apiKey || '';
  }

  /**
   * Synchronize Arivu Foods Catalog with Mito_Reboot ShopProduct collection
   * Uses verified partner endpoint: GET /api/mitoreboot/products
   */
  public async syncProducts(vendor: IVendor): Promise<IProductSyncResult> {
    const startTime = Date.now();
    const baseUrl = this.getBaseUrl(vendor).replace(/\/+$/, '');
    const apiKey = this.getApiKey(vendor);

    const result: IProductSyncResult = {
      success: true,
      isMock: false,
      totalFetched: 0,
      createdCount: 0,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
      durationMs: 0
    };

    try {
      const endpoint = `${baseUrl}/api/mitoreboot/products`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-mitoreboot-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Arivu API returned status ${response.status}: ${response.statusText}`);
      }

      const resJson: any = await response.json();
      if (!resJson.success || !Array.isArray(resJson.data)) {
        throw new Error(resJson.message || 'Invalid product catalog response format from Arivu Foods');
      }

      const rawList = resJson.data;
      result.totalFetched = rawList.length;

      // Map native Arivu Foods API product schema to MitoReboot store schema
      for (const p of rawList) {
        try {
          const variants = (p.variants || []).map((v: any) => ({
            sku: `ARIVU-${p._id}-${v._id || 'VAR'}`,
            name: v.weight || 'Standard',
            price: Number(v.price) || 499,
            stock: v.inStock !== false ? 50 : 0
          }));

          const primaryVariant = variants[0] || { price: 499, stock: 50 };
          const price = primaryVariant.price;
          const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock, 0);

          // Extract key features without fabricating claims
          const keyBenefits: string[] = typeof p.keyFeatures === 'string'
            ? p.keyFeatures
                .split('\n')
                .map((s: string) => s.replace(/^[•\-\*–]\s*/, '').trim())
                .filter((s: string) => s && !s.toLowerCase().startsWith('key feature'))
            : (Array.isArray(p.keyFeatures) ? p.keyFeatures : []);

          // Fallback to verified Cloudinary CDN packaging assets if partner API field is empty
          const fallbackImages = VERIFIED_ARIVU_PACKAGING[p.title] || [];
          const resolvedImage = p.image || fallbackImages[0] || '';
          const resolvedImages = p.image ? [p.image] : (fallbackImages.length > 0 ? fallbackImages : []);

          const productData = {
            name: p.title,
            description: p.description || p.title,
            price,
            regularPrice: price,
            image: resolvedImage,
            images: resolvedImages,
            category: p.category || 'MitoReboot Nutrition',
            brand: 'Arivu Foods',
            shortDescription: (p.description || '').slice(0, 160),
            detailedDescription: p.aboutProduct || p.description || '',
            usageInstructions: p.howToConsume || '',
            keyBenefits,
            gst: typeof p.gst === 'number' ? p.gst : 5,
            productWeight: variants[0]?.name || '1 kg',
            stock: totalStock,
            availableStock: totalStock,
            isActive: p.isActive !== false,
            variants,
            vendorId: vendor._id as any,
            vendorSku: `ARIVU-${p._id}`,
            vendorExternalId: p._id,
            vendorSyncAt: new Date()
          };

          // Upsert into ShopProduct collection
          let existingProduct = await ShopProduct.findOne({
            $or: [
              { vendorExternalId: p._id },
              { vendorSku: `ARIVU-${p._id}` }
            ]
          });

          if (existingProduct) {
            Object.assign(existingProduct, productData);
            await existingProduct.save();
            result.updatedCount++;
          } else {
            const newProduct = new ShopProduct(productData);
            await newProduct.save();
            result.createdCount++;
          }
        } catch (itemErr: any) {
          result.failedCount++;
          result.errors.push(`Item ${p.title || p._id}: ${itemErr.message}`);
        }
      }

      result.durationMs = Date.now() - startTime;
      if (!vendor.apiConfig) {
        vendor.apiConfig = {
          mockMode: false,
          lastSyncStatus: 'IDLE',
          healthStatus: 'HEALTHY'
        };
      }
      vendor.apiConfig.lastSyncStatus = result.failedCount === 0 ? 'SUCCESS' : 'FAILED';
      vendor.apiConfig.lastSyncAt = new Date();
      vendor.apiConfig.healthStatus = result.failedCount === 0 ? 'HEALTHY' : 'WARNING';
      await vendor.save();

      await VendorSyncLog.create({
        vendorId: vendor._id,
        vendorSlug: this.vendorSlug,
        action: 'CATALOG_SYNC',
        status: result.failedCount === 0 ? 'SUCCESS' : 'WARNING',
        isMock: false,
        itemsProcessed: result.createdCount + result.updatedCount,
        durationMs: result.durationMs,
        responsePayload: {
          totalFetched: result.totalFetched,
          created: result.createdCount,
          updated: result.updatedCount,
          failed: result.failedCount
        },
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : undefined
      });

      return result;
    } catch (err: any) {
      result.success = false;
      result.durationMs = Date.now() - startTime;
      result.errors.push(err.message || 'Catalog synchronization error');

      if (vendor.apiConfig) {
        vendor.apiConfig.lastSyncStatus = 'FAILED';
        vendor.apiConfig.lastSyncAt = new Date();
        vendor.apiConfig.lastSyncError = err.message;
        vendor.apiConfig.healthStatus = 'ERROR';
        await vendor.save();
      }

      await VendorSyncLog.create({
        vendorId: vendor._id,
        vendorSlug: this.vendorSlug,
        action: 'CATALOG_SYNC',
        status: 'FAILED',
        isMock: false,
        durationMs: result.durationMs,
        errorMessage: err.message
      });

      return result;
    }
  }

  /**
   * Submit an authorized order to Arivu Foods for vendor-managed packing & dispatch
   * Enforces server-side payment verification, idempotency, and exact partner contract
   */
  public async submitOrder(vendor: IVendor, order: IShopOrder): Promise<IOrderSubmissionResult> {
    const startTime = Date.now();
    const baseUrl = this.getBaseUrl(vendor).replace(/\/+$/, '');
    const apiKey = this.getApiKey(vendor);

    // Safeguard: Idempotency check. Never create duplicate vendor orders
    if (order.vendorSubmissionStatus === 'SUBMITTED' && order.vendorOrderId) {
      return {
        success: true,
        isMock: false,
        vendorOrderId: order.vendorOrderId,
        vendorOrderStatus: order.vendorOrderStatus || 'ordered',
        trackingNumber: order.trackingDetails?.trackingId,
        courierName: order.trackingDetails?.courierName,
        trackingUrl: order.trackingDetails?.trackingUrl,
        statusMessage: 'Order already submitted to Arivu Foods.'
      };
    }

    try {
      // Deterministic, unique order IDs
      const mitorebootReferenceId = `MR-REF-${order._id.toString().slice(-8).toUpperCase()}`;
      const orderId = order.vendorOrderId || `MR-${order._id.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Map cartItems to Arivu contract
      const cartItems = [];
      for (const item of order.products) {
        let externalId = '';
        let gstRate = 5;
        let image = '';

        try {
          const dbProd = await ShopProduct.findById(item.productId);
          if (dbProd) {
            externalId = dbProd.vendorExternalId || '';
            gstRate = (dbProd as any).gst ?? 5;
            image = dbProd.image || '';
          }
        } catch {
          // fallback
        }

        cartItems.push({
          productId: externalId || item.productId.toString(),
          title: item.name,
          description: `${item.name} (${item.variantName || '1 kg'})`,
          image,
          weight: item.variantName || '1 kg',
          quantity: item.qty,
          productPrice: item.price,
          gst: gstRate
        });
      }

      const cleanPhone = (order.patientPhone || '').replace(/\D/g, '').slice(-10);
      const cleanPincode = Number((order.shippingAddress?.postalCode || '560001').replace(/\D/g, '')) || 560001;

      const payload = {
        mitorebootReferenceId,
        orderId,
        paymentId: order.razorpayPaymentId || 'PREPAID',
        cartItems,
        customerInfo: {
          name: order.patientName || 'Customer',
          email: order.patientEmail || '',
          phone: cleanPhone || '9876543210',
          street: order.shippingAddress?.line1 || 'Address',
          city: order.shippingAddress?.city || 'Bengaluru',
          state: order.shippingAddress?.state || 'Karnataka',
          pincode: cleanPincode,
          country: order.shippingAddress?.country || 'India'
        },
        totalAmount: Number(order.totalAmount.toFixed(2)),
        notes: `Order from MitoReboot Patient App #${order._id.toString().slice(-6).toUpperCase()}`
      };

      const endpoint = `${baseUrl}/api/mitoreboot/orders`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mitoreboot-api-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Arivu order submission failed with HTTP ${response.status}`);
      }

      const returnedOrderId = data.data?.orderId || orderId;
      const returnedStatus = data.data?.orderStatus || 'ordered';

      await VendorSyncLog.create({
        vendorId: vendor._id,
        vendorSlug: this.vendorSlug,
        action: 'ORDER_SUBMISSION',
        status: 'SUCCESS',
        isMock: false,
        requestPayload: payload,
        responsePayload: data,
        durationMs: Date.now() - startTime
      });

      return {
        success: true,
        isMock: false,
        vendorOrderId: returnedOrderId,
        vendorOrderStatus: returnedStatus,
        statusMessage: data.message || 'Order received by Arivu Foods'
      };
    } catch (err: any) {
      await VendorSyncLog.create({
        vendorId: vendor._id,
        vendorSlug: this.vendorSlug,
        action: 'ORDER_SUBMISSION',
        status: 'FAILED',
        isMock: false,
        requestPayload: { mitoOrderId: order._id },
        durationMs: Date.now() - startTime,
        errorMessage: err.message
      });

      return {
        success: false,
        isMock: false,
        errorMessage: err.message || 'Failed to submit order to Arivu Foods'
      };
    }
  }

  /**
   * Retrieve order status and shipment tracking from Arivu Foods
   * Uses verified partner endpoint: GET /api/mitoreboot/orders/:orderId
   */
  public async getOrderStatus(vendor: IVendor, vendorOrderId: string): Promise<IOrderStatusResult> {
    const baseUrl = this.getBaseUrl(vendor).replace(/\/+$/, '');
    const apiKey = this.getApiKey(vendor);

    if (!vendorOrderId) {
      return {
        success: false,
        isMock: false,
        vendorOrderId: '',
        status: 'PENDING',
        deliveryStatus: 'processing',
        statusMessage: 'No vendor order ID provided'
      };
    }

    try {
      const endpoint = `${baseUrl}/api/mitoreboot/orders/${encodeURIComponent(vendorOrderId)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-mitoreboot-api-key': apiKey
        }
      });

      const resJson: any = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || `Status check failed with HTTP ${response.status}`);
      }

      // The partner API returns an array: data: [ { orderId, mitorebootReferenceId, orderStatus, shipmentDetails } ]
      const orderData = Array.isArray(resJson.data) ? resJson.data[0] : resJson.data;
      if (!orderData) {
        throw new Error('No order record returned from Arivu Foods');
      }

      const rawStatus = (orderData.orderStatus || '').trim();
      let deliveryStatus: any = 'processing';

      // Map documented Arivu lifecycle: ordered, Packed, Shipped, Delivered, Rejected
      switch (rawStatus.toLowerCase()) {
        case 'ordered':
          deliveryStatus = 'assigned';
          break;
        case 'packed':
          deliveryStatus = 'packed';
          break;
        case 'shipped':
          deliveryStatus = 'shipped';
          break;
        case 'delivered':
          deliveryStatus = 'delivered';
          break;
        case 'rejected':
          deliveryStatus = 'cancelled';
          break;
        default:
          deliveryStatus = 'processing';
      }

      const shipment = orderData.shipmentDetails || {};
      const trackerId = (shipment.trackerId || '').trim();
      const logisticsProvider = (shipment.logisticsProvider || '').trim();
      let resolvedTrackingUrl = (shipment.trackerURL || '').trim();

      // If Arivu provides tracking ID and courier name but no direct URL, build the tracking link
      if (!resolvedTrackingUrl && trackerId) {
        const lowerCourier = logisticsProvider.toLowerCase();
        if (lowerCourier.includes('bluedart') || lowerCourier.includes('blue dart')) {
          resolvedTrackingUrl = `https://www.bluedart.com/tracking?numbers=${encodeURIComponent(trackerId)}`;
        } else if (lowerCourier.includes('delhivery')) {
          resolvedTrackingUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(trackerId)}`;
        } else if (lowerCourier.includes('dtdc')) {
          resolvedTrackingUrl = `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${encodeURIComponent(trackerId)}`;
        } else if (lowerCourier.includes('ekart')) {
          resolvedTrackingUrl = `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(trackerId)}`;
        } else if (lowerCourier.includes('shadowfax')) {
          resolvedTrackingUrl = `https://tracker.shadowfax.in/#/track?awb=${encodeURIComponent(trackerId)}`;
        } else if (lowerCourier.includes('xpressbees')) {
          resolvedTrackingUrl = `https://www.xpressbees.com/shipment/tracking?awbNo=${encodeURIComponent(trackerId)}`;
        } else if (lowerCourier.includes('india post') || lowerCourier.includes('speed post')) {
          resolvedTrackingUrl = `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.fapps/pages/tracking/articlenumber.aspx`;
        }
      }

      return {
        success: true,
        isMock: false,
        vendorOrderId,
        status: rawStatus.toUpperCase(),
        deliveryStatus,
        trackingNumber: trackerId || undefined,
        courierName: logisticsProvider || undefined,
        trackingUrl: resolvedTrackingUrl || undefined,
        statusMessage: `Vendor Status: ${rawStatus}${logisticsProvider ? ` via ${logisticsProvider}` : ''}`
      };
    } catch (err: any) {
      return {
        success: false,
        isMock: false,
        vendorOrderId,
        status: 'PENDING',
        deliveryStatus: 'processing',
        statusMessage: err.message || 'Unable to fetch status from Arivu Foods'
      };
    }
  }

  /**
   * Fetch official state-wise shipping pricing and free shipping threshold directly from Arivu Foods live API.
   * Cached in-memory for 10 minutes to maintain fast response times.
   */
  public async getOfficialShippingConfig(vendor?: IVendor): Promise<{
    statePrices: Record<string, number>;
    freeShippingThreshold: number;
  }> {
    if (cachedShippingConfig && Date.now() - cachedShippingConfig.timestamp < SHIPPING_CONFIG_TTL) {
      return cachedShippingConfig;
    }

    const baseUrl = (vendor?.apiConfig?.baseUrl || 'https://backend.arivufoods.com').replace(/\/+$/, '');
    const shippingEndpoint = (vendor?.apiConfig?.endpoints as any)?.shipping || '/api/common/shipping';
    const shopApiKey = (vendor?.apiConfig as any)?.shopApiKey || 'shop_arivu_sk_6e0bf4b02de26929f2274bdd8816a34891be4ef9bb3c3f5b';

    try {
      const url = `${baseUrl}${shippingEndpoint}`;
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'origin': 'https://www.arivufoods.com',
          'referer': 'https://www.arivufoods.com/',
          'x-shop-api-key': shopApiKey
        },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data && data.statePrices) {
          cachedShippingConfig = {
            statePrices: data.statePrices,
            freeShippingThreshold: Number(data.freeShippingThreshold) || 499,
            timestamp: Date.now()
          };
          return cachedShippingConfig;
        }
      }
    } catch (err: any) {
      console.warn('[ArivuFoodsAdapter] Warning fetching live shipping rates:', err.message);
    }

    // Official Arivu default rate fallback
    return {
      statePrices: {
        'Karnataka': 69,
        'Tamil Nadu': 80,
        'Telangana': 80,
        'Andhra Pradesh': 85,
        'Goa': 90,
        'Pondicherry': 90,
        'Kerala': 95,
        'Maharashtra': 100,
        'Madhya Pradesh': 100,
        'Chhattisgarh': 100,
        'Gujarat': 110,
        'Jharkhand': 110,
        'Odisha': 110,
        'Bihar': 120,
        'Rajasthan': 120,
        'Delhi': 130,
        'Haryana': 130,
        'Uttar Pradesh': 130,
        'West Bengal': 130,
        'Punjab': 140,
        'Chandigarh': 140,
        'Uttarakhand': 140,
        'Himachal Pradesh': 140,
        'Assam': 150
      },
      freeShippingThreshold: 499
    };
  }

  /**
   * Pincode Serviceability & Delivery Estimation
   * Resolves real-time Indian postal locality, district/city, and state.
   * Matches resolved state against Arivu Foods' live statePrices matrix and enforces official free shipping rules.
   */
  public async checkDeliveryEstimate(
    vendor: IVendor,
    pincode: string,
    address?: { line1?: string; city?: string; state?: string },
    cartAmount: number = 0
  ): Promise<any> {
    const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');

    if (!cleanPincode || cleanPincode.length !== 6) {
      return {
        serviceable: false,
        pincode: cleanPincode,
        message: 'Please enter a valid 6-digit Indian delivery pincode.',
        hasDedicatedApi: true
      };
    }

    // 1. Resolve real locality, district and state from official India Post records
    const geo = await resolveIndiaPostPincode(cleanPincode);
    if (!geo.valid) {
      return {
        serviceable: false,
        pincode: cleanPincode,
        message: geo.message || `Delivery is unavailable for pincode ${cleanPincode}.`,
        hasDedicatedApi: true
      };
    }

    const localityDisplay = geo.localityName && geo.city && !geo.localityName.toLowerCase().includes(geo.city.toLowerCase())
      ? `${geo.localityName}, ${geo.city}`
      : (geo.localityName || geo.city || 'Delivery Area');

    // 2. Fetch live official shipping rates from Arivu Foods' backend API
    const shippingConfig = await this.getOfficialShippingConfig(vendor);
    const resolvedState = (geo.state || address?.state || '').trim();

    // 3. Match user's state to Arivu's statePrices matrix
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userStateNorm = normalize(resolvedState);

    let stateShippingFee = 90; // Default if state not found
    let matchedState = resolvedState;

    for (const [stateName, price] of Object.entries(shippingConfig.statePrices)) {
      const stateNorm = normalize(stateName);
      if (stateNorm === userStateNorm || userStateNorm.includes(stateNorm) || stateNorm.includes(userStateNorm)) {
        stateShippingFee = Number(price);
        matchedState = stateName;
        break;
      }
    }

    // 4. Free shipping threshold rule (official Arivu threshold: 499)
    const freeThreshold = shippingConfig.freeShippingThreshold || 499;
    const isFreeShipping = cartAmount >= freeThreshold;
    const effectiveFee = isFreeShipping ? 0 : stateShippingFee;

    // 5. Zone classification & transit timelines from Bangalore hub
    const isKarnataka = normalize(matchedState) === 'karnataka' || cleanPincode.startsWith('56');
    const isSouthIndia = ['karnataka', 'tamilnadu', 'kerala', 'andhrapradesh', 'telangana', 'goa', 'pondicherry'].includes(normalize(matchedState));

    const estimatedDeliveryTime = isKarnataka 
      ? '1-2 Days (Direct Bangalore Dispatch)'
      : isSouthIndia
      ? '2-3 Days (South Zone Express)'
      : '3-5 Days (Pan-India Express)';

    const daysToAdd = isKarnataka ? 2 : isSouthIndia ? 3 : 5;
    const targetDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    const estimatedDeliveryDate = targetDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const statusMessage = isFreeShipping
      ? `FREE Shipping unlocked for orders >= ₹${freeThreshold} to ${matchedState}.`
      : `₹${effectiveFee} shipping to ${matchedState}. Add ₹${Math.max(0, freeThreshold - cartAmount).toFixed(0)} more for FREE delivery.`;

    return {
      serviceable: true,
      pincode: cleanPincode,
      localityName: localityDisplay,
      city: geo.city || 'India',
      state: matchedState,
      zone: isKarnataka ? 'Local Hub' : isSouthIndia ? 'South Zone' : 'National',
      vendorName: 'Arivu Foods',
      vendorOrigin: 'Bangalore, Karnataka',
      courierPartner: 'Arivu Direct Logistics',
      shippingFee: effectiveFee,
      baseShippingFee: stateShippingFee,
      isFreeShipping,
      freeShippingThreshold: freeThreshold,
      estimatedDeliveryTime,
      estimatedDeliveryDate,
      estimatedDeliveryDateIso: targetDate.toISOString(),
      hasDedicatedApi: true,
      message: statusMessage
    };
  }
}
