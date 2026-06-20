import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment variables (respecting production vs development environment)
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env.production') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

import { FoodSyncService } from './services/foodSyncService';

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';
  console.log('Connecting to database:', uri);
  await mongoose.connect(uri);
  console.log('Database connected successfully.');

  try {
    console.log('Starting data import from trusted online sources...');
    const count = await FoodSyncService.syncAllDatasets();
    console.log(`Sync completed successfully! Upserted items: ${count}`);
    process.exit(0);
  } catch (err: any) {
    console.error('Sync failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

run();
