import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { AdminUser } from './models/AdminUser';
import { FoodMaster } from './models/FoodMaster';
import { Guide } from './models/Guide';
import { Video } from './models/Video';
import { SubscriptionPlan } from './models/SubscriptionPlan';
import { PaymentGatewayConfig } from './models/PaymentGatewayConfig';
import { Coupon } from './models/Coupon';
import { seedFoodLibrary } from './seedFoodLibrary';

// Removed Open Food Facts API fetching in favor of comprehensive local seed data.

const SEED_GUIDES = [
  {
    title: 'Optimal Fasting Window Tips',
    category: 'Diet',
    readTime: 4,
    content: `## Guidelines for Intermittent Fasting (14/10 Protocol)
Intermittent fasting combined with glucose monitoring is a powerful technique for resetting metabolic sensitivity. FastGluco recommends a 14-hour fasting window (e.g. 7:00 PM to 9:00 AM) to allow baseline insulin clearing.`
  },
  {
    title: 'Understanding Glycaemic Index (GI)',
    category: 'Diet',
    readTime: 6,
    content: `## What is Glycaemic Index?
The Glycaemic Index (GI) rates carbohydrates from 0 to 100 based on how rapidly they raise blood sugar levels compared to pure glucose (GI 100). Swapping out white rice for millets helps prevent high spikes.`
  }
];

const SEED_VIDEOS = [
  {
    title: 'How to Attach and Pair Abbott CGM Sensor',
    description: 'A step-by-step video guide explaining sensor application, cleaning the skin site, and scanning to activate.',
    url: 'https://www.youtube.com/embed/SceJu7p2g8k',
    thumbnailUrl: 'https://img.youtube.com/vi/SceJu7p2g8k/0.jpg',
    category: 'CGM Guide'
  }
];

const seed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(uri);
    console.log('Database connected successfully.');

    // 1. Seed Admin User
    const adminEmail = 'admin@fastgluco.com';
    const existingAdmin = await AdminUser.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminPassword123!', salt);
      await AdminUser.create({
        name: 'FastGluco SuperAdmin',
        email: adminEmail,
        passwordHash,
        role: 'SuperAdmin'
      });
      console.log('Admin user seeded: admin@fastgluco.com');
    }

    // 2. Fetch and seed foods list
    console.log('Seeding Comprehensive Local Food Library...');
    await FoodMaster.deleteMany({});
    
    // De-duplicate items by name before inserting just in case
    const uniqueFoods: any[] = [];
    const seenNames = new Set<string>();
    for (const f of seedFoodLibrary) {
      const lowerName = f.name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueFoods.push(f);
      }
    }

    await FoodMaster.insertMany(uniqueFoods);
    console.log(`Successfully seeded ${uniqueFoods.length} food items.`);

    // 3. Seed Guides
    await Guide.deleteMany({});
    await Guide.insertMany(SEED_GUIDES);
    console.log(`Successfully seeded ${SEED_GUIDES.length} guides.`);

    // 4. Seed Videos
    await Video.deleteMany({});
    await Video.insertMany(SEED_VIDEOS);
    console.log(`Successfully seeded ${SEED_VIDEOS.length} educational videos.`);

    // 5. Seed Subscription Plans
    console.log('Seeding subscription plans...');
    const BASIC_PLAN_ID = new mongoose.Types.ObjectId('6a2ac86dcd7c91d367ceb356');
    const PREMIUM_PLAN_ID = new mongoose.Types.ObjectId('6a2ac86dcd7c91d367ceb357');

    await SubscriptionPlan.deleteMany({});
    await SubscriptionPlan.create([
      {
        _id: BASIC_PLAN_ID,
        name: 'Basic Plan',
        code: 'basic',
        description: 'Access to food insights and customized notifications.',
        monthlyPrice: 99,
        yearlyPrice: 999,
        trialDays: 7,
        displayOrder: 1,
        badge: 'Recommended',
        color: '#0284C7',
        isActive: true,
        features: {
          unlimitedReports: false,
          advancedAnalysis: false,
          premiumVideos: false,
          foodInsights: true,
          exportReports: false,
          notifications: true
        }
      },
      {
        _id: PREMIUM_PLAN_ID,
        name: 'Premium Plan',
        code: 'premium',
        description: 'Complete access to all features including unlimited report uploads and advanced analysis.',
        monthlyPrice: 199,
        yearlyPrice: 1999,
        trialDays: 14,
        displayOrder: 2,
        badge: 'Best Value',
        color: '#4F46E5',
        isActive: true,
        features: {
          unlimitedReports: true,
          advancedAnalysis: true,
          premiumVideos: true,
          foodInsights: true,
          exportReports: true,
          notifications: true
        }
      }
    ]);
    console.log('Successfully seeded subscription plans with static ObjectIds.');

    // Migrate any transactions and subscriptions pointing to the temporary/previous basic/premium plan IDs
    // to the static BASIC_PLAN_ID and PREMIUM_PLAN_ID.
    const tempBasicId = new mongoose.Types.ObjectId('6a2acbfb7ff08757d5dcedee');
    const tempPremiumId = new mongoose.Types.ObjectId('6a2acbfb7ff08757d5dcedef');

    await mongoose.connection.db!.collection('usersubscriptions').updateMany(
      { planId: tempBasicId },
      { $set: { planId: BASIC_PLAN_ID } }
    );
    await mongoose.connection.db!.collection('usersubscriptions').updateMany(
      { planId: tempPremiumId },
      { $set: { planId: PREMIUM_PLAN_ID } }
    );

    await mongoose.connection.db!.collection('paymenttransactions').updateMany(
      { planId: tempBasicId },
      { $set: { planId: BASIC_PLAN_ID } }
    );
    await mongoose.connection.db!.collection('paymenttransactions').updateMany(
      { planId: tempPremiumId },
      { $set: { planId: PREMIUM_PLAN_ID } }
    );
    console.log('Successfully migrated database plan references to static ObjectIds.');

    // 5.5. Seed Coupons
    console.log('Seeding discount coupons...');
    await Coupon.deleteMany({});
    await Coupon.create([
      {
        code: 'WELCOME50',
        discountType: 'percentage',
        discountValue: 50,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      },
      {
        code: 'ANTI30',
        discountType: 'fixed',
        discountValue: 30,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      },
      {
        code: 'FREE100',
        discountType: 'percentage',
        discountValue: 100,
        expiryDate: new Date('2030-12-31'),
        isActive: true
      }
    ]);
    console.log('Successfully seeded discount coupons.');

    // 6. Seed Payment Gateway Configuration singleton
    console.log('Seeding payment gateway configuration...');
    await PaymentGatewayConfig.deleteMany({});
    
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    await PaymentGatewayConfig.create({
      isSandbox: true,
      enablePayments: !!(envKeyId && envKeySecret), // Enable real payments if keys are present in .env
      enableSubscriptions: true, // Subscriptions required globally
      razorpayKeyId: envKeyId || undefined,
      razorpayKeySecret: envKeySecret || undefined
    });
    console.log(`Created default payment gateway configuration (Real Payments Active: ${!!(envKeyId && envKeySecret)}, Subscriptions required).`);

    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
