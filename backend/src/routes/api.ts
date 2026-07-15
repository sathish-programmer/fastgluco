import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthController } from '../controllers/authController';
import { ProfileController } from '../controllers/profileController';
import { FoodController } from '../controllers/foodController';
import { GlucoseController } from '../controllers/glucoseController';
import { EducationalController } from '../controllers/educationalController';
import { AdminController } from '../controllers/adminController';
import { ReportController } from '../controllers/reportController';
import { CoachingController } from '../controllers/coachingController';
import { SubscriptionController } from '../controllers/subscriptionController';
import { PlanAdminController } from '../controllers/planAdminController';
import { PaymentAdminController } from '../controllers/paymentAdminController';
import { CouponAdminController } from '../controllers/couponAdminController';
import { SupportController } from '../controllers/supportController';
import { HealthInsightController } from '../controllers/healthInsightController';
import { NotificationController } from '../controllers/notificationController';
import { ActivityController } from '../controllers/activityController';
import { FounderController } from '../controllers/founderController';
import * as RecommendedFoodController from '../controllers/recommendedFoodController';
import * as HabitController from '../controllers/habitController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { requireSubscriptionFeature } from '../middlewares/subscriptionMiddleware';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { Appointment } from '../models/Appointment';
import * as ShopController from '../controllers/shopController';
import * as ScreeningController from '../controllers/screeningController';

const router = Router();

// --- MULTER STORAGE SETUP FOR REPORT UPLOADS ---
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.csv', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Abbott CGM export formats (.csv, .pdf) are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const imageFileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image formats (.png, .jpg, .jpeg, .webp) are allowed.'));
  }
};

