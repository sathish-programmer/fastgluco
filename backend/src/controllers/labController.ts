import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Laboratory from '../models/Laboratory';
import LabTest from '../models/LabTest';
import LabStaff from '../models/LabStaff';
import LabBooking from '../models/LabBooking';
import BookingTimeline from '../models/BookingTimeline';
import LabReport from '../models/LabReport';
import CancerScreeningTest from '../models/CancerScreeningTest';
import { AdminUser } from '../models/AdminUser';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { EmailService } from '../services/emailService';
import Razorpay from 'razorpay';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

// --- USER FACING APIs ---

export const getCancerScreeningTests = async (req: Request, res: Response) => {
  try {
    const tests = await CancerScreeningTest.find({ isActive: true });
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
};

export const getLabsForTest = async (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const labTests = await LabTest.find({ cancerScreeningTestId: testId, isActive: true })
      .populate('laboratoryId');
    res.status(200).json(labTests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch labs for test' });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { laboratoryId, labTestId, collectionType, collectionAddress, preferredDate, preferredTime, specialInstructions } = req.body;
    const userId = (req as any).user?.id;

    const labTest = await LabTest.findById(labTestId);
    const lab = await Laboratory.findById(laboratoryId);
    
    if (!labTest || !lab) {
      return res.status(404).json({ error: 'Lab or Test not found' });
    }

    const testPrice = labTest.price;
    const homeCollectionFee = (collectionType === 'HOME') ? 200 : 0; // Fixed fee for demo, could be in Laboratory model
    const totalAmount = testPrice + homeCollectionFee;

    // Calculate commission
    let platformShare = 0;
    let labShare = totalAmount;
    if (lab.commissionType === 'PERCENTAGE') {
      platformShare = (totalAmount * lab.commissionValue) / 100;
      labShare = totalAmount - platformShare;
    } else {
      platformShare = lab.commissionValue;
      labShare = totalAmount - platformShare;
    }
    const newBooking = new LabBooking({
      userId,
      laboratoryId,
      labTestId,
      collectionType,
      collectionAddress,
      preferredDate,
      preferredTime,
      specialInstructions,
      testPrice,
      homeCollectionFee,
      totalAmount,
      commissionCalculated: true,
      platformShare,
      labShare,
      status: 'PENDING',
      paymentStatus: totalAmount === 0 ? 'COMPLETED' : 'PENDING'
    });

    await newBooking.save();

    const timeline = new BookingTimeline({
      bookingId: newBooking._id,
      status: 'PENDING',
      note: 'Booking initiated'
    });
    await timeline.save();

    if (totalAmount > 0) {
      const config = await PaymentGatewayConfig.findOne();
      if (config && config.enablePayments && config.razorpayKeyId && config.razorpayKeySecret) {
        const instance = new Razorpay({
          key_id: config.razorpayKeyId,
          key_secret: config.razorpayKeySecret
        });

        const orderOptions = {
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          receipt: `booking_${newBooking._id}`
        };

        const razorpayOrder = await instance.orders.create(orderOptions);

        return res.status(201).json({ 
          message: 'Booking created', 
          bookingId: newBooking._id, 
          amount: totalAmount,
          razorpayOrderId: razorpayOrder.id,
          razorpayKeyId: config.razorpayKeyId
        });
      }
    }

    res.status(201).json({ message: 'Booking created', bookingId: newBooking._id, amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const config = await PaymentGatewayConfig.findOne();
    if (!config || !config.razorpayKeySecret) {
      return res.status(500).json({ error: 'Payment gateway configuration missing' });
    }

    const hash = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (hash !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const booking = await LabBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.paymentStatus = 'COMPLETED';
    await booking.save();

    res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const bookings = await LabBooking.find({ userId })
      .populate('laboratoryId')
      .populate({
        path: 'labTestId',
        populate: {
          path: 'cancerScreeningTestId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
};

export const getBookingTimelines = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const timelines = await BookingTimeline.find({ bookingId }).sort({ createdAt: 1 });
    res.status(200).json(timelines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timelines' });
  }
};

export const getBookingReport = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const report = await LabReport.findOne({ bookingId });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// --- LAB PORTAL APIs ---
export const labLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const staff = await LabStaff.findOne({ email, isActive: true });
    if (!staff || staff.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: staff._id, email: staff.email, role: 'LabPartner', laboratoryId: staff.laboratoryId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(200).json({ token, ...staff.toObject() });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId, status, note } = req.body;
    
    const booking = await LabBooking.findByIdAndUpdate(bookingId, { status }, { new: true });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const timeline = new BookingTimeline({
      bookingId,
      status,
      note
    });
    await timeline.save();

    if (status === 'REPORT_READY') {
      const user = await User.findById(booking.userId);
      if (user && user.email) {
        await EmailService.sendReportReadyEmail(user.email, user.name || 'User');
      }
    }

    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

export const uploadReport = async (req: Request, res: Response) => {
  try {
    const { bookingId, imageUrls, structuredData } = req.body;
    let pdfUrl = req.body.pdfUrl;

    if (req.file) {
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      pdfUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }
    
    const booking = await LabBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const newReport = new LabReport({
      bookingId,
      userId: booking.userId,
      laboratoryId: booking.laboratoryId,
      pdfUrl,
      imageUrls,
      structuredData
    });
    
    await newReport.save();

    // Mark as REPORT_READY
    await LabBooking.findByIdAndUpdate(bookingId, { status: 'REPORT_READY' });
    await new BookingTimeline({ bookingId, status: 'REPORT_READY', note: 'Report uploaded by lab' }).save();

    const user = await User.findById(booking.userId);
    if (user && user.email) {
      // Fire and forget email to prevent blocking the response if SMTP hangs
      EmailService.sendReportReadyEmail(user.email, user.name || 'User', pdfUrl).catch(console.error);
    }

    res.status(201).json({ message: 'Report uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload report' });
  }
};

// --- ADMIN APIs ---
export const createLaboratory = async (req: Request, res: Response) => {
  try {
    const lab = new Laboratory(req.body);
    await lab.save();
    res.status(201).json(lab);
  } catch (error) {
    console.error('Error creating lab:', error);
    res.status(500).json({ error: 'Failed to create lab' });
  }
};

export const createLabTest = async (req: Request, res: Response) => {
  try {
    const test = new LabTest(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lab test' });
  }
};

export const createLabStaff = async (req: Request, res: Response) => {
  try {
    const { password, role, ...rest } = req.body;
    let mappedRole = 'ADMIN';
    if (role === 'Technician' || role === 'TECHNICIAN') mappedRole = 'TECHNICIAN';
    if (role === 'Collector' || role === 'COLLECTOR') mappedRole = 'COLLECTOR';

    const staff = new LabStaff({
      ...rest,
      passwordHash: password, // using plaintext for MVP demo
      role: mappedRole
    });
    await staff.save();
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error creating lab staff:', error);
    res.status(500).json({ error: 'Failed to create lab staff' });
  }
};

export const getLabStaff = async (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    const staff = await LabStaff.find({ laboratoryId: labId });
    res.status(200).json(staff);
  } catch (error) {
    console.error('Error fetching lab staff:', error);
    res.status(500).json({ error: 'Failed to fetch lab staff' });
  }
};

export const getAllLabs = async (req: Request, res: Response) => {
  try {
    const labs = await Laboratory.find();
    res.status(200).json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
};

export const getLabTests = async (req: Request, res: Response) => {
  try {
    const { labId } = req.params;
    const tests = await LabTest.find({ laboratoryId: labId }).populate('cancerScreeningTestId');
    res.status(200).json(tests);
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
};

// --- LAB ADMIN PORTAL APIs ---
export const getPortalAvailability = async (req: Request, res: Response) => {
  try {
    const laboratoryId = (req as any).user?.laboratoryId;
    const lab = await Laboratory.findById(laboratoryId);
    if (!lab) return res.status(404).json({ error: 'Lab not found', user: (req as any).user, labIdSearched: laboratoryId });
    res.status(200).json({ 
      availableSlots: lab.availableSlots, 
      isHomeCollectionAvailable: lab.isHomeCollectionAvailable,
      holidays: lab.holidays || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

export const updatePortalAvailability = async (req: Request, res: Response) => {
  try {
    const laboratoryId = (req as any).user?.laboratoryId;
    const { availableSlots, isHomeCollectionAvailable, holidays } = req.body;
    
    const updateData: any = {};
    if (availableSlots !== undefined) updateData.availableSlots = availableSlots;
    if (isHomeCollectionAvailable !== undefined) updateData.isHomeCollectionAvailable = isHomeCollectionAvailable;
    if (holidays !== undefined) updateData.holidays = holidays;

    const lab = await Laboratory.findByIdAndUpdate(
      laboratoryId,
      updateData,
      { new: true }
    );
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    res.status(200).json({ message: 'Availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

export const getPortalTests = async (req: Request, res: Response) => {
  try {
    const laboratoryId = (req as any).user?.laboratoryId;
    const tests = await LabTest.find({ laboratoryId }).populate('cancerScreeningTestId');
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portal tests' });
  }
};

export const addPortalTest = async (req: Request, res: Response) => {
  try {
    const laboratoryId = (req as any).user?.laboratoryId;
    const test = new LabTest({ ...req.body, laboratoryId });
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create portal test' });
  }
};

export const getPortalStaff = async (req: Request, res: Response) => {
  try {
    const labId = (req as any).user?.laboratoryId;
    if (!labId) return res.status(400).json({ error: 'Laboratory context missing' });

    const staff = await AdminUser.find({ laboratoryId: labId }).select('-password');
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portal staff' });
  }
};

export const getPortalBookings = async (req: Request, res: Response) => {
  try {
    const labId = (req as any).user?.laboratoryId;
    if (!labId) return res.status(400).json({ error: 'Laboratory context missing' });

    const bookings = await LabBooking.find({ laboratoryId: labId })
      .populate('userId', 'name email phone')
      .populate({
        path: 'labTestId',
        populate: {
          path: 'cancerScreeningTestId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portal bookings' });
  }
};

export const addPortalStaff = async (req: Request, res: Response) => {
  try {
    const laboratoryId = (req as any).user?.laboratoryId;
    const { password, role, ...rest } = req.body;
    let mappedRole = 'TECHNICIAN';
    if (role === 'LabAdmin' || role === 'ADMIN') mappedRole = 'ADMIN';
    if (role === 'Collector' || role === 'COLLECTOR') mappedRole = 'COLLECTOR';

    const staff = new LabStaff({
      ...rest,
      passwordHash: password,
      role: mappedRole,
      laboratoryId
    });
    await staff.save();
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create portal staff' });
  }
};
