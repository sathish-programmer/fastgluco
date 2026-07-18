import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import {
  getCancerScreeningTests,
  getLabsForTest,
  createBooking,
  getUserBookings,
  getBookingTimelines,
  getBookingReport,
  labLogin,
  updateBookingStatus,
  uploadReport,
  createLaboratory,
  createLabTest,
  createLabStaff,
  getLabStaff,
  getAllLabs,
  getLabTests,
  getPortalAvailability,
  updatePortalAvailability,
  getPortalTests,
  addPortalTest,
  getPortalStaff,
  addPortalStaff,
  getPortalBookings,
  verifyPayment
} from '../controllers/labController';

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

const uploadReportFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

// --- USER FACING ---
// Get all cancer screening tests
router.get('/tests', getCancerScreeningTests);

// Get all labs that offer a specific test
router.get('/tests/:testId/labs', getLabsForTest);

// Create a new booking
router.post('/booking', authenticateToken, createBooking);
router.post('/booking/verify-payment', authenticateToken, verifyPayment);

// Get user's bookings
router.get('/booking/history', authenticateToken, getUserBookings);

// Get timeline for a specific booking
router.get('/booking/:bookingId/timeline', authenticateToken, getBookingTimelines);

// Get report for a specific booking
router.get('/booking/:bookingId/report', authenticateToken, getBookingReport);


// --- LAB PORTAL FACING ---
router.post('/auth/login', labLogin);
router.put('/portal/booking/status', updateBookingStatus);
router.post('/portal/booking/report', uploadReportFile.single('reportFile'), uploadReport);

router.get('/portal/availability', authenticateToken, requireRole(['LabPartner']), getPortalAvailability);
router.put('/portal/availability', authenticateToken, requireRole(['LabPartner']), updatePortalAvailability);
router.get('/portal/tests', authenticateToken, requireRole(['LabPartner']), getPortalTests);
router.post('/portal/tests', authenticateToken, requireRole(['LabPartner']), addPortalTest);
router.get('/portal/staff', authenticateToken, requireRole(['LabPartner']), getPortalStaff);
router.post('/portal/staff', authenticateToken, requireRole(['LabPartner']), addPortalStaff);
router.get('/portal/bookings', authenticateToken, requireRole(['LabPartner']), getPortalBookings);


// --- ADMIN FACING ---
router.post('/admin/labs', authenticateToken, requireRole(['SuperAdmin', 'Admin']), createLaboratory);
router.get('/admin/labs', authenticateToken, requireRole(['SuperAdmin', 'Admin']), getAllLabs);
router.post('/admin/lab-tests', authenticateToken, requireRole(['SuperAdmin', 'Admin']), createLabTest);
router.get('/admin/labs/:labId/tests', authenticateToken, requireRole(['SuperAdmin', 'Admin']), getLabTests);
router.post('/admin/lab-staff', authenticateToken, requireRole(['SuperAdmin', 'Admin']), createLabStaff);
router.get('/admin/labs/:labId/staff', authenticateToken, requireRole(['SuperAdmin', 'Admin']), getLabStaff);

export default router;