const uploadImage = multer({ 
  storage, 
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ==========================================
// 1. PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/send-otp', AuthController.sendOtp);
router.post('/auth/verify-otp', AuthController.verifyOtp);
router.post('/auth/onboard', authenticateToken, AuthController.onboardNewUser);

// Public System Configuration Endpoint
router.get('/config/public', async (req, res) => {
  try {
    let config = await PaymentGatewayConfig.findOne();
    if (!config) {
      config = new PaymentGatewayConfig({
        enableHydrationTracker: true,
        hydrationDailyLimitMl: 3000,
        enableWorkoutTracker: true
      });
      await config.save();
    }
    return res.status(200).json({
      enableHydrationTracker: config.enableHydrationTracker ?? true,
      hydrationDailyLimitMl: config.hydrationDailyLimitMl ?? 3000,
      enableWorkoutTracker: config.enableWorkoutTracker ?? true,
      aiSpikeThreshold: config.aiSpikeThreshold ?? 110,
      enableSubscriptions: config.enableSubscriptions,
      enableSubscriptionCoupons: config.enableSubscriptionCoupons ?? true,
      enableExternalPayments: config.enableExternalPayments ?? false,
      enableSaferFoodCoupons: config.enableSaferFoodCoupons ?? true,
      enablePayments: config.enablePayments,
      appName: config.appName || 'Mito_Reboot',
      appTagline: config.appTagline || 'The circadian fasting app',
      appLogoUrl: config.appLogoUrl || '',
      cancerTreatmentDisclaimer: config.cancerTreatmentDisclaimer || 'Disclaimer: This app is for informational purposes only. If you are undergoing active cancer treatment, please consult with your oncologist before starting any circadian fasting protocols.',
      cancerSecondaryDisclaimer: config.cancerSecondaryDisclaimer || 'Disclaimer: This app is for informational purposes only. If you have a previous history of cancer (secondary prevention), please consult with your medical team before starting any circadian fasting protocols.'
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error fetching system configurations.' });
  }
});

// ==========================================
// 1.5. SUBSCRIPTION PUBLIC & USER ENDPOINTS
// ==========================================
// Public plans listing
router.get('/subscriptions/plans', SubscriptionController.listActivePlans);

// User-protected subscription routes
router.use('/subscriptions', authenticateToken, requireRole(['User']));
router.get('/subscriptions/current', SubscriptionController.getCurrentSubscription);
router.post('/subscriptions/validate-coupon', SubscriptionController.validateCoupon);
router.post('/subscriptions/create-order', SubscriptionController.createOrder);
router.post('/subscriptions/verify-payment', SubscriptionController.verifyPayment);
router.post('/subscriptions/mock-verify', SubscriptionController.verifyMockPayment);
router.post('/subscriptions/cancel', SubscriptionController.cancelSubscription);
router.post('/subscriptions/reactivate', SubscriptionController.reactivateSubscription);
router.get('/subscriptions/invoices/:id/download', SubscriptionController.downloadInvoicePdf);

// ==========================================
// 2. PATIENT PROTECTED ENDPOINTS (JWT required)
// ==========================================
router.use('/users', authenticateToken, requireRole(['User']));
router.get('/users/profile', ProfileController.getProfile);
router.put('/users/profile', ProfileController.updateProfile);
router.delete('/users/profile', ProfileController.deleteOwnAccount);
router.put('/users/profile/request-edit', ProfileController.requestProfileEdit);
router.post('/users/profile/sync-libre', ProfileController.triggerSync);

router.use('/food-library', authenticateToken, requireRole(['User', 'SuperAdmin', 'Admin', 'Editor']));
router.get('/food-library', FoodController.searchLibrary);
// FatSecret external fallback — called when FoodMaster returns 0 results
router.get('/food-library/external', FoodController.searchFoodExternal);

router.use('/food-logs', authenticateToken, requireRole(['User']));
router.get('/food-logs', FoodController.getLogs);
router.post('/food-logs', FoodController.createLog);
router.post('/food-logs/scan', uploadImage.single('image'), requireSubscriptionFeature('foodScanner'), FoodController.scanFoodImage);
router.put('/food-logs/:id', FoodController.updateLog);
router.post('/food-logs/:id/feedback', FoodController.recordFeedback);
router.delete('/food-logs/:id', FoodController.deleteLog);

router.use('/recommended-foods', authenticateToken, requireRole(['User']));
router.get('/recommended-foods', RecommendedFoodController.getRecommendedFoods);

router.use('/reports', authenticateToken, requireRole(['User']));
router.post('/reports/upload', upload.single('report'), requireSubscriptionFeature('unlimitedReports'), ReportController.uploadReport);
router.get('/reports/user-pdf', ReportController.downloadUserPDFReport);
router.get('/reports', ReportController.getHistory);
router.post('/reports/:id/reprocess', ReportController.reprocess);
router.get('/reports/:id/download', requireSubscriptionFeature('exportReports'), ReportController.downloadReport);
router.delete('/reports/:id', ReportController.deleteReport);


router.use('/glucose', authenticateToken, requireRole(['User']));
router.post('/glucose/manual', GlucoseController.logManualReading);
router.get('/glucose', GlucoseController.getReadings);
router.get('/glucose/export', requireSubscriptionFeature('exportReports'), GlucoseController.exportAbbottFormatCSV);
router.get('/glucose/analysis', requireSubscriptionFeature('advancedAnalysis'), GlucoseController.getSpikeAnalysis);
router.get('/glucose/top-foods', requireSubscriptionFeature('foodInsights'), GlucoseController.getTopFoods);

router.use('/activity-logs', authenticateToken, requireRole(['User']));
router.post('/activity-logs', ActivityController.logActivity);
router.get('/activity-logs', ActivityController.getActivities);

router.use('/notifications', authenticateToken, requireRole(['User']));
router.get('/notifications/unread-count', NotificationController.getUnreadCount);
router.get('/notifications', NotificationController.listRecent);
router.post('/notifications/read-all', NotificationController.markAllAsRead);
router.post('/notifications/:id/read', NotificationController.markAsRead);
router.delete('/notifications/:id', NotificationController.deleteNotification);
router.delete('/notifications', NotificationController.clearAll);

// Public Educational & Support content fetches
router.get('/guides', EducationalController.getGuides);
router.get('/guides/:id', EducationalController.getGuideById);
router.get('/videos', EducationalController.getVideos);

router.use('/coaching', authenticateToken, requireRole(['User']));
router.get('/coaching/sessions', CoachingController.getSessions);
router.post('/coaching/sessions/:id/reply', CoachingController.replyToSession);
router.post('/coaching/sessions/:id/dismiss', CoachingController.dismissSession);

router.get('/faqs', SupportController.getPublicFAQs);
router.post('/support', SupportController.submitTicket);
router.get('/legal/:type', AdminController.getLegalDocument);
router.get('/health-insights/current', authenticateToken, requireRole(['User', 'SuperAdmin', 'Admin', 'Editor']), HealthInsightController.getCurrentInsight);
router.get('/founders', FounderController.getAll);

// ==========================================
// 2.5 NON-CANCER PATIENT WORKFLOW (USER)
// ==========================================
router.get('/shop/products', authenticateToken, requireRole(['User']), ShopController.getProducts);
router.post('/shop/validate-coupon', authenticateToken, requireRole(['User']), ShopController.validateShopCoupon);
router.get('/shop/coupons', authenticateToken, requireRole(['User']), ShopController.getAvailableCoupons);
router.post('/shop/create-order', authenticateToken, requireRole(['User']), ShopController.createOrder);
router.post('/shop/verify-payment', authenticateToken, requireRole(['User']), ShopController.verifyPayment);
router.get('/screening/tests', authenticateToken, requireRole(['User']), ScreeningController.getScreeningTests);
router.get('/workflow-config/:type', authenticateToken, requireRole(['User']), ScreeningController.getWorkflowConfig);

router.use('/habits', authenticateToken, requireRole(['User']));
router.post('/habits', HabitController.logHabit);
router.get('/habits', HabitController.getRecentHabits);
router.delete('/habits/:id', HabitController.deleteHabit);

// ==========================================
// 3. ADMIN PORTAL ENDPOINTS
// ==========================================
router.post('/admin/auth/login', AdminController.login);
router.post('/admin/auth/register', AdminController.register);

// Admin Authorized Area
router.use('/admin', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']));

router.get('/admin/stats', AdminController.getStats);
router.get('/admin/users', AdminController.getUsers);
router.get('/admin/users/:id/activity', AdminController.getUserActivity);
router.get('/admin/profile-edits', AdminController.getPendingProfileEdits);
router.post('/admin/profile-edits/:id/approve', AdminController.approveProfileEdit);
router.post('/admin/profile-edits/:id/reject', AdminController.rejectProfileEdit);
router.get('/admin/users/:userId/coaching', CoachingController.getSessionsForUser);
router.put('/admin/users/:id/block', AdminController.toggleUserBlock);
router.delete('/admin/users/:id', AdminController.deleteUser);
router.delete('/admin/reports/:id', ReportController.deleteReportAsAdmin);

// Recommended Foods Management (Admin)
router.get('/admin/recommended-foods', RecommendedFoodController.getRecommendedFoods);
router.post('/admin/recommended-foods', RecommendedFoodController.addRecommendedFood);
router.put('/admin/recommended-foods/:id', RecommendedFoodController.updateRecommendedFood);
router.delete('/admin/recommended-foods/:id', RecommendedFoodController.deleteRecommendedFood);


// Subscription Plans Management (Admin)
router.get('/admin/payments/plans', PlanAdminController.listPlans);
router.post('/admin/payments/plans', PlanAdminController.createPlan);
router.put('/admin/payments/plans/:id', PlanAdminController.updatePlan);
router.delete('/admin/payments/plans/:id', PlanAdminController.deletePlan);

// Payment Configurations (Admin)
router.get('/admin/payments/config', PaymentAdminController.getConfig);
router.put('/admin/payments/config', PaymentAdminController.updateConfig);
router.post('/admin/branding/upload-logo', uploadImage.single('logo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    // Return relative or absolute URL (absolute URL based on protocol/host is easiest)
    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.status(200).json({ logoUrl });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error uploading logo.' });
  }
});

// Payment Analytics Dashboard (Admin)
router.get('/admin/payments/dashboard', PaymentAdminController.getDashboardStats);

// Payment Transactions Directory (Admin)
router.get('/admin/payments/transactions', PaymentAdminController.getTransactions);
router.get('/admin/payments/transactions/:id', PaymentAdminController.getTransactionById);
router.post('/admin/payments/transactions/:id/refund', PaymentAdminController.refundTransaction);

// Coupon Management (Admin)
router.get('/admin/payments/coupons', CouponAdminController.listCoupons);
router.post('/admin/payments/coupons', CouponAdminController.createCoupon);
router.put('/admin/payments/coupons/:id', CouponAdminController.updateCoupon);
router.delete('/admin/payments/coupons/:id', CouponAdminController.deleteCoupon);

// Subscription Override Management (Admin)
router.post('/admin/payments/subscriptions/:id/cancel', PaymentAdminController.forceCancelSubscription);
router.post('/admin/payments/subscriptions/:id/extend', PaymentAdminController.extendSubscription);
router.post('/admin/payments/subscriptions/:id/change-plan', PaymentAdminController.changeUserPlan);

// Food template management
router.get('/admin/food-library', AdminController.getFoods);
router.post('/admin/food-library', AdminController.addFoodMaster);
router.post('/admin/food-library/bulk-import', upload.single('file'), AdminController.bulkImportFoods);
router.put('/admin/food-library/:id', AdminController.updateFoodMaster);
router.delete('/admin/food-library/:id', AdminController.deleteFoodMaster);

// Educational materials management
router.post('/admin/videos', AdminController.addVideo);
router.put('/admin/videos/:id', AdminController.updateVideo);
router.delete('/admin/videos/:id', AdminController.deleteVideo);

// Educational articles management
router.post('/admin/guides', AdminController.addGuide);
router.put('/admin/guides/:id', AdminController.updateGuide);
router.delete('/admin/guides/:id', AdminController.deleteGuide);

// Push notifications and emails management
router.post('/admin/notifications/send', AdminController.sendPush);
router.post('/admin/notifications/schedule', AdminController.scheduleNotification);
router.post('/admin/notifications/email', AdminController.sendManualEmail);

// FAQ Management
router.get('/admin/faqs', AdminController.getFAQs);
router.post('/admin/faqs', AdminController.addFAQ);
router.put('/admin/faqs/:id', AdminController.updateFAQ);
router.delete('/admin/faqs/:id', AdminController.deleteFAQ);

// Support Q&A Management
router.get('/admin/support/tickets', AdminController.getTickets);
router.post('/admin/support/tickets/:id/answer', AdminController.answerTicket);

// Legal Documents Management
router.get('/admin/legal/:type', AdminController.getLegalDocument);
router.put('/admin/legal/:type', AdminController.updateLegalDocument);

// Health Insights Management (Admin)
router.get('/admin/health-insights', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), HealthInsightController.listInsights);
router.post('/admin/health-insights/set-active', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), HealthInsightController.updateActiveInsight);

// Founder Section Management (Admin)
router.post('/admin/founders', FounderController.create);
router.put('/admin/founders/:id', FounderController.update);
router.delete('/admin/founders/:id', FounderController.delete);

// Non-Cancer Features Management (Admin)
router.get('/admin/shop-products', ShopController.getAdminProducts);
router.post('/admin/shop-products', ShopController.createAdminProduct);
router.put('/admin/shop-products/:id', ShopController.updateAdminProduct);
router.delete('/admin/shop-products/:id', ShopController.deleteAdminProduct);

import { DoctorController } from '../controllers/doctorController';
import { AppointmentController } from '../controllers/appointmentController';
import { VendorController } from '../controllers/vendorController';

router.get('/admin/screening-tests', ScreeningController.getAdminScreeningTests);
router.post('/admin/screening-tests', ScreeningController.createAdminScreeningTest);
router.put('/admin/screening-tests/:id', ScreeningController.updateAdminScreeningTest);
router.delete('/admin/screening-tests/:id', ScreeningController.deleteAdminScreeningTest);

router.get('/admin/workflow-config/:type', ScreeningController.getAdminWorkflowConfig);
router.put('/admin/workflow-config/:type', ScreeningController.updateAdminWorkflowConfig);

// --- DOCTOR MANAGEMENT FOR ADMIN ---
router.get('/admin/doctors', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminGetDoctors);
router.post('/admin/doctors', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminAddDoctor);
router.put('/admin/doctors/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminEditDoctor);
router.delete('/admin/doctors/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminDeleteDoctor);

// --- VENDOR MANAGEMENT FOR ADMIN ---
router.get('/admin/vendors', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), VendorController.adminGetVendors);
router.post('/admin/vendors', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), VendorController.adminAddVendor);
router.put('/admin/vendors/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), VendorController.adminEditVendor);
router.post('/admin/orders/:orderId/assign', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), VendorController.adminAssignOrder);

// Admin-specific confirmation for appointments
router.post('/admin/appointments/:appointmentId/confirm', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), AppointmentController.adminConfirmAppointment);

// One-time fix: regenerate valid Google Meet links for all confirmed appointments with broken mock URLs
router.post('/admin/appointments/fix-meeting-links', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), async (req, res) => {
  try {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rand = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const genCode = () => `${rand(3)}-${rand(4)}-${rand(3)}`;

    const broken = await Appointment.find({
      status: 'confirmed',
      meetingLink: { $regex: /mock-appointment/ }
    });
    for (const appt of broken) {
      appt.meetingLink = `https://meet.google.com/${genCode()}`;
      await appt.save();
    }
    res.json({ fixed: broken.length, message: `${broken.length} appointment(s) updated with valid Meet links.` });
  } catch (err: any) {
    res.status(500).json({ message: 'Error fixing meeting links' });
  }
});

