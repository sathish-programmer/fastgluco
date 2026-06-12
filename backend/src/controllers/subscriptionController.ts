import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { UserSubscription } from '../models/UserSubscription';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { Invoice } from '../models/Invoice';
import { FCMService } from '../services/fcmService';
import { Coupon } from '../models/Coupon';
import { EmailService } from '../services/emailService';

export class SubscriptionController {
  /**
   * List Active Plans for Users
   */
  public static async listActivePlans(req: AuthRequest, res: Response) {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
      return res.status(200).json(plans);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error listing subscription plans.' });
    }
  }

  /**
   * Validate coupon code for a selected plan
   */
  public static async validateCoupon(req: AuthRequest, res: Response) {
    try {
      const { couponCode, planId, billingCycle } = req.body;
      if (!couponCode) {
        return res.status(400).json({ message: 'Coupon code is required.' });
      }

      const coupon = await Coupon.findOne({ 
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        isDeleted: false
      });

      if (!coupon) {
        return res.status(400).json({ valid: false, message: 'Invalid or inactive coupon code.' });
      }

      // Check expiry date
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ valid: false, message: 'This coupon code has expired.' });
      }

      // Check max redemptions
      if (coupon.maxRedemptions !== undefined && coupon.redemptionsCount >= coupon.maxRedemptions) {
        return res.status(400).json({ valid: false, message: 'This coupon code has reached its usage limit.' });
      }

      let originalPrice = 0;
      let discountAmount = 0;
      let finalAmount = 0;
      let hasPlanDetails = false;

      if (planId && billingCycle) {
        const plan = await SubscriptionPlan.findById(planId);
        if (plan && plan.isActive) {
          hasPlanDetails = true;
          originalPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          if (coupon.discountType === 'percentage') {
            discountAmount = parseFloat(((originalPrice * coupon.discountValue) / 100).toFixed(2));
          } else {
            discountAmount = coupon.discountValue;
          }

          // Limit discount to originalPrice
          if (discountAmount > originalPrice) {
            discountAmount = originalPrice;
          }

          finalAmount = parseFloat((originalPrice - discountAmount).toFixed(2));
        }
      }

      // Fetch global settings config
      const config = await PaymentGatewayConfig.findOne();
      const gstPercentage = config ? config.gstPercentage : 18;
      const gstAmount = parseFloat(((finalAmount * gstPercentage) / 100).toFixed(2));
      const totalAmount = parseFloat((finalAmount + gstAmount).toFixed(2));

      return res.status(200).json({
        valid: true,
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        ...(hasPlanDetails ? {
          discountAmount,
          originalAmount: originalPrice,
          finalAmount,
          gstPercentage,
          gstAmount,
          totalAmount
        } : {}),
        message: `Coupon '${coupon.code}' is valid.`
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error validating coupon.' });
    }
  }

  /**
   * Get Current Active Subscription & Billing History
   */
  public static async getCurrentSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const now = new Date();

      // Find active user subscription (including trial runs)
      const subscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trialing', 'cancelled'] },
        $or: [
          { endDate: { $gte: now } },
          { trialEndDate: { $gte: now } }
        ]
      });

      let planDetails = null;
      if (subscription) {
        planDetails = await SubscriptionPlan.findById(subscription.planId);
      }

      // Fetch payment and invoice histories
      const invoices = await Invoice.find({ userId }).sort({ createdAt: -1 });
      const transactions = await PaymentTransaction.find({ userId }).sort({ createdAt: -1 });

      // Fetch global settings config
      const config = await PaymentGatewayConfig.findOne();
      const subscriptionsRequired = config ? config.enableSubscriptions : true;
      const gstPercentage = config ? config.gstPercentage : 18;

      return res.status(200).json({
        subscription,
        plan: planDetails,
        invoices,
        transactions,
        subscriptionsRequired,
        gstPercentage
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching subscription details.' });
    }
  }

  public static async createOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { planId, billingCycle, couponCode } = req.body; // billingCycle = 'monthly' | 'yearly'

      if (!planId || !billingCycle) {
        return res.status(400).json({ message: 'Plan ID and billing cycle are required.' });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan || !plan.isActive) {
        return res.status(404).json({ message: 'Subscription plan not found or inactive.' });
      }

      const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      if (price <= 0) {
        return res.status(400).json({ message: 'Invalid price calculation.' });
      }

      // 1. Coupon validation and discount math
      let finalPrice = price;
      let discountAmount = 0;
      let appliedCouponCode = '';

      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.trim().toUpperCase(),
          isActive: true,
          isDeleted: false
        });

        if (coupon) {
          // Check expiry date
          const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
          // Check max redemptions
          const isLimitReached = coupon.maxRedemptions !== undefined && coupon.redemptionsCount >= coupon.maxRedemptions;

          if (!isExpired && !isLimitReached) {
            appliedCouponCode = coupon.code;
            if (coupon.discountType === 'percentage') {
              discountAmount = parseFloat(((price * coupon.discountValue) / 100).toFixed(2));
            } else {
              discountAmount = coupon.discountValue;
            }
            if (discountAmount > price) {
              discountAmount = price;
            }
            finalPrice = parseFloat((price - discountAmount).toFixed(2));
          }
        }
      }

      // Fetch gateway configuration details
      const config = await PaymentGatewayConfig.findOne();
      const useRazorpay = !!(config && config.enablePayments && config.razorpayKeyId && config.razorpayKeySecret);
      const gstPercentage = config ? config.gstPercentage : 18;

      // 2. Handle Zero-Amount (100% discount free bypass)
      if (finalPrice <= 0) {
        const mockOrderId = `free_order_${Date.now()}_${Math.round(Math.random() * 1000)}`;
        
        // Save successful free transaction
        const transaction = new PaymentTransaction({
          userId,
          planId: plan._id,
          amount: 0,
          originalAmount: price,
          discountAmount: price,
          couponCode: appliedCouponCode,
          currency: 'INR',
          gateway: 'mock',
          gatewayOrderId: mockOrderId,
          gatewayPaymentId: `free_redeem_${Date.now()}`,
          status: 'success'
        });

        await transaction.save();

        // Activate immediately
        const subscription = await SubscriptionController.activateSubscriptionForUser(
          userId!,
          plan,
          billingCycle,
          appliedCouponCode
        );

        transaction.subscriptionId = subscription._id as any;
        await transaction.save();

        // Increment coupon redemptions count
        if (appliedCouponCode) {
          await Coupon.updateOne(
            { code: appliedCouponCode },
            { $inc: { redemptionsCount: 1 } }
          );
        }

        // Write Invoice
        await SubscriptionController.generateInvoice(userId!, transaction, plan);

        // FCM Alerts
        await FCMService.sendPushNotification(
          userId!,
          'Subscription Activated (Promo)!',
          `Your subscription to ${plan.name} has been successfully activated for free!`,
          'SubscriptionActivated' as any
        );

        return res.status(201).json({
          gateway: 'free',
          orderId: mockOrderId,
          amount: 0,
          planName: plan.name,
          subscription
        });
      }

      const baseAmount = finalPrice;
      const gstAmount = parseFloat(((baseAmount * gstPercentage) / 100).toFixed(2));
      const totalAmountCharged = parseFloat((baseAmount + gstAmount).toFixed(2));

      if (useRazorpay) {
        // 3. Initialize Razorpay Client
        const instance = new Razorpay({
          key_id: config.razorpayKeyId!,
          key_secret: config.razorpayKeySecret!
        });

        // 4. Generate Razorpay checkout Order
        const orderOptions = {
          amount: Math.round(totalAmountCharged * 100), // paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };

        const razorpayOrder = await instance.orders.create(orderOptions);

        // 5. Save pending transaction in database
        const transaction = new PaymentTransaction({
          userId,
          planId: plan._id,
          amount: totalAmountCharged,
          originalAmount: price,
          discountAmount: discountAmount,
          couponCode: appliedCouponCode,
          currency: 'INR',
          gateway: 'razorpay',
          gatewayOrderId: razorpayOrder.id,
          status: 'pending'
        });

        await transaction.save();

        return res.status(201).json({
          gateway: 'razorpay',
          keyId: config.razorpayKeyId,
          orderId: razorpayOrder.id,
          amount: orderOptions.amount,
          currency: orderOptions.currency,
          planName: plan.name,
          baseAmount,
          gstAmount,
          totalAmountCharged
        });
      } else {
        // 6. Local Mock checkout Mode
        const mockOrderId = `mock_order_${Date.now()}_${Math.round(Math.random() * 1000)}`;

        const transaction = new PaymentTransaction({
          userId,
          planId: plan._id,
          amount: totalAmountCharged,
          originalAmount: price,
          discountAmount: discountAmount,
          couponCode: appliedCouponCode,
          currency: 'INR',
          gateway: 'mock',
          gatewayOrderId: mockOrderId,
          status: 'pending'
        });

        await transaction.save();

        return res.status(201).json({
          gateway: 'mock',
          orderId: mockOrderId,
          amount: Math.round(totalAmountCharged * 100),
          currency: 'INR',
          planName: plan.name,
          baseAmount,
          gstAmount,
          totalAmountCharged
        });
      }
    } catch (error: any) {
      console.error('Checkout creation error:', error);
      const errMsg = error.error?.description || error.message || 'Error initializing order.';
      return res.status(500).json({ message: errMsg });
    }
  }

  /**
   * Verify Razorpay Payment Signature
   */
  public static async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment signature verification components.' });
      }

      // Fetch gateway configurations
      const config = await PaymentGatewayConfig.findOne();
      if (!config || !config.razorpayKeySecret) {
        return res.status(500).json({ message: 'Razorpay keys not configured.' });
      }

      // Verify HMAC-SHA256 signature
      const hash = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (hash !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid cryptographic signature verification failed.' });
      }

      // Update Transaction status
      const transaction = await PaymentTransaction.findOne({ gatewayOrderId: razorpay_order_id, userId });
      if (!transaction) {
        return res.status(404).json({ message: 'Payment transaction record not found.' });
      }

      transaction.status = 'success';
      transaction.gatewayPaymentId = razorpay_payment_id;
      transaction.gatewaySignature = razorpay_signature;
      await transaction.save();

      // Retrieve plan specifications
      const plan = await SubscriptionPlan.findById(transaction.planId);
      if (!plan) return res.status(404).json({ message: 'Plan details not found.' });

      // Increment coupon redemptions count
      if (transaction.couponCode) {
        await Coupon.updateOne(
          { code: transaction.couponCode },
          { $inc: { redemptionsCount: 1 } }
        );
      }

      // Build subscription record
      const subscription = await SubscriptionController.activateSubscriptionForUser(
        userId!,
        plan,
        transaction.amount >= plan.yearlyPrice ? 'yearly' : 'monthly',
        transaction.couponCode
      );

      // Link subscription ID back to transaction
      transaction.subscriptionId = subscription._id as any;
      await transaction.save();

      // Write Invoice
      await SubscriptionController.generateInvoice(userId!, transaction, plan);

      // Dispatch alert
      await FCMService.sendPushNotification(
        userId!,
        'Subscription Activated!',
        `Your ${plan.name} plan is now active. Enjoy premium features!`,
        'SubscriptionActivated' as any
      );

      return res.status(200).json({
        message: 'Payment verified and subscription activated.',
        subscription
      });
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return res.status(500).json({ message: error.message || 'Error verifying payment.' });
    }
  }

  /**
   * Mock Verification Route (when payments are sandbox/disabled)
   */
  public static async verifyMockPayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required.' });
      }

      const transaction = await PaymentTransaction.findOne({ gatewayOrderId: orderId, userId });
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction record not found.' });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: 'Transaction is already processed.' });
      }

      transaction.status = 'success';
      transaction.gatewayPaymentId = `mock_pay_${Date.now()}`;
      await transaction.save();

      const plan = await SubscriptionPlan.findById(transaction.planId);
      if (!plan) return res.status(404).json({ message: 'Associated plan details not found.' });

      // Increment coupon redemptions count
      if (transaction.couponCode) {
        await Coupon.updateOne(
          { code: transaction.couponCode },
          { $inc: { redemptionsCount: 1 } }
        );
      }

      const cycle = transaction.amount >= plan.yearlyPrice ? 'yearly' : 'monthly';
      const subscription = await SubscriptionController.activateSubscriptionForUser(
        userId!, 
        plan, 
        cycle,
        transaction.couponCode
      );

      transaction.subscriptionId = subscription._id as any;
      await transaction.save();

      await SubscriptionController.generateInvoice(userId!, transaction, plan);

      await FCMService.sendPushNotification(
        userId!,
        'Subscription Activated (Mock)!',
        `Your ${plan.name} subscription has been created. Enjoy premium features!`,
        'SubscriptionActivated' as any
      );

      return res.status(200).json({
        message: 'Mock payment verified successfully.',
        subscription
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error processing mock payment.' });
    }
  }

  /**
   * Self Cancel Auto Renew Options
   */
  public static async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const now = new Date();

      const subscription = await UserSubscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] },
        endDate: { $gte: now }
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found to cancel.' });
      }

      subscription.cancelAtPeriodEnd = true;
      await subscription.save();

      // Set status to cancelled but active until period ends
      subscription.status = 'cancelled';
      await subscription.save();

      // Send Cancellation Email
      const user = await mongoose.model('User').findById(userId);
      if (user && user.email) {
        EmailService.sendCancellationEmail(user.email, user.name || 'FastGluco User', subscription.endDate.toISOString()).catch(console.error);
      }

      return res.status(200).json({
        message: 'Auto-renewal disabled successfully. Subscription remains active until expiry date.',
        subscription
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error cancelling subscription.' });
    }
  }

  /**
   * Reactivate Auto Renew (Resume Subscription)
   */
  public static async reactivateSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const now = new Date();

      const subscription = await UserSubscription.findOne({
        userId,
        status: 'cancelled',
        endDate: { $gte: now }
      });

      if (!subscription) {
        return res.status(404).json({ message: 'No cancelled active subscription found to reactivate.' });
      }

      subscription.cancelAtPeriodEnd = false;
      subscription.status = 'active'; // Revert back to active status
      await subscription.save();

      return res.status(200).json({
        message: 'Auto-renewal enabled successfully.',
        subscription
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error reactivating subscription.' });
    }
  }

  // --- INTERNAL UTILITIES ---

  public static async activateSubscriptionForUser(
    userId: string,
    plan: any,
    cycle: 'monthly' | 'yearly',
    couponCode?: string
  ): Promise<any> {
    // Disable any existing active/trialing subscriptions to prevent overlap conflicts
    const activeSubs = await UserSubscription.find({ userId, status: { $in: ['active', 'trialing'] } });
    if (activeSubs.length > 0) {
      await UserSubscription.updateMany(
        { userId, status: { $in: ['active', 'trialing'] } },
        { $set: { status: 'expired' } }
      );
      // Send Plan Change Email asynchronously
      const user = await mongoose.model('User').findById(userId);
      if (user && user.email) {
        EmailService.sendPlanChangeEmail(user.email, user.name || 'FastGluco User', plan.name).catch(console.error);
      }
    }

    const now = new Date();
    let endDate = new Date();
    
    if (cycle === 'monthly') {
      endDate.setDate(now.getDate() + 30);
    } else {
      endDate.setDate(now.getDate() + 365);
    }

    let trialEndDate: Date | undefined;
    if (plan.trialDays > 0) {
      trialEndDate = new Date();
      trialEndDate.setDate(now.getDate() + plan.trialDays);
    }

    const subscription = new UserSubscription({
      userId,
      planId: plan._id,
      billingCycle: cycle,
      status: plan.trialDays > 0 ? 'trialing' : 'active',
      startDate: now,
      endDate,
      trialStartDate: plan.trialDays > 0 ? now : undefined,
      trialEndDate,
      cancelAtPeriodEnd: false,
      couponCode
    });

    await subscription.save();
    return subscription;
  }

  public static async generateInvoice(userId: string, transaction: any, plan: any) {
    const user = await mongoose.model('User').findById(userId);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.round(Math.random() * 899999 + 100000)}`;

    const total = transaction.amount;

    // Fetch dynamic GST
    const config = await PaymentGatewayConfig.findOne();
    const gstPercent = config ? config.gstPercentage : 18;

    const amountWithoutTax = parseFloat((total / (1 + gstPercent / 100)).toFixed(2));
    const tax = parseFloat((total - amountWithoutTax).toFixed(2));

    const invoice = new Invoice({
      userId,
      transactionId: transaction._id,
      planId: plan._id,
      invoiceNumber,
      amount: amountWithoutTax,
      originalAmount: transaction.originalAmount || transaction.amount,
      discountAmount: transaction.discountAmount || 0,
      couponCode: transaction.couponCode,
      taxAmount: tax,
      totalAmount: total,
      billingName: user?.name || 'FastGluco Patient',
      billingEmail: user?.email || 'patient@fastgluco.com'
    });

    await invoice.save();

    // Trigger invoice email asynchronously
    if (user && user.email) {
      EmailService.sendSubscriptionInvoiceEmail(
        user.email,
        user.name || 'FastGluco Patient',
        plan.name || 'Subscription',
        total,
        user.currency || 'INR'
      ).catch(err => console.error('Error triggering invoice email:', err));
    }

    return invoice;
  }

  /**
   * Stream printable invoice PDF
   */
  public static async downloadInvoicePdf(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const invoice = await Invoice.findById(id).populate('planId');
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found.' });
      }

      // Allow owner or Admin access
      if (invoice.userId.toString() !== userId && req.user?.role !== 'SuperAdmin' && req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const plan: any = invoice.planId;
      const planName = plan ? plan.name : 'Subscription Plan';

      // Safe number formatter to prevent toFixed crashes
      const safeNum = (val: any, fallback: number = 0): number => {
        const n = Number(val);
        return isNaN(n) || val === null || val === undefined ? fallback : n;
      };
      const fmt = (val: any, fallback?: number): string => safeNum(val, fallback).toFixed(2);

      // Initialize PDFDocument
      const doc = new PDFDocument({ margin: 50 });

      // Set download headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);

      doc.pipe(res);

      // --- PDF DRAWING ---
      // Logo / Title Header
      doc.fillColor('#0284C7').fontSize(24).font('Helvetica-Bold').text('FastGluco', 50, 50);
      doc.fillColor('#64748B').fontSize(10).font('Helvetica-Bold').text('HEALTH & DIABETES TRACKING', 50, 78);

      doc.fillColor('#1E293B').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
      doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 400, 75, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' });

      // Horizontal Line divider
      doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // Bill To details
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold').text('Billed To:', 50, 135);
      doc.fillColor('#334155').fontSize(10).font('Helvetica').text(invoice.billingName, 50, 155);
      doc.text(invoice.billingEmail, 50, 170);

      // Issued By details
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold').text('Issued By:', 300, 135);
      doc.fillColor('#334155').fontSize(10).font('Helvetica').text('FastGluco Platform Inc.', 300, 155);
      doc.text('support@fastgluco.com', 300, 170);
      doc.text('Bangalore, Karnataka, India', 300, 185);

      // Table Header
      const tableTop = 230;
      doc.rect(50, tableTop, 500, 25).fill('#F8FAFC');
      doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('Description', 60, tableTop + 7);
      doc.text('Amount (INR)', 450, tableTop + 7, { align: 'right' });

      // Table Row
      const rowTop = tableTop + 25;
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica').text(`FastGluco Premium Subscription - ${planName}`, 60, rowTop + 10);
      doc.text(`Rs.${fmt(invoice.originalAmount, safeNum(invoice.totalAmount))}`, 450, rowTop + 10, { align: 'right' });

      // Table Row underline
      doc.moveTo(50, rowTop + 30).lineTo(550, rowTop + 30).strokeColor('#F1F5F9').lineWidth(1).stroke();

      // Calculation breakdown
      const calcTop = rowTop + 45;
      doc.fillColor('#64748B').fontSize(10).text('Subtotal:', 350, calcTop);
      doc.fillColor('#1E293B').text(`Rs.${fmt(invoice.originalAmount, safeNum(invoice.totalAmount))}`, 450, calcTop, { align: 'right' });

      const discountAmt = safeNum(invoice.discountAmount);
      if (discountAmt > 0) {
        doc.fillColor('#64748B').text(`Discount (${invoice.couponCode || 'Promo'}):`, 350, calcTop + 20);
        doc.fillColor('#EF4444').text(`-Rs.${fmt(invoice.discountAmount)}`, 450, calcTop + 20, { align: 'right' });
      }

      const nextCalcTop = calcTop + (discountAmt > 0 ? 40 : 20);
      doc.fillColor('#64748B').text('Taxable Base Price:', 350, nextCalcTop);
      doc.fillColor('#1E293B').text(`Rs.${fmt(invoice.amount, safeNum(invoice.totalAmount))}`, 450, nextCalcTop, { align: 'right' });

      // Dynamically calculate dynamic GST percent
      const invoiceAmount = safeNum(invoice.amount, 1);
      const invoiceTax = safeNum(invoice.taxAmount);
      const gstPercent = invoiceAmount > 0 ? Math.round((invoiceTax / invoiceAmount) * 100) : 18;
      doc.fillColor('#64748B').text(`GST (${gstPercent}%):`, 350, nextCalcTop + 20);
      doc.fillColor('#1E293B').text(`Rs.${fmt(invoice.taxAmount)}`, 450, nextCalcTop + 20, { align: 'right' });

      // Divider line
      doc.moveTo(350, nextCalcTop + 38).lineTo(550, nextCalcTop + 38).strokeColor('#E2E8F0').stroke();

      // Total Paid
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold').text('Total Paid:', 350, nextCalcTop + 45);
      doc.fillColor('#0284C7').fontSize(14).text(`Rs.${fmt(invoice.totalAmount)}`, 450, nextCalcTop + 44, { align: 'right' });

      // Footer notice
      doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('This is a computer generated invoice and does not require a signature.', 50, 480, { align: 'center', width: 500 });
      doc.text('FastGluco Platform - Glucose & Metabolic Monitoring', 50, 495, { align: 'center', width: 500 });

      // End document
      doc.end();

    } catch (error: any) {
      console.error('Invoice PDF download error:', error);
      // Only send JSON error if headers haven't been sent yet
      if (!res.headersSent) {
        return res.status(500).json({ message: error.message || 'Error generating invoice PDF.' });
      }
    }
  }
}
