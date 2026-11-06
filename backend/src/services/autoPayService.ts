import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import { UserSubscription, IUserSubscription } from '../models/UserSubscription';
import { SubscriptionPlan, ISubscriptionPlan } from '../models/SubscriptionPlan';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { AutoPayAuditLog } from '../models/AutoPayAuditLog';
import { WebhookEventLog } from '../models/WebhookEventLog';
import { Invoice } from '../models/Invoice';
import { FCMService } from './fcmService';
import { EmailService } from './emailService';
import { User } from '../models/User';
import { SubscriptionController } from '../controllers/subscriptionController';

export class AutoPayService {
  /**
   * Initialize Razorpay client with config keys
   */
  public static getRazorpayClient(config: any): Razorpay | null {
    if (!config || !config.razorpayKeyId || !config.razorpayKeySecret) {
      return null;
    }
    return new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    });
  }

  /**
   * Verify HMAC-SHA256 signature for Razorpay recurring subscription authorization
   * Signature formula: razorpay_payment_id + '|' + razorpay_subscription_id
   */
  public static verifySubscriptionSignature(
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    signature: string,
    secret: string
  ): boolean {
    if (!razorpayPaymentId || !razorpaySubscriptionId || !signature || !secret) {
      return false;
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
      .digest('hex');

    return expected === signature;
  }

  /**
   * Verify HMAC-SHA256 signature for Razorpay Webhook events
   */
  public static verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean {
    if (!rawBody || !signature || !secret) {
      return false;
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return expected === signature;
  }

  /**
   * Ensure a Razorpay recurring Plan exists for this cycle & amount.
   * If existing cached plan matches the amount, reuses it; otherwise creates a new plan in Razorpay.
   */
  public static async ensureRazorpayPlan(
    razorpay: Razorpay,
    planDoc: ISubscriptionPlan,
    billingCycle: 'monthly' | 'yearly',
    amountInINR: number
  ): Promise<string> {
    const isYearly = billingCycle === 'yearly';
    const cachedPlanId = isYearly ? planDoc.razorpayYearlyPlanId : planDoc.razorpayMonthlyPlanId;

    if (cachedPlanId) {
      try {
        const existingRzpPlan: any = await razorpay.plans.fetch(cachedPlanId);
        const expectedPaise = Math.round(amountInINR * 100);
        if (existingRzpPlan && existingRzpPlan.item && existingRzpPlan.item.amount === expectedPaise) {
          return existingRzpPlan.id;
        }
      } catch (err) {
        console.warn(`[AutoPayService] Cached Razorpay plan ${cachedPlanId} not usable:`, err);
      }
    }

    // Create a new recurring plan on Razorpay
    const createdPlan: any = await razorpay.plans.create({
      period: isYearly ? 'yearly' : 'monthly',
      interval: 1,
      item: {
        name: `${planDoc.name} (${isYearly ? 'Annual' : 'Monthly'})`,
        amount: Math.round(amountInINR * 100), // in paise
        currency: 'INR',
        description: `Mito_Reboot ${planDoc.name} ${isYearly ? 'Annual' : 'Monthly'} AutoPay Subscription`
      },
      notes: {
        planCode: planDoc.code,
        billingCycle
      }
    });

    if (isYearly) {
      planDoc.razorpayYearlyPlanId = createdPlan.id;
    } else {
      planDoc.razorpayMonthlyPlanId = createdPlan.id;
    }
    await planDoc.save();

    return createdPlan.id;
  }

  /**
   * Cancel an active Razorpay recurring subscription mandate
   */
  public static async cancelRazorpayMandate(
    razorpaySubscriptionId: string,
    config: any
  ): Promise<{ success: boolean; message?: string }> {
    const razorpay = AutoPayService.getRazorpayClient(config);
    if (!razorpay) {
      return { success: false, message: 'Razorpay keys not configured' };
    }

    try {
      await razorpay.subscriptions.cancel(razorpaySubscriptionId, false);
      return { success: true };
    } catch (error: any) {
      const desc = error?.error?.description || error?.message || 'Error cancelling Razorpay mandate';
      // If already cancelled or completed, treat as success
      if (desc.toLowerCase().includes('already cancelled') || desc.toLowerCase().includes('completed')) {
        return { success: true };
      }
      console.warn(`[AutoPayService] Warning cancelling Razorpay mandate ${razorpaySubscriptionId}:`, desc);
      return { success: false, message: desc };
    }
  }

  /**
   * Fetch payment method and mandate details from Razorpay Payment
   */
  public static async fetchMandateDetails(
    razorpay: Razorpay,
    razorpayPaymentId: string
  ): Promise<any> {
    try {
      const payment: any = await razorpay.payments.fetch(razorpayPaymentId);
      if (!payment) return undefined;

      const details: any = {
        method: payment.method
      };

      if (payment.method === 'card' && payment.card) {
        details.cardNetwork = payment.card.network;
        details.last4 = payment.card.last4;
        details.bank = payment.card.issuer;
        details.authType = payment.card.type;
      } else if (payment.method === 'upi') {
        details.authType = 'UPI AutoPay';
        details.bank = payment.vpa ? payment.vpa.split('@')[1] : undefined;
        details.last4 = payment.vpa ? payment.vpa.slice(-4) : undefined;
      } else if (payment.method === 'netbanking' || payment.method === 'emandate') {
        details.authType = 'eMandate / NetBanking';
        details.bank = payment.bank;
      }

      return details;
    } catch (err) {
      console.warn(`[AutoPayService] Could not fetch payment details for ${razorpayPaymentId}:`, err);
      return undefined;
    }
  }

  /**
   * Verify and process Razorpay Webhook Events for Subscriptions & AutoPay
   */
  public static async processWebhook(
    signature: string,
    rawBody: string,
    eventPayload: any
  ): Promise<{ success: boolean; event?: string; message?: string; duplicate?: boolean }> {
    const config = await PaymentGatewayConfig.findOne();
    const webhookSecret = (config as any)?.razorpayWebhookSecret || config?.razorpayKeySecret;

    if (!webhookSecret) {
      console.warn('[AutoPayService Webhook] Missing webhook secret, skipping verification.');
      return { success: false, message: 'Webhook secret not configured.' };
    }

    // Verify HMAC-SHA256 signature
    if (!AutoPayService.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('[AutoPayService Webhook] Signature verification failed.');
      return { success: false, message: 'Invalid webhook signature.' };
    }

    const event = eventPayload.event;
    const eventId = eventPayload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log(`[AutoPayService Webhook] Verified event: ${event} (ID: ${eventId})`);

    // Check idempotency
    const existingLog = await WebhookEventLog.findOne({ eventId });
    if (existingLog && existingLog.processed) {
      console.log(`[AutoPayService Webhook] Duplicate event ${eventId} already processed, skipping.`);
      return { success: true, event, duplicate: true };
    }

    const webhookLog = existingLog || new WebhookEventLog({
      eventId,
      eventType: event,
      processed: false,
      status: 'processed'
    });

    try {
      if (event === 'subscription.authenticated') {
        // Customer authorized the recurring mandate
        await AutoPayService.handleSubscriptionAuthenticated(eventPayload);
      } else if (event === 'subscription.activated') {
        // Subscription is now officially active
        await AutoPayService.handleSubscriptionActivated(eventPayload);
      } else if (event === 'subscription.charged') {
        // Recurring charge was successfully debited!
        await AutoPayService.handleSubscriptionCharged(eventPayload);
      } else if (event === 'subscription.pending') {
        // Recurring charge failed and is pending retry
        await AutoPayService.handleSubscriptionPending(eventPayload);
      } else if (event === 'subscription.halted') {
        // All retries failed, subscription halted
        await AutoPayService.handleSubscriptionHalted(eventPayload);
      } else if (event === 'subscription.cancelled') {
        // Subscription cancelled on Razorpay
        await AutoPayService.handleSubscriptionCancelled(eventPayload);
      } else if (event === 'payment.failed') {
        // Payment failed
        await AutoPayService.handlePaymentFailed(eventPayload);
      }

      webhookLog.processed = true;
      webhookLog.status = 'processed';
      await webhookLog.save();

      return { success: true, event };
    } catch (error: any) {
      console.error(`[AutoPayService Webhook] Error processing event ${event}:`, error);
      webhookLog.status = 'failed';
      webhookLog.errorMessage = error.message;
      await webhookLog.save().catch(() => {});
      return { success: false, event, message: error.message };
    }
  }

  /**
   * Handle: subscription.authenticated
   */
  private static async handleSubscriptionAuthenticated(eventPayload: any) {
    const subEntity = eventPayload?.payload?.subscription?.entity;
    if (!subEntity) return;

    const rzpSubId = subEntity.id;
    const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!subscription) {
      console.log(`[AutoPayService] No local subscription found for rzpSubId ${rzpSubId}`);
      return;
    }

    subscription.autoPayEnabled = true;
    subscription.mandateStatus = 'authenticated';
    if (subEntity.charge_at) {
      subscription.nextBillingDate = new Date(subEntity.charge_at * 1000);
    }
    await subscription.save();

    await AutoPayAuditLog.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpaySubscriptionId: rzpSubId,
      event: 'MANDATE_AUTHENTICATED',
      status: 'authenticated',
      details: 'User authenticated recurring payment mandate successfully.',
      metadata: subEntity
    });
  }

  /**
   * Handle: subscription.activated
   */
  private static async handleSubscriptionActivated(eventPayload: any) {
    const subEntity = eventPayload?.payload?.subscription?.entity;
    if (!subEntity) return;

    const rzpSubId = subEntity.id;
    const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!subscription) return;

    subscription.autoPayEnabled = true;
    subscription.mandateStatus = 'active';
    subscription.status = 'active';
    if (subEntity.charge_at) {
      subscription.nextBillingDate = new Date(subEntity.charge_at * 1000);
    }
    await subscription.save();

    await AutoPayAuditLog.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpaySubscriptionId: rzpSubId,
      event: 'MANDATE_ACTIVATED',
      status: 'active',
      details: 'Razorpay recurring subscription mandate is fully active.',
      metadata: subEntity
    });
  }

  /**
   * Handle: subscription.charged
   * Recurring Auto-Debit Success: Extends subscription, generates invoice, sends emails & push alerts.
   * Strictly idempotent: Never extends twice for the same payment.id.
   */
  private static async handleSubscriptionCharged(eventPayload: any) {
    const subEntity = eventPayload?.payload?.subscription?.entity;
    const paymentEntity = eventPayload?.payload?.payment?.entity;
    if (!subEntity || !paymentEntity) return;

    const rzpSubId = subEntity.id;
    const paymentId = paymentEntity.id;
    const amountInINR = (paymentEntity.amount || 0) / 100;

    // 1. Idempotency Check: Did we already process this exact payment ID?
    const existingTx = await PaymentTransaction.findOne({ gatewayPaymentId: paymentId });
    if (existingTx && existingTx.status === 'success') {
      console.log(`[AutoPayService] Payment ${paymentId} for subscription ${rzpSubId} was already processed. Skipping duplicate extension.`);
      return;
    }

    // 2. Find local UserSubscription
    const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!subscription) {
      console.warn(`[AutoPayService] No local subscription found for rzpSubId ${rzpSubId} on charged event.`);
      return;
    }

    const plan = await SubscriptionPlan.findById(subscription.planId);
    if (!plan) {
      console.warn(`[AutoPayService] Plan ${subscription.planId} not found.`);
      return;
    }

    // 3. Record PaymentTransaction
    const isRecurring = true;
    const transaction = existingTx || new PaymentTransaction({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      planId: plan._id,
      amount: amountInINR,
      originalAmount: amountInINR,
      discountAmount: 0,
      currency: paymentEntity.currency || 'INR',
      gateway: 'razorpay',
      gatewayOrderId: paymentEntity.order_id || `rec_${paymentId}`,
      gatewayPaymentId: paymentId,
      gatewaySubscriptionId: rzpSubId,
      isRecurring,
      status: 'success'
    });

    transaction.status = 'success';
    transaction.gatewayPaymentId = paymentId;
    transaction.gatewaySubscriptionId = rzpSubId;
    transaction.isRecurring = true;
    await transaction.save();

    // 4. Extend Subscription Validity
    // If current endDate is in the future, extend from endDate; otherwise from now.
    const now = new Date();
    const baseDate = subscription.endDate && new Date(subscription.endDate) > now
      ? new Date(subscription.endDate)
      : now;

    const newEndDate = new Date(baseDate);
    if (subscription.billingCycle === 'monthly') {
      newEndDate.setDate(newEndDate.getDate() + 30);
    } else {
      newEndDate.setDate(newEndDate.getDate() + 365);
    }

    subscription.status = 'active';
    subscription.mandateStatus = 'active';
    subscription.autoPayEnabled = true;
    subscription.endDate = newEndDate;
    subscription.lastBillingDate = now;
    subscription.lastPaymentStatus = 'success';
    subscription.lastFailureReason = undefined;
    subscription.razorpayPaymentId = paymentId;
    subscription.recurringAmount = amountInINR;
    if (subEntity.charge_at) {
      subscription.nextBillingDate = new Date(subEntity.charge_at * 1000);
    } else {
      subscription.nextBillingDate = newEndDate;
    }
    await subscription.save();

    // 5. Generate Invoice
    try {
      await SubscriptionController.generateInvoice(
        subscription.userId.toString(),
        transaction,
        plan,
        subscription
      );
    } catch (invErr) {
      console.error('[AutoPayService] Error generating invoice for auto-renewal:', invErr);
    }

    // 6. Audit Log
    await AutoPayAuditLog.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpaySubscriptionId: rzpSubId,
      razorpayPaymentId: paymentId,
      event: 'RECURRING_CHARGE_SUCCESS',
      status: 'success',
      amount: amountInINR,
      billingCycle: subscription.billingCycle,
      details: `AutoPay recurring deduction of ₹${amountInINR} succeeded. Subscription extended to ${newEndDate.toLocaleDateString()}.`,
      metadata: { payment: paymentEntity, subscription: subEntity }
    });

    // 7. Push Notification & Email
    const user = await User.findById(subscription.userId);
    if (user) {
      await FCMService.sendPushNotification(
        subscription.userId.toString(),
        'Subscription Auto-Renewed!',
        `Your ${plan.name} subscription has been renewed for ₹${amountInINR}. Valid until ${newEndDate.toLocaleDateString()}.`,
        'SubscriptionActivated' as any
      ).catch(() => {});

      if (user.email) {
        EmailService.sendAutoPayRenewalSuccessEmail(
          user.email,
          user.name || 'Valued Patient',
          plan.name,
          amountInINR,
          newEndDate
        ).catch(() => {});
      }
    }
  }

  /**
   * Handle: subscription.pending
   */
  private static async handleSubscriptionPending(eventPayload: any) {
    const subEntity = eventPayload?.payload?.subscription?.entity;
    if (!subEntity) return;

    const rzpSubId = subEntity.id;
    const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!subscription) return;

    subscription.mandateStatus = 'pending';
    subscription.lastPaymentStatus = 'failed';
    subscription.lastFailureReason = 'Recurring deduction pending retry by bank/gateway.';
    await subscription.save();

    await AutoPayAuditLog.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpaySubscriptionId: rzpSubId,
      event: 'MANDATE_PENDING',
      status: 'pending',
      details: 'Recurring deduction failed; pending automatic retry by Razorpay.',
      metadata: subEntity
    });
  }

  /**
   * Handle: subscription.halted
   */
  private static async handleSubscriptionHalted(eventPayload: any) {
    const subEntity = eventPayload?.payload?.subscription?.entity;
    if (!subEntity) return;

    const rzpSubId = subEntity.id;
    const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!subscription) return;

    subscription.mandateStatus = 'halted';
    subscription.lastPaymentStatus = 'failed';
    subscription.lastFailureReason = 'Recurring mandate halted: maximum retry attempts exhausted.';
    await subscription.save();

    await AutoPayAuditLog.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpaySubscriptionId: rzpSubId,
      event: 'MANDATE_HALTED',
      status: 'halted',
      details: 'Mandate halted due to repeated payment failures.',
      metadata: subEntity
    });

    const user = await User.findById(subscription.userId);
    const plan = await SubscriptionPlan.findById(subscription.planId);
    if (user) {
      await FCMService.sendPushNotification(
        subscription.userId.toString(),
        'Action Required: AutoPay Failed',
        'Recurring subscription payment could not be processed. Please update your payment method to continue access.',
        'General' as any
      ).catch(() => {});

      if (user.email && plan) {
        EmailService.sendAutoPayPaymentFailedEmail(
          user.email,
          user.name || 'Valued Patient',
          plan.name,
          subscription.recurringAmount || plan.yearlyPrice,
          'Max payment retries exceeded. Mandate halted.'
        ).catch(() => {});
      }
    }
  }

  /**
   * Handle: subscription.cancelled
   */
  private static async handleSubscriptionCancelled(eventPayload: any) {
    const subEntity = eventPayload?.payload?.subscription?.entity;
    if (!subEntity) return;

    const rzpSubId = subEntity.id;
    const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
    if (!subscription) return;

    subscription.autoPayEnabled = false;
    subscription.mandateStatus = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = 'Mandate cancelled via Razorpay';
    // NOTE: Current subscription period remains active until endDate!
    await subscription.save();

    await AutoPayAuditLog.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpaySubscriptionId: rzpSubId,
      event: 'MANDATE_CANCELLED',
      status: 'cancelled',
      details: 'Razorpay subscription mandate was cancelled. Access remains valid until expiry date.',
      metadata: subEntity
    });

    const user = await User.findById(subscription.userId);
    const plan = await SubscriptionPlan.findById(subscription.planId);
    if (user && user.email && plan) {
      EmailService.sendAutoPayDisabledEmail(
        user.email,
        user.name || 'Valued Patient',
        plan.name,
        subscription.endDate
      ).catch(() => {});
    }
  }

  /**
   * Handle: payment.failed
   */
  private static async handlePaymentFailed(eventPayload: any) {
    const paymentEntity = eventPayload?.payload?.payment?.entity;
    if (!paymentEntity) return;

    const paymentId = paymentEntity.id;
    const errorDesc = paymentEntity.error_description || paymentEntity.error_reason || 'Payment failed';
    const rzpSubId = paymentEntity.subscription_id || paymentEntity.notes?.subscription_id;

    if (rzpSubId) {
      const subscription = await UserSubscription.findOne({ razorpaySubscriptionId: rzpSubId });
      if (subscription) {
        subscription.lastPaymentStatus = 'failed';
        subscription.lastFailureReason = errorDesc;
        await subscription.save();

        await AutoPayAuditLog.create({
          userId: subscription.userId,
          subscriptionId: subscription._id,
          razorpaySubscriptionId: rzpSubId,
          razorpayPaymentId: paymentId,
          event: 'RECURRING_CHARGE_FAILED',
          status: 'failed',
          details: `Recurring payment attempt failed: ${errorDesc}`,
          metadata: paymentEntity
        });

        const user = await User.findById(subscription.userId);
        const plan = await SubscriptionPlan.findById(subscription.planId);
        if (user && user.email && plan) {
          EmailService.sendAutoPayPaymentFailedEmail(
            user.email,
            user.name || 'Valued Patient',
            plan.name,
            (paymentEntity.amount || 0) / 100,
            errorDesc
          ).catch(() => {});
        }
      }
    }
  }
}
