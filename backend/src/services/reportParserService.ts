import fs from 'fs';
import { GlucoseReading } from '../models/GlucoseReading';
import pdfParse from 'pdf-parse';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';
import { UserSubscription } from '../models/UserSubscription';
export interface ParseResult {
  readingsCount: number;
  errorMessage?: string;
}

export class ReportParserService {
  /**
   * Resilient Date Parser handling multiple formats (YYYY/MM/DD, DD/MM/YYYY, DD-MM-YYYY, etc.)
   */
  public static parseDateResilient(str: string): Date {
    // Attempt standard parsing first (if ISO format YYYY-MM-DD or YYYY/MM/DD)
    const standardDate = new Date(str);
    if (!isNaN(standardDate.getTime()) && str.includes('-') && str.indexOf('-') === 4) {
      return standardDate;
    }

    // Match DD/MM/YYYY HH:MM:SS or DD-MM-YYYY HH:MM
    const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed month
      const year = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = match[6] ? parseInt(match[6], 10) : 0;
      
      const parsed = new Date(year, month, day, hour, minute, second);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback standard parse
    return standardDate;
  }

  /**
   * Resilient CSV Parser for Abbott Libre exports
   */
  public static async parseCSV(filePath: string, userId: string, reportId: string): Promise<ParseResult> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Report file not found: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split(/\r?\n/);
      
      let headerRowIndex = -1;
      let timestampColIndex = -1;
      let historicGlucoseColIndex = -1;
      let scanGlucoseColIndex = -1;

      // 1. Scan for the header row
      for (let i = 0; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.replace(/"/g, '').trim().toLowerCase());
        
        const hasTime = columns.some(c => c.includes('time') || c.includes('timestamp') || c === 'date');
        const hasGlucose = columns.some(c => c.includes('glucose') || c.includes('value'));

        if (hasTime && hasGlucose) {
          headerRowIndex = i;
          timestampColIndex = columns.findIndex(c => c.includes('time') || c.includes('timestamp') || c === 'date');
          historicGlucoseColIndex = columns.findIndex(c => c.includes('historic') && c.includes('glucose'));
          scanGlucoseColIndex = columns.findIndex(c => c.includes('scan') && c.includes('glucose'));
          
          if (historicGlucoseColIndex === -1) {
            historicGlucoseColIndex = columns.findIndex(c => c.includes('glucose'));
          }
          if (scanGlucoseColIndex === -1) {
            scanGlucoseColIndex = columns.findIndex(c => c.includes('scan') || c.includes('scan glucose'));
          }
          break;
        }
      }

      if (headerRowIndex === -1 || timestampColIndex === -1 || historicGlucoseColIndex === -1) {
        throw new Error('Invalid Abbott report format: Could not locate Time/Glucose header columns.');
      }

      const readingsToInsert: any[] = [];
      const seenTimestamps = new Set<string>();

      // 2. Parse data rows
      for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
        if (columns.length <= Math.max(timestampColIndex, historicGlucoseColIndex)) continue;

        const timestampStr = columns[timestampColIndex];
        const glucoseStr = columns[historicGlucoseColIndex] || columns[scanGlucoseColIndex];

        if (!timestampStr || !glucoseStr) continue;

        const glucoseValue = parseFloat(glucoseStr);
        if (isNaN(glucoseValue) || glucoseValue <= 0) continue;

        const timestamp = ReportParserService.parseDateResilient(timestampStr);
        if (isNaN(timestamp.getTime())) continue;

        const timeKey = timestamp.toISOString();
        if (seenTimestamps.has(timeKey)) continue;
        seenTimestamps.add(timeKey);

        readingsToInsert.push({
          userId,
          reportId,
          value: glucoseValue,
          timestamp,
          source: 'CGM'
        });
      }

      if (readingsToInsert.length === 0) {
        return { readingsCount: 0, errorMessage: 'No valid glucose readings found in the file.' };
      }

      // 3. Write readings to database
      const operations = readingsToInsert.map(reading => ({
        updateOne: {
          filter: { userId: reading.userId, timestamp: reading.timestamp },
          update: { $set: reading },
          upsert: true
        }
      }));

      await GlucoseReading.bulkWrite(operations, { ordered: false });

      return { readingsCount: readingsToInsert.length };
    } catch (error: any) {
      console.error('Error parsing CGM CSV:', error);
      return { readingsCount: 0, errorMessage: error.message || 'An error occurred during CSV parsing.' };
    }
  }

  /**
   * PDF Support (Modular & Optional)
   */
  public static async parsePDF(filePath: string, userId: string, reportId: string): Promise<ParseResult> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Report file not found: ${filePath}`);
      }

      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      const text = data.text;
      const readingsToInsert: any[] = [];
      
      // Match "DD/MM/YYYY HH:MM Glucose"
      const regex = /(\d{2}[-/]\d{2}[-/]\d{4}\s+\d{2}:\d{2}(?::\d{2})?)\s+(\d{2,3})/g;
      let match;
      const seenTimestamps = new Set<string>();

      while ((match = regex.exec(text)) !== null) {
        const timestampStr = match[1];
        const glucoseValue = parseInt(match[2], 10);

        if (glucoseValue >= 40 && glucoseValue <= 400) {
          const timestamp = ReportParserService.parseDateResilient(timestampStr);
          if (!isNaN(timestamp.getTime())) {
            const timeKey = timestamp.toISOString();
            if (!seenTimestamps.has(timeKey)) {
              seenTimestamps.add(timeKey);
              readingsToInsert.push({
                userId,
                reportId,
                value: glucoseValue,
                timestamp,
                source: 'CGM'
              });
            }
          }
        }
      }

      if (readingsToInsert.length === 0) {
        return { 
          readingsCount: 0, 
          errorMessage: 'No structured text glucose logs matching "DD/MM/YYYY HH:MM Glucose" pattern found in PDF. Please upload CSV export for automated processing.' 
        };
      }

      const operations = readingsToInsert.map(reading => ({
        updateOne: {
          filter: { userId: reading.userId, timestamp: reading.timestamp },
          update: { $set: reading },
          upsert: true
        }
      }));

      await GlucoseReading.bulkWrite(operations, { ordered: false });
      return { readingsCount: readingsToInsert.length };
    } catch (error: any) {
      console.error('Error parsing CGM PDF:', error);
      return { readingsCount: 0, errorMessage: error.message || 'An error occurred during PDF parsing.' };
    }
  }
}
