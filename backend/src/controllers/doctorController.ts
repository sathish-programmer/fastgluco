import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Doctor } from '../models/Doctor';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { Appointment } from '../models/Appointment';
import { Feedback } from '../models/Feedback';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345!';

export class DoctorController {
  // --- ADMIN PORTAL ACTIONS ON DOCTORS ---

  public static async adminAddDoctor(req: Request, res: Response) {
    try {
      const { name, email, password, specialty, description, avatar } = req.body;
      if (!name || !email || !password || !specialty || !description) {
        return res.status(400).json({ message: 'Missing required doctor fields.' });
      }

      const existing = await Doctor.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Doctor with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const doc = new Doctor({
        name,
        email,
        passwordHash,
        specialty,
        description,
        avatar
      });
      await doc.save();

      // Create default availability
      const availability = new DoctorAvailability({
        doctorId: doc._id,
        availableDays: [1, 2, 3, 4, 5],
        availableTimeSlots: [
          { start: '09:00', end: '13:00' },
          { start: '14:00', end: '17:00' }
        ],
        slotDuration: 30
      });
      await availability.save();

      const token = jwt.sign(
        { id: doc._id, email: doc.email, role: 'Doctor' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        token,
        doctor: {
          id: doc._id,
          name: doc.name,
          email: doc.email,
          specialty: doc.specialty,
          description: doc.description,
          avatar: doc.avatar
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error adding doctor' });
    }
  }

  public static async adminEditDoctor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, specialty, description, isActive, avatar } = req.body;
      const doc = await Doctor.findById(id);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

      if (name) doc.name = name;
      if (specialty) doc.specialty = specialty;
      if (description) doc.description = description;
      if (isActive !== undefined) doc.isActive = isActive;
      if (avatar !== undefined) doc.avatar = avatar;

      await doc.save();
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error updating doctor' });
    }
  }

  public static async adminDeleteDoctor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await Doctor.findById(id);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

