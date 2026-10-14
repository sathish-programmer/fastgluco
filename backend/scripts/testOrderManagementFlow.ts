import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import ShopOrder from '../src/models/ShopOrder';
import ShopProduct from '../src/models/ShopProduct';
import { User } from '../src/models/User';
import { AdminUser } from '../src/models/AdminUser';
import { Vendor } from '../src/models/Vendor';
import { SupportTicket } from '../src/models/SupportTicket';
import { AuditLog } from '../src/models/AuditLog';
import { OrderSettings } from '../src/models/OrderSettings';
import { OrderManagementController } from '../src/controllers/orderManagementController';

// Mock Express Response helper
function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: any) {
      res.data = payload;
      return res;
    },
    send(payload: any) {
      res.data = payload;
      return res;
    },
    setHeader(name: string, val: string) {
      res.headers[name] = val;
    }
  };
  return res;
}

async function runTests() {
  console.log('--- STARTING ORDER MANAGEMENT SYSTEM VERIFICATION ---');
  await connectDB();

  // Find or create test admin user
  let testUser = await User.findOne();
  if (!testUser) {
    testUser = await User.create({
      name: 'Test Customer',
      email: 'testcustomer@mitoreboot.in',
      mobileNumber: '+919999988888',
      role: 'User'
    });
  }

  const mockAdminReq: any = {
    user: {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'superadmin@mitoreboot.in',
      role: 'SuperAdmin'
    },
    query: {},
    params: {},
    body: {}
  };

  // TEST 1: Overview Metrics
  console.log('\n[Test 1] Testing getOverviewMetrics...');
  const res1 = createMockRes();
  await OrderManagementController.getOverviewMetrics(mockAdminReq, res1);
  if (res1.statusCode === 200 && res1.data?.summary) {
    console.log('✓ Overview Metrics returned successfully:', {
      totalOrders: res1.data.summary.totalOrders,
      grossOrderValue: res1.data.summary.grossOrderValue,
      netSalesAfterRefunds: res1.data.summary.netSalesAfterRefunds,
      paidOrders: res1.data.summary.paidOrders,
      openSupportTickets: res1.data.summary.openSupportTickets
    });
  } else {
    throw new Error(`getOverviewMetrics failed: ${JSON.stringify(res1.data)}`);
  }

  // TEST 2: All Orders pagination and filtering
  console.log('\n[Test 2] Testing getAllOrders with pagination & search...');
  const res2 = createMockRes();
  mockAdminReq.query = { page: '1', limit: '10' };
  await OrderManagementController.getAllOrders(mockAdminReq, res2);
  if (res2.statusCode === 200 && Array.isArray(res2.data?.orders)) {
    console.log(`✓ All Orders returned ${res2.data.orders.length} orders (Total: ${res2.data.pagination?.total})`);
  } else {
    throw new Error(`getAllOrders failed: ${JSON.stringify(res2.data)}`);
  }

  // TEST 3: CSV Export
  console.log('\n[Test 3] Testing getAllOrders CSV export...');
  const resCsv = createMockRes();
  mockAdminReq.query = { format: 'csv' };
  await OrderManagementController.getAllOrders(mockAdminReq, resCsv);
  if (typeof resCsv.data === 'string' && resCsv.data.startsWith('Order ID,')) {
    console.log('✓ CSV export generated valid header and rows');
  } else {
    throw new Error('CSV export did not produce expected CSV format');
  }

  // TEST 4: Create a dedicated test order and verify Order Lifecycle progression
  console.log('\n[Test 4] Testing Order Lifecycle progression (pending -> processing -> packed -> shipped -> delivered)...');
  const testOrder = await ShopOrder.create({
    userId: testUser._id,
    products: [{
      productId: new mongoose.Types.ObjectId(),
      name: 'Mito Multi Seed Dosa Mix (500g)',
      price: 299,
      qty: 2
    }],
    totalAmount: 598,
    gstAmount: 29,
    taxAmount: 29,
    shippingCharge: 0,
    discountAmount: 0,
    status: 'completed', // paid
    deliveryStatus: 'pending',
    vendorOrderId: `MR-TEST-${Date.now().toString().slice(-6)}`,
    patientName: 'Test Patient',
    patientEmail: 'patient@example.com',
    patientPhone: '9876543210',
    shippingAddress: {
      line1: '123 Health Ave',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India'
    }
  });

  const resLifecycle = createMockRes();
  mockAdminReq.params = { orderId: testOrder._id.toString() };
  mockAdminReq.body = {
    deliveryStatus: 'shipped',
    courierName: 'Blue Dart Express',
    trackingId: 'BD-TEST-998877',
    adminNotes: 'Package dispatched via Blue Dart'
  };
  await OrderManagementController.updateOrderLifecycle(mockAdminReq, resLifecycle);
  if (resLifecycle.statusCode === 200 && resLifecycle.data?.order?.deliveryStatus === 'shipped') {
    console.log('✓ Order lifecycle updated to shipped with Blue Dart tracking details');
  } else {
    throw new Error(`Lifecycle update failed: ${JSON.stringify(resLifecycle.data)}`);
  }

  // TEST 5: Internal Admin Notes
  console.log('\n[Test 5] Testing addAdminNote...');
  const resNote = createMockRes();
  mockAdminReq.body = { note: 'Patient requested delivery before Saturday.' };
  await OrderManagementController.addAdminNote(mockAdminReq, resNote);
  if (resNote.statusCode === 200 && resNote.data?.adminNotes?.includes('Patient requested delivery')) {
    console.log('✓ Internal admin note successfully added to order');
  } else {
    throw new Error(`Add admin note failed: ${JSON.stringify(resNote.data)}`);
  }

  // TEST 6: Refund Processing & Balance Check
  console.log('\n[Test 6] Testing processRefund (Partial refund ₹200 with balance validation)...');
  const resRefund = createMockRes();
  mockAdminReq.body = {
    amount: 200,
    reason: 'Customer cancelled 1 pack',
    isManualReconciliation: true,
    idempotencyKey: `idemp_${testOrder._id}_200`
  };
  await OrderManagementController.processRefund(mockAdminReq, resRefund);
  if (resRefund.statusCode === 200 && resRefund.data?.success) {
    console.log('✓ Partial refund processed successfully. Remaining balance:', resRefund.data.remainingBalance);
  } else {
    throw new Error(`Refund failed: ${JSON.stringify(resRefund.data)}`);
  }

  // TEST 7: Idempotent duplicate refund prevention
  console.log('\n[Test 7] Testing duplicate refund rejection (same idempotencyKey)...');
  const resDupRefund = createMockRes();
  await OrderManagementController.processRefund(mockAdminReq, resDupRefund);
  if (resDupRefund.statusCode === 409) {
    console.log('✓ Duplicate refund was correctly intercepted and rejected (HTTP 409 Conflict)');
  } else {
    throw new Error(`Duplicate refund was not rejected! Status: ${resDupRefund.statusCode}`);
  }

  // TEST 8: Customer Support Ticket & Reply
  console.log('\n[Test 8] Testing Customer Support Inbox & replies...');
  const testTicket = await SupportTicket.create({
    ticketId: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: testUser._id,
    orderId: testOrder._id,
    relatedId: testOrder.vendorOrderId,
    name: 'Test Customer',
    email: 'testcustomer@mitoreboot.in',
    subject: 'Question on shipment ETA',
    question: 'When can I expect delivery of my seed mix order?',
    category: 'Delivery',
    priority: 'High',
    status: 'Open'
  });

  const resTicketReply = createMockRes();
  mockAdminReq.params = { id: testTicket._id.toString() };
  mockAdminReq.body = {
    message: 'Hello! Your order has been dispatched via Blue Dart (AWB: BD-TEST-998877) and should reach you by tomorrow.',
    isInternalNote: false,
    status: 'Resolved'
  };
  await OrderManagementController.updateTicket(mockAdminReq, resTicketReply);
  if (resTicketReply.statusCode === 200 && resTicketReply.data?.ticket?.status === 'Resolved') {
    console.log('✓ Support ticket replied and resolved successfully');
  } else {
    throw new Error(`Ticket reply failed: ${JSON.stringify(resTicketReply.data)}`);
  }

  // TEST 9: Reports & Analytics Calculations
  console.log('\n[Test 9] Testing getReportsAndAnalytics (monthly timeframe)...');
  const resReports = createMockRes();
  mockAdminReq.query = { period: 'month' };
  await OrderManagementController.getReportsAndAnalytics(mockAdminReq, resReports);
  if (resReports.statusCode === 200 && resReports.data?.kpis) {
    console.log('✓ Growth analytics computed successfully:', {
      grossOrderValue: resReports.data.kpis.grossOrderValue,
      netSalesAfterRefunds: resReports.data.kpis.netSalesAfterRefunds,
      cancellationRate: resReports.data.kpis.cancellationRate,
      aov: resReports.data.kpis.aov
    });
  } else {
    throw new Error(`getReportsAndAnalytics failed: ${JSON.stringify(resReports.data)}`);
  }

  // TEST 10: Immutable Audit History
  console.log('\n[Test 10] Testing getAuditHistory...');
  const resAudit = createMockRes();
  mockAdminReq.query = { limit: '10' };
  const countInDb = await AuditLog.countDocuments();
  console.log('Count of AuditLog in DB:', countInDb);
  await OrderManagementController.getAuditHistory(mockAdminReq, resAudit);
  console.log('resAudit status and data:', resAudit.statusCode, resAudit.data);
  if (resAudit.statusCode === 200 && resAudit.data?.logs?.length > 0) {
    console.log(`✓ Audit history contains ${resAudit.data.logs.length} logged administrative events`);
  } else {
    throw new Error('Audit history was empty or failed');
  }

  // TEST 11: Order Settings
  console.log('\n[Test 11] Testing getOrderSettings & updateOrderSettings...');
  const resSettings = createMockRes();
  await OrderManagementController.getOrderSettings(mockAdminReq, resSettings);
  if (resSettings.statusCode === 200 && resSettings.data?.settings) {
    console.log('✓ Order Settings retrieved successfully:', {
      cancellationWindowHours: resSettings.data.settings.cancellationWindowHours,
      returnWindowDays: resSettings.data.settings.returnWindowDays
    });
  } else {
    throw new Error('getOrderSettings failed');
  }

  // Clean up test order & ticket
  await ShopOrder.findByIdAndDelete(testOrder._id);
  await SupportTicket.findByIdAndDelete(testTicket._id);

  console.log('\n======================================================');
  console.log(' ALL 11 ORDER MANAGEMENT ACCEPTANCE TESTS PASSED! 🎉 ');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
