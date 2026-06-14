import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CGMReport } from '../models/CGMReport';
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

      // Create a database log
      const report = new CGMReport({
        userId,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`, // relative link for dev storage
        fileType,
        status: 'Processing',
        parsedReadingsCount: 0
      });

      await report.save();

      // Process file synchronously or background. We'll do it synchronously here for quick client updates.
      const filePath = file.path;
      let parseResult;

      if (fileType === 'csv') {
        parseResult = await ReportParserService.parseCSV(filePath, userId!, report.id);
      } else {
        parseResult = await ReportParserService.parsePDF(filePath, userId!, report.id);
      }

      if (parseResult.errorMessage && parseResult.readingsCount === 0) {
        report.status = 'Failed';
        report.errorMessage = parseResult.errorMessage;
        await report.save();
        return res.status(422).json({
          message: 'Report upload failed during processing.',
          error: parseResult.errorMessage,
          report
        });
      }

      report.status = 'Processed';
      report.parsedReadingsCount = parseResult.readingsCount;
      if (parseResult.errorMessage) {
        report.errorMessage = parseResult.errorMessage; // warning indicators if any
      }
      await report.save();

      // Automatically run meal spike matching for all logs since new CGM readings are populated
      try {
        await GlucoseService.analyzeAllUserFoodLogs(userId!);
      } catch (syncErr) {
        console.error('Post-upload meal synchronization warning:', syncErr);
      }

      return res.status(200).json({
        message: 'Report uploaded and parsed successfully.',
        readingsCount: parseResult.readingsCount,
        report
      });
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
      const history = await CGMReport.find({ userId }).sort({ createdAt: -1 });
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
      return res.status(200).json({ message: 'Report deleted successfully.' });
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

      // Fetch User, Glucose readings, Food logs
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

      // Compute statistics
      const glucoseValues = readings.map(r => r.value);
      const readingsCount = readings.length;
      const avgGlucose = readingsCount > 0 ? Math.round(glucoseValues.reduce((a, b) => a + b, 0) / readingsCount) : 0;
      const maxGlucose = readingsCount > 0 ? Math.max(...glucoseValues) : 0;
      const minGlucose = readingsCount > 0 ? Math.min(...glucoseValues) : 0;

      // Safe threshold details
      const targetMin = 70;
      const targetMax = 140;
      const inRangeReadings = glucoseValues.filter(v => v >= targetMin && v <= targetMax).length;
      const timeInRangePct = readingsCount > 0 ? Math.round((inRangeReadings / readingsCount) * 100) : 0;

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

      // Set headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="FastGluco-User-Report-${new Date().toISOString().split('T')[0]}.pdf"`);
      doc.pipe(res);

      // --- PAGE 1: TITLE & USER METRICS ---
      // Logo Header
      doc.fillColor('#0284C7').fontSize(24).font('Helvetica-Bold').text('FastGluco', 40, 40);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('METABOLIC HEALTH & NUTRITION PLATFORM', 40, 68);

      doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text('Personal Health & Metabolic Report', 200, 40, { align: 'right' });
      doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, 200, 60, { align: 'right' });
      doc.text(`Timeframe: ${rangeText}`, 200, 75, { align: 'right' });

      // Divider Line
      doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#E2E8F0').lineWidth(1.5).stroke();

      // User Profile Info Card
      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('User Profile Summary', 40, 110);
      doc.rect(40, 130, 515, 75).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 130, 515, 75).stroke();

      // Col 1 User Info
      doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Name:', 55, 145);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(user.name, 120, 145);
      doc.fillColor('#64748B').font('Helvetica').text('Email:', 55, 165);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(user.email, 120, 165);
      doc.fillColor('#64748B').font('Helvetica').text('Gender/Age:', 55, 185);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.gender || 'N/A'}, ${user.age || 'N/A'} yrs`, 120, 185);

      // Col 2 User Info
      doc.fillColor('#64748B').font('Helvetica').text('Height / Weight:', 290, 145);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.height || 'N/A'} cm / ${user.weight || 'N/A'} kg`, 380, 145);
      doc.fillColor('#64748B').font('Helvetica').text('Calorie Target:', 290, 165);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.dailyCalorieTarget || 'N/A'} kcal/day`, 380, 165);
      doc.fillColor('#64748B').font('Helvetica').text('Spike Threshold:', 290, 185);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${user.spikeThreshold} mg/dL`, 380, 185);

      // Glycemic Trends Card
      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Glucose Metrics', 40, 225);
      doc.rect(40, 245, 250, 110).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 245, 250, 110).stroke();

      doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('Average Glucose', 55, 260);
      doc.fillColor('#0284C7').fontSize(16).font('Helvetica-Bold').text(readingsCount > 0 ? `${avgGlucose} mg/dL` : 'No Data', 55, 275);
      
      doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Peak Glucose:', 55, 305);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(readingsCount > 0 ? `${maxGlucose} mg/dL` : 'N/A', 150, 305);
      doc.fillColor('#64748B').font('Helvetica').text('Min Glucose:', 55, 320);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(readingsCount > 0 ? `${minGlucose} mg/dL` : 'N/A', 150, 320);
      doc.fillColor('#64748B').font('Helvetica').text('Time In Range:', 55, 335);
      doc.fillColor('#10B981').font('Helvetica-Bold').text(readingsCount > 0 ? `${timeInRangePct}% (70-140)` : 'N/A', 150, 335);

      // Nutrition Summary Card
      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Nutrition & Meal Stats', 305, 225);
      doc.rect(305, 245, 250, 110).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(305, 245, 250, 110).stroke();

      doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('Total Meals Logged', 320, 260);
      doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text(`${foodLogs.length} Meals`, 320, 275);
      
      doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Total Calories:', 320, 305);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${Math.round(totalCalories)} kcal`, 420, 305);
      doc.fillColor('#64748B').font('Helvetica').text('Total Carbs:', 320, 320);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${Math.round(totalCarbs)}g`, 420, 320);
      doc.fillColor('#64748B').font('Helvetica').text('Protein / Fat:', 320, 335);
      doc.fillColor('#1E293B').font('Helvetica-Bold').text(`${Math.round(totalProtein)}g / ${Math.round(totalFat)}g`, 420, 335);

      // Meal Spikes Classification Card
      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Glycemic Spike Distribution', 40, 375);
      doc.rect(40, 395, 515, 75).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').lineWidth(1).rect(40, 395, 515, 75).stroke();

      // Safe, Moderate, Avoid sections
      doc.fillColor('#10B981').fontSize(11).font('Helvetica-Bold').text('Safe meals (Green)', 60, 415);
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(`${safeMealsCount}`, 60, 435);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Average Peak < 90 mg/dL', 60, 452);

      doc.fillColor('#F59E0B').fontSize(11).font('Helvetica-Bold').text('Moderate meals', 230, 415);
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(`${moderateMealsCount}`, 230, 435);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Peak 90 - 110 mg/dL', 230, 452);

      doc.fillColor('#EF4444').fontSize(11).font('Helvetica-Bold').text('Avoid meals (Red)', 400, 415);
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text(`${avoidMealsCount}`, 400, 435);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Spike Peak > 110 mg/dL', 400, 452);

      // Footer
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text('FastGluco Platform - Patient Metabolic Insights & Trends', 40, 520, { align: 'center', width: 515 });

      // Page break for details
      doc.addPage();

      // --- PAGE 2: MEAL AND SPIKE ANALYSIS LOGS ---
      doc.fillColor('#0284C7').fontSize(20).font('Helvetica-Bold').text('Meal & Glycemic Spike Logs', 40, 40);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Chronological list of logged meals and corresponding glucose response values.', 40, 65);

      // Table Headers
      let y = 90;
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
          // Check page overflow
          if (y > 740) {
            doc.addPage();
            // Redraw Header
            y = 40;
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

          if (f.glucoseAnalysis) {
            const gluStr = `${f.glucoseAnalysis.beforeGlucose} -> ${f.glucoseAnalysis.peakGlucose} (${f.glucoseAnalysis.difference > 0 ? '+' : ''}${f.glucoseAnalysis.difference})`;
            doc.text(gluStr, 410, y + 10);

            // Status indicator coloring
            let statusColor = '#64748B';
            if (f.glucoseAnalysis.status === 'Safe') statusColor = '#10B981';
            else if (f.glucoseAnalysis.status === 'Moderate') statusColor = '#F59E0B';
            else if (f.glucoseAnalysis.status === 'Avoid') statusColor = '#EF4444';

            doc.fillColor(statusColor).font('Helvetica-Bold').text(f.glucoseAnalysis.status, 490, y + 10);
          } else {
            doc.fillColor('#94A3B8').text('No Readings Matched', 410, y + 10);
            doc.text('-', 490, y + 10);
          }

          // Row divider line
          doc.moveTo(40, y + 28).lineTo(555, y + 28).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          y += 28;
        });
      }

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

