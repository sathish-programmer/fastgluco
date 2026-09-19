import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Vendor, IVendor } from '../models/Vendor';
import ShopOrder, { IShopOrder } from '../models/ShopOrder';
import ShopProduct from '../models/ShopProduct';
import { VendorSettlement, IVendorSettlement } from '../models/VendorSettlement';
import { VendorSyncLog } from '../models/VendorSyncLog';
import { VendorAdapterFactory } from '../services/vendorAdapters/VendorAdapterFactory';
import { EmailService } from '../services/emailService';
import { InvoiceService } from '../services/invoiceService';
import { FCMService } from '../services/fcmService';
import { NotificationType } from '../models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

export class VendorController {
  // --- ADMIN VENDOR MANAGEMENT ---

  public static async adminAddVendor(req: Request, res: Response) {
    try {
      const {
        name,
        slug,
        email,
        password,
        phone,
        logo,
        website,
        address,
        businessName,
        licenseNumber,
        taxId,
        businessAddress,
        assignedProducts,
        commissionType,
        commissionValue,
        capabilities,
        commissionConfig,
        apiConfig,
        externalStoreUrl,
        agreementNotes
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required.' });
      }

      const existing = await Vendor.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Vendor with this email already exists.' });
      }

      const vendorSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const passwordHash = await bcrypt.hash(password, 10);

      const vendor = new Vendor({
        name,
        slug: vendorSlug,
        email,
        passwordHash,
        phone: phone || '',
        logo: logo || '',
        website: website || '',
        address: address || '',
        businessName: businessName || name,
        licenseNumber: licenseNumber || '',
        taxId: taxId || '',
        businessAddress: businessAddress || '',
        assignedProducts: assignedProducts || [],
        commissionType: commissionType || 'PERCENTAGE',
        commissionValue: commissionValue !== undefined ? Number(commissionValue) : 30,
        capabilities: capabilities || {
          productType: 'MULTIPLE',
          productSyncMethod: 'API',
          checkoutType: 'INTERNAL',
          fulfillmentType: 'API',
          deliveryManagedBy: 'VENDOR',
          trackingMethod: 'API_POLLING'
        },
        commissionConfig: commissionConfig || {
          rate: 30,
          type: 'PERCENTAGE',
          gstOnCommissionRate: 18,
          settlementCycleDays: 30,
          customerPaysGatewayFee: true,
          passThroughShipping: true,
          minFreeShippingOrderValue: 599,
          standardShippingFee: 90
        },
        apiConfig: apiConfig || {
          baseUrl: 'https://api.arivufoods.com/v1',
          apiKey: '',
          mockMode: true,
          lastSyncStatus: 'IDLE',
          healthStatus: 'HEALTHY'
        },
        externalStoreUrl: externalStoreUrl || '',
        agreementNotes: agreementNotes || '',
        isActive: true
      });

      await vendor.save();
      res.status(201).json(vendor);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error adding vendor' });
    }
  }

  public static async adminEditVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        slug,
        phone,
        logo,
        website,
        address,
        businessName,
        licenseNumber,
        taxId,
        businessAddress,
        assignedProducts,
        isActive,
        commissionType,
        commissionValue,
        capabilities,
        commissionConfig,
        apiConfig,
        externalStoreUrl,
        agreementNotes,
        password
      } = req.body;

      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      if (name !== undefined) vendor.name = name;
      if (slug !== undefined) vendor.slug = slug;
      if (phone !== undefined) vendor.phone = phone;
      if (logo !== undefined) vendor.logo = logo;
      if (website !== undefined) vendor.website = website;
      if (address !== undefined) vendor.address = address;
      if (businessName !== undefined) vendor.businessName = businessName;
      if (licenseNumber !== undefined) vendor.licenseNumber = licenseNumber;
      if (taxId !== undefined) vendor.taxId = taxId;
      if (businessAddress !== undefined) vendor.businessAddress = businessAddress;
      if (assignedProducts !== undefined) vendor.assignedProducts = assignedProducts;
      if (commissionType !== undefined) vendor.commissionType = commissionType;
      if (commissionValue !== undefined) vendor.commissionValue = Number(commissionValue);
      if (externalStoreUrl !== undefined) vendor.externalStoreUrl = externalStoreUrl;
      if (agreementNotes !== undefined) vendor.agreementNotes = agreementNotes;

      if (capabilities) {
        vendor.capabilities = { ...vendor.capabilities, ...capabilities };
      }

      if (commissionConfig) {
        vendor.commissionConfig = { ...vendor.commissionConfig, ...commissionConfig };
        // Sync root commissionValue if rate is provided
        if (commissionConfig.rate !== undefined) {
          vendor.commissionValue = commissionConfig.rate;
        }
      }

      if (apiConfig) {
        vendor.apiConfig = { ...vendor.apiConfig, ...apiConfig };
      }

      if (password) {
        vendor.passwordHash = await bcrypt.hash(password, 10);
      }

      if (isActive !== undefined) {
        vendor.isActive = isActive;
        if (!isActive) {
          vendor.deactivatedAt = new Date();
        } else {
          vendor.deactivatedAt = undefined;
        }
      }

      await vendor.save();
      res.json(vendor);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error updating vendor.' });
    }
  }

  public static async adminGetVendors(req: Request, res: Response) {
    try {
      const vendors = await Vendor.find().populate('assignedProducts').sort({ createdAt: -1 });

      // Enrich vendors with live metrics for the listing table
      const enriched = await Promise.all(
        vendors.map(async (v) => {
          const vendorObj = v.toObject();
          const vendorId = v._id;

          // Count products
          const productCount = await ShopProduct.countDocuments({
            $or: [{ vendorId }, { _id: { $in: v.assignedProducts || [] } }]
          });

          // Order stats
          const orders = await ShopOrder.find({ vendorId });
          const orderCount = orders.length;
          const totalOrderValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

          // Pending settlement (delivered orders unsettled)
          const unsettledOrders = orders.filter(
            (o) => o.deliveryStatus === 'delivered' && o.settlementStatus !== 'SETTLED'
          );
          const pendingSettlementAmount = unsettledOrders.reduce(
            (sum, o) => sum + (o.financialBreakdown?.finalVendorPayable || o.vendorEarnings || 0),
            0
          );

          return {
            ...vendorObj,
            metrics: {
              productCount,
              orderCount,
              totalOrderValue,
              pendingSettlementAmount,
              lastSyncStatus: v.apiConfig?.lastSyncStatus || 'IDLE',
              lastSyncAt: v.apiConfig?.lastSyncAt,
              healthStatus: v.apiConfig?.healthStatus || 'HEALTHY'
            }
          };
        })
      );

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ message: 'Error listing vendors' });
    }
  }

  public static async adminGetVendorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findById(id).populate('assignedProducts');
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      // Fetch products
      const products = await ShopProduct.find({
        $or: [{ vendorId: vendor._id }, { _id: { $in: vendor.assignedProducts || [] } }]
      }).sort({ createdAt: -1 });

      // Fetch orders
      const orders = await ShopOrder.find({ vendorId: vendor._id }).sort({ createdAt: -1 });

      // Fetch recent sync logs
      const syncLogs = await VendorSyncLog.find({ vendorId: vendor._id }).sort({ createdAt: -1 }).limit(20);

      // Fetch settlements
      const settlements = await VendorSettlement.find({ vendorId: vendor._id }).sort({ createdAt: -1 });

      res.json({
        vendor,
        products,
        orders,
        syncLogs,
        settlements
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error fetching vendor details' });
    }
  }

  // --- CATALOG SYNC (ARIVU FOODS & FUTURE VENDORS) ---

  public static async adminSyncProducts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      const adapter = VendorAdapterFactory.getAdapter(vendor);
      const syncResult = await adapter.syncProducts(vendor);

      res.json({
        message: syncResult.success ? 'Catalog synchronized successfully.' : 'Sync completed with warnings/errors.',
        result: syncResult
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error synchronizing vendor products.' });
    }
  }

  // --- ORDER SUBMISSION & STATUS SYNC ---

  public static async adminSubmitVendorOrder(req: Request, res: Response) {
    try {
      const { id, orderId } = req.params;
      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      const adapter = VendorAdapterFactory.getAdapter(vendor);
      const result = await adapter.submitOrder(vendor, order);

      if (result.success) {
        order.vendorOrderId = result.vendorOrderId || order.vendorOrderId;
        order.vendorOrderStatus = result.vendorOrderStatus || 'PROCESSING';
        order.vendorSubmissionStatus = 'SUBMITTED';
        order.vendorSubmissionError = '';
        order.vendorSubmissionAttempts = (order.vendorSubmissionAttempts || 0) + 1;

        if (result.trackingNumber) {
          order.trackingDetails = {
            courierName: result.courierName || 'Blue Dart Express',
            trackingId: result.trackingNumber,
            trackingUrl: result.trackingUrl || ''
          };
          order.deliveryStatus = 'shipped';
        }

        order.orderTimeline = order.orderTimeline || [];
        order.orderTimeline.push({
          status: 'submitted_to_vendor',
          timestamp: new Date(),
          comment: `Dispatched to ${vendor.name}. Ref: ${order.vendorOrderId}`
        });

        await order.save();
      } else {
        order.vendorSubmissionStatus = 'FAILED';
        order.vendorSubmissionError = result.errorMessage || 'Submission failed';
        order.vendorSubmissionAttempts = (order.vendorSubmissionAttempts || 0) + 1;
        await order.save();
      }

      res.json({ result, order });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error submitting order to vendor.' });
    }
  }

  public static async adminSyncOrderStatus(req: Request, res: Response) {
    try {
      const { id, orderId } = req.params;
      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      if (!order.vendorOrderId) {
        return res.status(400).json({ message: 'Order does not have a vendor order ID yet.' });
      }

      const adapter = VendorAdapterFactory.getAdapter(vendor);
      const statusResult = await adapter.getOrderStatus(vendor, order.vendorOrderId);

      if (statusResult.success) {
        order.vendorOrderStatus = statusResult.status;
        order.deliveryStatus = statusResult.deliveryStatus;

        if (statusResult.trackingNumber) {
          order.trackingDetails = {
            courierName: statusResult.courierName || order.trackingDetails?.courierName || 'Blue Dart Express',
            trackingId: statusResult.trackingNumber,
            trackingUrl: statusResult.trackingUrl || order.trackingDetails?.trackingUrl || ''
          };
        }

        if (statusResult.deliveryStatus === 'delivered' && !order.deliveryDate) {
          order.deliveryDate = statusResult.actualDeliveryDate || new Date();
        }

        order.orderTimeline = order.orderTimeline || [];
        order.orderTimeline.push({
          status: statusResult.deliveryStatus,
          timestamp: new Date(),
          comment: statusResult.statusMessage || `Vendor status update: ${statusResult.status}`
        });

        await order.save();
      }

      res.json({ statusResult, order });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error polling vendor status.' });
    }
  }

  // --- COMMISSION & SETTLEMENT ENGINE ---

  public static async adminGetVendorSettlements(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const settlements = await VendorSettlement.find({ vendorId: id }).sort({ createdAt: -1 });
      res.json(settlements);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error fetching settlements.' });
    }
  }

  public static async adminGenerateSettlement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate, cycleDays } = req.body;

      const vendor = await Vendor.findById(id);
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      const settlementDays = cycleDays || vendor.commissionConfig?.settlementCycleDays || 30;

      // Find delivered orders for this vendor in date range that are not yet settled
      const orders = await ShopOrder.find({
        vendorId: vendor._id,
        deliveryStatus: 'delivered',
        settlementStatus: { $ne: 'SETTLED' },
        createdAt: { $gte: start, $lte: end }
      }).sort({ createdAt: 1 });

      const commissionRate = vendor.commissionConfig?.rate ?? 30; // 30% per Arivu agreement
      const gstRate = vendor.commissionConfig?.gstOnCommissionRate ?? 18; // 18% GST on commission
      const passThroughShipping = vendor.commissionConfig?.passThroughShipping ?? true;

      let totalGross = 0;
      let totalPlatformComm = 0;
      let totalGstOnComm = 0;
      let totalPlatformRetention = 0;
      let totalVendorBase = 0;
      let totalShippingPass = 0;
      let totalFinalPayable = 0;

      const lineItems = orders.map((order) => {
        // Listed product price (sum of products belonging to vendor)
        const listedProductPrice = order.products.reduce((acc, p) => acc + (p.price * p.qty), 0);
        
        // Agreement formula:
        // Platform Commission = 30% of listed price
        const platformComm = Number(((listedProductPrice * commissionRate) / 100).toFixed(2));
        // GST on commission = 18% of platform commission
        const gstComm = Number(((platformComm * gstRate) / 100).toFixed(2));
        // Platform Retention = Commission + GST
        const platformRetention = Number((platformComm + gstComm).toFixed(2));
        // Vendor Product Share = Listed price - Platform retention (64.6%)
        const vendorProductShare = Number((listedProductPrice - platformRetention).toFixed(2));
        
        // Shipping: Free above 599, Rs 90 below 599, transferred 100% to Arivu Foods without deduction
        const shippingCollected = order.shippingCharge || 0;
        const shippingTransferred = passThroughShipping ? shippingCollected : 0;
        
        // Gateway fee: 2% + 18% GST (2.36%) borne by customer, 0 deducted from vendor
        const customerGatewayFee = Number(((order.totalAmount * 2.36) / 100).toFixed(2));

        // Net vendor payable for this order
        const netVendorPayable = Number((vendorProductShare + shippingTransferred).toFixed(2));

        totalGross += listedProductPrice;
        totalPlatformComm += platformComm;
        totalGstOnComm += gstComm;
        totalPlatformRetention += platformRetention;
        totalVendorBase += vendorProductShare;
        totalShippingPass += shippingTransferred;
        totalFinalPayable += netVendorPayable;

        return {
          orderId: order._id as any,
          orderNumber: order._id.toString().slice(-6).toUpperCase(),
          orderDate: order.createdAt,
          customerName: order.patientName || 'Customer',
          listedProductPrice,
          platformCommissionRate: commissionRate,
          platformCommission: platformComm,
          gstOnCommission: gstComm,
          totalPlatformRetention: platformRetention,
          vendorProductShare,
          shippingCollected,
          customerGatewayFee,
          netVendorPayable,
          deliveryStatus: order.deliveryStatus || 'delivered'
        };
      });

      const dateStr = start.toISOString().slice(0, 10);
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const settlementCode = `SET-${(vendor.slug || 'ARIVU').toUpperCase()}-${dateStr}-${codeSuffix}`;

      const settlement = new VendorSettlement({
        vendorId: vendor._id,
        settlementCode,
        startDate: start,
        endDate: end,
        cycleDays: settlementDays,
        status: 'DRAFT',
        totalOrdersCount: orders.length,
        eligibleOrdersCount: orders.length,
        grossSales: Number(totalGross.toFixed(2)),
        commissionableAmount: Number(totalGross.toFixed(2)),
        appliedCommissionRate: commissionRate,
        totalPlatformCommission: Number(totalPlatformComm.toFixed(2)),
        gstOnCommission: Number(totalGstOnComm.toFixed(2)),
        totalPlatformRetention: Number(totalPlatformRetention.toFixed(2)),
        shippingPassThrough: Number(totalShippingPass.toFixed(2)),
        vendorBasePayable: Number(totalVendorBase.toFixed(2)),
        refundsAndDeductions: 0,
        finalSettlementAmount: Number(totalFinalPayable.toFixed(2)),
        lineItems,
        orderIds: orders.map((o) => o._id as any),
        notes: `Generated for cycle (${settlementDays} days) per accepted commercial terms. 30% commission, 18% GST on commission, 100% shipping pass-through.`
      });

      await settlement.save();
      res.status(201).json(settlement);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating settlement.' });
    }
  }

  public static async adminFinalizeSettlement(req: Request, res: Response) {
    try {
      const { settlementId } = req.params;
      const settlement = await VendorSettlement.findById(settlementId);
      if (!settlement) return res.status(404).json({ message: 'Settlement not found.' });

      if (settlement.status === 'FINALIZED' || settlement.status === 'PAID') {
        return res.status(400).json({ message: 'Settlement is already finalized or paid.' });
      }

      settlement.status = 'FINALIZED';
      settlement.finalizedAt = new Date();
      settlement.finalizedBy = (req as any).user?.id || undefined;
      await settlement.save();

      // Lock orders and mark settlementStatus as 'SETTLED'
      await ShopOrder.updateMany(
        { _id: { $in: settlement.orderIds } },
        { $set: { settlementStatus: 'SETTLED', settlementId: settlement._id } }
      );

      res.json({ message: 'Settlement finalized successfully and orders locked.', settlement });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error finalizing settlement.' });
    }
  }

  public static async adminExportSettlementCsv(req: Request, res: Response) {
    try {
      const { settlementId } = req.params;
      const settlement = await VendorSettlement.findById(settlementId).populate('vendorId');
      if (!settlement) return res.status(404).json({ message: 'Settlement not found.' });

      const headers = [
        'Order ID',
        'Date',
        'Customer',
        'Listed Product Price (INR)',
        'Commission Rate (%)',
        'Platform Commission (INR)',
        'GST on Commission 18% (INR)',
        'Total Platform Retention (INR)',
        'Vendor Product Share (INR)',
        'Shipping Pass-Through (INR)',
        'Net Vendor Payable (INR)',
        'Status'
      ];

      const rows = settlement.lineItems.map((item) => [
        item.orderNumber,
        new Date(item.orderDate).toLocaleDateString(),
        `"${item.customerName.replace(/"/g, '""')}"`,
        item.listedProductPrice.toFixed(2),
        `${item.platformCommissionRate}%`,
        item.platformCommission.toFixed(2),
        item.gstOnCommission.toFixed(2),
        item.totalPlatformRetention.toFixed(2),
        item.vendorProductShare.toFixed(2),
        item.shippingCollected.toFixed(2),
        item.netVendorPayable.toFixed(2),
        item.deliveryStatus
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${settlement.settlementCode}.csv"`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error exporting CSV.' });
    }
  }

  public static async adminGetVendorSyncLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const logs = await VendorSyncLog.find({ vendorId: id }).sort({ createdAt: -1 }).limit(50);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error fetching sync logs.' });
    }
  }

  // --- SEED VENDORS (ARIVU FOODS + FUTURE VENDOR PLACEHOLDERS) ---

  public static async adminSeedVendors(req: Request, res: Response) {
    try {
      // 1. Check or create Arivu Foods
      let arivu = await Vendor.findOne({ slug: 'arivu-foods' });
      if (!arivu) {
        const passwordHash = await bcrypt.hash('Arivu@2026Mito', 10);
        arivu = new Vendor({
          name: 'Arivu Foods',
          slug: 'arivu-foods',
          email: 'support@arivufoods.com',
          passwordHash,
          phone: '+91 98450 12345',
          logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
          website: 'https://www.arivufoods.com',
          businessName: 'Arivu Natural Foods Private Limited',
          licenseNumber: 'FSSAI: 11223333000542',
          taxId: '29ABCDE1234F1Z5',
          businessAddress: 'Plot 42, Peenya Industrial Area, Bangalore 560058, Karnataka',
          commissionType: 'PERCENTAGE',
          commissionValue: 30,
          capabilities: {
            productType: 'MULTIPLE',
            productSyncMethod: 'API',
            checkoutType: 'INTERNAL',
            fulfillmentType: 'API',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'API_POLLING'
          },
          commissionConfig: {
            rate: 30,
            type: 'PERCENTAGE',
            gstOnCommissionRate: 18,
            settlementCycleDays: 30, // Note: Clause 13 says 15, Schedule A says 30
            customerPaysGatewayFee: true,
            passThroughShipping: true,
            minFreeShippingOrderValue: 599,
            standardShippingFee: 90
          },
          apiConfig: {
            baseUrl: 'https://api.arivufoods.com/v1',
            apiKey: 'arivu_live_mock_key_998124',
            mockMode: true,
            lastSyncStatus: 'IDLE',
            healthStatus: 'HEALTHY',
            endpoints: {
              catalogSync: '/catalog/products',
              orderSubmit: '/orders/submit',
              orderStatus: '/orders/:id/status',
              shipmentTracking: '/orders/:id/tracking',
              cancelOrder: '/orders/:id/cancel'
            }
          },
          agreementNotes:
            'Accepted Agreement 02.09.2026: 30% commission on listed product price. 18% GST on commission. Shipping free >=599, ₹90 <599 (100% transferred to Arivu). Payment gateway fee (2.36%) borne by customer. Settlement cycle: Clause 13 mentions 15 days, Schedule A mentions 30 days (defaulting to 30 days, configurable).',
          isActive: true
        });
        await arivu.save();

        // Perform initial catalog sync for Arivu Foods
        const adapter = VendorAdapterFactory.getAdapter(arivu);
        await adapter.syncProducts(arivu);
      }

      // 2. Future Vendor Stubs (Babu, Oncocur, Wig, Genomics, Pure and Pure, Swasa Products)
      const futureVendors = [
        {
          name: 'Babu',
          slug: 'babu',
          email: 'babu@partner.mitoreboot.com',
          businessName: 'Babu Health Products',
          capabilities: {
            productType: 'SINGLE',
            productSyncMethod: 'MANUAL',
            checkoutType: 'INTERNAL',
            fulfillmentType: 'MANUAL',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'MANUAL'
          },
          commissionConfig: { rate: 20, type: 'PERCENTAGE', gstOnCommissionRate: 18, settlementCycleDays: 30, customerPaysGatewayFee: true, passThroughShipping: true },
          apiConfig: { mockMode: true, lastSyncStatus: 'IDLE', healthStatus: 'HEALTHY' }
        },
        {
          name: 'Oncocur',
          slug: 'oncocur',
          email: 'contact@oncocur.com',
          businessName: 'Oncocur Therapeutics',
          capabilities: {
            productType: 'SINGLE',
            productSyncMethod: 'MANUAL',
            checkoutType: 'INTERNAL',
            fulfillmentType: 'MANUAL',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'MANUAL'
          },
          commissionConfig: { rate: 25, type: 'PERCENTAGE', gstOnCommissionRate: 18, settlementCycleDays: 30, customerPaysGatewayFee: true, passThroughShipping: true },
          apiConfig: { mockMode: true, lastSyncStatus: 'IDLE', healthStatus: 'HEALTHY' }
        },
        {
          name: 'Wig',
          slug: 'wig',
          email: 'support@wigcare.com',
          businessName: 'Wig Wellness',
          capabilities: {
            productType: 'SINGLE',
            productSyncMethod: 'MANUAL',
            checkoutType: 'INTERNAL',
            fulfillmentType: 'MANUAL',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'MANUAL'
          },
          commissionConfig: { rate: 20, type: 'PERCENTAGE', gstOnCommissionRate: 18, settlementCycleDays: 30, customerPaysGatewayFee: true, passThroughShipping: true },
          apiConfig: { mockMode: true, lastSyncStatus: 'IDLE', healthStatus: 'HEALTHY' }
        },
        {
          name: 'Genomics',
          slug: 'genomics',
          email: 'ops@genomicsindia.com',
          businessName: 'Genomics Health Systems',
          capabilities: {
            productType: 'MULTIPLE',
            productSyncMethod: 'MANUAL',
            checkoutType: 'INTERNAL',
            fulfillmentType: 'API',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'API_POLLING'
          },
          commissionConfig: { rate: 25, type: 'PERCENTAGE', gstOnCommissionRate: 18, settlementCycleDays: 30, customerPaysGatewayFee: true, passThroughShipping: true },
          apiConfig: { mockMode: true, lastSyncStatus: 'IDLE', healthStatus: 'HEALTHY' }
        },
        {
          name: 'Pure and Pure',
          slug: 'pure-and-pure',
          email: 'partner@pureandpure.com',
          businessName: 'Pure and Pure Naturals',
          capabilities: {
            productType: 'SINGLE',
            productSyncMethod: 'MANUAL',
            checkoutType: 'EXTERNAL_AMAZON',
            fulfillmentType: 'VENDOR_PORTAL',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'MANUAL'
          },
          commissionConfig: { rate: 0, type: 'PERCENTAGE', gstOnCommissionRate: 18, settlementCycleDays: 30, customerPaysGatewayFee: false, passThroughShipping: false },
          apiConfig: { mockMode: true, lastSyncStatus: 'IDLE', healthStatus: 'HEALTHY' },
          externalStoreUrl: 'https://www.amazon.in/dp/B08XYZ1234'
        },
        {
          name: 'Swasa Products',
          slug: 'swasa-products',
          email: 'sales@swasaproducts.com',
          businessName: 'Swasa Respiratory & Herbal Care',
          capabilities: {
            productType: 'MULTIPLE',
            productSyncMethod: 'MANUAL',
            checkoutType: 'EXTERNAL_AMAZON',
            fulfillmentType: 'VENDOR_PORTAL',
            deliveryManagedBy: 'VENDOR',
            trackingMethod: 'MANUAL'
          },
          commissionConfig: { rate: 0, type: 'PERCENTAGE', gstOnCommissionRate: 18, settlementCycleDays: 30, customerPaysGatewayFee: false, passThroughShipping: false },
          apiConfig: { mockMode: true, lastSyncStatus: 'IDLE', healthStatus: 'HEALTHY' },
          externalStoreUrl: 'https://www.amazon.in/dp/B09ABC5678'
        }
      ];

      for (const fv of futureVendors) {
        const exists = await Vendor.findOne({ slug: fv.slug });
        if (!exists) {
          const pass = await bcrypt.hash('Partner@2026Mito', 10);
          await Vendor.create({
            name: fv.name,
            slug: fv.slug,
            email: fv.email,
            passwordHash: pass,
            businessName: fv.businessName,
            commissionType: fv.commissionConfig.type,
            commissionValue: fv.commissionConfig.rate,
            capabilities: fv.capabilities,
            commissionConfig: fv.commissionConfig,
            apiConfig: fv.apiConfig,
            externalStoreUrl: fv.externalStoreUrl || '',
            isActive: true
          });
        }
      }

      res.json({ message: 'Arivu Foods and future vendor architectural records seeded successfully.' });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error seeding vendors.' });
    }
  }

  // --- PRESERVED EXISTING METHODS ---

  public static async adminAssignOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { vendorId } = req.body;
      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      order.vendorId = vendorId || undefined;
      order.deliveryStatus = vendorId ? 'assigned' : 'pending';

      if (vendorId) {
        const vendor = await Vendor.findById(vendorId);
        if (vendor) {
          const listedProductPrice = order.products.reduce((acc, p) => acc + (p.price * p.qty), 0);
          const commissionRate = vendor.commissionConfig?.rate ?? (vendor.commissionValue || 30);
          const gstRate = vendor.commissionConfig?.gstOnCommissionRate ?? 18;

          const platformComm = (listedProductPrice * commissionRate) / 100;
          const gstComm = (platformComm * gstRate) / 100;
          const totalRetention = platformComm + gstComm;
          const vendorShare = listedProductPrice - totalRetention;
          const shipping = vendor.commissionConfig?.passThroughShipping ? (order.shippingCharge || 0) : 0;
          const finalPayable = vendorShare + shipping;

          order.platformCommission = totalRetention;
          order.vendorEarnings = finalPayable;
          order.financialBreakdown = {
            listedProductPrice,
            platformCommissionRate: commissionRate,
            platformCommission: platformComm,
            gstOnCommissionRate: gstRate,
            gstOnCommission: gstComm,
            totalPlatformRetention: totalRetention,
            vendorProductShare: vendorShare,
            shippingCharge: order.shippingCharge || 0,
            customerGatewayCharge: (order.totalAmount * 2.36) / 100,
            finalVendorPayable: finalPayable
          };
        }
      }

      const statusLabel = vendorId ? 'assigned' : 'pending';
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: statusLabel,
        timestamp: new Date(),
        comment: vendorId ? 'Order assigned to vendor for fulfillment' : 'Order marked as pending review'
      });

      await order.save();

      if (vendorId) {
        EmailService.sendOrderEmail('assigned', order._id.toString()).catch(console.error);
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error assigning order.' });
    }
  }

  public static async adminGetVendorPerformance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orders = await ShopOrder.find({ vendorId: id });

      const totalAssigned = orders.length;
      const deliveredOrders = orders.filter((o) => o.deliveryStatus === 'delivered');
      const totalDelivered = deliveredOrders.length;
      const totalCancelled = orders.filter((o) => o.deliveryStatus === 'cancelled').length;

      const totalRevenue = deliveredOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

      let totalFulfillmentTimeHours = 0;
      let fulfillmentCount = 0;

      deliveredOrders.forEach((order) => {
        const assignedStep = order.orderTimeline?.find((t) => t.status === 'assigned');
        const deliveredStep = order.orderTimeline?.find((t) => t.status === 'delivered') || {
          timestamp: order.deliveryDate
        };

        if (assignedStep && deliveredStep && deliveredStep.timestamp) {
          const diffMs = new Date(deliveredStep.timestamp).getTime() - new Date(assignedStep.timestamp).getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          totalFulfillmentTimeHours += diffHours;
          fulfillmentCount++;
        }
      });

      const avgFulfillmentTimeHours =
        fulfillmentCount > 0 ? (totalFulfillmentTimeHours / fulfillmentCount).toFixed(1) : 'N/A';

      res.json({
        totalAssigned,
        totalDelivered,
        totalCancelled,
        totalRevenue,
        avgFulfillmentTimeHours,
        cancelRate: totalAssigned > 0 ? ((totalCancelled / totalAssigned) * 100).toFixed(1) + '%' : '0%'
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error calculating vendor performance.' });
    }
  }

  public static async vendorLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const vendor = await Vendor.findOne({ email });
      if (!vendor || vendor.isDeleted || !vendor.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or inactive account.' });
      }

      const isMatch = await bcrypt.compare(password, vendor.passwordHash);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

      const token = jwt.sign(
        { id: vendor._id, email: vendor.email, role: 'Vendor' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        vendor: {
          id: vendor._id,
          name: vendor.name,
          slug: vendor.slug,
          email: vendor.email,
          businessName: vendor.businessName,
          licenseNumber: vendor.licenseNumber,
          taxId: vendor.taxId
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error logging in.' });
    }
  }

  public static async getVendorOrders(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const orders = await ShopOrder.find({ vendorId })
        .populate('userId', 'name email mobileNumber')
        .sort({ updatedAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching vendor orders.' });
    }
  }

  public static async vendorDashboard(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const orders = await ShopOrder.find({ vendorId });

      const deliveredOrders = orders.filter((o) => o.deliveryStatus === 'delivered');
      const grossSales = deliveredOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const totalCommission = deliveredOrders.reduce((acc, curr) => acc + (curr.platformCommission || 0), 0);
      const netEarnings = deliveredOrders.reduce(
        (acc, curr) =>
          acc +
          (curr.vendorEarnings !== undefined
            ? curr.vendorEarnings
            : curr.totalAmount - (curr.platformCommission || 0)),
        0
      );

      const stats = {
        totalOrders: orders.length,
        pending: orders.filter((o) => o.deliveryStatus === 'assigned').length,
        processing: orders.filter((o) => o.deliveryStatus === 'accepted').length,
        packed: orders.filter((o) => o.deliveryStatus === 'packed').length,
        shipped: orders.filter((o) => o.deliveryStatus === 'shipped').length,
        delivered: deliveredOrders.length,
        cancelled: orders.filter((o) => o.deliveryStatus === 'cancelled').length,
        grossSales,
        totalCommission,
        netEarnings,
        revenue: netEarnings
      };

      const recentOrders = await ShopOrder.find({ vendorId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({ stats, recentOrders });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating vendor dashboard.' });
    }
  }

  public static async updateOrderStatus(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;
      const { deliveryStatus, comment } = req.body;

      const order = await ShopOrder.findOne({ _id: orderId, vendorId }).populate('userId');
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.deliveryStatus = deliveryStatus;

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: deliveryStatus,
        timestamp: new Date(),
        comment: comment || `Status updated to ${deliveryStatus}`
      });

      if (deliveryStatus === 'delivered') {
        order.deliveryDate = new Date();
        try {
          const invoiceUrl = await InvoiceService.generateInvoicePDF(order);
          order.invoiceUrl = invoiceUrl;
        } catch (pdfErr) {
          console.error('Failed to generate invoice PDF:', pdfErr);
        }
      }

      await order.save();

      const targetUserId = (order.userId as any)?._id
        ? (order.userId as any)._id.toString()
        : order.userId?.toString();

      if (deliveryStatus === 'delivered') {
        EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);
        if (targetUserId) {
          FCMService.sendNotificationToUser(targetUserId, {
            title: 'Order Delivered',
            body: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered successfully!`,
            type: 'OrderDelivered',
            data: { route: 'Shop Orders', orderId: order._id.toString() }
          }).catch(console.error);
        }
      } else if (deliveryStatus === 'shipped' || deliveryStatus === 'out_for_delivery') {
        EmailService.sendOrderEmail('shipped', order._id.toString()).catch(console.error);
        if (targetUserId) {
          FCMService.sendNotificationToUser(targetUserId, {
            title: 'Order Shipped',
            body: `Great news! Your order #${order._id.toString().slice(-6).toUpperCase()} has been shipped.`,
            type: 'OrderShipped',
            data: { route: 'Shop Orders', orderId: order._id.toString() }
          }).catch(console.error);
        }
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error updating order status.' });
    }
  }

  public static async uploadTrackingDetails(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;
      const { courierName, trackingId, trackingUrl } = req.body;

      if (!courierName || !trackingId) {
        return res.status(400).json({ message: 'Courier name and tracking ID are required.' });
      }

      const order = await ShopOrder.findOne({ _id: orderId, vendorId });
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.trackingDetails = {
        courierName,
        trackingId,
        trackingUrl: trackingUrl || ''
      };

      order.deliveryStatus = 'shipped';
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'shipped',
        timestamp: new Date(),
        comment: `Shipped via ${courierName}. Tracking ID: ${trackingId}`
      });

      await order.save();
      EmailService.sendOrderEmail('shipped', order._id.toString()).catch(console.error);

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error uploading tracking details.' });
    }
  }

  public static async confirmDelivery(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { orderId } = req.params;

      const order = await ShopOrder.findOne({ _id: orderId, vendorId }).populate('userId');
      if (!order) return res.status(404).json({ message: 'Order not found or unauthorized.' });

      order.deliveryStatus = 'delivered';
      order.deliveryDate = new Date();

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'delivered',
        timestamp: new Date(),
        comment: 'Order delivered successfully.'
      });

      try {
        const invoiceUrl = await InvoiceService.generateInvoicePDF(order);
        order.invoiceUrl = invoiceUrl;
      } catch (pdfErr) {
        console.error('Failed to generate invoice PDF:', pdfErr);
      }

      await order.save();
      EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error confirming delivery.' });
    }
  }

  /**
   * Real-time Vendor Webhook Listener (Vendor pushes tracking & delivery status directly to our app)
   * e.g., POST /api/vendors/webhook/:slug
   */
  public static async handleVendorWebhook(req: Request, res: Response) {
    const startTime = Date.now();
    try {
      const { slug } = req.params;
      const vendor = await Vendor.findOne({ slug });
      if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

      const {
        vendorOrderId,
        mitoOrderId,
        status,
        deliveryStatus: incomingDeliveryStatus,
        courierName,
        trackingNumber,
        trackingUrl,
        estimatedDeliveryDate,
        statusMessage
      } = req.body;

      if (!vendorOrderId && !mitoOrderId) {
        return res.status(400).json({ message: 'Either vendorOrderId or mitoOrderId is required.' });
      }

      // Find order by vendorOrderId or _id
      const query: any = {};
      if (mitoOrderId) {
        query._id = mitoOrderId;
      } else {
        query.vendorOrderId = vendorOrderId;
      }

      const order = await ShopOrder.findOne(query);
      if (!order) return res.status(404).json({ message: 'Order not found in MitoReboot.' });

      // Map vendor status to deliveryStatus
      const rawStatus = (status || '').toUpperCase();
      let newDeliveryStatus = incomingDeliveryStatus;
      if (!newDeliveryStatus) {
        if (rawStatus === 'DELIVERED') newDeliveryStatus = 'delivered';
        else if (rawStatus === 'SHIPPED') newDeliveryStatus = 'shipped';
        else if (rawStatus === 'OUT_FOR_DELIVERY') newDeliveryStatus = 'out_for_delivery';
        else if (rawStatus === 'PACKED') newDeliveryStatus = 'packed';
        else if (rawStatus === 'PROCESSING' || rawStatus === 'ACCEPTED') newDeliveryStatus = 'processing';
        else if (rawStatus === 'CANCELLED') newDeliveryStatus = 'cancelled';
        else newDeliveryStatus = order.deliveryStatus || 'processing';
      }

      order.vendorOrderStatus = rawStatus || order.vendorOrderStatus;
      order.deliveryStatus = newDeliveryStatus;
      if (statusMessage) order.vendorStatusMessage = statusMessage;
      if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);

      if (trackingNumber || courierName || trackingUrl) {
        order.trackingDetails = {
          courierName: courierName || order.trackingDetails?.courierName || 'Blue Dart Express',
          trackingId: trackingNumber || order.trackingDetails?.trackingId || '',
          trackingUrl: trackingUrl || order.trackingDetails?.trackingUrl || ''
        };
      }

      if (newDeliveryStatus === 'delivered' && !order.deliveryDate) {
        order.deliveryDate = new Date();
        try {
          const invoiceUrl = await InvoiceService.generateInvoicePDF(order);
          order.invoiceUrl = invoiceUrl;
        } catch (e) {
          console.error('Invoice generation failed during webhook:', e);
        }
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: newDeliveryStatus,
        timestamp: new Date(),
        comment: statusMessage || `Live status from ${vendor.name} API: ${rawStatus}`
      });

      await order.save();

      // Send Push Notification to user
      const notifType: NotificationType = newDeliveryStatus === 'delivered' ? 'OrderDelivered' : 'OrderShipped';
      FCMService.sendNotificationToUser(order.userId.toString(), {
        title: `Order Update from ${vendor.name}`,
        body: statusMessage || `Your order #${order._id.toString().slice(-6).toUpperCase()} status is now: ${newDeliveryStatus.toUpperCase()}`,
        type: notifType,
        data: {
          route: 'Shop Orders',
          orderId: order._id.toString(),
          trackingNumber: order.trackingDetails?.trackingId || ''
        }
      }).catch(console.error);

      // Audit Log
      await VendorSyncLog.create({
        vendorId: vendor._id,
        vendorSlug: vendor.slug || slug,
        action: 'WEBHOOK_UPDATE',
        status: 'SUCCESS',
        isMock: false,
        requestPayload: req.body,
        responsePayload: { success: true, orderId: order._id, newDeliveryStatus },
        durationMs: Date.now() - startTime
      });

      res.json({ success: true, message: 'Vendor status update processed successfully', orderId: order._id });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error processing vendor webhook.' });
    }
  }

  /**
   * Patient Live Order Tracking: Fetches real-time status & courier tracking directly from the vendor's API
   * e.g., GET /patient/orders/:id/track
   */
  public static async getPatientOrderTracking(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const order = await ShopOrder.findOne({ _id: id, userId }).populate('vendorId');
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      // If this is a vendor order and has a vendorOrderId, query vendor API for the latest tracking
      let liveVendorData: any = null;
      if (order.vendorId) {
        const vendor = order.vendorId as any;
        if (order.vendorOrderId) {
          try {
            const adapter = VendorAdapterFactory.getAdapter(vendor);
            const statusResult = await adapter.getOrderStatus(vendor, order.vendorOrderId);

            if (statusResult.success) {
              order.vendorOrderStatus = statusResult.status;
              order.deliveryStatus = statusResult.deliveryStatus;
              if (statusResult.statusMessage) order.vendorStatusMessage = statusResult.statusMessage;
              if (statusResult.estimatedDeliveryDate) order.estimatedDeliveryDate = statusResult.estimatedDeliveryDate;

              if (statusResult.trackingNumber) {
                order.trackingDetails = {
                  courierName: statusResult.courierName || order.trackingDetails?.courierName || 'Blue Dart Express',
                  trackingId: statusResult.trackingNumber,
                  trackingUrl: statusResult.trackingUrl || order.trackingDetails?.trackingUrl || ''
                };
              }

              if (statusResult.deliveryStatus === 'delivered' && !order.deliveryDate) {
                order.deliveryDate = statusResult.actualDeliveryDate || new Date();
              }

              await order.save();
              liveVendorData = statusResult;
            }
          } catch (adapterErr: any) {
            console.error('Error fetching live tracking from vendor API:', adapterErr.message);
          }
        }
      }

      const vendor = order.vendorId as any;
      res.json({
        orderId: order._id,
        isVendorManaged: Boolean(order.vendorId),
        vendorName: vendor?.name || 'In-House Store',
        vendorSlug: vendor?.slug || 'mitoreboot',
        vendorOrderId: order.vendorOrderId || null,
        vendorOrderStatus: order.vendorOrderStatus || null,
        deliveryStatus: order.deliveryStatus || 'processing',
        courierName: order.trackingDetails?.courierName || null,
        trackingNumber: order.trackingDetails?.trackingId || null,
        trackingUrl: order.trackingDetails?.trackingUrl || null,
        vendorStatusMessage: order.vendorStatusMessage || liveVendorData?.statusMessage || null,
        estimatedDeliveryDate: order.estimatedDeliveryDate || liveVendorData?.estimatedDeliveryDate || null,
        deliveryDate: order.deliveryDate || null,
        orderTimeline: order.orderTimeline || [],
        shippingAddress: order.shippingAddress,
        patientName: order.patientName
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error retrieving live order tracking.' });
    }
  }
}
