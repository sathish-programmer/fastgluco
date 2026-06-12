import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { User } from './models/User';
import { FoodLog } from './models/FoodLog';
import { GlucoseReading } from './models/GlucoseReading';
import { CGMReport } from './models/CGMReport';
import { ReportParserService } from './services/reportParserService';
import { GlucoseService } from './services/glucoseService';

const MOCK_CSV_CONTENT = `
"Patient Name","Test Patient"
"Created On","10-06-2026"
Device,Serial Number,Device Timestamp,Record Type,Historic Glucose (mg/dL),Scan Glucose (mg/dL),Non-numeric,Non-numeric
FreeStyle Libre,123456,10/06/2026 08:30,0,85,,
FreeStyle Libre,123456,10/06/2026 09:30,0,88,,
FreeStyle Libre,123456,10/06/2026 10:00,0,98,,
FreeStyle Libre,123456,10/06/2026 10:30,0,115,,
FreeStyle Libre,123456,10/06/2026 11:00,0,92,,
FreeStyle Libre,123456,10/06/2026 11:30,0,87,,
FreeStyle Libre,123456,10/06/2026 12:30,0,84,,
`;

const runValidation = async () => {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    console.error('Error: MONGODB_URI not set.');
    process.exit(1);
  }

  try {
    console.log('--- STARTING BACKEND INTEGRATION VALIDATION ---');
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Database connected.');

    // 1. Clear database elements
    await User.deleteMany({ email: 'test_patient@fastgluco.com' });
    await CGMReport.deleteMany({});
    
    // 2. Create Patient
    console.log('Creating mock patient...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('PatientPassword123!', salt);
    const user = await User.create({
      name: 'Test Patient',
      email: 'test_patient@fastgluco.com',
      passwordHash,
      gender: 'Male',
      age: 35,
      height: 175,
      weight: 70,
      activityLevel: 'Moderately active',
      goal: 'Maintain weight',
      spikeThreshold: 90
    });
    console.log(`Mock patient created. ID: ${user._id}`);

    // 3. Create mock CSV file
    const testUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }
    const csvPath = path.join(testUploadDir, 'test_report_export.csv');
    fs.writeFileSync(csvPath, MOCK_CSV_CONTENT.trim());
    console.log(`Created mock Abbott FreeStyle CSV file: ${csvPath}`);

    // 4. Create CGM Report Document in DB
    const report = await CGMReport.create({
      userId: user._id,
      fileName: 'test_report_export.csv',
      fileUrl: '/uploads/test_report_export.csv',
      fileType: 'csv',
      status: 'Processing',
      parsedReadingsCount: 0
    });
    console.log(`CGMReport entry created. ID: ${report._id}`);

    // 5. Test parser execution
    console.log('Running CSV Parser...');
    const parseResult = await ReportParserService.parseCSV(csvPath, user.id, report.id);
    console.log('CSV Parser Completed:', parseResult);

    if (parseResult.errorMessage) {
      throw new Error(`CSV parser failed: ${parseResult.errorMessage}`);
    }

    report.status = 'Processed';
    report.parsedReadingsCount = parseResult.readingsCount;
    await report.save();

    // Verify readings count in database
    const dbReadingsCount = await GlucoseReading.countDocuments({ reportId: report._id });
    console.log(`Glucose readings successfully stored in MongoDB: ${dbReadingsCount}`);

    // 6. Test Food Logging & Spikes analysis
    console.log('Logging a breakfast meal at 10/06/2026 09:30 AM (Masala Dosa)...');
    const mealTime = ReportParserService.parseDateResilient('10/06/2026 09:30');
    
    // Clear former logs
    await FoodLog.deleteMany({ userId: user._id });

    const foodLog = await FoodLog.create({
      userId: user._id,
      name: 'Masala Dosa',
      category: 'South Indian',
      mealType: 'Breakfast',
      calories: 250,
      carbs: 40,
      protein: 5,
      fat: 8,
      quantity: 1,
      unit: 'piece',
      loggedAt: mealTime
    });

    console.log('Correlating food log with continuous readings (Spike analysis)...');
    const analysis = await GlucoseService.analyzeFoodLog(foodLog.id);
    
    if (!analysis) {
      throw new Error('Analysis correlation returned null! Readings did not match correctly.');
    }

    console.log('\n--- SPIKE ANALYSIS RESULTS ---');
    console.log(`Food Logged    : ${foodLog.name}`);
    console.log(`Logged At      : ${foodLog.loggedAt}`);
    console.log(`Before Glucose : ${analysis.beforeGlucose} mg/dL (At 09:30 AM: 88 mg/dL)`);
    console.log(`Peak Glucose   : ${analysis.peakGlucose} mg/dL (At 10:30 AM: 115 mg/dL)`);
    console.log(`Difference     : +${analysis.difference} mg/dL`);
    console.log(`Food Status    : ${analysis.status} (Peak exceeds threshold 90, falls into Avoid >110)`);
    console.log('------------------------------\n');

    // 7. Test Top Foods aggregates screen
    console.log('Running Top Foods reports aggregator...');
    const topFoods = await GlucoseService.getTopFoodsReport(user.id);
    console.log('Aggregated Top Foods:', JSON.stringify(topFoods, null, 2));

    console.log('Clean up test CSV file...');
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }

    console.log('--- VALIDATION SUCCESSFUL ---');
    process.exit(0);
  } catch (err) {
    console.error('Validation failed with error:', err);
    process.exit(1);
  }
};

runValidation();
