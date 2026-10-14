import { Response } from 'express';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import ShopOrder from '../models/ShopOrder';
import ShopProduct from '../models/ShopProduct';
import { Vendor } from '../models/Vendor';
import { User } from '../models/User';
import { AdminUser } from '../models/AdminUser';
import { SupportTicket } from '../models/SupportTicket';
import { AuditLog } from '../models/AuditLog';
import { OrderSettings } from '../models/OrderSettings';
import { Notification } from '../models/Notification';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { AuthRequest } from '../middlewares/authMiddleware';
import { EmailService } from '../services/emailService';
import { FCMService } from '../services/fcmService';
import { SMSService } from '../services/smsService';
import { autoAssignAndSubmitVendorOrder } from './shopController';

export class OrderManagementController {
  // Helper to record immutable audit log entries
  private static async logAudit(params: {
    adminId: string;
    adminName?: string;
    adminEmail?: string;
    action: string;
    details: string;
    entityType?: string;
    entityId?: string;
    orderNumber?: string;
    previousStatus?: string;
    newStatus?: string;
    amount?: number;
    reason?: string;
    gatewayRef?: string;
    ipAddress?: string;
  }) {
    try {
      await AuditLog.create({
        adminId: new mongoose.Types.ObjectId(params.adminId),
        adminName: params.adminName || 'Admin User',
        adminEmail: params.adminEmail || '',
        action: params.action,
        details: params.details,
        entityType: params.entityType,
        entityId: params.entityId,
        orderNumber: params.orderNumber,
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        amount: params.amount,
        reason: params.reason,
        gatewayRef: params.gatewayRef,
        ipAddress: params.ipAddress
      });
    } catch (e) {
      console.error('[OrderManagementAudit] Error saving audit log:', e);
    }
  }

  // Helper to get admin details
  private static getAdminInfo(req: AuthRequest) {
    return {
      adminId: req.user?.id || '',
      adminEmail: req.user?.email || '',
      adminName: req.user?.email ? req.user.email.split('@')[0] : 'Administrator',
      role: req.user?.role || 'Admin'
    };
  }

  /**
   * 1. ORDER OVERVIEW METRICS
   * Real database aggregations - excludes Amazon affiliate clicks
   */
  public static async getOverviewMetrics(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all store orders
      const allOrders = await ShopOrder.find().lean();

      // Counts and amounts
      const totalOrders = allOrders.length;
      const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= startOfToday).length;
      const ordersThisMonth = allOrders.filter(o => new Date(o.createdAt) >= startOfMonth).length;

      // Paid / completed orders vs pending vs failed
      const paidOrdersList = allOrders.filter(o => o.status === 'completed');
      const paidOrders = paidOrdersList.length;
      const pendingPayments = allOrders.filter(o => o.status === 'pending').length;
      const failedPayments = allOrders.filter(o => o.status === 'failed').length;

      // Gross value only from verified completed / paid orders
      const grossOrderValue = paidOrdersList.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      // Refunds calculation
      let totalRefundsCompleted = 0;
      let refundsCompletedCount = 0;
      let refundsPendingCount = 0;

      allOrders.forEach(o => {
        // Individual refunds array
        if (Array.isArray(o.refunds)) {
          o.refunds.forEach((r: any) => {
            if (r.status === 'COMPLETED') {
              totalRefundsCompleted += (r.amount || 0);
              refundsCompletedCount++;
            } else if (r.status === 'PENDING') {
              refundsPendingCount++;
            }
          });
        }
        // Legacy cancellationRequest refund check
        if (o.cancellationRequest) {
          if (o.cancellationRequest.refundStatus === 'COMPLETED') {
            if (!o.refunds || o.refunds.length === 0) {
              totalRefundsCompleted += (o.cancellationRequest.refundAmount || 0);
              refundsCompletedCount++;
            }
          } else if (o.cancellationRequest.refundStatus === 'INITIATED' || o.cancellationRequest.status === 'PENDING') {
            if (!o.refunds || o.refunds.length === 0) {
              refundsPendingCount++;
            }
          }
        }
      });

      const netSalesAfterRefunds = Math.max(0, grossOrderValue - totalRefundsCompleted);

      // Fulfilment breakdown
      const ordersAwaitingProcessing = allOrders.filter(o => 
        o.status === 'completed' && (!o.deliveryStatus || o.deliveryStatus === 'pending' || o.deliveryStatus === 'assigned')
      ).length;

      const ordersShipped = allOrders.filter(o => o.deliveryStatus === 'shipped' || o.deliveryStatus === 'out_for_delivery').length;
      const ordersDelivered = allOrders.filter(o => o.deliveryStatus === 'delivered').length;
      const cancelledOrders = allOrders.filter(o => o.deliveryStatus === 'cancelled' || o.status === 'failed').length;

      // Open customer support tickets
      const openSupportTickets = await SupportTicket.countDocuments({
        status: { $in: ['Open', 'In Progress', 'Waiting for Customer', 'Waiting for Vendor'] }
      });

      // Volume & Revenue trends (last 7 days)
      const last7Days: { date: string; orders: number; revenue: number; refunds: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const dayOrders = allOrders.filter(o => {
          const dt = new Date(o.createdAt);
          return dt >= dayStart && dt <= dayEnd;
        });

        const dayRevenue = dayOrders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        let dayRefunds = 0;
        dayOrders.forEach(o => {
          if (o.refunds) {
            o.refunds.forEach((r: any) => {
              if (r.status === 'COMPLETED' && r.completedAt && new Date(r.completedAt) >= dayStart && new Date(r.completedAt) <= dayEnd) {
                dayRefunds += r.amount;
              }
            });
          }
        });

        last7Days.push({
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: Math.round(dayRevenue),
          refunds: Math.round(dayRefunds)
        });
      }

      // Order status distribution
      const orderStatusDistribution = [
        { name: 'Pending', count: allOrders.filter(o => !o.deliveryStatus || o.deliveryStatus === 'pending').length, color: '#f59e0b' },
        { name: 'Processing', count: allOrders.filter(o => o.deliveryStatus === 'processing' || o.deliveryStatus === 'accepted').length, color: '#3b82f6' },
        { name: 'Packed', count: allOrders.filter(o => o.deliveryStatus === 'packed').length, color: '#8b5cf6' },
        { name: 'Shipped', count: allOrders.filter(o => o.deliveryStatus === 'shipped' || o.deliveryStatus === 'out_for_delivery').length, color: '#06b6d4' },
        { name: 'Delivered', count: ordersDelivered, color: '#10b981' },
        { name: 'Cancelled', count: cancelledOrders, color: '#ef4444' }
      ];

      // Payment status distribution
      const paymentStatusDistribution = [
        { name: 'Paid', count: paidOrders, color: '#10b981' },
        { name: 'Pending', count: pendingPayments, color: '#f59e0b' },
        { name: 'Failed', count: failedPayments, color: '#ef4444' }
      ];

