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
      const {
        name,
        email,
        password,
        specialty,
        qualification,
        experience,
        description,
        avatar,
        languagesKnown,
        consultationFee,
        onlineConsultationFee,
        offlineConsultationFee,
        slotDuration,
        extraFeePer15Min,
        feePolicy,
        sleepEvaluationNote,
        focusTitle,
        focusIcon,
        isRecommended,
        commissionType,
        commissionValue
      } = req.body;

      if (!name || !email || !password || !specialty) {
        return res.status(400).json({ message: 'Missing required doctor fields (name, email, password, specialty).' });
      }

      const existing = await Doctor.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Doctor with this email already exists.' });
      }

      const fee = Number(onlineConsultationFee || consultationFee || 500);
      const passwordHash = await bcrypt.hash(password, 10);
      const fullAvatar = avatar ? avatar.trim() : '';
      const doc = new Doctor({
        name,
        email,
        passwordHash,
        specialty,
        qualification: qualification || '',
        experience: experience !== undefined ? Number(experience) : 0,
        description: description || '',
        avatar: fullAvatar,
        languagesKnown: Array.isArray(languagesKnown) ? languagesKnown : [],
        consultationFee: fee,
        onlineConsultationFee: fee,
        offlineConsultationFee: offlineConsultationFee !== undefined ? Number(offlineConsultationFee) : fee,
        slotDuration: slotDuration !== undefined ? Number(slotDuration) : 30,
        extraFeePer15Min: extraFeePer15Min !== undefined ? Number(extraFeePer15Min) : 0,
        feePolicy: feePolicy || '',
        sleepEvaluationNote: sleepEvaluationNote || '',
        focusTitle: focusTitle || '',
        focusIcon: focusIcon || '',
        isRecommended: isRecommended !== undefined ? Boolean(isRecommended) : false,
        commissionType: commissionType || 'PERCENTAGE',
        commissionValue: commissionValue !== undefined ? Number(commissionValue) : 10
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
        slotDuration: slotDuration !== undefined ? Number(slotDuration) : 30
      });
      await availability.save();

      const token = jwt.sign(
        { id: doc._id, email: doc.email, role: 'Doctor' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        token,
        doctor: doc
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error adding doctor' });
    }
  }

  public static async adminEditDoctor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        password,
        specialty,
        qualification,
        experience,
        description,
        isActive,
        avatar,
        languagesKnown,
        consultationFee,
        onlineConsultationFee,
        offlineConsultationFee,
        slotDuration,
        extraFeePer15Min,
        feePolicy,
        sleepEvaluationNote,
        focusTitle,
        focusIcon,
        isRecommended,
        commissionType,
        commissionValue,
        hospitalName,
        registrationNumber
      } = req.body;
      const doc = await Doctor.findById(id);
      if (!doc) return res.status(404).json({ message: 'Doctor not found.' });

      if (name) doc.name = name.trim();
      if (email !== undefined && typeof email === 'string') {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail) {
          if (normalizedEmail !== doc.email) {
            const existing = await Doctor.findOne({ email: normalizedEmail, _id: { $ne: doc._id } });
            if (existing) {
              return res.status(400).json({ message: 'Another doctor with this email address already exists.' });
            }
            doc.email = normalizedEmail;
          }
        }
      }
      if (password && typeof password === 'string' && password.trim().length > 0) {
        doc.passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      if (specialty) doc.specialty = specialty.trim();
      if (qualification !== undefined) doc.qualification = qualification;
      if (experience !== undefined) doc.experience = Number(experience);
      if (description !== undefined) doc.description = description;
      if (isActive !== undefined) doc.isActive = Boolean(isActive);
      if (avatar !== undefined) {
        doc.avatar = avatar ? avatar.trim() : '';
      }
      if (onlineConsultationFee !== undefined) {
        const fee = Number(onlineConsultationFee);
        doc.onlineConsultationFee = fee;
        if (consultationFee === undefined) doc.consultationFee = fee;
      }
      if (consultationFee !== undefined) {
        const fee = Number(consultationFee);
        doc.consultationFee = fee;
        if (onlineConsultationFee === undefined) doc.onlineConsultationFee = fee;
      }
      if (offlineConsultationFee !== undefined) doc.offlineConsultationFee = Number(offlineConsultationFee);
      if (slotDuration !== undefined) {
        const slot = Number(slotDuration);
        doc.slotDuration = slot;
        await DoctorAvailability.updateMany(
          { doctorId: doc._id },
          { $set: { slotDuration: slot } }
        );
      }
      if (extraFeePer15Min !== undefined) doc.extraFeePer15Min = Number(extraFeePer15Min);
      if (feePolicy !== undefined) doc.feePolicy = feePolicy;
      if (sleepEvaluationNote !== undefined) doc.sleepEvaluationNote = sleepEvaluationNote;
      if (focusTitle !== undefined) doc.focusTitle = focusTitle;
      if (focusIcon !== undefined) doc.focusIcon = focusIcon;
      if (isRecommended !== undefined) doc.isRecommended = Boolean(isRecommended);
      if (commissionType !== undefined) doc.commissionType = commissionType;
      if (commissionValue !== undefined) doc.commissionValue = Number(commissionValue);
      if (hospitalName !== undefined) doc.hospitalName = hospitalName;
      if (registrationNumber !== undefined) doc.registrationNumber = registrationNumber;
      if (languagesKnown !== undefined) {
        if (Array.isArray(languagesKnown)) {
          doc.languagesKnown = languagesKnown;
        } else if (typeof languagesKnown === 'string') {
          doc.languagesKnown = (languagesKnown as string).split(',').map((s: string) => s.trim()).filter(Boolean);
        } else {
          doc.languagesKnown = [];
        }
      }

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
          const getBaseUrl = () => {
            if (process.env.API_BASE_URL) return process.env.API_BASE_URL.replace(/\/+$/, '');
            const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
            const host = req.get('host') || 'api.mitoreboot.in';
            return `${proto}://${host}`;
          };
          const avatar = doc.avatar
            ? (doc.avatar.startsWith('http://') || doc.avatar.startsWith('https://')
                ? doc.avatar
                : `${getBaseUrl()}${doc.avatar.startsWith('/') ? '' : '/'}${doc.avatar}`)
            : '';
          return { ...doc.toObject(), avatar, avgRating, ratingCount };
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

  public static async adminGetDoctorToken(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await Doctor.findById(id);
      if (!doc || doc.isDeleted) {
        return res.status(404).json({ message: 'Doctor not found.' });
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
          role: 'Doctor'
        }
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Error generating doctor access token' });
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
        .populate('recommendationId')
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
      if (consultationFee !== undefined) {
        const fee = Number(consultationFee);
        doc.consultationFee = fee;
        if (onlineConsultationFee === undefined) doc.onlineConsultationFee = fee;
        if (offlineConsultationFee === undefined) doc.offlineConsultationFee = fee;
      }
      if (onlineConsultationFee !== undefined) {
        const fee = Number(onlineConsultationFee);
        doc.onlineConsultationFee = fee;
        if (consultationFee === undefined) doc.consultationFee = fee;
      }
      if (offlineConsultationFee !== undefined) doc.offlineConsultationFee = Number(offlineConsultationFee);
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
        maxAppointmentsPerSlot, deaddictionHelpline
      } = req.body;
 
      if (password) {
        doc.passwordHash = await bcrypt.hash(password, 10);
      }
      if (workingHours !== undefined) doc.workingHours = workingHours;
      if (availableDays !== undefined) doc.availableDays = availableDays;
      if (slotDuration !== undefined) doc.slotDuration = slotDuration;
      if (holidays !== undefined) doc.holidays = holidays;
      if (visibility !== undefined) doc.visibility = visibility;
      if (onlineConsultationFee !== undefined) {
        const fee = Number(onlineConsultationFee);
        doc.onlineConsultationFee = fee;
        doc.consultationFee = fee;
      }
      if (offlineConsultationFee !== undefined) doc.offlineConsultationFee = Number(offlineConsultationFee);
      if (deaddictionHelpline !== undefined) doc.deaddictionHelpline = deaddictionHelpline;
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
      const { 
        notes, 
        prescriptionText, 
        prescriptionUrl, 
        status, 
        medicines, 
        diagnosis, 
        dietaryAdvice, 
        lifestyleAdvice, 
        followUpDate,
        generatePdf 
      } = req.body;

      const appt = await Appointment.findOne({ _id: appointmentId, doctorId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found or not assigned to you.' });

      if (notes !== undefined) appt.notes = notes;
      if (prescriptionText !== undefined) appt.prescriptionText = prescriptionText;
      if (prescriptionUrl !== undefined) appt.prescriptionUrl = prescriptionUrl;
      if (status !== undefined) appt.status = status;
      if (medicines !== undefined) appt.medicines = medicines;
      if (diagnosis !== undefined) appt.diagnosis = diagnosis;
      if (dietaryAdvice !== undefined) appt.dietaryAdvice = dietaryAdvice;
      if (lifestyleAdvice !== undefined) appt.lifestyleAdvice = lifestyleAdvice;
      if (followUpDate !== undefined) appt.followUpDate = followUpDate;

      await appt.save();

      // Automatically generate prescription PDF if requested or medicines provided
      if (generatePdf || (Array.isArray(appt.medicines) && appt.medicines.length > 0 && !prescriptionUrl)) {
        try {
          const populatedForPrescription = await Appointment.findById(appt._id)
            .populate('doctorId')
            .populate('userId');
          if (populatedForPrescription) {
            const { PrescriptionService } = require('../services/prescriptionService');
            const pdfPath = await PrescriptionService.generatePrescriptionPDF(populatedForPrescription);
            appt.prescriptionUrl = pdfPath;
            await appt.save();
          }
        } catch (pdfErr) {
          console.error('Error generating prescription PDF in notes update:', pdfErr);
        }
      }

      res.json(appt);
    } catch (err: any) {
      res.status(500).json({ message: 'Error updating consultation notes' });
    }
  }

  public static async generatePrescription(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { appointmentId } = req.params;
      const {
        medicines,
        diagnosis,
        notes,
        prescriptionText,
        dietaryAdvice,
        lifestyleAdvice,
        followUpDate
      } = req.body;

      const appt = await Appointment.findOne({ _id: appointmentId, doctorId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found or unauthorized.' });

      if (medicines !== undefined) appt.medicines = medicines;
      if (diagnosis !== undefined) appt.diagnosis = diagnosis;
      if (notes !== undefined) appt.notes = notes;
      if (prescriptionText !== undefined) appt.prescriptionText = prescriptionText;
      if (dietaryAdvice !== undefined) appt.dietaryAdvice = dietaryAdvice;
      if (lifestyleAdvice !== undefined) appt.lifestyleAdvice = lifestyleAdvice;
      if (followUpDate !== undefined) appt.followUpDate = followUpDate;

      await appt.save();

      const populatedAppt = await Appointment.findById(appt._id)
        .populate('doctorId')
        .populate('userId');

      const { PrescriptionService } = require('../services/prescriptionService');
      const pdfPath = await PrescriptionService.generatePrescriptionPDF(populatedAppt);
      appt.prescriptionUrl = pdfPath;
      await appt.save();

      // Send notification & email to patient
      const { EmailService } = require('../services/emailService');
      const { FCMService } = require('../services/fcmService');

      EmailService.sendAppointmentEmail('prescription', appt._id.toString()).catch(console.error);
      FCMService.sendNotificationToUser(appt.userId.toString(), {
        title: 'Prescription Available',
        body: `Dr. ${(populatedAppt?.doctorId as any)?.name || 'Specialist'} has generated an official medical prescription.`,
        type: 'DoctorConsultation',
        data: {
          route: 'Appointments',
          appointmentId: appt._id.toString()
        }
      }).catch(console.error);

      res.json({ message: 'Prescription generated successfully', appointment: appt, prescriptionUrl: pdfPath });
    } catch (err: any) {
      console.error('Error generating prescription:', err);
      res.status(500).json({ message: err.message || 'Error generating prescription PDF.' });
    }
  }

  public static async uploadPrescriptionFile(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { appointmentId } = req.params;
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      const appt = await Appointment.findOne({ _id: appointmentId, doctorId });
      if (!appt) return res.status(404).json({ message: 'Appointment not found or unauthorized.' });

      const relativePath = `/uploads/prescriptions/${file.filename}`;
      appt.prescriptionUrl = relativePath;
      await appt.save();

      const { EmailService } = require('../services/emailService');
      const { FCMService } = require('../services/fcmService');

      EmailService.sendAppointmentEmail('prescription', appt._id.toString()).catch(console.error);
      FCMService.sendNotificationToUser(appt.userId.toString(), {
        title: 'Prescription Attached',
        body: 'Your doctor has attached a medical prescription document for your consultation.',
        type: 'DoctorConsultation',
        data: {
          route: 'Appointments',
          appointmentId: appt._id.toString()
        }
      }).catch(console.error);

      res.json({ message: 'Prescription uploaded successfully', appointment: appt, prescriptionUrl: relativePath });
    } catch (err: any) {
      console.error('Error uploading prescription file:', err);
      res.status(500).json({ message: err.message || 'Error uploading prescription file.' });
    }
  }

  public static async sendMessageToPatient(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { appointmentId } = req.params;
      const { subject, message, patientId } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Message content is required.' });
      }

      let targetUserId = patientId;
      let appt: any = null;

      if (appointmentId && appointmentId !== 'direct') {
        appt = await Appointment.findOne({ _id: appointmentId, doctorId }).populate('doctorId');
        if (appt && appt.userId) {
          targetUserId = appt.userId.toString();
        }
      }

      if (!targetUserId) {
        return res.status(400).json({ message: 'Target patient not found.' });
      }

      const doctor = await Doctor.findById(doctorId);
      const doctorName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Your Specialist';

      const title = subject && subject.trim() ? subject.trim() : `Clinical Advice from ${doctorName}`;

      const { Notification } = require('../models/Notification');
      const { FCMService } = require('../services/fcmService');
      const { EmailService } = require('../services/emailService');
      const { User } = require('../models/User');

      await Notification.create({
        userId: targetUserId,
        title,
        body: message.trim(),
        type: 'DoctorConsultation',
        metadata: {
          route: 'Appointments',
          appointmentId: appt?._id ? appt._id.toString() : undefined,
          status: 'AdviceReceived'
        },
        isRead: false,
        sentAt: new Date(),
        isSent: true
      });

      // Send push notification
      FCMService.sendNotificationToUser(targetUserId, {
        title,
        body: message.trim(),
        type: 'DoctorConsultation',
        data: {
          route: 'Appointments',
          appointmentId: appt?._id ? appt._id.toString() : ''
        }
      }).catch(console.error);

      // Send email if user has email
      const targetUser = await User.findById(targetUserId);
      if (targetUser && targetUser.email) {
        EmailService.sendEmail({
          to: targetUser.email,
          subject: `[Mito Reboot] ${title}`,
          html: `<div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #0284c7; margin-top: 0;">${title}</h2>
            <p style="white-space: pre-line; line-height: 1.6; font-size: 14px; color: #334155;">${message.trim()}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="font-size: 12px; color: #64748b;">
              Sent by <strong>${doctorName}</strong> (${doctor?.specialty || 'Consultant Specialist'}) via Mito Reboot Clinical Portal.
            </p>
          </div>`
        }).catch(console.error);
      }

      res.json({ success: true, message: 'Message and clinical advice sent successfully to patient.' });
    } catch (err: any) {
      console.error('Error sending message to patient:', err);
      res.status(500).json({ message: err.message || 'Error sending message to patient.' });
    }
  }

  public static async getDoctorDashboardStats(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      
      const appointments = await Appointment.find({ doctorId });
      
      // Calculate Revenue
      const onlineAppts = appointments.filter(a => a.type === 'online');
      const offlineAppts = appointments.filter(a => a.type === 'offline');
      
      const validAppts = appointments.filter(a => (a.type === 'online' && a.paymentStatus === 'paid' && a.status !== 'cancelled') || (a.type === 'offline' && a.status === 'completed'));

      const onlineRevenue = onlineAppts
        .filter(a => a.paymentStatus === 'paid' && a.status !== 'cancelled')
        .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
      
      const offlineRevenue = offlineAppts
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
        
      const grossRevenue = onlineRevenue + offlineRevenue;
      const totalCommission = validAppts.reduce((sum, a) => sum + (a.platformCommission || 0), 0);
      const netDoctorEarnings = validAppts.reduce((sum, a) => sum + (a.doctorEarnings !== undefined ? a.doctorEarnings : ((a.consultationFee || 0) - (a.platformCommission || 0))), 0);
      const totalAppointments = appointments.length;
      
      const upcoming = appointments.filter(a => a.status === 'confirmed').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;
      
      res.json({
        onlineRevenue,
        offlineRevenue,
        grossRevenue,
        totalRevenue: grossRevenue,
        totalCommission,
        netDoctorEarnings,
        totalAppointments,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        cancelledAppointments: cancelled
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Error fetching doctor dashboard statistics.' });
    }
  }

  public static async getDeaddictionNumber(req: Request, res: Response) {
    try {
      const doc = await Doctor.findOne({ deaddictionHelpline: { $exists: true, $ne: "" }, visibility: true });
      const number = doc ? doc.deaddictionHelpline : "1800-11-0031";
      res.status(200).json({ number });
    } catch (error) {
      console.error('Error fetching deaddiction number:', error);
      res.status(200).json({ number: "1800-11-0031" });
    }
  }

  public static async getAssignedStainReviews(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const HabitLog = mongoose.model('HabitLog');
      const reviews = await HabitLog.find({ type: 'TobaccoStainTracker', assignedDoctorId: doctorId })
        .populate('userId', 'name email mobileNumber')
        .sort({ timestamp: -1 });
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching assigned reviews.' });
    }
  }

  public static async submitStainReviewNotes(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { logId } = req.params;
      const { doctorNotes } = req.body;

      const HabitLog = mongoose.model('HabitLog');
      const log = await HabitLog.findOne({ _id: logId, assignedDoctorId: doctorId });
      if (!log) {
        return res.status(404).json({ message: 'Assigned review log not found.' });
      }

      log.doctorNotes = doctorNotes;
      log.reviewed = true;
      log.reviewedAt = new Date();
      log.reviewedBy = doctorId;
      await log.save();

      res.json({ message: 'Review notes submitted successfully', log });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting review notes.' });
    }
  }

  public static async getAssignedLabBookings(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const LabBooking = mongoose.model('LabBooking');
      const bookings = await LabBooking.find({ assignedDoctorId: doctorId })
        .populate('userId', 'name email mobileNumber')
        .populate({
          path: 'labTestId',
          populate: {
            path: 'cancerScreeningTestId',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 });
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching assigned lab bookings.' });
    }
  }

  public static async submitLabBookingNotes(req: Request, res: Response) {
    try {
      const doctorId = (req as any).user.id;
      const { bookingId } = req.params;
      const { doctorNotes } = req.body;

      const LabBooking = mongoose.model('LabBooking');
      const booking = await LabBooking.findOne({ _id: bookingId, assignedDoctorId: doctorId });
      if (!booking) {
        return res.status(404).json({ message: 'Assigned lab booking not found.' });
      }

      booking.doctorNotes = doctorNotes;
      booking.status = 'REPORT_READY'; // Keep standard booking status
      await booking.save();

      res.json({ message: 'Lab report review notes submitted successfully', booking });
    } catch (error: any) {
      res.status(500).json({ message: 'Error submitting lab report notes.' });
    }
  }
}

import mongoose from 'mongoose';

