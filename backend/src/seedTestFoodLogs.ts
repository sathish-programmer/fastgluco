/**
 * Seed Test Food Logs Script
 * 
 * This script creates food log entries for a user that match the
 * Abbott FreeStyle Libre CGM test CSV data (11 June 2026).
 * Then runs glucose spike analysis to correlate food with glucose readings.
 * 
 * Usage: npx ts-node src/seedTestFoodLogs.ts
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';
import { FoodLog } from './models/FoodLog';
import { GlucoseReading } from './models/GlucoseReading';
import { GlucoseService } from './services/glucoseService';

const TEST_FOOD_LOGS = [
  {
    name: 'Idli Sambar',
    category: 'South Indian' as const,
    mealType: 'Breakfast' as const,
    calories: 250,
    carbs: 45,
    protein: 8,
    fat: 5,
    quantity: 3,
    unit: 'pieces',
    // Breakfast at 08:00 → glucose before ~83, peaks to ~95 (Safe)
    loggedAt: new Date('2026-06-11T08:00:00')
  },
  {
    name: 'Gulab Jamun',
    category: 'Snacks' as const,
    mealType: 'Snack' as const,
    calories: 380,
    carbs: 65,
    protein: 4,
    fat: 14,
    quantity: 3,
    unit: 'pieces',
    // Mid-morning snack at 10:30 → glucose before ~84, spikes to ~165 (Avoid!)
    loggedAt: new Date('2026-06-11T10:30:00')
  },
  {
    name: 'White Rice with Sambar',
    category: 'South Indian' as const,
    mealType: 'Lunch' as const,
    calories: 520,
    carbs: 85,
    protein: 12,
    fat: 10,
    quantity: 1,
    unit: 'plate',
    // Lunch at 13:00 → glucose before ~98, spikes to ~148 (Avoid!)
    loggedAt: new Date('2026-06-11T13:00:00')
  },
  {
    name: 'Masala Chai with Biscuits',
    category: 'Beverages' as const,
    mealType: 'Snack' as const,
    calories: 180,
    carbs: 30,
    protein: 3,
    fat: 6,
    quantity: 1,
    unit: 'cup + 3 biscuits',
    // Afternoon snack at 15:30 → glucose before ~100, rises to ~118 (Moderate)
    loggedAt: new Date('2026-06-11T15:30:00')
  },
  {
    name: 'Apple',
    category: 'Fruits' as const,
    mealType: 'Snack' as const,
    calories: 95,
    carbs: 25,
    protein: 0.5,
    fat: 0.3,
    quantity: 1,
    unit: 'medium',
    // Evening snack at 17:30 → glucose before ~88, stays at ~88 (Safe)
    loggedAt: new Date('2026-06-11T17:30:00')
  },
  {
    name: 'Chapati with Dal and Sabzi',
    category: 'North Indian' as const,
    mealType: 'Dinner' as const,
    calories: 420,
    carbs: 55,
    protein: 15,
    fat: 14,
    quantity: 2,
    unit: 'chapatis + bowl',
    // Dinner at 20:00 → glucose before ~83, rises to ~125 (Avoid since > 110)
    loggedAt: new Date('2026-06-11T20:00:00')
  }
];

async function seedTestFoodLogs() {
  try {
    await connectDB();

    // Find the user (by email or first user)
    const user = await User.findOne({ email: 'sathish@gmail.com' }) || await User.findOne({});
    if (!user) {
      console.error('❌ No User found in database. Please register a user first.');
      process.exit(1);
    }

    console.log(`\n🔍 Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}\n`);

    // Check glucose readings count
    const readingsCount = await GlucoseReading.countDocuments({ userId: user._id });
    console.log(`📊 Glucose readings in DB for this user: ${readingsCount}`);

    if (readingsCount === 0) {
      console.error('❌ No glucose readings found! Please upload the Abbott CSV first.');
      process.exit(1);
    }

    // Show existing glucose readings date range
    const earliestReading = await GlucoseReading.findOne({ userId: user._id }).sort({ timestamp: 1 });
    const latestReading = await GlucoseReading.findOne({ userId: user._id }).sort({ timestamp: -1 });
    console.log(`   Date range: ${earliestReading?.timestamp?.toLocaleString()} → ${latestReading?.timestamp?.toLocaleString()}\n`);

    // Remove existing test food logs for clean re-run
    const deletedCount = await FoodLog.deleteMany({ userId: user._id });
    console.log(`🧹 Cleared ${deletedCount.deletedCount} existing food log(s)\n`);

    // Insert food logs
    console.log('🍽️  Creating food logs...\n');
    const createdLogs: any[] = [];
    
    for (const food of TEST_FOOD_LOGS) {
      const log = new FoodLog({
        userId: user._id,
        ...food
      });
      await log.save();
      createdLogs.push(log);
      console.log(`   ✅ ${food.mealType.padEnd(10)} | ${food.loggedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ${food.name}`);
    }

    console.log(`\n📝 Created ${createdLogs.length} food logs.`);

    // Run glucose spike analysis on each food log
    console.log('\n🔬 Running glucose spike analysis...\n');

    for (const log of createdLogs) {
      try {
        const analysis = await GlucoseService.analyzeFoodLog(log._id.toString());
        if (analysis) {
          const emoji = analysis.status === 'Safe' ? '✅' : analysis.status === 'Moderate' ? '🟡' : '🔴';
          console.log(`   ${emoji} ${log.name.padEnd(30)} | Before: ${String(analysis.beforeGlucose).padStart(3)} → Peak: ${String(analysis.peakGlucose).padStart(3)} mg/dL | Diff: +${analysis.difference} | Status: ${analysis.status}`);
        } else {
          console.log(`   ⚠️  ${log.name.padEnd(30)} | No matching glucose data found in time window`);
        }
      } catch (err: any) {
        console.error(`   ❌ ${log.name}: Analysis failed - ${err.message}`);
      }
    }

    // Run the top foods aggregation report 
    console.log('\n📊 Top Foods Analysis Report:\n');
    const topFoods = await GlucoseService.getTopFoodsReport(user._id.toString());
    
    console.log('   ✅ SAFE FOODS:');
    if (topFoods.safe.length === 0) {
      console.log('      (none)');
    }
    for (const f of topFoods.safe) {
      console.log(`      • ${f.name} (avg peak: ${f.avgPeak} mg/dL, ${f.count} logs)`);
    }

    console.log('   🟡 MODERATE FOODS:');
    if (topFoods.moderate.length === 0) {
      console.log('      (none)');
    }
    for (const f of topFoods.moderate) {
      console.log(`      • ${f.name} (avg peak: ${f.avgPeak} mg/dL, ${f.count} logs)`);
    }

    console.log('   🔴 AVOID FOODS:');
    if (topFoods.avoid.length === 0) {
      console.log('      (none)');
    }
    for (const f of topFoods.avoid) {
      console.log(`      • ${f.name} (avg peak: ${f.avgPeak} mg/dL, ${f.count} logs)`);
    }

    console.log('\n✨ Done! Refresh the Analysis page in the app to see results.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error);
    process.exit(1);
  }
}

seedTestFoodLogs();
