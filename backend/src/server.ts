import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';
import { connectDB } from './config/db';
import cron from 'node-cron';
import { SubscriptionCron } from './cron/subscriptionCron';
import { LibreSyncService } from './services/libreSyncService';

const PORT = process.env.PORT || 5001;

// Boot up server
const bootstrap = async () => {
  try {
    // Connect to database
    await connectDB();

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` FastGluco Backend Service is running locally `);
      console.log(` Port: ${PORT} `);
      console.log(` Healthcheck: http://localhost:${PORT}/health `);
      console.log(`===================================================`);

      // Initialize Cron Jobs
      cron.schedule('0 0 * * *', () => {
        console.log('Running daily cron jobs...');
        SubscriptionCron.checkExpiringSubscriptions();
      });

      // LLU auto-sync cron job every 10 minutes
      cron.schedule('*/10 * * * *', async () => {
        console.log('Running background LibreLinkUp sync...');
        try {
          const stats = await LibreSyncService.runGlobalBackgroundSync();
          console.log(`LibreLinkUp sync complete: ${stats.succeeded} users succeeded, ${stats.failed} users failed.`);
        } catch (err) {
          console.error('LibreLinkUp background sync failed:', err);
        }
      });
      console.log('Cron jobs scheduled successfully.');

    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

bootstrap();
