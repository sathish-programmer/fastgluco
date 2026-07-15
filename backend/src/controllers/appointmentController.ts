import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Feedback } from '../models/Feedback';
import { Doctor } from '../models/Doctor';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { EmailService } from '../services/emailService';

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
      res.json(doctors);
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
        status: { $ne: 'cancelled' }
      }).select('time');

      const bookedTimes = existing.map(e => e.time);

      // Generate dynamic slots based on availableTimeSlots
      const slotSet = new Set<string>();
      const duration = avail.slotDuration || 30;

      for (const block of avail.availableTimeSlots) {
        let currentMin = AppointmentController.timeToMinutes(block.start);
        const endMin = AppointmentController.timeToMinutes(block.end);

        while (currentMin + duration <= endMin) {
          const slotStr = AppointmentController.minutesToTime(currentMin);
          if (!bookedTimes.includes(slotStr)) {
            slotSet.add(slotStr); // Set auto-deduplicates
          }
          currentMin += duration;
        }
      }

      // Convert to sorted array (chronological order)
      const slots = Array.from(slotSet).sort((a, b) =>
        AppointmentController.timeToMinutes(a) - AppointmentController.timeToMinutes(b)
      );

      res.json(slots);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating slots.' });
    }
  }

  public static async bookAppointment(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { doctorId, date, time, reason, patientNotes } = req.body;
      if (!doctorId || !date || !time || !reason) {
        return res.status(400).json({ message: 'Missing required parameters.' });
      }

      // Check if already booked
      const existing = await Appointment.findOne({ doctorId, date, time, status: { $ne: 'cancelled' } });
      if (existing) {
        return res.status(400).json({ message: 'This slot is already booked.' });
      }

      const appointment = new Appointment({
        doctorId,
        userId,
        reason,
        date,
        time,
        status: 'pending',
        patientNotes: patientNotes || ''
      });
      await appointment.save();

      // Trigger Email log in background
      EmailService.sendAppointmentEmail('booked', appointment._id.toString()).catch(console.error);

      res.status(201).json(appointment);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error booking appointment.' });
    }
  }

  public static async getPatientAppointments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const appointments = await Appointment.find({ userId })
        .populate('doctorId', 'name specialty description avatar')
        .sort({ createdAt: -1 });

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
      const { notes, prescriptionUrl, status } = req.body;

      const appt = await Appointment.findOne({ _id: appointmentId, doctorId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found or unauthorized.' });

      if (notes !== undefined) appt.notes = notes;
      if (prescriptionUrl !== undefined) appt.prescriptionUrl = prescriptionUrl;
      if (status !== undefined) appt.status = status;

      await appt.save();

      if (status === 'completed') {
        EmailService.sendAppointmentEmail('completed', appt._id.toString()).catch(console.error);
      }
      if (prescriptionUrl) {
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