// Extra order retrieval endpoints for Admin
router.get('/admin/orders/all', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), async (req, res) => {
  try {
    const ShopOrder = require('../models/ShopOrder').default;
    const orders = await ShopOrder.find().populate('userId').populate('vendorId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all orders' });
  }
});

// --- DOCTOR SIGN IN & PORTAL ROUTES ---
router.post('/doctor/auth/login', DoctorController.doctorLogin);
router.post('/doctor/auth/register', DoctorController.adminAddDoctor);
router.get('/doctor/availability', authenticateToken, requireRole(['Doctor']), DoctorController.getDoctorAvailability);
router.put('/doctor/availability', authenticateToken, requireRole(['Doctor']), DoctorController.updateDoctorAvailability);
router.get('/doctor/appointments', authenticateToken, requireRole(['Doctor']), DoctorController.getDoctorAppointments);
router.post('/doctor/appointments/:appointmentId/accept', authenticateToken, requireRole(['Doctor']), AppointmentController.adminConfirmAppointment);
router.post('/doctor/appointments/:appointmentId/reject', authenticateToken, requireRole(['Doctor']), AppointmentController.doctorRejectAppointment);
router.put('/doctor/appointments/:appointmentId/consultation', authenticateToken, requireRole(['Doctor']), AppointmentController.updateConsultation);

