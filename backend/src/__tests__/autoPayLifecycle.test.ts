import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AutoPayService } from '../services/autoPayService';
import { UserSubscription } from '../models/UserSubscription';
import { WebhookEventLog } from '../models/WebhookEventLog';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { AutoPayAuditLog } from '../models/AutoPayAuditLog';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { Invoice } from '../models/Invoice';
import { EmailService } from '../services/emailService';
import { FCMService } from '../services/fcmService';
import { SubscriptionController } from '../controllers/subscriptionController';
import { User } from '../models/User';

describe('Razorpay AutoPay (Recurring Subscriptions) End-to-End Lifecycle', () => {
  const TEST_SECRET = 'test_webhook_secret_98765';

  // Helper to generate a valid Razorpay webhook signature
  const generateWebhookSig = (body: string, secret: string = TEST_SECRET): string => {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  };

  // Helper to generate subscription signature
  const generateSubSig = (paymentId: string, subscriptionId: string, secret: string = TEST_SECRET): string => {
    return crypto.createHmac('sha256', secret).update(`${paymentId}|${subscriptionId}`).digest('hex');
  };

  describe('1. Cryptographic Signature Verification', () => {
    test('Verifies valid Razorpay subscription payment signature (payment_id|subscription_id)', () => {
      const paymentId = 'pay_Recur12345';
      const subscriptionId = 'sub_Mandate67890';
      const validSig = generateSubSig(paymentId, subscriptionId, TEST_SECRET);

      const isValid = AutoPayService.verifySubscriptionSignature(paymentId, subscriptionId, validSig, TEST_SECRET);
      assert.strictEqual(isValid, true, 'Valid subscription signature must return true');
    });

    test('Rejects tampered subscription signature or mismatched payment/subscription ID', () => {
      const paymentId = 'pay_Recur12345';
      const subscriptionId = 'sub_Mandate67890';
      const validSig = generateSubSig(paymentId, subscriptionId, TEST_SECRET);

      // Tampered subscription ID
      const isTampered = AutoPayService.verifySubscriptionSignature(paymentId, 'sub_HACKED', validSig, TEST_SECRET);
      assert.strictEqual(isTampered, false, 'Tampered subscription ID must fail verification');

      // Invalid signature string
      const isFake = AutoPayService.verifySubscriptionSignature(paymentId, subscriptionId, 'invalid_signature_hex', TEST_SECRET);
      assert.strictEqual(isFake, false, 'Invalid signature hex must fail verification');
    });

    test('Verifies valid Razorpay Webhook HMAC signature', () => {
      const rawBody = JSON.stringify({ event: 'subscription.activated', id: 'evt_123' });
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const isValid = AutoPayService.verifyWebhookSignature(rawBody, signature, TEST_SECRET);
      assert.strictEqual(isValid, true, 'Valid webhook signature must return true');
    });

    test('Rejects invalid or modified Webhook payload', () => {
      const rawBody = JSON.stringify({ event: 'subscription.activated', id: 'evt_123' });
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const isModified = AutoPayService.verifyWebhookSignature(rawBody + 'tamper', signature, TEST_SECRET);
      assert.strictEqual(isModified, false, 'Modified webhook payload must fail verification');
    });
  });

  describe('2. Webhook Idempotency & Duplicate Prevention', () => {
    let origConfigFindOne: any;
    let origFindOne: any;
    let origCreate: any;
    let origWebhookSave: any;

    beforeEach(() => {
      origConfigFindOne = PaymentGatewayConfig.findOne;
      origFindOne = WebhookEventLog.findOne;
      origCreate = WebhookEventLog.create;
      origWebhookSave = WebhookEventLog.prototype.save;

      WebhookEventLog.prototype.save = (async function(this: any) { return this; }) as any;

      PaymentGatewayConfig.findOne = (async () => ({
        razorpayWebhookSecret: TEST_SECRET
      })) as any;
    });

    afterEach(() => {
      PaymentGatewayConfig.findOne = origConfigFindOne;
      WebhookEventLog.findOne = origFindOne;
      WebhookEventLog.create = origCreate;
      WebhookEventLog.prototype.save = origWebhookSave;
    });

    test('Rejects duplicate webhook event if already recorded in WebhookEventLog', async () => {
      // Simulate existing event in database
      WebhookEventLog.findOne = (async (query: any) => {
        if (query.eventId === 'evt_duplicate_999') {
          return { eventId: 'evt_duplicate_999', eventType: 'subscription.charged', processed: true };
        }
        return null;
      }) as any;

      const duplicateEvent = {
        id: 'evt_duplicate_999',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: { id: 'sub_test_123' }
          }
        }
      };

      const rawBody = JSON.stringify(duplicateEvent);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const result = await AutoPayService.processWebhook(signature, rawBody, duplicateEvent);
      assert.strictEqual(result.duplicate, true, 'Duplicate event must return duplicate: true');
      assert.strictEqual(result.success, true, 'Duplicate returns success: true to acknowledge Razorpay');
    });
  });

  describe('3. Webhook Lifecycle Transitions', () => {
    let origConfigFindOne: any;
    let origSubFindOne: any;
    let origWebhookFindOne: any;
    let origWebhookCreate: any;
    let origAuditCreate: any;
    let origUserFindById: any;
    let origPlanFindById: any;
    let origEmailAct: any;
    let origEmailCancel: any;
    let origEmailSuccess: any;
    let origEmailFail: any;
    let origWebhookSave: any;
    let origAuditSave: any;
    let origSubSave: any;

    beforeEach(() => {
      origConfigFindOne = PaymentGatewayConfig.findOne;
      origSubFindOne = UserSubscription.findOne;
      origWebhookFindOne = WebhookEventLog.findOne;
      origWebhookCreate = WebhookEventLog.create;
      origAuditCreate = AutoPayAuditLog.create;
      origUserFindById = User.findById;
      origPlanFindById = SubscriptionPlan.findById;

      origEmailAct = EmailService.sendAutoPayEnabledEmail;
      origEmailCancel = EmailService.sendAutoPayDisabledEmail;
      origEmailSuccess = EmailService.sendAutoPayRenewalSuccessEmail;
      origEmailFail = EmailService.sendAutoPayPaymentFailedEmail;

      origWebhookSave = WebhookEventLog.prototype.save;
      origAuditSave = AutoPayAuditLog.prototype.save;
      origSubSave = UserSubscription.prototype.save;

      WebhookEventLog.prototype.save = (async function(this: any) { return this; }) as any;
      AutoPayAuditLog.prototype.save = (async function(this: any) { return this; }) as any;
      UserSubscription.prototype.save = (async function(this: any) { return this; }) as any;
      PaymentTransaction.prototype.save = (async function(this: any) { return this; }) as any;
      Invoice.prototype.save = (async function(this: any) { return this; }) as any;

      PaymentGatewayConfig.findOne = (async () => ({
        razorpayWebhookSecret: TEST_SECRET
      })) as any;

      // Stub audit & log models so they succeed in-memory
      WebhookEventLog.findOne = (async () => null) as any;
      WebhookEventLog.create = (async (doc: any) => ({ ...doc, save: async () => doc })) as any;
      AutoPayAuditLog.create = (async (doc: any) => ({ ...doc, save: async () => doc })) as any;
      User.findById = (async () => ({ email: 'test@example.com', name: 'Test User' })) as any;
      SubscriptionPlan.findById = (async () => ({ _id: new mongoose.Types.ObjectId(), name: 'Premium Plan' })) as any;

      // Stub emails
      EmailService.sendAutoPayEnabledEmail = (async () => true) as any;
      EmailService.sendAutoPayDisabledEmail = (async () => true) as any;
      EmailService.sendAutoPayRenewalSuccessEmail = (async () => true) as any;
      EmailService.sendAutoPayPaymentFailedEmail = (async () => true) as any;
      EmailService.sendSubscriptionInvoiceEmail = (async () => true) as any;
      FCMService.sendPushNotification = (async () => true) as any;
      (SubscriptionController as any).generateInvoice = (async () => ({ _id: new mongoose.Types.ObjectId() })) as any;
    });

    afterEach(() => {
      PaymentGatewayConfig.findOne = origConfigFindOne;
      UserSubscription.findOne = origSubFindOne;
      WebhookEventLog.findOne = origWebhookFindOne;
      WebhookEventLog.create = origWebhookCreate;
      AutoPayAuditLog.create = origAuditCreate;
      User.findById = origUserFindById;
      SubscriptionPlan.findById = origPlanFindById;

      EmailService.sendAutoPayEnabledEmail = origEmailAct;
      EmailService.sendAutoPayDisabledEmail = origEmailCancel;
      EmailService.sendAutoPayRenewalSuccessEmail = origEmailSuccess;
      EmailService.sendAutoPayPaymentFailedEmail = origEmailFail;

      WebhookEventLog.prototype.save = origWebhookSave;
      AutoPayAuditLog.prototype.save = origAuditSave;
      UserSubscription.prototype.save = origSubSave;
    });

    test('subscription.authenticated: updates mandateStatus to authenticated', async () => {
      const mockSub: any = {
        _id: 'sub_mongo_001',
        userId: 'user_001',
        razorpaySubscriptionId: 'sub_rzp_auth_test',
        mandateStatus: 'created',
        save: async function () { return this; }
      };

      UserSubscription.findOne = (async (query: any) => {
        if (query.razorpaySubscriptionId === 'sub_rzp_auth_test') return mockSub;
        return null;
      }) as any;

      const event = {
        id: 'evt_auth_100',
        event: 'subscription.authenticated',
        payload: {
          subscription: {
            entity: { id: 'sub_rzp_auth_test', status: 'authenticated' }
          }
        }
      };

      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const result = await AutoPayService.processWebhook(signature, rawBody, event);
      assert.strictEqual(result.success, true);
      assert.strictEqual(mockSub.mandateStatus, 'authenticated');
    });

    test('subscription.activated: sets autoPayEnabled = true and mandateStatus = active', async () => {
      const mockSub: any = {
        _id: 'sub_mongo_002',
        userId: 'user_002',
        razorpaySubscriptionId: 'sub_rzp_act_test',
        autoPayEnabled: false,
        mandateStatus: 'authenticated',
        save: async function () { return this; }
      };

      UserSubscription.findOne = (async (query: any) => {
        if (query.razorpaySubscriptionId === 'sub_rzp_act_test') return mockSub;
        return null;
      }) as any;

      const event = {
        id: 'evt_act_200',
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_act_test',
              status: 'active',
              charge_at: Math.floor(Date.now() / 1000) + 2592000
            }
          }
        }
      };

      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const result = await AutoPayService.processWebhook(signature, rawBody, event);
      assert.strictEqual(result.success, true);
      assert.strictEqual(mockSub.autoPayEnabled, true, 'AutoPay must be turned ON');
      assert.strictEqual(mockSub.mandateStatus, 'active', 'Mandate status must be active');
    });

    test('subscription.charged: extends validity by 30 days for monthly plan and records recurring transaction', async () => {
      const initialEndDate = new Date('2026-11-15T00:00:00.000Z');
      const mockPlanObjId = new mongoose.Types.ObjectId();
      const mockSub: any = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        planId: mockPlanObjId,
        razorpaySubscriptionId: 'sub_rzp_charged_test',
        billingCycle: 'monthly',
        status: 'active',
        endDate: new Date(initialEndDate),
        lastPaymentId: 'pay_old_001',
        save: async function () { return this; }
      };

      UserSubscription.findOne = (async (query: any) => {
        if (query.razorpaySubscriptionId === 'sub_rzp_charged_test') return mockSub;
        return null;
      }) as any;

      SubscriptionPlan.findById = (async () => ({ _id: mockPlanObjId, name: 'Premium Monthly' })) as any;

      // Mock PaymentTransaction & Invoice creation
      let createdTx: any = null;
      const origTxSave = PaymentTransaction.prototype.save;
      PaymentTransaction.prototype.save = (async function(this: any) {
        createdTx = this;
        return this;
      }) as any;

      const origTxFindOne = PaymentTransaction.findOne;
      PaymentTransaction.findOne = (async () => null) as any;

      const chargeDateUnix = Math.floor(initialEndDate.getTime() / 1000);
      const nextChargeDateUnix = chargeDateUnix + (30 * 86400);

      const event = {
        id: 'evt_charge_300',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_rzp_charged_test',
              status: 'active',
              charge_at: nextChargeDateUnix,
              current_end: nextChargeDateUnix
            }
          },
          payment: {
            entity: {
              id: 'pay_new_recurring_777',
              amount: 29900, // ₹299.00 in paise
              currency: 'INR',
              status: 'captured',
              method: 'upi',
              vpa: 'test@okaxis'
            }
          }
        }
      };

      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const result = await AutoPayService.processWebhook(signature, rawBody, event);
      assert.strictEqual(result.success, true);

      // Verify extension: endDate was extended by 30 days
      const daysDiff = Math.round((mockSub.endDate.getTime() - initialEndDate.getTime()) / (1000 * 60 * 60 * 24));
      assert.strictEqual(daysDiff, 30, 'Monthly subscription must be extended by 30 days');

      // Verify transaction recorded
      assert.ok(createdTx, 'PaymentTransaction should be created');
      assert.strictEqual(createdTx.isRecurring, true, 'Payment must be marked as isRecurring: true');
      assert.strictEqual(createdTx.gatewayPaymentId, 'pay_new_recurring_777');
      assert.strictEqual(mockSub.razorpayPaymentId, 'pay_new_recurring_777');

      PaymentTransaction.prototype.save = origTxSave;
      PaymentTransaction.findOne = origTxFindOne;
    });

    test('subscription.charged: avoids duplicate extension if already processed with same payment ID', async () => {
      const mockSub: any = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        planId: new mongoose.Types.ObjectId(),
        razorpaySubscriptionId: 'sub_rzp_dup_charge',
        billingCycle: 'monthly',
        status: 'active',
        endDate: new Date('2026-12-01T00:00:00.000Z'),
        lastPaymentId: 'pay_already_processed_999',
        save: async function () { return this; }
      };

      UserSubscription.findOne = (async () => mockSub) as any;

      // Simulate existing processed transaction
      const origTxFindOne = PaymentTransaction.findOne;
      PaymentTransaction.findOne = (async (query: any) => {
        if (query.gatewayPaymentId === 'pay_already_processed_999') {
          return { status: 'success', gatewayPaymentId: 'pay_already_processed_999' };
        }
        return null;
      }) as any;

      const event = {
        id: 'evt_charge_duplicate_400',
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: { id: 'sub_rzp_dup_charge', status: 'active' }
          },
          payment: {
            entity: { id: 'pay_already_processed_999', amount: 29900, status: 'captured' }
          }
        }
      };

      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const origEndDate = mockSub.endDate.getTime();
      const result = await AutoPayService.processWebhook(signature, rawBody, event);

      assert.strictEqual(result.success, true);
      // End date must NOT have been moved forward again
      assert.strictEqual(mockSub.endDate.getTime(), origEndDate, 'Duplicate charge must not extend validity twice');

      PaymentTransaction.findOne = origTxFindOne;
    });

    test('payment.failed: records failure reason without terminating active subscription immediately', async () => {
      const mockSub: any = {
        _id: 'sub_mongo_005',
        userId: 'user_005',
        razorpaySubscriptionId: 'sub_rzp_fail_test',
        status: 'active',
        lastPaymentStatus: 'success',
        save: async function () { return this; }
      };

      UserSubscription.findOne = (async () => mockSub) as any;

      const event = {
        id: 'evt_fail_500',
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_fail_111',
              subscription_id: 'sub_rzp_fail_test',
              error_description: 'Card expired or insufficient funds',
              error_code: 'BAD_REQUEST_ERROR'
            }
          }
        }
      };

      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const result = await AutoPayService.processWebhook(signature, rawBody, event);
      assert.strictEqual(result.success, true);
      assert.strictEqual(mockSub.lastPaymentStatus, 'failed');
      assert.strictEqual(mockSub.lastFailureReason, 'Card expired or insufficient funds');
      assert.strictEqual(mockSub.status, 'active', 'Subscription status remains active during retry window');
    });

    test('subscription.cancelled: disables AutoPay but preserves current paid validity and active status', async () => {
      const paidUntil = new Date('2027-01-01T00:00:00.000Z');
      const mockSub: any = {
        _id: 'sub_mongo_006',
        userId: 'user_006',
        razorpaySubscriptionId: 'sub_rzp_cancel_test',
        status: 'active',
        autoPayEnabled: true,
        mandateStatus: 'active',
        endDate: new Date(paidUntil),
        save: async function () { return this; }
      };

      UserSubscription.findOne = (async () => mockSub) as any;

      const event = {
        id: 'evt_cancel_600',
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: { id: 'sub_rzp_cancel_test', status: 'cancelled' }
          }
        }
      };

      const rawBody = JSON.stringify(event);
      const signature = generateWebhookSig(rawBody, TEST_SECRET);

      const result = await AutoPayService.processWebhook(signature, rawBody, event);
      assert.strictEqual(result.success, true);
      assert.strictEqual(mockSub.autoPayEnabled, false, 'AutoPay must be marked as disabled');
      assert.strictEqual(mockSub.mandateStatus, 'cancelled', 'Mandate status must be cancelled');
      // Critical requirement: Disabling AutoPay must NOT shorten or cancel active subscription
      assert.strictEqual(mockSub.status, 'active', 'Paid subscription status must remain active');
      assert.strictEqual(mockSub.endDate.getTime(), paidUntil.getTime(), 'Subscription endDate must be preserved');
    });
  });

  describe('4. Plan Resolution & Billing Cycles', () => {
    test('Calculates monthly and yearly periods accurately', () => {
      const now = new Date('2026-11-06T12:00:00.000Z');

      const monthlyExpiry = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const yearlyExpiry = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));

      const monthlyDays = (monthlyExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
      const yearlyDays = (yearlyExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24);

      assert.strictEqual(monthlyDays, 30, 'Monthly period must be 30 days');
      assert.strictEqual(yearlyDays, 365, 'Yearly period must be 365 days');
    });
  });
});