      doc.isDeleted = true;
      await doc.save();
      res.json({ message: 'Doctor marked as deleted.' });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error deleting doctor' });
    }
  }

  public static async adminGetDoctors(req: Request, res: Response) {
    try {
      const docs = await Doctor.find().sort({ createdAt: -1 });
      const { Feedback } = require('../models/Feedback');
      const { Appointment } = require('../models/Appointment');

      const docsWithRating = await Promise.all(
        docs.map(async (doc: any) => {
          // Get all completed appointment IDs for this doctor
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
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctors' });
    }
  }

  public static async adminGetDoctorAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const avail = await DoctorAvailability.findOne({ doctorId: id });
      res.json(avail || null);
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctor availability' });
    }
  }

  // --- DOCTOR ACTIONS ---

  public static async doctorLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const doc = await Doctor.findOne({ email });
      if (!doc || doc.isDeleted || !doc.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or inactive account.' });
      }

      const isMatch = await bcrypt.compare(password, doc.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: doc._id, email: doc.email, role: 'Doctor' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        doctor: {
          id: doc._id,
          name: doc.name,
          email: doc.email,
          specialty: doc.specialty,
          description: doc.description,
          avatar: doc.avatar
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error during login.' });
    }
  }

  public static async getDoctorAvailability(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      let avail = await DoctorAvailability.findOne({ doctorId });
      if (!avail) {
        avail = new DoctorAvailability({ doctorId });
        await avail.save();
      }
      res.json(avail);
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching availability' });
    }
  }

  public static async updateDoctorAvailability(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { availableDays, availableTimeSlots, holidays, leaves, slotDuration, maxAppointmentsPerSlot } = req.body;

      let avail = await DoctorAvailability.findOne({ doctorId });
      if (!avail) {
        avail = new DoctorAvailability({ doctorId });
      }

      if (availableDays) avail.availableDays = availableDays;
      if (availableTimeSlots) avail.availableTimeSlots = availableTimeSlots;
      if (holidays) avail.holidays = holidays.map((d: string) => new Date(d));
      if (leaves) avail.leaves = leaves.map((d: string) => new Date(d));
      if (slotDuration) avail.slotDuration = slotDuration;
      if (maxAppointmentsPerSlot !== undefined) avail.maxAppointmentsPerSlot = maxAppointmentsPerSlot;

      await avail.save();
      res.json(avail);
    } catch (err: any) {
      res.status(500).json({ message: 'Error updating availability' });
    }
  }

  public static async getDoctorAppointments(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const appointments = await Appointment.find({
        doctorId,
        $or: [
          { type: 'offline' },
          { type: 'online', paymentStatus: 'paid' }
        ]
      })
        .populate('userId', 'name email mobileNumber')
        .sort({ date: 1, time: 1 });

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
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctor appointments' });
    }
  }

  public static async getDoctorProfile(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const doc = await Doctor.findById(doctorId);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctor profile' });
    }
  }

  public static async updateDoctorProfile(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const doc = await Doctor.findById(doctorId);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

      const {
        name, specialty, description, avatar,
        qualification, experience, hospitalName,
        registrationNumber, consultationFee, onlineConsultationFee, offlineConsultationFee, phone,
        address, languagesKnown
      } = req.body;

      if (name) doc.name = name;
      if (specialty) doc.specialty = specialty;
      if (description) doc.description = description;
      if (avatar !== undefined) doc.avatar = avatar;
      if (qualification !== undefined) doc.qualification = qualification;
      if (experience !== undefined) doc.experience = experience;
      if (hospitalName !== undefined) doc.hospitalName = hospitalName;
      if (registrationNumber !== undefined) doc.registrationNumber = registrationNumber;
      if (consultationFee !== undefined) doc.consultationFee = consultationFee;
      if (onlineConsultationFee !== undefined) doc.onlineConsultationFee = onlineConsultationFee;
      if (offlineConsultationFee !== undefined) doc.offlineConsultationFee = offlineConsultationFee;
      if (phone !== undefined) doc.phone = phone;
      if (address !== undefined) doc.address = address;
      if (languagesKnown !== undefined) doc.languagesKnown = languagesKnown;

      await doc.save();
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ message: 'Error updating doctor profile' });
    }
  }

  public static async updateDoctorSettings(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const doc = await Doctor.findById(doctorId);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

      const {
        password, workingHours, availableDays,
        slotDuration, holidays, visibility,
        notificationPreferences, onlineConsultationFee, offlineConsultationFee,
        maxAppointmentsPerSlot
      } = req.body;

      if (password) {
        doc.passwordHash = await bcrypt.hash(password, 10);
      }
      if (workingHours !== undefined) doc.workingHours = workingHours;
      if (availableDays !== undefined) doc.availableDays = availableDays;
      if (slotDuration !== undefined) doc.slotDuration = slotDuration;
      if (holidays !== undefined) doc.holidays = holidays;
      if (visibility !== undefined) doc.visibility = visibility;
      if (onlineConsultationFee !== undefined) doc.onlineConsultationFee = onlineConsultationFee;
      if (offlineConsultationFee !== undefined) doc.offlineConsultationFee = offlineConsultationFee;
      if (notificationPreferences !== undefined) {
        doc.notificationPreferences = typeof notificationPreferences === 'object'
          ? JSON.stringify(notificationPreferences)
          : notificationPreferences;
      }

      await doc.save();

      // Keep DoctorAvailability in sync
      let avail = await DoctorAvailability.findOne({ doctorId });
      if (!avail) {
        avail = new DoctorAvailability({ doctorId });
      }
      if (availableDays !== undefined) {
        const dayMap: Record<string, number> = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        avail.availableDays = availableDays.map((d: string) => dayMap[d]).filter((d: any) => d !== undefined);
      }
      if (slotDuration !== undefined) avail.slotDuration = slotDuration;
      if (holidays !== undefined) {
        avail.holidays = holidays.map((d: string) => new Date(d));
      }
      if (maxAppointmentsPerSlot !== undefined) {
        avail.maxAppointmentsPerSlot = maxAppointmentsPerSlot;
      }
      if (workingHours !== undefined && typeof workingHours === 'string') {
        const parts = workingHours.split('-');
        if (parts.length === 2) {
          avail.availableTimeSlots = [{
            start: parts[0].trim(),
            end: parts[1].trim()
          }];
        }
      }
      await avail.save();

      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ message: 'Error updating doctor settings' });
    }
  }

  public static async getDoctorFeedback(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const appointments = await Appointment.find({ doctorId });
      const appointmentIds = appointments.map(a => a._id);
      const feedbacks = await Feedback.find({ appointmentId: { $in: appointmentIds } })
        .populate({
          path: 'appointmentId',
          populate: { path: 'userId', select: 'name email' }
        });
      res.json(feedbacks);
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctor feedback' });
    }
  }

  public static async updateAppointmentNotes(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { appointmentId } = req.params;
      const { notes, prescriptionText, prescriptionUrl, status } = req.body;

      const appt = await Appointment.findOne({ _id: appointmentId, doctorId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found or not assigned to you.' });

      if (notes !== undefined) appt.notes = notes;
      if (prescriptionText !== undefined) appt.prescriptionText = prescriptionText;
      if (prescriptionUrl !== undefined) appt.prescriptionUrl = prescriptionUrl;
      if (status !== undefined) appt.status = status;

      await appt.save();
      res.json(appt);
    } catch (err: any) {
      res.status(500).json({ message: 'Error updating consultation notes' });
    }
  }

  public static async getDoctorDashboardStats(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      
      const appointments = await Appointment.find({ doctorId });
      
      // Calculate Revenue
      const onlineAppts = appointments.filter(a => a.type === 'online');
      const offlineAppts = appointments.filter(a => a.type === 'offline');
      
      // Revenue is counted for completed appointments (or paid online ones)
      const onlineRevenue = onlineAppts
        .filter(a => a.paymentStatus === 'paid' && a.status !== 'cancelled')
        .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
      
      const offlineRevenue = offlineAppts
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
        
      const totalRevenue = onlineRevenue + offlineRevenue;
      const totalAppointments = appointments.length;
      
      const upcoming = appointments.filter(a => a.status === 'confirmed').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;
      
      res.json({
        onlineRevenue,
        offlineRevenue,
        totalRevenue,
        totalAppointments,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        cancelledAppointments: cancelled
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctor dashboard statistics.' });
    }
  }
}
