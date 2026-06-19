import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env.production') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

import { FoodSyncService } from '../src/services/foodSyncService';
import { FoodMaster } from '../src/models/FoodMaster';

const runSync = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Database connected successfully.');

    const beforeCount = await FoodMaster.countDocuments();
    console.log(`Current items in FoodMaster library: ${beforeCount}`);

    console.log('Running syncAllDatasets...');
    const syncedCount = await FoodSyncService.syncAllDatasets();
    console.log(`Sync function returned count: ${syncedCount}`);

    const afterCount = await FoodMaster.countDocuments();
    console.log(`New items in FoodMaster library: ${afterCount}`);

    // Verify some sample records
    const sample = await FoodMaster.findOne({ verified: true, source: 'IFCT' });
    if (sample) {
      console.log('Sample IFCT Food:', {
        name: sample.name,
        aliases: sample.aliases,
        category: sample.category,
        calories: sample.calories,
        carbs: sample.carbs,
        protein: sample.protein,
        fat: sample.fat,
        fiber: sample.fiber,
        source: sample.source,
        verified: sample.verified,
        countries: sample.countries
      });
    } else {
      console.log('No IFCT food found after sync.');
    }

    const sampleUSDA = await FoodMaster.findOne({ verified: true, source: 'USDA' });
    if (sampleUSDA) {
      console.log('Sample USDA Food:', {
        name: sampleUSDA.name,
        aliases: sampleUSDA.aliases,
        category: sampleUSDA.category,
        calories: sampleUSDA.calories,
        carbs: sampleUSDA.carbs,
        protein: sampleUSDA.protein,
        fat: sampleUSDA.fat,
        fiber: sampleUSDA.fiber,
        source: sampleUSDA.source,
        verified: sampleUSDA.verified,
        countries: sampleUSDA.countries
      });
    } else {
      console.log('No USDA food found after sync.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Sync execution failed:', error);
    process.exit(1);
  }
};

runSync();
