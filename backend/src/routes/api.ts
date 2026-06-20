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
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { requireSubscriptionFeature } from '../middlewares/subscriptionMiddleware';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

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
router.post('/auth/verify-otp', AuthController.verifyFirebaseToken);
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
// 3. ADMIN PORTAL ENDPOINTS
// ==========================================
router.post('/admin/auth/login', AdminController.login);
router.post('/admin/auth/register', AdminController.register);

// Admin Authorized Area
router.use('/admin', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']));

router.get('/admin/stats', AdminController.getStats);
router.get('/admin/users', AdminController.getUsers);
router.get('/admin/users/:id/activity', AdminController.getUserActivity);
router.get('/admin/users/:userId/coaching', CoachingController.getSessionsForUser);
router.put('/admin/users/:id/block', AdminController.toggleUserBlock);
router.delete('/admin/users/:id', AdminController.deleteUser);
router.delete('/admin/reports/:id', ReportController.deleteReportAsAdmin);

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

export default router;
