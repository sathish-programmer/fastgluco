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
import { ConsultationController } from '../controllers/ConsultationController';
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
import { ShopReportController } from '../controllers/shopReportController';
import { DoctorController } from '../controllers/doctorController';
import { AppointmentController } from '../controllers/appointmentController';
import { VendorController } from '../controllers/vendorController';
import * as AdminReviewController from '../controllers/adminReviewController';
import { assignLabBookingDoctor } from '../controllers/labController';
import { IndianCancerController } from '../controllers/indianCancerController';

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

const mediaUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for video files
});

router.post('/admin/upload-media', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), mediaUpload.single('file'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ==========================================
// 1. PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/send-otp', AuthController.sendOtp);
router.post('/auth/verify-otp', AuthController.verifyOtp);
router.post('/auth/onboard', authenticateToken, AuthController.onboardNewUser);

// Public System Configuration Endpoint
router.get('/config/public', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
      enableExternalPayments: config.enableExternalPayments ?? true,
      enableSaferFoodCoupons: config.enableSaferFoodCoupons ?? true,
      enablePayments: config.enablePayments,
      appName: config.appName || 'Mito_Reboot',
      appTagline: config.appTagline || 'The circadian fasting app',
      appLogoUrl: config.appLogoUrl || '',
      cancerTreatmentDisclaimer: config.cancerTreatmentDisclaimer || `Lifestyle Guidance & Legal Disclaimer
The recommendations provided in this application are intended solely for educational and general wellness purposes. They are designed to complement—not replace—the advice, diagnosis, or treatment provided by your healthcare professionals.

Recommended Healthy Lifestyle Practices
Where medically appropriate, we encourage you to:
• Complete your evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), if approved by your treating doctor.
• Engage in at least 20 minutes of physical activity each day, such as walking, yoga, stretching, or other suitable exercise.
• Spend at least 20 minutes daily doing an activity you enjoy, such as listening to music, singing, dancing, reading, gardening, painting, or spending time with loved ones.
• Practice meditation, mindfulness, deep breathing, or other relaxation techniques for 10–20 minutes each day to support emotional well-being and stress management.

Important Medical Notice
If you are currently undergoing treatment for cancer, you must discuss these lifestyle recommendations with your treating oncologist or healthcare team before implementing them.
Time-Restricted Eating, exercise, dietary changes, and other lifestyle interventions may not be appropriate for every individual. Their suitability depends on factors including your cancer type and stage, treatment plan, nutritional status, body weight, diabetes or blood sugar control, kidney or liver function, and other medical conditions.
If you experience significant weight loss, poor appetite, dizziness, dehydration, low blood sugar, severe fatigue, persistent vomiting, or any worsening symptoms, discontinue the intervention immediately and seek medical advice.

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is general educational information and does not constitute medical advice.
• All lifestyle modifications are undertaken voluntarily and at your own discretion.
• You are responsible for consulting your treating oncologist or healthcare provider before making any dietary, fasting, exercise, or lifestyle changes.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, or contributors associated with this application shall be liable for any injury, illness, adverse event, complication, treatment outcome, loss, or damage arising directly or indirectly from the use of this application or from reliance on its recommendations.
• This application does not create a doctor–patient relationship between you and the Company or any healthcare professional associated the application.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the recommendations only in consultation with your treating healthcare team.`,
      cancerSecondaryDisclaimer: config.cancerSecondaryDisclaimer || `Lifestyle, Nutrition & Antioxidant Guidance for Cancer Survivors
(Cancer Prevention and Survivorship)

Congratulations on completing your cancer treatment. The recommendations provided in this application are intended to support healthy living after cancer treatment and may contribute to overall health and reducing the risk of cancer recurrence. They are not intended to replace regular medical follow-up or evidence-based medical care.

Recommended Healthy Lifestyle Practices
Where medically appropriate and after discussion with your healthcare team, we encourage you to:
• Complete your evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), if suitable for your health.
• Engage in at least 20–30 minutes of physical activity every day, such as brisk walking, yoga, cycling, resistance exercises, or other activities appropriate for your fitness level.
• Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.
• If you choose to take antioxidant supplements (such as Vitamin C, Vitamin E, Curcumin, Coenzyme Q10, Selenium, Zinc, or other nutritional supplements), discuss their use with your treating oncologist or healthcare provider before starting them.
• Spend at least 20 minutes each day doing an activity you enjoy, such as listening to music, singing, dancing, reading, gardening, painting, or spending time with family and friends.
• Practice meditation, mindfulness, deep breathing, or relaxation exercises for 10–20 minutes daily.
• Maintain a healthy body weight, obtain adequate sleep, avoid tobacco, limit alcohol consumption, and attend all scheduled follow-up appointments.

About Antioxidants
This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to better understand your lifestyle habits and generate personalised wellness insights.
The information collected is not intended to prescribe, recommend, or encourage the use of any specific antioxidant or supplement. While a diet naturally rich in fruits, vegetables, whole grains, legumes, nuts, and seeds is generally recommended for overall health, the benefits and safety of antioxidant supplements may vary depending on your cancer type, previous treatments, treatments, medications, and other medical conditions.
Do not start, stop, or modify any antioxidant supplement without consulting your treating oncologist or healthcare provider.

Important Medical Notice
Even after completing cancer treatment, significant dietary changes, Time-Restricted Eating, fasting, exercise programmes, or nutritional supplements should be discussed with your healthcare provider, particularly if you have:
• Diabetes or blood sugar disorders
• Unintentional weight loss or malnutrition
• Kidney, liver, or heart disease
• Osteoporosis or frailty
• Persistent treatment-related side effects
• Any other significant medical condition

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is for educational, wellness, and survivorship purposes only and does not constitute medical advice, diagnosis, or treatment.
• The lifestyle recommendations, including Time-Restricted Eating, exercise, stress management, natural antioxidant intake, and antioxidant supplements, are intended to provide general wellness guidance and cannot guarantee prevention of cancer recurrence or improved treatment outcomes.
• Any dietary changes, fasting schedules, exercise programmes, or use of antioxidant supplements are undertaken voluntarily and at your own discretion and risk.
• You are solely responsible for discussing these interventions with your treating oncologist or healthcare provider before implementing them.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, supplement-related adverse effects, drug–nutrient interactions, cancer recurrence, disease progression, treatment outcome, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance on its recommendations.
• This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the recommendations only as a complement to regular medical follow-up and professional medical advice.`,
      cancerPreventionDisclaimer: config.cancerPreventionDisclaimer || `Lifestyle Guidance & Legal Disclaimer for the General Public
(Primary Cancer Prevention and Healthy Living)

This application is designed to promote healthy lifestyle habits that are supported by current scientific evidence and public health recommendations. The goal is to encourage behaviours that may help reduce the risk of cancer and other chronic diseases while improving overall health and well-being.

The information provided by this application is intended for educational and wellness purposes only. It is not intended to diagnose, treat, cure, or prevent any disease and should not be considered a substitute for professional medical advice.

Recommended Healthy Lifestyle Practices
We encourage users to:
• Finish their evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), where appropriate.
• Engage in at least 20–30 minutes of physical activity every day.
• Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.
• Limit ultra-processed foods, sugary beverages, processed meats, and excessive saturated fats.
• Spend at least 20 minutes each day doing an activity they enjoy to promote emotional well-being.
• Practice meditation, mindfulness, or deep breathing for 10–20 minutes daily.
• Maintain a healthy body weight, obtain adequate sleep, avoid tobacco in all forms, and limit or avoid alcohol consumption.

About Antioxidants
This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to provide personalised wellness insights.
A balanced diet containing naturally occurring antioxidants is generally recommended as part of a healthy lifestyle. However, high-dose antioxidant supplements may not be appropriate for everyone and should not be used as a substitute for a healthy diet.
If you are pregnant, breastfeeding, have diabetes, kidney or liver disease, heart disease, or any other significant medical condition, or if you are taking prescription medications, consult your healthcare provider before beginning Time-Restricted Eating, major dietary changes, or antioxidant supplements.

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is for educational, informational, and wellness purposes only and does not constitute medical advice, diagnosis, or treatment.
• The recommendations contained within this application are based on current scientific literature and recognised healthy lifestyle principles but cannot guarantee prevention of cancer or any other disease.
• Any lifestyle modifications, including Time-Restricted Eating, dietary changes, exercise, meditation, stress-management practices, natural antioxidant intake, or antioxidant supplements, are undertaken voluntarily and entirely at your own discretion and risk.
• You are responsible for seeking advice from a qualified healthcare professional before making significant dietary or lifestyle changes, particularly if you have an existing medical condition or are taking medications.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, nutritional deficiency, supplement-related adverse effects, drug–nutrient interactions, medical complications, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance upon its recommendations.
• This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the information responsibly as part of a healthy lifestyle, while seeking professional medical advice whenever appropriate.`
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
router.get('/shop/products/:id', authenticateToken, requireRole(['User']), ShopController.getProductDetails);
router.get('/shop/categories', authenticateToken, requireRole(['User', 'SuperAdmin', 'Admin', 'Editor']), ShopController.getCategories);
router.post('/shop/validate-coupon', authenticateToken, requireRole(['User']), ShopController.validateShopCoupon);
router.get('/shop/coupons', authenticateToken, requireRole(['User']), ShopController.getAvailableCoupons);
router.post('/shop/create-order', authenticateToken, requireRole(['User']), ShopController.createOrder);
router.post('/shop/verify-payment', authenticateToken, requireRole(['User']), ShopController.verifyPayment);
router.post('/shop/reviews', authenticateToken, requireRole(['User']), ShopController.submitProductReview);
router.get('/shop/products/:id/reviews', authenticateToken, requireRole(['User']), ShopController.getProductReviews);
router.get('/patient/reviews', authenticateToken, requireRole(['User']), ShopController.getPatientReviews);
router.get('/screening/tests', authenticateToken, requireRole(['User']), ScreeningController.getScreeningTests);
router.get('/cancer-screening/indian-cancers', authenticateToken, requireRole(['User']), IndianCancerController.getIndianCancers);
router.get('/workflow-config/:type', authenticateToken, requireRole(['User']), ScreeningController.getWorkflowConfig);
router.get('/patient/deaddiction-number', authenticateToken, requireRole(['User']), DoctorController.getDeaddictionNumber);

router.use('/habits', authenticateToken, requireRole(['User']));
router.post('/habits/upload', uploadImage.single('image'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});
router.post('/habits', HabitController.logHabit);
router.get('/habits', HabitController.getRecentHabits);
router.delete('/habits/:id', HabitController.deleteHabit);

// ==========================================
// 3. ADMIN PORTAL ENDPOINTS
// ==========================================
router.post('/admin/auth/login', AdminController.login);
router.post('/admin/auth/register', AdminController.register);

// Doctor/Admin shared review routes (Defined before general admin role check to allow Doctors)
router.get('/admin/stain-reviews', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor', 'Doctor']), AdminReviewController.getStainReviews);
router.post('/admin/stain-reviews/:logId/recommendation', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor', 'Doctor']), AdminReviewController.submitRecommendation);
router.post('/admin/stain-reviews/:logId/assign', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), AdminReviewController.assignStainReviewDoctor);
router.post('/admin/lab-bookings/:bookingId/assign', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), assignLabBookingDoctor);
router.get('/admin/patients', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor', 'Doctor']), AdminReviewController.getPatients);
router.get('/admin/patients/:patientId/activity', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor', 'Doctor']), AdminReviewController.getPatientTimeline);
router.get('/admin/stain-image/:filename', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor', 'Doctor']), AdminReviewController.getStainImage);

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

router.get('/admin/support/tickets', SupportController.getAllTickets);
router.post('/admin/support/tickets/:id/reply', SupportController.replyToTicket);
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
router.get('/admin/shop-products', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.getAdminProducts);
router.post('/admin/shop-products', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.createAdminProduct);
router.post('/admin/shop-products/upload-image', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), uploadImage.single('image'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});
router.put('/admin/shop-products/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.updateAdminProduct);
router.delete('/admin/shop-products/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.deleteAdminProduct);
router.post('/admin/shop-categories', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.createAdminCategory);
router.get('/admin/shop-reports', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopReportController.getReportsSummary);
router.get('/admin/shop-reviews', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.getAdminReviews);
router.put('/admin/shop-reviews/:id/status', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ShopController.updateReviewStatus);
router.get('/admin/vendors/:id/performance', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), VendorController.adminGetVendorPerformance);



router.get('/admin/screening-tests', ScreeningController.getAdminScreeningTests);
router.post('/admin/screening-tests', ScreeningController.createAdminScreeningTest);
router.put('/admin/screening-tests/:id', ScreeningController.updateAdminScreeningTest);
router.delete('/admin/screening-tests/:id', ScreeningController.deleteAdminScreeningTest);

// Indian Cancers & Risks
router.get('/admin/indian-cancers', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.getAdminIndianCancers);
router.post('/admin/indian-cancers', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.createIndianCancer);
router.put('/admin/indian-cancers/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.updateIndianCancer);
router.delete('/admin/indian-cancers/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.deleteIndianCancer);

// Cancer Videos
router.get('/admin/cancer-videos', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.getAdminCancerVideos);
router.post('/admin/cancer-videos', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.createCancerVideo);
router.put('/admin/cancer-videos/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.updateCancerVideo);
router.delete('/admin/cancer-videos/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), IndianCancerController.deleteCancerVideo);
router.get('/admin/appointments', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), AdminController.getAppointments);
router.get('/admin/global-search', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), AdminController.globalSearch);

router.get('/admin/workflow-config/:type', ScreeningController.getAdminWorkflowConfig);
router.put('/admin/workflow-config/:type', ScreeningController.updateAdminWorkflowConfig);

// --- DOCTOR MANAGEMENT FOR ADMIN ---
router.get('/admin/doctors', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminGetDoctors);
router.post('/admin/doctors', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminAddDoctor);
router.put('/admin/doctors/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminEditDoctor);
router.delete('/admin/doctors/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminDeleteDoctor);
router.get('/admin/doctors/:id/availability', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), DoctorController.adminGetDoctorAvailability);

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
router.get('/doctor/profile', authenticateToken, requireRole(['Doctor']), DoctorController.getDoctorProfile);
router.put('/doctor/profile', authenticateToken, requireRole(['Doctor']), DoctorController.updateDoctorProfile);
router.put('/doctor/settings', authenticateToken, requireRole(['Doctor']), DoctorController.updateDoctorSettings);
router.get('/doctor/feedback', authenticateToken, requireRole(['Doctor']), DoctorController.getDoctorFeedback);
router.put('/doctor/appointments/:appointmentId/notes', authenticateToken, requireRole(['Doctor']), DoctorController.updateAppointmentNotes);
router.get('/doctor/stats', authenticateToken, requireRole(['Doctor']), DoctorController.getDoctorDashboardStats);
router.get('/doctor/assigned-stain-reviews', authenticateToken, requireRole(['Doctor']), DoctorController.getAssignedStainReviews);
router.post('/doctor/assigned-stain-reviews/:logId/notes', authenticateToken, requireRole(['Doctor']), DoctorController.submitStainReviewNotes);
router.get('/doctor/assigned-lab-bookings', authenticateToken, requireRole(['Doctor']), DoctorController.getAssignedLabBookings);
router.post('/doctor/assigned-lab-bookings/:bookingId/notes', authenticateToken, requireRole(['Doctor']), DoctorController.submitLabBookingNotes);

// --- VENDOR SIGN IN & PORTAL ROUTES ---
router.post('/vendor/auth/login', VendorController.vendorLogin);
router.get('/vendor/dashboard', authenticateToken, requireRole(['Vendor']), VendorController.vendorDashboard);
router.get('/vendor/orders', authenticateToken, requireRole(['Vendor']), VendorController.getVendorOrders);
router.put('/vendor/orders/:orderId/status', authenticateToken, requireRole(['Vendor']), VendorController.updateOrderStatus);
router.post('/vendor/orders/:orderId/tracking', authenticateToken, requireRole(['Vendor']), VendorController.uploadTrackingDetails);
router.post('/vendor/orders/:orderId/confirm-delivery', authenticateToken, requireRole(['Vendor']), VendorController.confirmDelivery);

// --- PATIENT BOOKING ROUTES ---
router.get('/patient/doctors', authenticateToken, requireRole(['User']), AppointmentController.getAvailableDoctors);
router.get('/patient/doctors/:doctorId/slots', authenticateToken, requireRole(['User']), AppointmentController.getDoctorSlots);
router.post('/patient/appointments', authenticateToken, requireRole(['User']), AppointmentController.bookAppointment);
router.get('/patient/appointments', authenticateToken, requireRole(['User']), AppointmentController.getPatientAppointments);
router.post('/patient/appointments/verify-payment', authenticateToken, requireRole(['User']), AppointmentController.verifyAppointmentPayment);
router.post('/patient/appointments/:appointmentId/cancel-payment', authenticateToken, requireRole(['User']), AppointmentController.cancelAppointmentPayment);

// Consultation Recommendation Endpoints
router.get('/admin/consultations/analytics', authenticateToken, requireRole(['SuperAdmin', 'Admin', 'Editor']), ConsultationController.getAnalytics);
router.post('/patient/consultations/log', authenticateToken, requireRole(['User']), ConsultationController.logRecommendation);
router.get('/patient/consultations/:id', authenticateToken, requireRole(['User']), ConsultationController.getRecommendation);
router.put('/patient/consultations/:id/status', authenticateToken, requireRole(['User']), ConsultationController.updateStatus);
router.post('/patient/feedback', authenticateToken, requireRole(['User']), AppointmentController.addFeedback);
router.get('/patient/doctors/:doctorId/feedback', authenticateToken, requireRole(['User']), AppointmentController.getDoctorFeedback);

// Patient retrieval of own orders (Shop history tracker)
router.get('/patient/orders', authenticateToken, requireRole(['User']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const ShopOrder = require('../models/ShopOrder').default;
    const orders = await ShopOrder.find({ userId })
      .populate('vendorId')
      .populate({ path: 'products.productId', select: 'image' })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patient orders.' });
  }
});

export default router;
