import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CGMReport } from '../models/CGMReport';
import { ReportParserService } from '../services/reportParserService';
import { GlucoseService } from '../services/glucoseService';
import fs from 'fs';
import path from 'path';

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
}
