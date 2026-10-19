const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env.production') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const PREMIUM_PLAN_ID = new mongoose.Types.ObjectId('6a2ac86dcd7c91d367ceb357');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }

  console.log('Connecting to DB...');
  await mongoose.connect(uri);
  console.log('Connected to DB');

  // 1. Delete all other plans
  const delRes = await mongoose.connection.db.collection('subscriptionplans').deleteMany({
    _id: { $ne: PREMIUM_PLAN_ID }
  });
  console.log(`Deleted ${delRes.deletedCount} non-premium plan(s).`);

  // 2. Upsert single plan: Premium Plan with 48h free trial, 1000/yr (3600 slashed to 1000)
  await mongoose.connection.db.collection('subscriptionplans').updateOne(
    { _id: PREMIUM_PLAN_ID },
    {
      $set: {
        name: 'Premium Plan',
        code: 'premium',
        description: 'Complete access to all features including unlimited report uploads, advanced glucose & spike analysis, AI coaching, food scanner, and 10 doctor consultations.',
        monthlyPrice: 1000,
        yearlyPrice: 1000,
        originalMonthlyPrice: 0,
        originalYearlyPrice: 3600,
        monthlyFreeQuestions: 1,
        yearlyFreeQuestions: 10,
        trialDays: 2,
        trialHours: 48,
        displayOrder: 1,
        badge: 'Best Value',
        color: '#4F46E5',
        isActive: true,
        isDeleted: false,
        features: {
          unlimitedReports: true,
          advancedAnalysis: true,
          premiumVideos: true,
          foodInsights: true,
          exportReports: true,
          notifications: true,
          aiCoaching: true,
          foodScanner: true
        },
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Upserted single Premium Plan: ₹1,000/year (slashed from ₹3,600), 48h free trial.');

  // 3. Migrate subscriptions & payment transactions
  const subRes = await mongoose.connection.db.collection('usersubscriptions').updateMany(
    { planId: { $ne: PREMIUM_PLAN_ID } },
    { $set: { planId: PREMIUM_PLAN_ID } }
  );
  console.log(`Updated ${subRes.modifiedCount} subscription references.`);

  const txRes = await mongoose.connection.db.collection('paymenttransactions').updateMany(
    { planId: { $ne: PREMIUM_PLAN_ID } },
    { $set: { planId: PREMIUM_PLAN_ID } }
  );
  console.log(`Updated ${txRes.modifiedCount} payment transaction references.`);

  const activePlans = await mongoose.connection.db.collection('subscriptionplans').find({ isActive: true, isDeleted: false }).toArray();
  console.log('Active Plans in DB count:', activePlans.length);
  console.log(JSON.stringify(activePlans, null, 2));

  await mongoose.disconnect();
  console.log('Migration complete!');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
