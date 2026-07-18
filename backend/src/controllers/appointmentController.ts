import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Feedback } from '../models/Feedback';
import { ConsultationRecommendation } from '../models/ConsultationRecommendation';
import { Doctor } from '../models/Doctor';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { EmailService } from '../services/emailService';
import Razorpay from 'razorpay';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { InvoiceService } from '../services/invoiceService';

/** Generate a valid Google Meet room code in the format: abc-defg-hij */
function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

export class AppointmentController {
  // --- PATIENT ACTIONS ---

  public static async getAvailableDoctors(req: Request, res: Response) {
    try {
      const doctors = await Doctor.find({ isActive: true, isDeleted: false });
      const { Feedback } = require('../models/Feedback');
      const { Appointment } = require('../models/Appointment');

      const docsWithRating = await Promise.all(
        doctors.map(async (doc: any) => {
          const apptIds = await Appointment.find({ doctorId: doc._id, status: 'completed' }).select('_id');
          const idList = apptIds.map((a: any) => a._id);
          const feedbacks = await Feedback.find({ appointmentId: { $in: idList } }).select('rating');
          const ratingCount = feedbacks.length;
          const avgRating = ratingCount > 0
            ? parseFloat((feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / ratingCount).toFixed(1))
            : null;
          return { ...doc.toObject(), avgRating, ratingCount };
        })
      );

      res.json(docsWithRating);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching active doctors' });
    }
  }

