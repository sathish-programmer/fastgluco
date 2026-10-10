import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';
import { connectDB } from './config/db';
import { EmailService } from './services/emailService';
import cron from 'node-cron';
import { SubscriptionCron } from './cron/subscriptionCron';
import { AppointmentReminderCron } from './cron/appointmentReminderCron';
import { LibreSyncService } from './services/libreSyncService';
import { FoodSyncService } from './services/foodSyncService';
import { VendorOrderStatusCron } from './cron/vendorOrderStatusCron';
import { seedWorkflows } from './utils/seedWorkflows';
import { seedAskMitoTopics } from './utils/seedAskMitoTopics';
import { AppHealthSyncService } from './services/appHealthSyncService';

const PORT = process.env.PORT || 5001;

// Boot up server
const bootstrap = async () => {
  try {
    // Connect to database
    await connectDB();

    // Auto-reseed AI chat workflows (delete stale + insert correct 3-mode workflows)
    await seedWorkflows();
    await seedAskMitoTopics();

    // Verify Brevo SMTP connection
    await EmailService.verifyConnection();

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` Mito_Reboot Backend Service is running locally `);
      console.log(` Port: ${PORT} `);
      console.log(` Healthcheck: http://localhost:${PORT}/health `);
      console.log(`===================================================`);

      // Initialize Cron Jobs
      cron.schedule('0 0 * * *', () => {
        console.log('Running daily cron jobs...');
        SubscriptionCron.checkExpiringSubscriptions();
      });

      // Weekly food database sync from source URLs at 2:00 AM every Sunday
      cron.schedule('0 2 * * 0', async () => {
        console.log('Running weekly food database sync...');
        try {
          await FoodSyncService.syncAllDatasets();
        } catch (err) {
          console.error('Weekly food database sync failed:', err);
        }
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
      // Appointment reminder cron — runs every minute
      // Sends email reminders 30 mins and 10 mins before confirmed appointments
      cron.schedule('* * * * *', async () => {
        await AppointmentReminderCron.sendUpcomingReminders();
      });

      // Vendor orders status tracking cron (Arivu Foods)
      // Arivu confirmed requirement: Polling at 9 AM and 10 PM IST fetches shipments processed during the day.
      cron.schedule('0 9,22 * * *', async () => {
        console.log('[VendorOrderStatusCron] Running scheduled 9 AM / 10 PM IST vendor order status sync...');
        await VendorOrderStatusCron.syncActiveVendorOrders();
      }, { timezone: 'Asia/Kolkata' });

      // Periodic evaluator (every 15 mins) to also respect any custom interval configured by Admin
      cron.schedule('*/15 * * * *', async () => {
        await VendorOrderStatusCron.checkAndRunPeriodicPoll();
      });

      // App Health Store & Telemetry sync (runs every 6 hours)
      cron.schedule('0 */6 * * *', async () => {
        console.log('[AppHealthSync] Running scheduled App Store & Play Store metrics sync...');
        try {
          const config = await AppHealthSyncService.getOrCreateConfig();
          if (config.autoSyncEnabled) {
            await AppHealthSyncService.syncAll();
          }
        } catch (err) {
          console.error('[AppHealthSync] Scheduled sync failed:', err);
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
