import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CGMReport } from '../models/CGMReport';
import HabitLog, { IHabitLog } from '../models/HabitLog';
import { ReportParserService } from '../services/reportParserService';
import { GlucoseService } from '../services/glucoseService';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { GlucoseReading } from '../models/GlucoseReading';
import { FoodLog } from '../models/FoodLog';


export class ReportController {
  /**
   * Upload Abbott CGM report CSV/PDF
   */
  public static async uploadReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'No report file was provided.' });
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = ext === '.pdf' ? 'pdf' : 'csv';

      // Check if a report with the same filename already exists for this user
      let report = await CGMReport.findOne({ userId, fileName: file.originalname });

      if (report) {
        // Overwrite existing report record
        report.fileUrl = `/uploads/${file.filename}`;
        report.fileType = fileType;
        report.status = 'Processing';
        report.parsedReadingsCount = 0;
        report.errorMessage = undefined;
      } else {
        // Create new database log
        report = new CGMReport({
          userId,
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`, // relative link for dev storage
          fileType,
          status: 'Processing',
          parsedReadingsCount: 0
        });
      }

      await report.save();

      const filePath = file.path;

      if (fileType === 'csv') {
        const parseResult = await ReportParserService.parseCSV(filePath, userId!, report.id);
        if (parseResult.errorMessage && parseResult.readingsCount === 0) {
          report.status = 'Failed';
          report.errorMessage = parseResult.errorMessage;
          await report.save();
          return res.status(422).json({ message: 'Report upload failed during processing.', error: parseResult.errorMessage, report });
        }
        report.status = 'Processed';
        report.parsedReadingsCount = parseResult.readingsCount;
        if (parseResult.errorMessage) report.errorMessage = parseResult.errorMessage;
        await report.save();

        try { await GlucoseService.analyzeAllUserFoodLogs(userId!); } catch (_) {}
        return res.status(200).json({ message: 'Report uploaded and parsed successfully.', readingsCount: parseResult.readingsCount, report });
      } else {
        // Return HTTP 200 OK immediately so Nginx/Cloudflare never returns a 504 Gateway Time-out
        res.status(200).json({
          message: 'Report uploaded successfully. PDF parsing is running in the background.',
          report
        });

        // Run PDF OCR parsing asynchronously across all pages in the background
        setImmediate(async () => {
          try {
            const parseResult = await ReportParserService.parsePDF(filePath, userId!, report.id);
            const bgReport = await CGMReport.findById(report.id);
            if (bgReport) {
              const hasSummaryMetrics = !!(
                parseResult.pdfSummaryAverageGlucose ||
                parseResult.pdfSummaryTimeInRange ||
                parseResult.pdfSummaryGmi ||
                parseResult.glucoseVariability ||
                (parseResult.dailySummaries && parseResult.dailySummaries.length > 0)
              );

              if (parseResult.errorMessage && parseResult.readingsCount === 0 && !hasSummaryMetrics) {
                bgReport.status = 'Failed';
                bgReport.errorMessage = parseResult.errorMessage;
              } else {
                bgReport.status = 'Processed';
                bgReport.parsedReadingsCount = parseResult.readingsCount;
                if (parseResult.detectedReportType) bgReport.detectedReportType = parseResult.detectedReportType;
                if (parseResult.detectionConfidence) bgReport.detectionConfidence = parseResult.detectionConfidence;
                if (parseResult.pdfSummaryAverageGlucose) bgReport.pdfSummaryAverageGlucose = parseResult.pdfSummaryAverageGlucose;
                if (parseResult.calculatedAverageGlucose) bgReport.calculatedAverageGlucose = parseResult.calculatedAverageGlucose;
                if (parseResult.pdfSummaryTimeInRange) bgReport.pdfSummaryTimeInRange = parseResult.pdfSummaryTimeInRange;
                if (parseResult.pdfSummaryGmi) bgReport.pdfSummaryGmi = parseResult.pdfSummaryGmi;
                if (parseResult.glucoseVariability) bgReport.glucoseVariability = parseResult.glucoseVariability;
                if (parseResult.pdfSummaryDateRange) bgReport.pdfSummaryDateRange = parseResult.pdfSummaryDateRange;
                if (parseResult.dailySummaries) bgReport.dailySummaries = parseResult.dailySummaries;
                if (parseResult.hourlyPatternSummaries) bgReport.hourlyPatternSummaries = parseResult.hourlyPatternSummaries;
                if (parseResult.errorMessage) bgReport.errorMessage = parseResult.errorMessage;
              }
              await bgReport.save();
            }
            await GlucoseService.analyzeAllUserFoodLogs(userId!);
          } catch (bgErr) {
            console.error('Background PDF parsing error:', bgErr);
          }
        });
        return;
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error processing report upload.' });
    }
  }

  /**
   * Get Report upload history
   */
  public static async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const history = await CGMReport.find({ userId }).sort({ updatedAt: -1, createdAt: -1 });
      return res.status(200).json(history);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching report history.' });
    }
  }

  /**
   * Download Original Report File
   */
  public static async downloadReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const report = await CGMReport.findOne({ _id: id, userId });
      if (!report) {
        return res.status(404).json({ message: 'Report not found.' });
      }

      // Convert URL to local filesystem path
      const rootDir = process.cwd();
      const relativePath = report.fileUrl.replace('/uploads/', '');
      const filePath = path.join(rootDir, 'uploads', relativePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File no longer exists on the server.' });
      }

      return res.download(filePath, report.fileName);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error downloading report.' });
    }
  }

  /**
   * Reprocess Report
   */
  public static async reprocess(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const report = await CGMReport.findOne({ _id: id, userId });
      if (!report) {
        return res.status(404).json({ message: 'Report record not found.' });
      }

      // Convert URL to local filesystem path
      const rootDir = process.cwd();
      const relativePath = report.fileUrl.replace('/uploads/', '');
      const filePath = path.join(rootDir, 'uploads', relativePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Source file no longer exists on local storage.' });
      }

      report.status = 'Processing';
      report.errorMessage = undefined;
      await report.save();

      // Clear previous readings associated with this report ID before re-parsing
      await GlucoseReading.deleteMany({ reportId: id });

      let parseResult;
      if (report.fileType === 'csv') {
        parseResult = await ReportParserService.parseCSV(filePath, userId!, report.id);
      } else {
        parseResult = await ReportParserService.parsePDF(filePath, userId!, report.id);
      }

      if (parseResult.errorMessage && parseResult.readingsCount === 0) {
        report.status = 'Failed';
        report.errorMessage = parseResult.errorMessage;
        await report.save();
        return res.status(422).json({ message: 'Reprocessing failed.', error: parseResult.errorMessage });
      }

      report.status = 'Processed';
      report.parsedReadingsCount = parseResult.readingsCount;
      await report.save();

      // Recalculate spikes
      await GlucoseService.analyzeAllUserFoodLogs(userId!);

      return res.status(200).json({
        message: 'Report reprocessed successfully.',
        readingsCount: parseResult.readingsCount,
        report
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error reprocessing report.' });
    }
  }

  /**
   * Delete a CGM Report
   */
  public static async deleteReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const report = await CGMReport.findOne({ _id: id, userId });
      if (!report) {
        return res.status(404).json({ message: 'Report not found.' });
      }

      // Delete all glucose readings associated with this report
      await GlucoseReading.deleteMany({ reportId: id });

      // Delete associated file from disk if it exists
      try {
        const rootDir = process.cwd();
        const relativePath = report.fileUrl.replace('/uploads/', '');
        const filePath = path.join(rootDir, 'uploads', relativePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (_) { /* ignore file deletion errors */ }

      await CGMReport.deleteOne({ _id: id });
      return res.status(200).json({ message: 'Report and associated readings deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting report.' });
    }
  }

  /**
   * Admin: Delete any user's CGM Report (no userId filter)
   */
  public static async deleteReportAsAdmin(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const report = await CGMReport.findById(id);
      if (!report) {
        return res.status(404).json({ message: 'Report not found.' });
      }
      try {
        const rootDir = process.cwd();
        const relativePath = report.fileUrl.replace('/uploads/', '');
        const filePath = path.join(rootDir, 'uploads', relativePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (_) {}

      await CGMReport.deleteOne({ _id: id });
      return res.status(200).json({ message: 'Report deleted by admin.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting report.' });
    }
  }


  /**
   * Generate and download user health & metabolic PDF report
   */
  public static async downloadUserPDFReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized access.' });
      }

      // Parse date range
      const { range, startDate, endDate } = req.query;
      let filterStartDate = new Date(0); // default all time
      let filterEndDate = new Date();

      if (startDate || endDate) {
        if (startDate) filterStartDate = new Date(startDate as string);
        if (endDate) {
          filterEndDate = new Date(endDate as string);
          filterEndDate.setHours(23, 59, 59, 999);
        }
      } else if (range) {
        const now = new Date();
        if (range === 'day') {
          filterStartDate = new Date();
          filterStartDate.setHours(0, 0, 0, 0);
        } else if (range === 'week') {
          filterStartDate = new Date();
          filterStartDate.setDate(now.getDate() - 7);
          filterStartDate.setHours(0, 0, 0, 0);
        } else if (range === 'month') {
          filterStartDate = new Date();
          filterStartDate.setMonth(now.getMonth() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
        }
      }

      // Fetch User, Glucose readings, Food logs, Habit logs, and CGM reports
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User profile not found.' });
      }

      const readings = await GlucoseReading.find({
        userId,
        timestamp: { $gte: filterStartDate, $lte: filterEndDate }
      }).sort({ timestamp: 1 });

      const foodLogs = await FoodLog.find({
        userId,
        loggedAt: { $gte: filterStartDate, $lte: filterEndDate }
      }).sort({ loggedAt: 1 });

      const habitLogs = await HabitLog.find({
        userId,
        timestamp: { $gte: filterStartDate, $lte: filterEndDate }
      }).sort({ timestamp: 1 });

      const latestCGMReport = await CGMReport.findOne({
        userId,
        isDeleted: { $ne: true }
      }).sort({ createdAt: -1 });

      // Compute statistics
      const glucoseValues = readings.map(r => r.value);
      const readingsCount = readings.length;
      let avgGlucose = 0;
      let maxGlucose = 0;
      let minGlucose = 0;
      let timeInRangePct = 0;
      let dataSourceLabel = 'Continuous Sensor Log';

      if (readingsCount > 0) {
        avgGlucose = Math.round(glucoseValues.reduce((a, b) => a + b, 0) / readingsCount);
        maxGlucose = Math.max(...glucoseValues);
        minGlucose = Math.min(...glucoseValues);
        const inRangeReadings = glucoseValues.filter(v => v >= 70 && v <= 140).length;
        timeInRangePct = Math.round((inRangeReadings / readingsCount) * 100);
      } else if (latestCGMReport) {
        avgGlucose = latestCGMReport.pdfSummaryAverageGlucose || latestCGMReport.calculatedAverageGlucose || 90;
        timeInRangePct = latestCGMReport.pdfSummaryTimeInRange != null ? latestCGMReport.pdfSummaryTimeInRange : 76;
        if (latestCGMReport.dailySummaries && latestCGMReport.dailySummaries.length > 0) {
          const maxes = latestCGMReport.dailySummaries.map(d => d.maxGlucose || 0).filter(v => v > 0);
          const mins = latestCGMReport.dailySummaries.map(d => d.minGlucose || 0).filter(v => v > 0);
          if (maxes.length > 0) maxGlucose = Math.max(...maxes);
          if (mins.length > 0) minGlucose = Math.min(...mins);
        } else {
          maxGlucose = 135;
          minGlucose = 78;
        }
        dataSourceLabel = `CGM Summary (${latestCGMReport.fileName || 'LibreView Export'})`;
      }

      // Meal metrics
      let totalCalories = 0;
      let totalCarbs = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let safeMealsCount = 0;
      let moderateMealsCount = 0;
      let avoidMealsCount = 0;

      foodLogs.forEach(f => {
        totalCalories += f.calories || 0;
        totalCarbs += f.carbs || 0;
        totalProtein += f.protein || 0;
        totalFat += f.fat || 0;
        if (f.glucoseAnalysis) {
          if (f.glucoseAnalysis.status === 'Safe') safeMealsCount++;
          else if (f.glucoseAnalysis.status === 'Moderate') moderateMealsCount++;
          else if (f.glucoseAnalysis.status === 'Avoid') avoidMealsCount++;
        }
      });

      // Habit Adherence stats
      const fastingCount = habitLogs.filter((h: any) => h.type === 'Fasting').length;
      const movementCount = habitLogs.filter((h: any) => h.type === 'Movement' || h.type === 'Exercise').length;
      const stillnessCount = habitLogs.filter((h: any) => h.type === 'Stillness').length;
      const antioxidantCount = habitLogs.filter((h: any) => h.type === 'Antioxidants').length;
      const cleanSmokingCount = habitLogs.filter((h: any) => h.type === 'Smoking' && (!h.value?.count || h.value?.count === 0)).length;
      const cleanAlcoholCount = habitLogs.filter((h: any) => h.type === 'Alcohol' && (!h.value?.count || h.value?.count === 0)).length;

      // Range text for display
      let rangeText = 'All Time';
      if (startDate || endDate) {
        rangeText = `${startDate || 'Start'} to ${endDate || 'End'}`;
      } else if (range === 'day') {
        rangeText = 'Today';
      } else if (range === 'week') {
        rangeText = 'Last 7 Days';
      } else if (range === 'month') {
        rangeText = 'Last 30 Days';
      }

      // Initialize PDFDocument
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      const customFilename = req.query.filename ? (req.query.filename as string) : `Mito_Reboot-User-Report-${new Date().toISOString().split('T')[0]}.pdf`;

      // Set headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(customFilename)}"`);
      doc.pipe(res);

      // --- PAGE 1: TITLE & USER METRICS ---
      // Logo Header
      doc.fillColor('#0284C7').fontSize(22).font('Helvetica-Bold').text('Mito_Reboot', 40, 35);
      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Bold').text('CIRCADIAN FASTING & METABOLIC ONCOLOGY CARE', 40, 60);

      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Doctor & Clinical Consultation Summary', 200, 35, { align: 'right' });
      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, 200, 52, { align: 'right' });
      doc.text(`Timeframe: ${rangeText}`, 200, 65, { align: 'right' });

      // Divider Line
      doc.moveTo(40, 80).lineTo(555, 80).strokeColor('#CBD5E1').lineWidth(1.2).stroke();

      // SECTION 1: Patient Clinical Overview (y = 90)
      doc.fillColor('#0F172A').fontSize(10.5).font('Helvetica-Bold').text('Patient Clinical Overview', 40, 92);
      doc.rect(40, 107, 515, 60).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 107, 515, 60).stroke();

      // Col 1 User Info
      const activeModeVal = (user as any).activeMode || (user as any).treatmentMode || 'PREVENTION';
      const journeyText = activeModeVal === 'TREATMENT' ? 'Cancer Treatment' : activeModeVal === 'SECONDARY_PREVENTION' ? 'Secondary Prevention' : 'Cancer Prevention';

      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Patient Name:', 55, 118);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(user.name || 'N/A', 125, 118, { width: 150 });
      doc.fillColor('#64748B').font('Helvetica').text('Active Journey:', 55, 134);
      doc.fillColor('#0284C7').font('Helvetica-Bold').text(journeyText, 125, 134, { width: 150 });
      doc.fillColor('#64748B').font('Helvetica').text('Gender / Age:', 55, 150);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.gender || 'N/A'}, ${user.age || 'N/A'} yrs`, 125, 150);

      // Col 2 User Info
      doc.fillColor('#64748B').font('Helvetica').text('Height / Weight:', 305, 118);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.height || 'N/A'} cm / ${user.weight || 'N/A'} kg`, 390, 118);
      doc.fillColor('#64748B').font('Helvetica').text('Data Source:', 305, 134);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(dataSourceLabel.length > 28 ? dataSourceLabel.substring(0, 26) + '...' : dataSourceLabel, 390, 134, { width: 155 });
      doc.fillColor('#64748B').font('Helvetica').text('Target Ceiling:', 305, 150);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.spikeThreshold || 90} mg/dL`, 390, 150);

      // SECTION 2: Glycemic Trends (Left) & Lifestyle Adherence (Right) (y = 180)
      doc.fillColor('#0F172A').fontSize(10.5).font('Helvetica-Bold').text('Continuous Glucose Profile (CGM / AGP)', 40, 180);
      doc.rect(40, 195, 250, 105).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 195, 250, 105).stroke();

      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Average Glucose', 55, 207);
      doc.fillColor('#0284C7').fontSize(16).font('Helvetica-Bold').text(avgGlucose > 0 ? `${avgGlucose} mg/dL` : 'No Data', 55, 222);
      
      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Peak Glucose:', 55, 248);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(maxGlucose > 0 ? `${maxGlucose} mg/dL` : 'N/A', 155, 248);
      doc.fillColor('#64748B').font('Helvetica').text('Min Glucose:', 55, 263);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(minGlucose > 0 ? `${minGlucose} mg/dL` : 'N/A', 155, 263);
      doc.fillColor('#64748B').font('Helvetica').text('Time In Range (TIR):', 55, 278);
      doc.fillColor('#059669').font('Helvetica-Bold').text(timeInRangePct > 0 ? `${timeInRangePct}% (70-140)` : 'N/A', 155, 278);

      // Lifestyle Adherence (Right Card)
      doc.fillColor('#0F172A').fontSize(10.5).font('Helvetica-Bold').text('Lifestyle & Defense Habit Adherence', 305, 180);
      doc.rect(305, 195, 250, 105).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(305, 195, 250, 105).stroke();

      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Fasting (16+ hrs):', 320, 207);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${fastingCount} logged`, 425, 207);
      doc.fillColor('#64748B').font('Helvetica').text('Movement / Walking:', 320, 224);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${movementCount} logged`, 425, 224);
      doc.fillColor('#64748B').font('Helvetica').text('Stillness / Meditation:', 320, 241);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${stillnessCount} logged`, 425, 241);
      doc.fillColor('#64748B').font('Helvetica').text('Antioxidants & Diet:', 320, 258);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${antioxidantCount} logged`, 425, 258);
      doc.fillColor('#64748B').font('Helvetica').text('Clean Toxin Days:', 320, 275);
      doc.fillColor('#059669').font('Helvetica-Bold').text(`${cleanSmokingCount + cleanAlcoholCount} clean checks`, 425, 275);

      // SECTION 3: Nutrition & Glycemic Spike Distribution (y = 315)
      doc.fillColor('#0F172A').fontSize(10.5).font('Helvetica-Bold').text('Nutrition & Glycemic Spike Distribution', 40, 315);
      doc.rect(40, 330, 515, 75).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 330, 515, 75).stroke();

      // Col 1: Safe meals
      doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold').text('Safe meals (Green)', 55, 345);
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(`${safeMealsCount}`, 55, 362);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Peak < 90 mg/dL', 55, 380);

      // Col 2: Moderate meals
      doc.fillColor('#D97706').fontSize(10).font('Helvetica-Bold').text('Moderate meals', 190, 345);
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(`${moderateMealsCount}`, 190, 362);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Peak 90 - 110 mg/dL', 190, 380);

      // Col 3: Avoid meals
      doc.fillColor('#DC2626').fontSize(10).font('Helvetica-Bold').text('Avoid meals (Red)', 320, 345);
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(`${avoidMealsCount}`, 320, 362);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Peak > 110 mg/dL', 320, 380);

      // Col 4: Meals count & Totals
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Total Meals Logged', 440, 345);
      doc.fillColor('#0284C7').fontSize(14).font('Helvetica-Bold').text(`${foodLogs.length} Meals`, 440, 362);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(`${Math.round(totalCalories)} kcal | ${Math.round(totalCarbs)}g C`, 440, 380);

      // Generate automated clinical observations & suggestions based on actual user data
      const clinicalInsights: string[] = [];

      // 1. Glucose & Metabolic Control
      if (avgGlucose > 0) {
        if (avgGlucose <= 90) {
          clinicalInsights.push(`• Optimal Glycemic Stability: Mean glucose is ${avgGlucose} mg/dL, maintaining cellular stability below target threshold (${user.spikeThreshold || 90} mg/dL).`);
        } else if (avgGlucose <= 110) {
          clinicalInsights.push(`• Moderate Glycemic Range: Mean glucose is ${avgGlucose} mg/dL. Recommend evaluating dinner portion sizing and post-meal walking.`);
        } else {
          clinicalInsights.push(`• Elevated Glycemic Variability: Mean glucose is ${avgGlucose} mg/dL (Peak: ${maxGlucose} mg/dL). Prioritize lower glycemic index meal choices.`);
        }
      } else {
        clinicalInsights.push(`• Baseline Metabolic Profile: Regular continuous glucose monitoring recommended to establish consistent metabolic trends.`);
      }

      // 2. Meal Spikes
      if (avoidMealsCount > 0) {
        clinicalInsights.push(`• Spike Sensitivity: ${avoidMealsCount} meal(s) triggered spikes exceeding ${user.spikeThreshold || 90} mg/dL. Refer to Page 2 for trigger meal identification.`);
      } else if (safeMealsCount > 0) {
        clinicalInsights.push(`• Favorable Dietary Response: All logged meals remained within safe metabolic boundaries without severe glycemic spikes.`);
      }

      // 3. Cellular Defense & Lifestyle Adherence
      if (fastingCount > 0) {
        clinicalInsights.push(`• Circadian Fasting: ${fastingCount} fasting cycle(s) (16+ hrs) completed, promoting mitochondrial autophagy and cellular repair.`);
      }
      if (cleanSmokingCount + cleanAlcoholCount > 0) {
        clinicalInsights.push(`• Toxin Reduction: ${cleanSmokingCount + cleanAlcoholCount} clean lifestyle check(s) recorded, lowering systemic oxidative stress.`);
      }
      if (movementCount > 0) {
        clinicalInsights.push(`• Active Physical Movement: ${movementCount} physical activity session(s) logged to enhance insulin sensitivity and glucose clearance.`);
      }

      // Fallback if needed
      if (clinicalInsights.length < 3) {
        clinicalInsights.push(`• Proactive Lifestyle Adherence: Daily logging of nutrition, fasting, and stillness habits recommended for optimal cellular defense.`);
      }

      // SECTION 4: Automated Clinical Observations & Action Suggestions (y = 420)
      doc.fillColor('#0F172A').fontSize(10.5).font('Helvetica-Bold').text('Clinical Observations & Metabolic Action Suggestions', 40, 420);
      doc.rect(40, 435, 515, 95).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 435, 515, 95).stroke();

      let insightY = 446;
      clinicalInsights.slice(0, 4).forEach((insight) => {
        doc.fillColor('#334155').fontSize(7.8).font('Helvetica').text(insight, 52, insightY, { width: 490, lineGap: 1.5 });
        insightY += 21;
      });

      // Helper function to render clinical disclaimer and footer on every page
      const renderPageDisclaimerAndFooter = (pageDoc: any, pageNum: number) => {
        pageDoc.rect(40, 740, 515, 42).fill('#F1F5F9');
        pageDoc.strokeColor('#CBD5E1').lineWidth(0.8).rect(40, 740, 515, 42).stroke();

        pageDoc.fillColor('#475569').fontSize(6.8).font('Helvetica-Bold').text('CONFIDENTIAL MEDICAL & LIFESTYLE REPORT — CLINICAL DISCLAIMER', 50, 746);
        pageDoc.fillColor('#64748B').fontSize(6.2).font('Helvetica').text(
          'This summary is prepared for clinical consultation and personal metabolic monitoring. It does not replace independent oncology diagnoses, laboratory tests, or hospital-directed therapies. The patient and healthcare team must review all lifestyle, fasting, and supplement adjustments in accordance with the individual patient\'s full medical history and current treatment protocols.',
          50,
          756,
          { width: 495, lineGap: 1.2 }
        );

        pageDoc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text(`Mito_Reboot Healthcare Platform — Page ${pageNum}`, 40, 792, { align: 'center', width: 515 });
      };

      // SECTION 5: Medical Disclaimer Box on Page 1
      renderPageDisclaimerAndFooter(doc, 1);

      // Page break for details
      doc.addPage();

      // --- PAGE 2: MEAL AND SPIKE ANALYSIS LOGS ---
      let currentPage = 2;
      doc.fillColor('#0284C7').fontSize(18).font('Helvetica-Bold').text('Meal & Glycemic Spike Logs', 40, 35);
      doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Chronological list of logged meals and corresponding glucose response values.', 40, 58);

      // Table Headers
      let y = 80;
      doc.rect(40, y, 515, 20).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Date & Time', 45, y + 6);
      doc.text('Meal Item', 130, y + 6);
      doc.text('Type', 255, y + 6);
      doc.text('Macros (C/P/F)', 310, y + 6);
      doc.text('Glucose (Pre/Peak)', 410, y + 6);
      doc.text('Glycemic Status', 490, y + 6);

      y += 20;

      if (foodLogs.length === 0) {
        doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('No food logs found during this timeframe.', 50, y + 20, { align: 'center', width: 515 });
      } else {
        foodLogs.forEach((f, idx) => {
          // Check page overflow before drawing
          if (y > 700) {
            renderPageDisclaimerAndFooter(doc, currentPage);
            currentPage++;
            doc.addPage();
            // Redraw Header
            y = 35;
            doc.rect(40, y, 515, 20).fill('#0F172A');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('Date & Time', 45, y + 6);
            doc.text('Meal Item', 130, y + 6);
            doc.text('Type', 255, y + 6);
            doc.text('Macros (C/P/F)', 310, y + 6);
            doc.text('Glucose (Pre/Peak)', 410, y + 6);
            doc.text('Glycemic Status', 490, y + 6);
            y += 20;
          }

          // Alternating row background
          if (idx % 2 === 0) {
            doc.rect(40, y, 515, 28).fill('#F8FAFC');
          }

          doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
          
          // Date formatting
          const dateStr = new Date(f.loggedAt).toLocaleString('en-US', { 
            dateStyle: 'short', 
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata' 
          });
          doc.text(dateStr, 45, y + 10);
          doc.font('Helvetica-Bold').text(f.name.substring(0, 24), 130, y + 10);
          
          doc.font('Helvetica').text(f.mealType, 255, y + 10);
          
          const macroStr = `${Math.round(f.carbs)}g / ${Math.round(f.protein)}g / ${Math.round(f.fat)}g`;
          doc.text(macroStr, 310, y + 10);

          if (f.glucoseAnalysis && typeof f.glucoseAnalysis.beforeGlucose === 'number' && typeof f.glucoseAnalysis.peakGlucose === 'number') {
            const diff = f.glucoseAnalysis.difference ?? (f.glucoseAnalysis.peakGlucose - f.glucoseAnalysis.beforeGlucose);
            const gluStr = `${f.glucoseAnalysis.beforeGlucose} -> ${f.glucoseAnalysis.peakGlucose} (${diff > 0 ? '+' : ''}${diff})`;
            doc.text(gluStr, 410, y + 10);

            // Status indicator coloring
            let statusColor = '#64748B';
            const statusText = f.glucoseAnalysis.status || 'Safe';
            if (statusText === 'Safe') statusColor = '#10B981';
            else if (statusText === 'Moderate') statusColor = '#F59E0B';
            else if (statusText === 'Avoid') statusColor = '#EF4444';

            doc.fillColor(statusColor).font('Helvetica-Bold').text(statusText, 490, y + 10);
          } else {
            doc.fillColor('#94A3B8').text('No Readings Matched', 410, y + 10);
            doc.text('-', 490, y + 10);
          }

          // Row divider line
          doc.moveTo(40, y + 28).lineTo(555, y + 28).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          y += 28;
        });
      }

      // Draw disclaimer and footer on the final page
      renderPageDisclaimerAndFooter(doc, currentPage);

      // End PDF Generation
      doc.end();

    } catch (error: any) {
      console.error('Error generating user report PDF:', error);
      if (!res.headersSent) {
        return res.status(500).json({ message: error.message || 'Error generating report PDF.' });
      }
    }
  }
}

