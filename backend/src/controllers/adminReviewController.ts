import { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import HabitLog from '../models/HabitLog';
import { User } from '../models/User';
import DoctorRecommendation from '../models/DoctorRecommendation';
import { AuditLog } from '../models/AuditLog';
import { AdminNotificationService } from '../services/adminNotificationService';

export const getStainReviews = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;

    // Fetch all logs of type TobaccoStainTracker
    const logs = await HabitLog.find({ type: 'TobaccoStainTracker' })
      .populate('userId', 'name email mobileNumber')
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching stain reviews:', error);
    res.status(500).json({ message: 'Error fetching stain reviews' });
  }
};

export const submitRecommendation = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { logId } = req.params;
    const { recommendationText, advice, channels } = req.body;

    if (!recommendationText || !channels || !Array.isArray(channels)) {
      return res.status(400).json({ message: 'recommendationText and channels array are required' });
    }

    const log = await HabitLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'Stain tracker log not found' });
    }

    const patientId = log.userId;

    // 1. Dispatch notifications and calculate true delivery statuses
    const deliveryStatus = await AdminNotificationService.dispatchRecommendation(
      patientId.toString(),
      recommendationText,
      channels
    );

    // 2. Save recommendation
    const recommendation = new DoctorRecommendation({
      patientId,
      doctorId: adminId,
      category: 'Dental',
      relatedLogId: logId,
      recommendationText,
      channels,
      deliveryStatus
    });
    await recommendation.save();

    // 3. Mark HabitLog as reviewed
    log.reviewed = true;
    log.reviewedAt = new Date();
    log.reviewedBy = new mongoose.Types.ObjectId(adminId);
    await log.save();

    // 4. Create Audit Logs
    await AuditLog.create({
      adminId,
      action: 'CREATE_DOCTOR_RECOMMENDATION',
      details: `Created dental recommendation for patient ID: ${patientId}`
    });

    await AuditLog.create({
      adminId,
      action: 'SEND_DOCTOR_RECOMMENDATION',
      details: `Sent recommendation to patient ID: ${patientId} via channels: ${channels.join(', ')}`
    });

    res.json({ message: 'Recommendation submitted successfully', recommendation, log });
  } catch (error) {
    console.error('Error submitting recommendation:', error);
    res.status(500).json({ message: 'Error submitting recommendation' });
  }
};

export const getPatients = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;

    // Fetch all patients
    const patients = await User.find({ isDeleted: { $ne: true } })
      .select('name email mobileNumber createdAt')
      .lean();

    const patientList = [];

    for (const patient of patients) {
      // Find latest activity from HabitLog
      const latestLog = await HabitLog.findOne({ userId: patient._id })
        .sort({ timestamp: -1 })
        .select('timestamp type');

      // Check overall activity status (Active if they have logged anything, or default to Pending Review if they have unreviewed stain logs)
      const unreviewedCount = await HabitLog.countDocuments({
        userId: patient._id,
        type: 'TobaccoStainTracker',
        reviewed: { $ne: true }
      });

      const totalLogs = await HabitLog.countDocuments({ userId: patient._id });

      let tobaccoStatus = 'No Info';
      const dentalLog = await HabitLog.findOne({ userId: patient._id, type: 'Dental' }).sort({ timestamp: -1 });
      if (dentalLog) {
        tobaccoStatus = dentalLog.value.tobacco === true ? 'Yes' : 'No';
      }

      patientList.push({
        ...patient,
        lastActive: latestLog ? latestLog.timestamp : patient.createdAt,
        totalLogs,
        unreviewedCount,
        tobaccoStatus,
        overallStatus: unreviewedCount > 0 ? 'Pending Review' : totalLogs > 0 ? 'Active' : 'New Account'
      });
    }

    res.json(patientList);
  } catch (error) {
    console.error('Error fetching patient list:', error);
    res.status(500).json({ message: 'Error fetching patient list' });
  }
};

export const getPatientTimeline = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { patientId } = req.params;

    const patient = await User.findById(patientId).select('name email mobileNumber createdAt');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Audit view action
    await AuditLog.create({
      adminId,
      action: 'VIEW_PATIENT_RECORD',
      details: `Opened activity details for patient ID: ${patientId}`
    });

    const timeline = [];

    // 1. Account Created
    timeline.push({
      date: patient.createdAt,
      type: 'ACCOUNT_CREATED',
      title: 'Account Registered',
      description: `Patient registered with email ${patient.email || 'N/A'}`
    });

    // 2. Fetch Dental questionnaires
    const dentalLogs = await HabitLog.find({ userId: patientId, type: 'Dental' }).sort({ timestamp: -1 });
    for (const log of dentalLogs) {
      const parts = [];
      if (log.value.sharpTooth !== undefined) parts.push(`Sharp Tooth: ${log.value.sharpTooth ? 'Yes' : 'No'}`);
      if (log.value.tobacco !== undefined) parts.push(`Tobacco Staining: ${log.value.tobacco ? 'Yes' : 'No'}`);
      if (log.value.illFittingDenture !== undefined) parts.push(`Ill-fitting Denture: ${log.value.illFittingDenture ? 'Yes' : 'No'}`);

      timeline.push({
        date: log.timestamp,
        type: 'DENTAL_CONSULTATION',
        title: 'Dental Assessment Logged',
        description: parts.join(' | ')
      });
    }

    // 3. Fetch Tobacco Stain Tracker logs
    const stainLogs = await HabitLog.find({ userId: patientId, type: 'TobaccoStainTracker' }).sort({ timestamp: -1 });
    for (const log of stainLogs) {
      timeline.push({
        date: log.timestamp,
        type: 'TOBACCO_STAIN',
        title: 'Tobacco Stain Photo Saved',
        description: `Stain Score: ${log.value.score} (${log.value.category})`,
        score: log.value.score,
        category: log.value.category,
        imageUrl: log.value.imageUrl,
        reviewed: log.reviewed,
        reviewedAt: log.reviewedAt,
        logId: log._id
      });
    }

    // 4. Fetch Doctor Recommendations
    const recommendations = await DoctorRecommendation.find({ patientId }).sort({ timestamp: -1 });
    for (const rec of recommendations) {
      timeline.push({
        date: rec.timestamp,
        type: 'DOCTOR_RECOMMENDATION',
        title: 'Doctor Recommendation Sent',
        description: rec.recommendationText,
        channels: rec.channels,
        deliveryStatus: rec.deliveryStatus
      });
    }

    // Sort timeline chronologically descending (newest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ patient, timeline });
  } catch (error) {
    console.error('Error fetching patient timeline:', error);
    res.status(500).json({ message: 'Error fetching patient timeline' });
  }
};

export const getStainImage = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
    const { filename } = req.params;

    // Prevent path traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'uploads', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Audit log image view action
    await AuditLog.create({
      adminId,
      action: 'VIEW_DENTAL_IMAGE',
      details: `Viewed secure dental image filename: ${safeFilename}`
    });

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving secure image:', error);
    res.status(500).json({ message: 'Error retrieving image file' });
  }
};