  public static async getDoctorSlots(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query; // YYYY-MM-DD
      if (!date) return res.status(400).json({ message: 'Date is required.' });

      const avail = await DoctorAvailability.findOne({ doctorId });
      if (!avail) return res.json([]); // No availability defined yet

      const checkDate = new Date(date as string);
      const dayOfWeek = checkDate.getDay();

      // Check if dayOfWeek is in availableDays
      if (!avail.availableDays.includes(dayOfWeek)) {
        return res.json([]);
      }

      // Check holidays
      const isHoliday = avail.holidays.some(h => new Date(h).toDateString() === checkDate.toDateString());
      const isLeave = avail.leaves.some(l => new Date(l).toDateString() === checkDate.toDateString());
      if (isHoliday || isLeave) {
        return res.json([]);
      }

      // Fetch existing appointments on this day
      const existing = await Appointment.find({
        doctorId,
        date: date as string,
        status: { $ne: 'cancelled' },
        $or: [
          { type: 'offline' },
          { type: 'online', paymentStatus: 'paid' }
        ]
      }).select('time');

      // Count booked slots
      const slotCounts = existing.reduce((acc: Record<string, number>, curr) => {
        acc[curr.time] = (acc[curr.time] || 0) + 1;
        return acc;
      }, {});

      const maxPerSlot = avail.maxAppointmentsPerSlot || 1;
      const bookedTimes = Object.keys(slotCounts).filter(time => slotCounts[time] >= maxPerSlot);

      // Generate dynamic slots based on availableTimeSlots
      const slotSet = new Set<string>();
      const duration = avail.slotDuration || 30;

      for (const block of avail.availableTimeSlots) {
        let currentMin = AppointmentController.timeToMinutes(block.start);
        const endMin = AppointmentController.timeToMinutes(block.end);

        while (currentMin + duration <= endMin) {
          const slotStr = AppointmentController.minutesToTime(currentMin);
          slotSet.add(slotStr); // Set auto-deduplicates
          currentMin += duration;
        }
      }

      // Convert to sorted array (chronological order)
      const allSlots = Array.from(slotSet).sort((a, b) =>
        AppointmentController.timeToMinutes(a) - AppointmentController.timeToMinutes(b)
      );

      const slotsWithAvailability = allSlots.map(slot => ({
        time: slot,
        isAvailable: !bookedTimes.includes(slot)
      }));

      res.json(slotsWithAvailability);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating slots.' });
    }
  }

  public static async bookAppointment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { doctorId, date, time, reason, patientNotes, type, recommendationId } = req.body;
      if (!doctorId || !date || !time || !reason) {
        return res.status(400).json({ message: 'Missing required parameters.' });
      }

      // Check slot availability based on maxAppointmentsPerSlot
      const avail = await DoctorAvailability.findOne({ doctorId });
      const maxPerSlot = avail?.maxAppointmentsPerSlot || 1;
      const existingCount = await Appointment.countDocuments({
        doctorId,
        date,
        time,
        status: { $ne: 'cancelled' },
        $or: [
          { type: 'offline' },
          { type: 'online', paymentStatus: 'paid' }
        ]
      });
      
      if (existingCount >= maxPerSlot) {
        return res.status(400).json({ message: 'This slot is already fully booked.' });
      }

      const doc = await Doctor.findById(doctorId);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

      const consultationFee = type === 'online' ? (doc.onlineConsultationFee || 0) : (doc.offlineConsultationFee || 0);

      const appointment = new Appointment({
        doctorId,
        userId,
        reason,
        date,
        time,
        status: 'pending',
        patientNotes: patientNotes || '',
        type: type || 'offline',
        consultationFee,
        paymentStatus: (type === 'online' && consultationFee > 0) ? 'pending' : 'waived',
        recommendationId
      });

      // If online consultation has a fee, generate a Razorpay order
      if (type === 'online' && consultationFee > 0) {
        const config = await PaymentGatewayConfig.findOne();
        if (config && config.razorpayKeyId && config.razorpayKeySecret) {
          const razorpay = new Razorpay({
            key_id: config.razorpayKeyId,
            key_secret: config.razorpayKeySecret
          });
          const rzpOrder = await razorpay.orders.create({
            amount: consultationFee * 100, // in paise/cents
            currency: 'INR',
            receipt: `appointment_${appointment._id}`
          });

          appointment.paymentDetails = {
            razorpayOrderId: rzpOrder.id
          };
          await appointment.save();

          return res.status(201).json({
            appointment,
            razorpayOrder: {
              id: rzpOrder.id,
              amount: rzpOrder.amount,
              currency: rzpOrder.currency,
              keyId: config.razorpayKeyId
            }
          });
        } else {
          appointment.paymentStatus = 'paid';
        }
      }

      // Otherwise save normally (offline or free online)
      await appointment.save();

      // Trigger Email log in background
      EmailService.sendAppointmentEmail('booked', appointment._id.toString()).catch(console.error);

      // Update recommendation status if provided
      if (recommendationId) {
        await ConsultationRecommendation.findByIdAndUpdate(recommendationId, {
          status: 'Booked',
          appointmentId: appointment._id
        });
      }

      res.status(201).json({ appointment });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error booking appointment.' });
    }
  }

  public static async verifyAppointmentPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const appt = await Appointment.findOne({ _id: appointmentId, userId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found.' });

      const config = await PaymentGatewayConfig.findOne();
      if (!config || !config.razorpayKeySecret) {
        // If razorpay isn't configured, auto confirm for demo/dev bypass
        appt.paymentStatus = 'paid';
        appt.status = 'pending';
        await appt.save();
        EmailService.sendAppointmentEmail('booked', appt._id.toString()).catch(console.error);
        return res.json({ message: 'Payment verified (Bypassed)', appointment: appt });
      }

      // Verify signature
      const crypto = require('crypto');
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        appt.paymentStatus = 'failed';
        await appt.save();
        return res.status(400).json({ message: 'Invalid signature. Payment verification failed.' });
      }

      appt.paymentStatus = 'paid';
      appt.status = 'pending';
      appt.paymentDetails = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      };
      await appt.save();

      EmailService.sendAppointmentEmail('booked', appt._id.toString()).catch(console.error);

      res.json({ message: 'Payment verified successfully.', appointment: appt });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error verifying appointment payment.' });
    }
  }

  public static async cancelAppointmentPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { appointmentId } = req.params;

      const appt = await Appointment.findOne({ _id: appointmentId, userId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found.' });

      appt.paymentStatus = 'failed';
      await appt.save();

      res.json({ message: 'Payment marked as failed.', appointment: appt });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error cancelling payment.' });
    }
  }

  public static async getPatientAppointments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const appointments = await Appointment.find({
        userId,
        $or: [
          { type: 'offline' },
          { type: 'online', paymentStatus: 'paid' }
        ]
      })
        .populate('doctorId', 'name specialty description avatar')
        .sort({ date: -1, time: -1 });

      // Fetch feedbacks for these appointments
      const appointmentIds = appointments.map(a => a._id);
      const feedbacks = await Feedback.find({ appointmentId: { $in: appointmentIds } });

      const apptsWithFeedback = appointments.map(a => {
        const fb = feedbacks.find(f => f.appointmentId.toString() === a._id.toString());
        return {
          ...a.toObject(),
          feedback: fb ? { rating: fb.rating, feedbackText: fb.feedbackText } : null,
          hasFeedback: !!fb
        };
      });

      res.json(apptsWithFeedback);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching appointments.' });
    }
  }

  public static async addFeedback(req: Request, res: Response) {
    try {
      const { appointmentId, rating, feedbackText } = req.body;
      if (!appointmentId || !rating || !feedbackText) {
        return res.status(400).json({ message: 'Missing rating details.' });
      }

      const appt = await Appointment.findById(appointmentId);
      if (!appt) return res.status(404).json({ message: 'Appointment not found.' });

      const feedback = new Feedback({
        appointmentId,
        rating,
        feedbackText
      });
      await feedback.save();

      res.status(201).json(feedback);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error saving feedback.' });
    }
  }

  public static async getDoctorFeedback(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const appointments = await Appointment.find({ doctorId });
      const appointmentIds = appointments.map(a => a._id);
      const feedbacks = await Feedback.find({ appointmentId: { $in: appointmentIds } })
        .populate({
          path: 'appointmentId',
          populate: { path: 'userId', select: 'name' }
        });
      res.json(feedbacks);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching doctor feedback.' });
    }
  }

  // --- CONSULTATION UPDATES (DOCTOR ACTIONS) ---

  public static async updateConsultation(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { appointmentId } = req.params;
      const { notes, prescriptionText, prescriptionUrl, status } = req.body;

      const appt = await Appointment.findOne({ _id: appointmentId, doctorId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found or unauthorized.' });

      if (notes !== undefined) appt.notes = notes;
      if (prescriptionText !== undefined) appt.prescriptionText = prescriptionText;
      if (prescriptionUrl !== undefined) appt.prescriptionUrl = prescriptionUrl;
      if (status !== undefined) appt.status = status;

      if (status === 'completed') {
        // If offline consultation, we assume payment is collected at clinic
        if (appt.type === 'offline') {
          appt.paymentStatus = 'paid';
        }
      }

      await appt.save();

      if (status === 'completed') {
        // Populate doctor and user details to generate a complete invoice PDF
        const populatedAppt = await Appointment.findById(appt._id)
          .populate('doctorId')
          .populate('userId');

        if (populatedAppt) {
          try {
            const invoicePath = await InvoiceService.generateAppointmentInvoicePDF(populatedAppt);
            appt.invoiceUrl = invoicePath;
            await appt.save();
          } catch (invErr) {
            console.error('Error generating appointment invoice PDF:', invErr);
          }
        }

        // Trigger Email log in background
        EmailService.sendAppointmentEmail('completed', appt._id.toString()).catch(console.error);
      } else if (prescriptionUrl) {
        EmailService.sendAppointmentEmail('prescription', appt._id.toString()).catch(console.error);
      }

      res.json(appt);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error saving consultation details.' });
    }
  }

  public static async adminConfirmAppointment(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;
      const { meetingLink } = req.body;

      const appt = await Appointment.findById(appointmentId);
      if (!appt) return res.status(404).json({ message: 'Appointment not found.' });

      appt.status = 'confirmed';
      if (meetingLink) {
        appt.meetingLink = meetingLink;
      } else {
        appt.meetingLink = `https://meet.google.com/${generateMeetCode()}`;
      }
      await appt.save();

      EmailService.sendAppointmentEmail('confirmed', appt._id.toString()).catch(console.error);

      res.json(appt);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error confirming appointment' });
    }
  }

  public static async doctorRejectAppointment(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;
      const appt = await Appointment.findById(appointmentId);
      if (!appt) return res.status(404).json({ message: 'Appointment not found.' });

      appt.status = 'cancelled';
      await appt.save();

      EmailService.sendAppointmentEmail('cancelled', appt._id.toString()).catch(console.error);

      res.json(appt);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error rejecting appointment' });
    }
  }

  // --- UTILS ---
  private static timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private static minutesToTime(m: number): string {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }
}