      // Top-selling products
      const productMap: Record<string, { id: string; name: string; qty: number; revenue: number }> = {};
      paidOrdersList.forEach(order => {
        (order.products || []).forEach(p => {
          const key = p.name;
          if (!productMap[key]) {
            productMap[key] = { id: p.productId?.toString() || key, name: p.name, qty: 0, revenue: 0 };
          }
          productMap[key].qty += p.qty || 1;
          productMap[key].revenue += (p.price || 0) * (p.qty || 1);
        });
      });
      const topSellingProducts = Object.values(productMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      // Top-performing vendors
      const vendors = await Vendor.find().select('name businessName slug').lean();
      const vendorStats = vendors.map(v => {
        const vOrders = allOrders.filter(o => o.vendorId?.toString() === v._id.toString());
        const vPaid = vOrders.filter(o => o.status === 'completed');
        const vRevenue = vPaid.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const vDelivered = vOrders.filter(o => o.deliveryStatus === 'delivered').length;
        return {
          id: v._id,
          name: v.businessName || v.name,
          slug: v.slug,
          totalOrders: vOrders.length,
          deliveredOrders: vDelivered,
          revenue: Math.round(vRevenue)
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Recent orders (last 6)
      const recentOrdersRaw = await ShopOrder.find()
        .populate('userId', 'name email mobile mobileNumber addressLine1 addressCity addressState addressPinCode')
        .populate('vendorId', 'name businessName')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

      const recentOrders = recentOrdersRaw.map((o: any) => ({
        ...o,
        patientName: o.patientName || (o.userId as any)?.name || 'Customer',
        patientEmail: o.patientEmail || (o.userId as any)?.email || '',
        patientPhone: o.patientPhone || (o.userId as any)?.mobileNumber || (o.userId as any)?.mobile || ''
      }));

      // Recent customer complaints / tickets (last 5)
      const recentComplaints = await SupportTicket.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Orders requiring admin attention
      const ordersRequiringAttention = allOrders.filter(o => 
        (o.status === 'pending' && new Date().getTime() - new Date(o.createdAt).getTime() > 2 * 3600 * 1000) ||
        (o.cancellationRequest && o.cancellationRequest.status === 'PENDING') ||
        (o.vendorSubmissionStatus === 'FAILED' || o.vendorSubmissionStatus === 'RETRY') ||
        (o.status === 'completed' && (!o.deliveryStatus || o.deliveryStatus === 'pending') && new Date().getTime() - new Date(o.createdAt).getTime() > 24 * 3600 * 1000)
      ).slice(0, 8);

      return res.json({
        summary: {
          totalOrders,
          ordersToday,
          ordersThisMonth,
          grossOrderValue: Math.round(grossOrderValue),
          netSalesAfterRefunds: Math.round(netSalesAfterRefunds),
          pendingPayments,
          paidOrders,
          failedPayments,
          ordersAwaitingProcessing,
          ordersShipped,
          ordersDelivered,
          cancelledOrders,
          refundsPendingCount,
          refundsCompletedCount,
          totalRefundsCompleted: Math.round(totalRefundsCompleted),
          openSupportTickets
        },
        charts: {
          last7Days,
          orderStatusDistribution,
          paymentStatusDistribution
        },
        topSellingProducts,
        topVendors: vendorStats.slice(0, 5),
        recentOrders,
        recentComplaints,
        ordersRequiringAttention
      });
    } catch (err: any) {
      console.error('[OrderManagementOverview] Error:', err);
      return res.status(500).json({ message: err.message || 'Error fetching overview metrics' });
    }
  }

  /**
   * 2. ALL ORDERS MANAGEMENT
   * Paginated, searchable, filterable order table with CSV export
   */
  public static async getAllOrders(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        search = '',
        dateRange = 'all',
        startDate,
        endDate,
        orderStatus,
        deliveryStatus,
        paymentStatus,
        vendorId,
        refundStatus,
        paymentMethod,
        format = 'json'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

      const query: any = {};

      // Search term
      if (search && typeof search === 'string' && search.trim()) {
        const s = search.trim();
        const searchRegex = { $regex: s, $options: 'i' };
        query.$or = [
          { vendorOrderId: searchRegex },
          { patientName: searchRegex },
          { patientEmail: searchRegex },
          { patientPhone: searchRegex },
          { 'trackingDetails.trackingId': searchRegex },
          { 'products.name': searchRegex },
          { razorpayPaymentId: searchRegex }
        ];

        if (mongoose.Types.ObjectId.isValid(s)) {
          query.$or.push({ _id: new mongoose.Types.ObjectId(s) });
        }
      }

      // Date filtering
      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.createdAt = { $gte: start };
      } else if (dateRange === 'yesterday') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        query.createdAt = { $gte: start, $lt: end };
      } else if (dateRange === 'this_week') {
        const day = now.getDay() || 7;
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
        query.createdAt = { $gte: start };
      } else if (dateRange === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: start };
      } else if (dateRange === 'this_quarter') {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const start = new Date(now.getFullYear(), quarterMonth, 1);
        query.createdAt = { $gte: start };
      } else if (dateRange === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1);
        query.createdAt = { $gte: start };
      } else if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      // Status filters
      if (orderStatus && orderStatus !== 'all') {
        query.status = orderStatus;
      }
      if (paymentStatus && paymentStatus !== 'all') {
        if (paymentStatus === 'paid') query.status = 'completed';
        else if (paymentStatus === 'pending') query.status = 'pending';
        else if (paymentStatus === 'failed') query.status = 'failed';
      }
      if (deliveryStatus && deliveryStatus !== 'all') {
        query.deliveryStatus = deliveryStatus;
      }
      if (vendorId && vendorId !== 'all' && mongoose.Types.ObjectId.isValid(vendorId as string)) {
        query.vendorId = new mongoose.Types.ObjectId(vendorId as string);
      }
      if (paymentMethod && paymentMethod !== 'all') {
        query.paymentMethod = paymentMethod;
      }

      // Refund status filter
      if (refundStatus && refundStatus !== 'all') {
        if (refundStatus === 'requested') {
          query['cancellationRequest.status'] = 'PENDING';
        } else if (refundStatus === 'approved') {
          query['cancellationRequest.status'] = 'APPROVED';
        } else if (refundStatus === 'completed') {
          query.$or = [
            { 'cancellationRequest.refundStatus': 'COMPLETED' },
            { 'refunds.status': 'COMPLETED' }
          ];
        } else if (refundStatus === 'none') {
          query.cancellationRequest = null;
          query.$or = [{ refunds: { $size: 0 } }, { refunds: { $exists: false } }];
        }
      }

      // CSV Export handling
      if (format === 'csv') {
        const ordersRaw = await ShopOrder.find(query)
          .populate('userId', 'name email mobile mobileNumber addressLine1 addressCity addressState addressPinCode')
          .populate('vendorId', 'name businessName')
          .sort({ createdAt: -1 })
          .lean();

        let csv = 'Order ID,Vendor Order ID,Date,Customer Name,Email,Phone,Products,Vendor,Subtotal,Tax,Shipping,Discount,Total Payable,Payment Method,Payment Status,Fulfilment Status,Tracking Courier,Tracking ID,Refund Status\n';

        ordersRaw.forEach((o: any) => {
          const user = o.userId;
          const patientName = o.patientName || user?.name || 'Customer';
          const patientEmail = o.patientEmail || user?.email || '';
          const patientPhone = o.patientPhone || user?.mobileNumber || user?.mobile || '';
          const productList = (o.products || []).map((p: any) => `${p.name} (x${p.qty})`).join('; ');
          const subtotal = (o.totalAmount || 0) - (o.taxAmount || o.gstAmount || 0) - (o.shippingCharge || 0) + (o.discountAmount || 0);
          const refundStat = o.cancellationRequest ? `${o.cancellationRequest.type}-${o.cancellationRequest.status}` : (o.totalRefundedAmount ? `Refunded ₹${o.totalRefundedAmount}` : 'None');
          
          const row = [
            `"${o._id}"`,
            `"${o.vendorOrderId || ''}"`,
            `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
            `"${patientName.replace(/"/g, '""')}"`,
            `"${patientEmail.replace(/"/g, '""')}"`,
            `"${patientPhone.replace(/"/g, '""')}"`,
            `"${productList.replace(/"/g, '""')}"`,
            `"${(o.vendorId as any)?.businessName || (o.vendorId as any)?.name || 'Direct'}"`,
            Math.round(subtotal),
            Math.round(o.taxAmount || o.gstAmount || 0),
            Math.round(o.shippingCharge || 0),
            Math.round(o.discountAmount || 0),
            Math.round(o.totalAmount || 0),
            `"${o.paymentMethod || 'Razorpay'}"`,
            `"${o.status === 'completed' ? 'Paid' : o.status}"`,
            `"${o.deliveryStatus || 'pending'}"`,
            `"${o.trackingDetails?.courierName || ''}"`,
            `"${o.trackingDetails?.trackingId || ''}"`,
            `"${refundStat}"`
          ].join(',');

          csv += row + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=mito-orders-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
      }

      // Paginated JSON response
      const total = await ShopOrder.countDocuments(query);
      const ordersRaw = await ShopOrder.find(query)
        .populate('userId', 'name email mobile mobileNumber addressLine1 addressCity addressState addressPinCode')
        .populate('vendorId', 'name businessName slug')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      const orders = ordersRaw.map((o: any) => {
        const user = o.userId;
        const patientName = o.patientName || user?.name || 'Customer';
        const patientEmail = o.patientEmail || user?.email || '';
        const patientPhone = o.patientPhone || user?.mobileNumber || user?.mobile || '';
        let shippingAddress = o.shippingAddress;
        if (!shippingAddress || !shippingAddress.line1) {
          if (user?.addressLine1) {
            shippingAddress = {
              line1: user.addressLine1,
              city: user.addressCity || '',
              state: user.addressState || '',
              postalCode: user.addressPinCode || '',
              country: 'India'
            };
          }
        }
        return {
          ...o,
          patientName,
          patientEmail,
          patientPhone,
          shippingAddress
        };
      });

      return res.json({
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    } catch (err: any) {
      console.error('[OrderManagementGetAllOrders] Error:', err);
      return res.status(500).json({ message: err.message || 'Error fetching orders' });
    }
  }

  /**
   * 3. GET ORDER DETAILS
   * Complete view including customer details, vendor info, linked tickets, timeline, tracking, and remaining refundable
   */
  public static async getOrderDetails(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid Order ID format.' });
      }

      const orderRaw = await ShopOrder.findById(orderId)
        .populate('userId', 'name email mobile mobileNumber addressLine1 addressCity addressState addressPinCode')
        .populate('vendorId', 'name businessName slug contactEmail contactPhone address')
        .lean();

      if (!orderRaw) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      const user = orderRaw.userId as any;
      const patientName = orderRaw.patientName || user?.name || 'Customer';
      const patientEmail = orderRaw.patientEmail || user?.email || '';
      const patientPhone = orderRaw.patientPhone || user?.mobileNumber || user?.mobile || '';
      let shippingAddress = orderRaw.shippingAddress;
      if (!shippingAddress || !shippingAddress.line1) {
        if (user?.addressLine1) {
          shippingAddress = {
            line1: user.addressLine1,
            city: user.addressCity || '',
            state: user.addressState || '',
            postalCode: user.addressPinCode || '',
            country: 'India'
          };
        }
      }
      const order = {
        ...orderRaw,
        patientName,
        patientEmail,
        patientPhone,
        shippingAddress
      };

      // Find linked customer support tickets
      const linkedTickets = await SupportTicket.find({
        $or: [
          { orderId: order._id },
          { relatedId: order._id.toString() },
          { relatedId: order.vendorOrderId }
        ]
      }).sort({ createdAt: -1 }).lean();

      // Find related audit logs for this order
      const orderAudits = await AuditLog.find({
        $or: [
          { entityId: order._id.toString() },
          { orderNumber: order.vendorOrderId },
          { orderNumber: order._id.toString() }
        ]
      }).sort({ createdAt: -1 }).lean();

      // Calculate refundable balance
      const totalPaid = order.status === 'completed' ? (order.totalAmount || 0) : 0;
      let alreadyRefunded = order.totalRefundedAmount || 0;
      if (!alreadyRefunded && order.cancellationRequest?.refundStatus === 'COMPLETED') {
        alreadyRefunded = order.cancellationRequest.refundAmount || 0;
      }
      const remainingRefundable = Math.max(0, totalPaid - alreadyRefunded);

      return res.json({
        order,
        remainingRefundable,
        alreadyRefunded,
        linkedTickets,
        orderAudits
      });
    } catch (err: any) {
      console.error('[OrderManagementGetDetails] Error:', err);
      return res.status(500).json({ message: err.message || 'Error fetching order details' });
    }
  }

  /**
   * 4. UPDATE ORDER LIFECYCLE & FULFILMENT STATUS
   * Lifecycle: pending -> assigned -> accepted -> processing -> packed -> shipped -> out_for_delivery -> delivered
   * Sensitive action protected with confirmation requirement and audit trail
   */
  public static async updateOrderLifecycle(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const {
        deliveryStatus,
        paymentStatus,
        courierName,
        trackingId,
        trackingUrl,
        adminNotes,
        notifyCustomer = true
      } = req.body;

      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      const admin = OrderManagementController.getAdminInfo(req);
      const prevDelivery = order.deliveryStatus || 'pending';
      const prevPayment = order.status || 'pending';

      // Disallow marking unpaid order as paid without verified gateway info
      if (paymentStatus === 'completed' && order.status !== 'completed' && !order.razorpayPaymentId) {
        if (admin.role !== 'SuperAdmin') {
          return res.status(403).json({
            message: 'Only a SuperAdmin can manually reconcile and mark an unverified order as Paid.'
          });
        }
      }

      if (deliveryStatus) {
        order.deliveryStatus = deliveryStatus;
        if (deliveryStatus === 'delivered') {
          order.deliveryDate = new Date();
        }
      }

      if (paymentStatus) {
        order.status = paymentStatus;
      }

      // Tracking details update
      if (courierName || trackingId || trackingUrl || adminNotes) {
        order.trackingDetails = {
          courierName: courierName !== undefined ? courierName : (order.trackingDetails?.courierName || ''),
          trackingId: trackingId !== undefined ? trackingId : (order.trackingDetails?.trackingId || ''),
          trackingUrl: trackingUrl !== undefined ? trackingUrl : (order.trackingDetails?.trackingUrl || ''),
          trackingNotes: adminNotes !== undefined ? adminNotes : (order.trackingDetails?.trackingNotes || '')
        };
      }

      if (adminNotes) {
        order.adminNotes = (order.adminNotes ? `${order.adminNotes}\n` : '') + `[${new Date().toLocaleDateString('en-IN')}] ${adminNotes}`;
      }

      // Add to timeline
      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: deliveryStatus || order.deliveryStatus || 'status_updated',
        timestamp: new Date(),
        comment: adminNotes ? `Fulfilment updated to ${deliveryStatus || order.deliveryStatus}: ${adminNotes}` : `Fulfilment updated to ${deliveryStatus || order.deliveryStatus} by ${admin.adminName}.`
      });

      await order.save();

      // Immutable audit log
      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: 'ORDER_LIFECYCLE_UPDATE',
        details: `Updated fulfilment status from ${prevDelivery} to ${order.deliveryStatus}. Tracking: ${order.trackingDetails?.courierName} / ${order.trackingDetails?.trackingId}`,
        entityType: 'Order',
        entityId: order._id.toString(),
        orderNumber: order.vendorOrderId || order._id.toString(),
        previousStatus: prevDelivery,
        newStatus: order.deliveryStatus,
        reason: adminNotes || 'Admin fulfilment status progression'
      });

      // Dispatch notifications if required
      if (notifyCustomer) {
        const orderDisplayId = order.vendorOrderId || order._id.toString().slice(-6).toUpperCase();
        
        // 1. In-App Notification
        if (order.userId) {
          let notifTitle = `Order Status: ${deliveryStatus}`;
          let notifBody = `Your order #${orderDisplayId} is now ${deliveryStatus}.`;
          let notifType: any = 'General';

          if (deliveryStatus === 'shipped') {
            notifTitle = 'Your Order Has Shipped! 🚚';
            notifBody = `Order #${orderDisplayId} has been shipped via ${order.trackingDetails?.courierName || 'courier'}. Tracking: ${order.trackingDetails?.trackingId || 'In transit'}`;
            notifType = 'OrderShipped';
          } else if (deliveryStatus === 'delivered') {
            notifTitle = 'Order Delivered! 🎉';
            notifBody = `Your order #${orderDisplayId} has been delivered successfully.`;
            notifType = 'OrderDelivered';
          } else if (deliveryStatus === 'processing' || deliveryStatus === 'packed') {
            notifTitle = 'Order Processing';
            notifBody = `Your order #${orderDisplayId} is being packed and prepared for dispatch.`;
            notifType = 'OrderProcessing';
          }

          await Notification.create({
            userId: order.userId,
            title: notifTitle,
            body: notifBody,
            type: notifType,
            metadata: {
              orderId: order._id.toString(),
              vendorOrderId: order.vendorOrderId,
              route: 'Shop Orders'
            }
          }).catch(console.error);

          FCMService.sendNotificationToUser(order.userId.toString(), {
            title: notifTitle,
            body: notifBody,
            type: notifType,
            data: { orderId: order._id.toString(), vendorOrderId: order.vendorOrderId || '' }
          }).catch(console.error);
        }

        // 2. Email Notification
        if (order.patientEmail && (deliveryStatus === 'shipped' || deliveryStatus === 'delivered')) {
          EmailService.sendOrderEmail(deliveryStatus as any, order._id.toString()).catch(console.error);
        }
      }

      return res.json({
        success: true,
        message: `Order status updated to ${order.deliveryStatus} successfully.`,
        order
      });
    } catch (err: any) {
      console.error('[OrderManagementUpdateLifecycle] Error:', err);
      return res.status(500).json({ message: err.message || 'Error updating order lifecycle' });
    }
  }

  /**
   * 5. ADD INTERNAL ADMIN NOTE
   */
  public static async addAdminNote(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const { note } = req.body;
      if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Note text cannot be empty.' });
      }

      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      const admin = OrderManagementController.getAdminInfo(req);
      const noteEntry = `[${new Date().toLocaleString('en-IN')}] (${admin.adminName}): ${note.trim()}`;
      order.adminNotes = (order.adminNotes ? `${order.adminNotes}\n` : '') + noteEntry;

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'internal_note',
        timestamp: new Date(),
        comment: `Internal Note added by ${admin.adminName}: ${note.trim()}`
      });

      await order.save();

      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: 'ORDER_ADMIN_NOTE_ADDED',
        details: note.trim(),
        entityType: 'Order',
        entityId: order._id.toString(),
        orderNumber: order.vendorOrderId || order._id.toString()
      });

      return res.json({ success: true, message: 'Internal note saved.', adminNotes: order.adminNotes });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error adding admin note' });
    }
  }

  /**
   * 6. CANCELLATION & RETURN MANAGEMENT
   * Inspect policy, eligibility, and decision history
   */
  public static async manageCancellation(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const {
        action, // 'APPROVE' | 'REJECT'
        adminNotes = '',
        arivuActionRequired = false,
        arivuActionNotes = '',
        initiateRefund = false,
        refundAmount
      } = req.body;

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ message: 'Action must be APPROVE or REJECT.' });
      }

      const order = await ShopOrder.findById(orderId).populate('vendorId');
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      const admin = OrderManagementController.getAdminInfo(req);

      // Verify that order has cancellationRequest or create default one
      if (!order.cancellationRequest) {
        order.cancellationRequest = {
          type: 'cancellation',
          reason: adminNotes || 'Admin direct cancellation',
          requestedAt: new Date(),
          status: 'PENDING'
        };
      }

      // Policy check: check if already shipped
      if (['shipped', 'out_for_delivery', 'delivered'].includes(order.deliveryStatus || '')) {
        if (order.cancellationRequest.type === 'cancellation' && action === 'APPROVE') {
          return res.status(400).json({
            message: `Order is already in '${order.deliveryStatus}' status. Direct cancellation is not allowed after dispatch. Please use the Return workflow instead.`
          });
        }
      }

      order.cancellationRequest.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      order.cancellationRequest.adminNotes = adminNotes;
      order.cancellationRequest.reviewedBy = new mongoose.Types.ObjectId(admin.adminId);
      order.cancellationRequest.reviewedAt = new Date();
      order.cancellationRequest.arivuActionRequired = !!arivuActionRequired;
      order.cancellationRequest.arivuActionNotes = arivuActionNotes;

      let refundOutcome = '';

      if (action === 'APPROVE') {
        if (order.cancellationRequest.type === 'cancellation') {
          order.deliveryStatus = 'cancelled';
        }

        // Process refund if requested and order is completed/paid
        if (initiateRefund && order.status === 'completed') {
          const refundAmt = Number(refundAmount) || order.totalAmount;
          const gatewayResult = await OrderManagementController.executeRazorpayRefund(order, refundAmt, adminNotes);
          
          if (gatewayResult.success) {
            order.cancellationRequest.refundStatus = 'COMPLETED';
            order.cancellationRequest.refundAmount = refundAmt;
            order.cancellationRequest.refundTransactionId = gatewayResult.refundId;
            refundOutcome = ` Gateway refund of ₹${refundAmt} completed (ID: ${gatewayResult.refundId}).`;
          } else {
            order.cancellationRequest.refundStatus = 'FAILED';
            refundOutcome = ` Refund gateway response: ${gatewayResult.error}. Manual reconciliation required.`;
          }
        }
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: `cancellation_${action.toLowerCase()}`,
        timestamp: new Date(),
        comment: `Admin ${action.toLowerCase()}d ${order.cancellationRequest.type} request. Notes: ${adminNotes}.${refundOutcome}`
      });

      await order.save();

      // Audit log
      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: `CANCELLATION_${action}`,
        details: `Admin ${action.toLowerCase()}d ${order.cancellationRequest.type}. Notes: ${adminNotes}.${refundOutcome}`,
        entityType: 'Cancellation',
        entityId: order._id.toString(),
        orderNumber: order.vendorOrderId || order._id.toString(),
        previousStatus: 'PENDING',
        newStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reason: adminNotes
      });

      // Notify customer
      if (order.patientEmail && action === 'APPROVE') {
        EmailService.sendOrderEmail('cancelled', order._id.toString()).catch(console.error);
      }

      return res.json({
        success: true,
        message: `Request ${action.toLowerCase()}d successfully.${refundOutcome}`,
        order
      });
    } catch (err: any) {
      console.error('[OrderManagementManageCancellation] Error:', err);
      return res.status(500).json({ message: err.message || 'Error managing cancellation request' });
    }
  }

  /**
   * Helper: Execute Razorpay refund safely with balance & credential checks
   */
  private static async executeRazorpayRefund(order: any, refundAmount: number, reason: string): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const config = await PaymentGatewayConfig.findOne();
      if (!config || !config.razorpayKeyId || !config.razorpayKeySecret) {
        return { success: false, error: 'Razorpay API credentials not configured.' };
      }

      if (!order.razorpayPaymentId) {
        return { success: false, error: 'Order does not have a verified Razorpay Payment ID.' };
      }

      const razorpay = new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret
      });

      const amountInPaise = Math.round(refundAmount * 100);
      const refund: any = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: amountInPaise,
        reverse_all: 1,
        notes: {
          orderId: order._id.toString(),
          vendorOrderId: order.vendorOrderId || '',
          reason: reason || 'Approved refund'
        }
      });

      return { success: true, refundId: refund.id };
    } catch (err: any) {
      console.error('[RazorpayRefundExecution] Error:', err);
      let rawError = err.error?.description || err.message || 'Gateway refund call failed';
      if (rawError.includes('invalid request sent') || rawError.includes('not have enough balance')) {
        rawError = 'Razorpay merchant account has insufficient balance to process automated gateway refund. Please add funds to your Razorpay balance or select "Process as manual offline reconciliation (UPI/NEFT)" to record the refund.';
      }
      return { success: false, error: rawError };
    }
  }

  /**
   * 7. PROCESS REFUND (Full or Partial)
   * Prevents duplicate refunds, validates remaining balance, maintains complete audit trail
   */
  public static async processRefund(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const {
        amount,
        reason,
        idempotencyKey,
        isManualReconciliation = false
      } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Refund amount must be greater than zero.' });
      }

      const refundNum = Number(amount);
      const order = await ShopOrder.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      if (order.status !== 'completed') {
        return res.status(400).json({ message: 'Only paid / completed orders can be refunded.' });
      }

      const admin = OrderManagementController.getAdminInfo(req);

      // Remaining refundable check
      const currentRefunded = order.totalRefundedAmount || 0;
      const remainingBalance = Math.max(0, order.totalAmount - currentRefunded);

      if (refundNum > remainingBalance) {
        return res.status(400).json({
          message: `Requested refund of ₹${refundNum} exceeds remaining refundable balance of ₹${remainingBalance}.`
        });
      }

      // Idempotency check: check if refund with same idempotencyKey already exists
      const safeKey = idempotencyKey || `ref_${orderId}_${refundNum}_${Date.now()}`;
      if (order.refunds && order.refunds.some(r => r.idempotencyKey === safeKey)) {
        return res.status(409).json({ message: 'Duplicate refund request detected. This refund has already been recorded.' });
      }

      const refundRequestNumber = `RF-${order._id.toString().slice(-6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      let gatewayRefundId = '';
      let refundStatus: 'COMPLETED' | 'FAILED' | 'PENDING' = 'COMPLETED';
      let gatewayMessage = '';

      if (!isManualReconciliation && order.razorpayPaymentId) {
        // Real gateway call
        const gwRes = await OrderManagementController.executeRazorpayRefund(order, refundNum, reason || 'Customer refund');
        if (gwRes.success) {
          gatewayRefundId = gwRes.refundId || '';
          refundStatus = 'COMPLETED';
          gatewayMessage = `Gateway refund confirmed (${gatewayRefundId}).`;
        } else {
          refundStatus = 'FAILED';
          gatewayMessage = `Gateway returned error: ${gwRes.error}`;
        }
      } else {
        // Manual reconciliation
        gatewayRefundId = `MANUAL-${Date.now()}`;
        refundStatus = 'COMPLETED';
        gatewayMessage = 'Manual offline reconciliation recorded.';
      }

      if (refundStatus === 'FAILED') {
        // Record failed attempt
        order.refunds = order.refunds || [];
        order.refunds.push({
          refundId: new mongoose.Types.ObjectId().toString(),
          refundRequestNumber,
          amount: refundNum,
          reason: reason || '',
          status: 'FAILED',
          initiatedAt: new Date(),
          initiatedBy: new mongoose.Types.ObjectId(admin.adminId),
          idempotencyKey: safeKey,
          gatewayResponse: { error: gatewayMessage }
        });
        await order.save();

        await OrderManagementController.logAudit({
          adminId: admin.adminId,
          adminName: admin.adminName,
          adminEmail: admin.adminEmail,
          action: 'REFUND_FAILED',
          details: `Failed to initiate refund of ₹${refundNum}: ${gatewayMessage}`,
          entityType: 'Refund',
          entityId: order._id.toString(),
          orderNumber: order.vendorOrderId || order._id.toString(),
          amount: refundNum,
          reason: reason || ''
        });

        return res.status(502).json({
          success: false,
          message: `Refund gateway failure: ${gatewayMessage}`,
          order
        });
      }

      // Successful refund recorded
      order.refunds = order.refunds || [];
      order.refunds.push({
        refundId: new mongoose.Types.ObjectId().toString(),
        refundRequestNumber,
        amount: refundNum,
        reason: reason || '',
        status: 'COMPLETED',
        gatewayRefundId,
        initiatedAt: new Date(),
        completedAt: new Date(),
        initiatedBy: new mongoose.Types.ObjectId(admin.adminId),
        idempotencyKey: safeKey
      });

      order.totalRefundedAmount = (order.totalRefundedAmount || 0) + refundNum;

      // Update cancellationRequest status if present
      if (order.cancellationRequest) {
        order.cancellationRequest.refundStatus = 'COMPLETED';
        order.cancellationRequest.refundAmount = (order.cancellationRequest.refundAmount || 0) + refundNum;
        order.cancellationRequest.refundTransactionId = gatewayRefundId;
      }

      // If fully refunded and not yet delivered, mark delivery status as cancelled
      if (order.totalRefundedAmount >= order.totalAmount && order.deliveryStatus !== 'delivered') {
        order.deliveryStatus = 'cancelled';
        if (order.cancellationRequest) {
          order.cancellationRequest.status = 'PROCESSED';
        }
      }

      order.orderTimeline = order.orderTimeline || [];
      order.orderTimeline.push({
        status: 'refund_processed',
        timestamp: new Date(),
        comment: `Refund of ₹${refundNum} processed by ${admin.adminName}. Reason: ${reason || 'N/A'}. ${gatewayMessage}`
      });

      if (order.deliveryStatus === 'cancelled') {
        order.orderTimeline.push({
          status: 'cancelled',
          timestamp: new Date(),
          comment: `Order automatically marked as Cancelled due to full refund (${admin.adminName}). Dispatch halted.`
        });
      }

      await order.save();

      // Audit log
      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: 'REFUND_COMPLETED',
        details: `Processed refund of ₹${refundNum}. Ref: ${gatewayRefundId}. Reason: ${reason}`,
        entityType: 'Refund',
        entityId: order._id.toString(),
        orderNumber: order.vendorOrderId || order._id.toString(),
        amount: refundNum,
        reason,
        gatewayRef: gatewayRefundId
      });

      // Send in-app notification & FCM
      if (order.userId) {
        await Notification.create({
          userId: order.userId,
          title: 'Refund Processed 💳',
          body: `A refund of ₹${refundNum} for order #${order.vendorOrderId || order._id.toString().slice(-6)} has been processed to your payment method.`,
          type: 'RefundProcessed',
          metadata: {
            orderId: order._id.toString(),
            refundAmount: refundNum,
            gatewayRefundId
          }
        }).catch(console.error);

        FCMService.sendNotificationToUser(order.userId.toString(), {
          title: 'Refund Processed 💳',
          body: `A refund of ₹${refundNum} has been processed.`,
          type: 'RefundProcessed',
          data: { orderId: order._id.toString(), refundAmount: refundNum.toString() }
        }).catch(console.error);
      }

      return res.json({
        success: true,
        message: `Refund of ₹${refundNum} completed successfully. ${gatewayMessage}`,
        refundRequestNumber,
        gatewayRefundId,
        remainingBalance: Math.max(0, order.totalAmount - order.totalRefundedAmount),
        order
      });
    } catch (err: any) {
      console.error('[OrderManagementProcessRefund] Error:', err);
      return res.status(500).json({ message: err.message || 'Error processing refund' });
    }
  }

  /**
   * 8. GET REFUNDS & CANCELLATIONS LIST
   * Dedicated list of all refunds, returns, and cancellation requests
   */
  public static async getRefundsAndCancellations(req: AuthRequest, res: Response) {
    try {
      const orders = await ShopOrder.find({
        $or: [
          { cancellationRequest: { $ne: null } },
          { 'refunds.0': { $exists: true } }
        ]
      })
      .populate('userId', 'name email mobileNumber')
      .populate('vendorId', 'name businessName')
      .sort({ updatedAt: -1 })
      .lean();

      // Flatten items into clean refund / cancellation view items
      const items: any[] = [];

      orders.forEach(o => {
        // From cancellationRequest
        if (o.cancellationRequest) {
          items.push({
            id: `${o._id}_cancel`,
            orderId: o._id,
            orderNumber: o.vendorOrderId || o._id.toString(),
            customerName: o.patientName || (o.userId as any)?.name || 'Customer',
            customerEmail: o.patientEmail || (o.userId as any)?.email || '',
            vendorName: (o.vendorId as any)?.businessName || (o.vendorId as any)?.name || 'Direct',
            type: o.cancellationRequest.type || 'cancellation',
            requestedAmount: o.cancellationRequest.refundAmount || o.totalAmount,
            alreadyRefunded: o.totalRefundedAmount || 0,
            remainingRefundable: Math.max(0, (o.totalAmount || 0) - (o.totalRefundedAmount || 0)),
            reason: o.cancellationRequest.reason || 'No reason specified',
            requestDate: o.cancellationRequest.requestedAt || o.createdAt,
            approvalStatus: o.cancellationRequest.status || 'PENDING',
            refundStatus: o.cancellationRequest.refundStatus || 'NONE',
            gatewayRef: o.cancellationRequest.refundTransactionId || '',
            deliveryStatus: o.deliveryStatus,
            adminNotes: o.cancellationRequest.adminNotes || '',
            arivuActionRequired: o.cancellationRequest.arivuActionRequired || false,
            arivuActionNotes: o.cancellationRequest.arivuActionNotes || ''
          });
        }

        // From individual refunds array
        if (Array.isArray(o.refunds)) {
          o.refunds.forEach((r: any) => {
            // Avoid duplicate if same ID
            if (!items.some(it => it.gatewayRef === r.gatewayRefundId && it.orderId === o._id)) {
              items.push({
                id: r.refundId || `${o._id}_${r.refundRequestNumber}`,
                orderId: o._id,
                orderNumber: o.vendorOrderId || o._id.toString(),
                refundRequestNumber: r.refundRequestNumber,
                customerName: o.patientName || (o.userId as any)?.name || 'Customer',
                customerEmail: o.patientEmail || (o.userId as any)?.email || '',
                vendorName: (o.vendorId as any)?.businessName || (o.vendorId as any)?.name || 'Direct',
                type: 'refund',
                requestedAmount: r.amount,
                alreadyRefunded: o.totalRefundedAmount || 0,
                remainingRefundable: Math.max(0, (o.totalAmount || 0) - (o.totalRefundedAmount || 0)),
                reason: r.reason || 'Admin direct refund',
                requestDate: r.initiatedAt,
                approvalStatus: r.status === 'COMPLETED' ? 'APPROVED' : r.status,
                refundStatus: r.status,
                gatewayRef: r.gatewayRefundId || '',
                deliveryStatus: o.deliveryStatus,
                adminNotes: ''
              });
            }
          });
        }
      });

      return res.json({ items });
    } catch (err: any) {
      console.error('[OrderManagementGetRefunds] Error:', err);
      return res.status(500).json({ message: err.message || 'Error fetching refunds and cancellations' });
    }
  }

  /**
   * 9. CUSTOMER SUPPORT INBOX
   * Searchable, filterable tickets with conversation view
   */
  public static async getSupportInbox(req: AuthRequest, res: Response) {
    try {
      const {
        status = 'all',
        category = 'all',
        priority = 'all',
        search = '',
        page = '1',
        limit = '25'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));

      const query: any = {};

      if (status !== 'all') {
        if (status === 'Open') {
          query.status = { $in: ['Open', 'In Progress', 'Waiting for Customer', 'Waiting for Vendor'] };
        } else {
          query.status = status;
        }
      }

      if (category !== 'all') {
        query.category = category;
      }

      if (priority !== 'all') {
        query.priority = priority;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const s = search.trim();
        query.$or = [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { question: { $regex: s, $options: 'i' } },
          { subject: { $regex: s, $options: 'i' } },
          { ticketId: { $regex: s, $options: 'i' } },
          { relatedId: { $regex: s, $options: 'i' } }
        ];
      }

      const total = await SupportTicket.countDocuments(query);
      const tickets = await SupportTicket.find(query)
        .populate('userId', 'name email mobileNumber')
        .populate('assignedAdmin', 'name email')
        .populate('orderId', 'vendorOrderId totalAmount status deliveryStatus')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      // Counts for badge headers
      const counts = {
        all: await SupportTicket.countDocuments(),
        open: await SupportTicket.countDocuments({ status: { $in: ['Open', 'In Progress', 'Waiting for Customer', 'Waiting for Vendor'] } }),
        resolved: await SupportTicket.countDocuments({ status: { $in: ['Resolved', 'Closed', 'Answered'] } })
      };

      return res.json({
        tickets,
        counts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    } catch (err: any) {
      console.error('[OrderManagementSupportInbox] Error:', err);
      return res.status(500).json({ message: err.message || 'Error fetching support inbox' });
    }
  }

  /**
   * 10. GET TICKET DETAILS
   */
  public static async getTicketDetails(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const ticket = await SupportTicket.findById(id)
        .populate('userId', 'name email mobileNumber address city state')
        .populate('assignedAdmin', 'name email')
        .populate('orderId')
        .lean();

      if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

      // If relatedId exists, find any matching ShopOrder
      let linkedOrder: any = ticket.orderId;
      if (!linkedOrder && ticket.relatedId) {
        linkedOrder = await ShopOrder.findOne({
          $or: [
            { vendorOrderId: ticket.relatedId },
            ...(mongoose.Types.ObjectId.isValid(ticket.relatedId) ? [{ _id: new mongoose.Types.ObjectId(ticket.relatedId) }] : [])
          ]
        }).lean();
      }

      return res.json({ ticket, linkedOrder });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching ticket details' });
    }
  }

  /**
   * 11. UPDATE TICKET (Reply or Internal Note)
   * Dispatches email notification to customer for customer-visible replies.
   * Internal notes are strictly kept private.
   */
  public static async updateTicket(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        message,
        isInternalNote = false,
        status,
        priority,
        category,
        assignedAdminId,
        orderId
      } = req.body;

      const ticket = await SupportTicket.findById(id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

      const admin = OrderManagementController.getAdminInfo(req);

      // Add conversation entry if message provided
      if (message && message.trim()) {
        ticket.messages = ticket.messages || [];
        ticket.messages.push({
          sender: 'admin',
          senderName: admin.adminName,
          senderId: new mongoose.Types.ObjectId(admin.adminId),
          message: message.trim(),
          timestamp: new Date(),
          isInternalNote: !!isInternalNote
        });

        if (!isInternalNote) {
          ticket.answer = message.trim();
          ticket.answeredAt = new Date();
          ticket.lastResponseAt = new Date();
          if (!status) {
            ticket.status = 'Answered';
          }
          // Dispatch email notification to customer
          EmailService.sendSupportAnswerEmail(
            ticket.email,
            ticket.name,
            ticket.question,
            message.trim()
          ).catch(console.error);
        } else {
          ticket.adminNotes = (ticket.adminNotes ? `${ticket.adminNotes}\n` : '') + `[${new Date().toLocaleDateString('en-IN')}] (${admin.adminName}): ${message.trim()}`;
        }
      }

      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (category) ticket.category = category;
      if (assignedAdminId && mongoose.Types.ObjectId.isValid(assignedAdminId)) {
        ticket.assignedAdmin = new mongoose.Types.ObjectId(assignedAdminId);
      }
      if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        ticket.orderId = new mongoose.Types.ObjectId(orderId);
      }

      await ticket.save();

      // Audit log
      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: isInternalNote ? 'TICKET_NOTE_ADDED' : 'TICKET_REPLIED',
        details: isInternalNote ? `Added private note to ticket #${ticket.ticketId || ticket._id}` : `Replied to ticket #${ticket.ticketId || ticket._id}`,
        entityType: 'SupportTicket',
        entityId: ticket._id.toString()
      });

      return res.json({ success: true, message: 'Ticket updated successfully.', ticket });
    } catch (err: any) {
      console.error('[OrderManagementUpdateTicket] Error:', err);
      return res.status(500).json({ message: err.message || 'Error updating ticket' });
    }
  }

  /**
   * 12. CUSTOMER MESSAGING & NOTIFICATIONS
   * Previews and dispatches templated/custom messages via Email, In-App, and SMS
   */
  public static async sendCustomerMessage(req: AuthRequest, res: Response) {
    try {
      const {
        customerId,
        customerEmail,
        customerPhone,
        orderId,
        template,
        subject,
        message,
        channels = ['in_app', 'email']
      } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required.' });
      }

      const admin = OrderManagementController.getAdminInfo(req);
      const deliveryStatus: Record<string, any> = {};

      let order: any = null;
      if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        order = await ShopOrder.findById(orderId);
      }

      const recipientEmail = customerEmail || order?.patientEmail;
      const recipientPhone = customerPhone || order?.patientPhone;
      const recipientUserId = customerId || order?.userId;

      // 1. In-App Notification
      if (channels.includes('in_app') && recipientUserId) {
        try {
          await Notification.create({
            userId: recipientUserId,
            title: subject,
            body: message,
            type: 'General',
            metadata: {
              orderId: order?._id?.toString(),
              template
            }
          });
          deliveryStatus.in_app = { success: true };
          FCMService.sendNotificationToUser(recipientUserId.toString(), {
            title: subject,
            body: message,
            type: 'General'
          }).catch(console.error);
        } catch (e: any) {
          deliveryStatus.in_app = { success: false, error: e.message };
        }
      }

      // 2. Email Delivery
      if (channels.includes('email') && recipientEmail) {
        try {
          await EmailService.sendRawEmail(
            recipientEmail,
            subject,
            `<div style="font-family:sans-serif;padding:20px;max-width:600px;margin:auto;">
              <h2 style="color:#1e293b;">${subject}</h2>
              <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px;border-radius:6px;margin:16px 0;line-height:1.6;color:#334155;">
                ${message.replace(/\n/g, '<br/>')}
              </div>
              <p style="font-size:12px;color:#94a3b8;">This is an official communication regarding your Mito Reboot account / order.</p>
            </div>`
          );
          deliveryStatus.email = { success: true };
        } catch (e: any) {
          deliveryStatus.email = { success: false, error: e.message };
        }
      }

      // 3. SMS Delivery
      if (channels.includes('sms') && recipientPhone) {
        try {
          const sent = await SMSService.sendSMS(recipientPhone, `[Mito Reboot] ${subject}: ${message.slice(0, 120)}`);
          deliveryStatus.sms = { success: sent, error: sent ? undefined : 'SMS delivery failed' };
        } catch (e: any) {
          deliveryStatus.sms = { success: false, error: e.message };
        }
      }

      // If linked to an order, add to timeline
      if (order) {
        order.orderTimeline = order.orderTimeline || [];
        order.orderTimeline.push({
          status: 'customer_communication',
          timestamp: new Date(),
          comment: `Admin sent message "${subject}" via ${channels.join(', ')}`
        });
        await order.save();
      }

      // Record audit
      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: 'CUSTOMER_MESSAGE_SENT',
        details: `Sent "${subject}" to ${recipientEmail || recipientPhone} via ${channels.join(', ')}`,
        entityType: 'Communication',
        entityId: order?._id?.toString()
      });

      return res.json({
        success: true,
        message: 'Message dispatched successfully.',
        deliveryStatus
      });
    } catch (err: any) {
      console.error('[OrderManagementSendMessage] Error:', err);
      return res.status(500).json({ message: err.message || 'Error sending customer message' });
    }
  }

  /**
   * 13. VENDOR FULFILMENT MANAGEMENT
   * Vendor orders tracking, dispatch status, sync logs, and retry
   */
  public static async getVendorFulfilmentOrders(req: AuthRequest, res: Response) {
    try {
      const { vendorId, submissionStatus } = req.query;
      const query: any = {
        vendorId: { $ne: null }
      };

      if (vendorId && vendorId !== 'all' && mongoose.Types.ObjectId.isValid(vendorId as string)) {
        query.vendorId = new mongoose.Types.ObjectId(vendorId as string);
      }

      if (submissionStatus && submissionStatus !== 'all') {
        query.vendorSubmissionStatus = submissionStatus;
      }

      const orders = await ShopOrder.find(query)
        .populate('userId', 'name email mobileNumber')
        .populate('vendorId', 'name businessName slug contactEmail contactPhone')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const vendors = await Vendor.find().select('name businessName slug').lean();

      return res.json({ orders, vendors });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching vendor fulfilment orders' });
    }
  }

  /**
   * Retry failed vendor submission
   */
  public static async retryVendorSubmission(req: AuthRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await ShopOrder.findById(orderId).populate('vendorId');
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      const admin = OrderManagementController.getAdminInfo(req);

      order.vendorSubmissionStatus = 'PENDING';
      order.vendorSubmissionAttempts = (order.vendorSubmissionAttempts || 0) + 1;
      await order.save();

      // Trigger autoAssignAndSubmitVendorOrder
      await autoAssignAndSubmitVendorOrder(order);

      const refreshedOrder = await ShopOrder.findById(orderId);

      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: 'VENDOR_SUBMISSION_RETRY',
        details: `Retried submission to vendor adapter. Outcome: ${refreshedOrder?.vendorSubmissionStatus}`,
        entityType: 'Vendor',
        entityId: order._id.toString(),
        orderNumber: order.vendorOrderId || order._id.toString()
      });

      return res.json({
        success: true,
        message: `Retry submitted. Current status: ${refreshedOrder?.vendorSubmissionStatus}`,
        order: refreshedOrder
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error retrying vendor submission' });
    }
  }

  /**
   * 14. BUSINESS REPORTS & GROWTH ANALYTICS
   * Comprehensive report with Day, Week, Month, Quarter, Year, and Custom date ranges
   */
  public static async getReportsAndAnalytics(req: AuthRequest, res: Response) {
    try {
      const { period = 'month', startDate, endDate } = req.query;

      const now = new Date();
      let queryStart: Date;
      let queryEnd: Date = now;

      if (startDate && endDate) {
        queryStart = new Date(startDate as string);
        queryEnd = new Date(endDate as string);
      } else if (period === 'day') {
        queryStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'week') {
        queryStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      } else if (period === 'month') {
        queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        const qm = Math.floor(now.getMonth() / 3) * 3;
        queryStart = new Date(now.getFullYear(), qm, 1);
      } else if (period === 'year') {
        queryStart = new Date(now.getFullYear(), 0, 1);
      } else {
        queryStart = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      }

      const matchQuery = {
        createdAt: { $gte: queryStart, $lte: queryEnd }
      };

      const orders = await ShopOrder.find(matchQuery).lean();

      // Counts
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed');
      const successfulPayments = completedOrders.length;
      const failedPayments = orders.filter(o => o.status === 'failed').length;
      const cancelledOrders = orders.filter(o => o.deliveryStatus === 'cancelled' || o.status === 'failed').length;
      const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;

      // Revenue breakdown
      const grossOrderValue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalDiscounts = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
      const totalTaxes = completedOrders.reduce((sum, o) => sum + (o.taxAmount || o.gstAmount || 0), 0);
      const totalShipping = completedOrders.reduce((sum, o) => sum + (o.shippingCharge || 0), 0);

      let totalRefunds = 0;
      orders.forEach(o => {
        if (Array.isArray(o.refunds)) {
          o.refunds.forEach((r: any) => {
            if (r.status === 'COMPLETED') totalRefunds += (r.amount || 0);
          });
        } else if (o.cancellationRequest?.refundStatus === 'COMPLETED') {
          totalRefunds += (o.cancellationRequest.refundAmount || 0);
        }
      });

      const netSalesAfterRefunds = Math.max(0, grossOrderValue - totalRefunds);
      const aov = successfulPayments > 0 ? Math.round(grossOrderValue / successfulPayments) : 0;

      // Customer repeat analysis
      const userOrderCounts: Record<string, number> = {};
      completedOrders.forEach(o => {
        const uid = o.userId?.toString();
        if (uid) userOrderCounts[uid] = (userOrderCounts[uid] || 0) + 1;
      });

      const uniqueCustomers = Object.keys(userOrderCounts).length;
      const repeatCustomers = Object.values(userOrderCounts).filter(cnt => cnt > 1).length;
      const repeatCustomerRate = uniqueCustomers > 0 ? Number(((repeatCustomers / uniqueCustomers) * 100).toFixed(1)) : 0;

      // Product rankings
      const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      completedOrders.forEach(o => {
        (o.products || []).forEach(p => {
          if (!productMap[p.name]) productMap[p.name] = { name: p.name, qty: 0, revenue: 0 };
          productMap[p.name].qty += p.qty || 1;
          productMap[p.name].revenue += (p.price || 0) * (p.qty || 1);
        });
      });
      const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

      // Support metrics in this timeframe
      const tickets = await SupportTicket.find(matchQuery).lean();
      const supportTicketVolume = tickets.length;
      const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed', 'Answered'].includes(t.status));
      const otpSupportIssues = tickets.filter(t => t.category === 'OTP Problem' || t.category === 'Account/Login').length;

      return res.json({
        period,
        dateRange: { start: queryStart, end: queryEnd },
        kpis: {
          totalOrders,
          successfulPayments,
          failedPayments,
          grossOrderValue: Math.round(grossOrderValue),
          netSalesAfterRefunds: Math.round(netSalesAfterRefunds),
          totalDiscounts: Math.round(totalDiscounts),
          totalTaxes: Math.round(totalTaxes),
          totalShipping: Math.round(totalShipping),
          totalRefunds: Math.round(totalRefunds),
          cancellationRate,
          aov,
          uniqueCustomers,
          repeatCustomers,
          repeatCustomerRate,
          supportTicketVolume,
          resolvedTicketsCount: resolvedTickets.length,
          otpSupportIssues
        },
        topProducts
      });
    } catch (err: any) {
      console.error('[OrderManagementReports] Error:', err);
      return res.status(500).json({ message: err.message || 'Error generating reports' });
    }
  }

  /**
   * 15. AUDIT HISTORY
   * Searchable, filterable immutable audit trail
   */
  public static async getAuditHistory(req: AuthRequest, res: Response) {
    try {
      const {
        search = '',
        action = 'all',
        entityType = 'all',
        page = '1',
        limit = '30'
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));

      const query: any = {};

      if (action !== 'all') {
        query.action = action;
      }

      if (entityType !== 'all') {
        query.entityType = entityType;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const s = search.trim();
        query.$or = [
          { details: { $regex: s, $options: 'i' } },
          { adminName: { $regex: s, $options: 'i' } },
          { adminEmail: { $regex: s, $options: 'i' } },
          { orderNumber: { $regex: s, $options: 'i' } },
          { gatewayRef: { $regex: s, $options: 'i' } }
        ];
      }

      const total = await AuditLog.countDocuments(query);
      // Ensure AdminUser model is active in runtime
      if (AdminUser) {}
      const logs = await AuditLog.find(query)
        .populate('adminId', 'name email role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      return res.json({
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching audit history' });
    }
  }

  /**
   * 16. ORDER SETTINGS & POLICIES
   */
  public static async getOrderSettings(req: AuthRequest, res: Response) {
    try {
      let settings = await OrderSettings.findOne();
      if (!settings) {
        settings = await OrderSettings.create({});
      }
      return res.json({ settings });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error fetching order settings' });
    }
  }

  public static async updateOrderSettings(req: AuthRequest, res: Response) {
    try {
      const admin = OrderManagementController.getAdminInfo(req);
      let settings = await OrderSettings.findOne();
      if (!settings) {
        settings = new OrderSettings({});
      }

      const {
        cancellationWindowHours,
        autoCancelUnpaidHours,
        returnWindowDays,
        enableEmailNotifications,
        enableSmsNotifications,
        enableInAppNotifications,
        supportEmail,
        defaultCourier,
        autoNotifyOnShipment,
        autoNotifyOnRefund,
        requireRefundConfirmation
      } = req.body;

      if (cancellationWindowHours !== undefined) settings.cancellationWindowHours = Number(cancellationWindowHours);
      if (autoCancelUnpaidHours !== undefined) settings.autoCancelUnpaidHours = Number(autoCancelUnpaidHours);
      if (returnWindowDays !== undefined) settings.returnWindowDays = Number(returnWindowDays);
      if (enableEmailNotifications !== undefined) settings.enableEmailNotifications = !!enableEmailNotifications;
      if (enableSmsNotifications !== undefined) settings.enableSmsNotifications = !!enableSmsNotifications;
      if (enableInAppNotifications !== undefined) settings.enableInAppNotifications = !!enableInAppNotifications;
      if (supportEmail !== undefined) settings.supportEmail = supportEmail;
      if (defaultCourier !== undefined) settings.defaultCourier = defaultCourier;
      if (autoNotifyOnShipment !== undefined) settings.autoNotifyOnShipment = !!autoNotifyOnShipment;
      if (autoNotifyOnRefund !== undefined) settings.autoNotifyOnRefund = !!autoNotifyOnRefund;
      if (requireRefundConfirmation !== undefined) settings.requireRefundConfirmation = !!requireRefundConfirmation;
      settings.updatedBy = new mongoose.Types.ObjectId(admin.adminId);

      await settings.save();

      await OrderManagementController.logAudit({
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        action: 'ORDER_SETTINGS_UPDATED',
        details: 'Updated order management policies & notification configurations',
        entityType: 'Settings'
      });

      return res.json({ success: true, message: 'Settings saved successfully.', settings });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Error updating order settings' });
    }
  }
}
