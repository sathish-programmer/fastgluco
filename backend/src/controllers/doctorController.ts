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
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctors' });
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
      const { availableDays, availableTimeSlots, holidays, leaves, slotDuration } = req.body;

      let avail = await DoctorAvailability.findOne({ doctorId });
      if (!avail) {
        avail = new DoctorAvailability({ doctorId });
      }

      if (availableDays) avail.availableDays = availableDays;
      if (availableTimeSlots) avail.availableTimeSlots = availableTimeSlots;
      if (holidays) avail.holidays = holidays.map((d: string) => new Date(d));
      if (leaves) avail.leaves = leaves.map((d: string) => new Date(d));
      if (slotDuration) avail.slotDuration = slotDuration;

      await avail.save();
      res.json(avail);
    } catch (err: any) {
      res.status(500).json({ message: 'Error updating availability' });
    }
  }

  public static async getDoctorAppointments(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const appointments = await Appointment.find({ doctorId })
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
}