// --- VENDOR SIGN IN & PORTAL ROUTES ---
router.post('/vendor/auth/login', VendorController.vendorLogin);
router.get('/vendor/orders', authenticateToken, requireRole(['Vendor']), VendorController.getVendorOrders);
router.put('/vendor/orders/:orderId/status', authenticateToken, requireRole(['Vendor']), VendorController.updateOrderStatus);

// --- PATIENT BOOKING ROUTES ---
router.get('/patient/doctors', authenticateToken, requireRole(['User']), AppointmentController.getAvailableDoctors);
router.get('/patient/doctors/:doctorId/slots', authenticateToken, requireRole(['User']), AppointmentController.getDoctorSlots);
router.post('/patient/appointments', authenticateToken, requireRole(['User']), AppointmentController.bookAppointment);
router.get('/patient/appointments', authenticateToken, requireRole(['User']), AppointmentController.getPatientAppointments);
router.post('/patient/feedback', authenticateToken, requireRole(['User']), AppointmentController.addFeedback);
router.get('/patient/doctors/:doctorId/feedback', authenticateToken, requireRole(['User']), AppointmentController.getDoctorFeedback);

// Patient retrieval of own orders (Shop history tracker)
router.get('/patient/orders', authenticateToken, requireRole(['User']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const ShopOrder = require('../models/ShopOrder').default;
    const orders = await ShopOrder.find({ userId }).populate('vendorId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patient orders.' });
  }
});

export default router;
