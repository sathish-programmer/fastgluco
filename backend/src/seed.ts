import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env.production') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

import { AdminUser } from './models/AdminUser';
import { FoodMaster } from './models/FoodMaster';
import { Guide } from './models/Guide';
import { Video } from './models/Video';
import { SubscriptionPlan } from './models/SubscriptionPlan';
import { PaymentGatewayConfig } from './models/PaymentGatewayConfig';
import { Coupon } from './models/Coupon';
import { FAQ } from './models/FAQ';
import { LegalDocument } from './models/LegalDocument';
import { seedFoodLibrary } from './seedFoodLibrary';

// Removed Open Food Facts API fetching in favor of comprehensive local seed data.

const SEED_GUIDES = [
  {
    title: 'Optimal Fasting Window Tips',
    category: 'Diet',
    readTime: 4,
    content: `## Guidelines for Intermittent Fasting (14/10 Protocol)
Intermittent fasting combined with glucose monitoring is a powerful technique for resetting metabolic sensitivity. Mito_Reboot recommends a 14-hour fasting window (e.g. 7:00 PM to 9:00 AM) to allow baseline insulin clearing.`
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
    url: 'https://www.youtube.com/embed/mlOQWxjDr-4',
    thumbnailUrl: 'https://img.youtube.com/vi/mlOQWxjDr-4/0.jpg',
    category: 'CGM Guide'
  }
];

const SEED_FAQS = [
  {
    question: 'How do I connect my FreeStyle Libre CGM sensor to the app?',
    answer: `<p>To connect your Abbott FreeStyle Libre sensor for automatic live tracking:</p>
<ol>
  <li>Open the official <strong>FreeStyle Libre</strong> app on your smartphone.</li>
  <li>Navigate to the side menu and select <strong>Connected Apps</strong> → <strong>LibreLinkUp</strong>.</li>
  <li>Tap <strong>Add Connection</strong> and invite a secondary email address you own (must be different from your primary LibreView email).</li>
  <li>Open the invitation email, download the <strong>LibreLinkUp app</strong>, sign up with that secondary email, and accept the caregiver invitation.</li>
  <li>Open our app, navigate to the <strong>Profile Configuration</strong> tab, enable <strong>LibreLinkUp Syncing</strong>, and enter those secondary caregiver credentials.</li>
</ol>`,
    platform: 'Both',
    category: 'General',
    isActive: true,
    order: 1
  },
  {
    question: 'How often does my glucose data sync?',
    answer: 'Once configured and enabled, our background worker automatically refreshes and imports your CGM data every 10 minutes. You can also trigger an immediate sync manually by clicking the "Sync Now" button inside your Profile settings.',
    platform: 'Both',
    category: 'General',
    isActive: true,
    order: 2
  },
  {
    question: 'What is Mito_Reboot and how does it help?',
    answer: 'Mito_Reboot is an intelligent circadian fasting and metabolic health platform that combines real-time continuous glucose monitor (CGM) data with meal logging. It calculates your spike thresholds, scores foods, and uses AI coaching to help you discover which specific meals cause blood sugar spikes.',
    platform: 'Both',
    category: 'General',
    isActive: true,
    order: 3
  },
  {
    question: 'Can I log my meals and view glucose insights manually?',
    answer: 'Yes! Even without a live CGM connection, you can upload historical Abbott Libre report CSV/PDF files or log foods manually. The app automatically correlates your food logs with your glucose logs to analyze glycemic status.',
    platform: 'Both',
    category: 'General',
    isActive: true,
    order: 4
  },
  {
    question: 'Is my health data secure?',
    answer: 'Absolutely. We prioritize your privacy. All credentials, personal demographics, and metabolic data are encrypted in transit and at rest in compliance with secure healthcare standard practices.',
    platform: 'Both',
    category: 'General',
    isActive: true,
    order: 5
  },
  {
    question: 'How do I upgrade to the Premium Plan?',
    answer: 'You can upgrade directly inside the app by going to your Profile, clicking "My Subscription & Billing", and selecting the Premium Plan. Upgrading unlocks unlimited report uploads, advanced spikes analysis, premium educational content, and the AI Coaching Assistant.',
    platform: 'Both',
    category: 'General',
    isActive: true,
    order: 6
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
    const adminEmail = 'admin@mitoreboot.com';
    const existingAdmin = await AdminUser.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminPassword123!', salt);
      await AdminUser.create({
        name: 'Mito_Reboot SuperAdmin',
        email: adminEmail,
        passwordHash,
        role: 'SuperAdmin'
      });
      console.log('Admin user seeded: admin@mitoreboot.com');
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

        // Determine portionType
        let portionType: 'count' | 'weight' | 'volume' = 'weight';
        const unit = (f.servingUnit || 'g').toLowerCase();
        if (unit.includes('piece') || unit.includes('egg') || unit.includes('roti') || unit.includes('slice') || unit.includes('burger') || unit.includes('pancake') || unit.includes('ball') || unit.includes('plate') || unit.includes('apple') || unit.includes('banana') || unit.includes('mango') || unit.includes('guava') || unit.includes('pieces') || unit.includes('pancakes')) {
          portionType = 'count';
        } else if (unit.includes('ml') || unit.includes('l')) {
          portionType = 'volume';
        }

        uniqueFoods.push({
          ...f,
          verified: true,
          source: 'LocalSeed',
          countries: ['India'],
          portionType
        });
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

    // 4.5. Seed FAQs
    console.log('Seeding support FAQs...');
    await FAQ.deleteMany({});
    await FAQ.insertMany(SEED_FAQS);
    console.log(`Successfully seeded ${SEED_FAQS.length} support FAQs.`);

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
          notifications: true,
          aiCoaching: false,
          foodScanner: false
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
          notifications: true,
          aiCoaching: true,
          foodScanner: true
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
    
    const isValidKey = (key?: string) => !!key && !key.includes('PLEASE_UPDATE') && key.trim().length > 0;
    const hasValidKeys = isValidKey(envKeyId) && isValidKey(envKeySecret);
    
    await PaymentGatewayConfig.create({
      isSandbox: true,
      enablePayments: hasValidKeys, // Enable real payments if valid keys are present in .env
      enableSubscriptions: true, // Subscriptions required globally
      razorpayKeyId: hasValidKeys ? envKeyId : undefined,
      razorpayKeySecret: hasValidKeys ? envKeySecret : undefined,
      glucoseAlertMinIntervalHours: 2,
      enableHydrationTracker: true,
      enableWorkoutTracker: true,
      cancerTreatmentDisclaimer: `Lifestyle Guidance & Legal Disclaimer
The recommendations provided in this application are intended solely for educational and general wellness purposes. They are designed to complement—not replace—the advice, diagnosis, or treatment provided by your healthcare professionals.

Recommended Healthy Lifestyle Practices
Where medically appropriate, we encourage you to:
• Complete your evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), if approved by your treating doctor.
• Engage in at least 20 minutes of physical activity each day, such as walking, yoga, stretching, or other suitable exercise.
• Spend at least 20 minutes daily doing an activity you enjoy, such as listening to music, singing, dancing, reading, gardening, painting, or spending time with loved ones.
• Practice meditation, mindfulness, deep breathing, or other relaxation techniques for 10–20 minutes each day to support emotional well-being and stress management.

Important Medical Notice
If you are currently undergoing treatment for cancer, you must discuss these lifestyle recommendations with your treating oncologist or healthcare team before implementing them.
Time-Restricted Eating, exercise, dietary changes, and other lifestyle interventions may not be appropriate for every individual. Their suitability depends on factors including your cancer type and stage, treatment plan, nutritional status, body weight, diabetes or blood sugar control, kidney or liver function, and other medical conditions.
If you experience significant weight loss, poor appetite, dizziness, dehydration, low blood sugar, severe fatigue, persistent vomiting, or any worsening symptoms, discontinue the intervention immediately and seek medical advice.

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is general educational information and does not constitute medical advice.
• All lifestyle modifications are undertaken voluntarily and at your own discretion.
• You are responsible for consulting your treating oncologist or healthcare provider before making any dietary, fasting, exercise, or lifestyle changes.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, or contributors associated with this application shall be liable for any injury, illness, adverse event, complication, treatment outcome, loss, or damage arising directly or indirectly from the use of this application or from reliance on its recommendations.
• This application does not create a doctor–patient relationship between you and the Company or any healthcare professional associated the application.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the recommendations only in consultation with your treating healthcare team.`,
      cancerSecondaryDisclaimer: `Lifestyle, Nutrition & Antioxidant Guidance for Cancer Survivors
(Cancer Prevention and Survivorship)

Congratulations on completing your cancer treatment. The recommendations provided in this application are intended to support healthy living after cancer treatment and may contribute to overall health and reducing the risk of cancer recurrence. They are not intended to replace regular medical follow-up or evidence-based medical care.

Recommended Healthy Lifestyle Practices
Where medically appropriate and after discussion with your healthcare team, we encourage you to:
• Complete your evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), if suitable for your health.
• Engage in at least 20–30 minutes of physical activity every day, such as brisk walking, yoga, cycling, resistance exercises, or other activities appropriate for your fitness level.
• Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.
• If you choose to take antioxidant supplements (such as Vitamin C, Vitamin E, Curcumin, Coenzyme Q10, Selenium, Zinc, or other nutritional supplements), discuss their use with your treating oncologist or healthcare provider before starting them.
• Spend at least 20 minutes each day doing an activity you enjoy, such as listening to music, singing, dancing, reading, gardening, painting, or spending time with family and friends.
• Practice meditation, mindfulness, deep breathing, or relaxation exercises for 10–20 minutes daily.
• Maintain a healthy body weight, obtain adequate sleep, avoid tobacco, limit alcohol consumption, and attend all scheduled follow-up appointments.

About Antioxidants
This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to better understand your lifestyle habits and generate personalised wellness insights.
The information collected is not intended to prescribe, recommend, or encourage the use of any specific antioxidant or supplement. While a diet naturally rich in fruits, vegetables, whole grains, legumes, nuts, and seeds is generally recommended for overall health, the benefits and safety of antioxidant supplements may vary depending on your cancer type, previous treatments, treatments, medications, and other medical conditions.
Do not start, stop, or modify any antioxidant supplement without consulting your treating oncologist or healthcare provider.

Important Medical Notice
Even after completing cancer treatment, significant dietary changes, Time-Restricted Eating, fasting, exercise programmes, or nutritional supplements should be discussed with your healthcare provider, particularly if you have:
• Diabetes or blood sugar disorders
• Unintentional weight loss or malnutrition
• Kidney, liver, or heart disease
• Osteoporosis or frailty
• Persistent treatment-related side effects
• Any other significant medical condition

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is for educational, wellness, and survivorship purposes only and does not constitute medical advice, diagnosis, or treatment.
• The lifestyle recommendations, including Time-Restricted Eating, exercise, stress management, natural antioxidant intake, and antioxidant supplements, are intended to provide general wellness guidance and cannot guarantee prevention of cancer recurrence or improved treatment outcomes.
• Any dietary changes, fasting schedules, exercise programmes, or use of antioxidant supplements are undertaken voluntarily and at your own discretion and risk.
• You are solely responsible for discussing these interventions with your treating oncologist or healthcare provider before implementing them.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, supplement-related adverse effects, drug–nutrient interactions, cancer recurrence, disease progression, treatment outcome, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance on its recommendations.
• This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the recommendations only as a complement to regular medical follow-up and professional medical advice.`,
      cancerPreventionDisclaimer: `Lifestyle Guidance & Legal Disclaimer for the General Public
(Primary Cancer Prevention and Healthy Living)

This application is designed to promote healthy lifestyle habits that are supported by current scientific evidence and public health recommendations. The goal is to encourage behaviours that may help reduce the risk of cancer and other chronic diseases while improving overall health and well-being.

The information provided by this application is intended for educational and wellness purposes only. It is not intended to diagnose, treat, cure, or prevent any disease and should not be considered a substitute for professional medical advice.

Recommended Healthy Lifestyle Practices
We encourage users to:
• Finish their evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), where appropriate.
• Engage in at least 20–30 minutes of physical activity every day.
• Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.
• Limit ultra-processed foods, sugary beverages, processed meats, and excessive saturated fats.
• Spend at least 20 minutes each day doing an activity they enjoy to promote emotional well-being.
• Practice meditation, mindfulness, or deep breathing for 10–20 minutes daily.
• Maintain a healthy body weight, obtain adequate sleep, avoid tobacco in all forms, and limit or avoid alcohol consumption.

About Antioxidants
This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to provide personalised wellness insights.
A balanced diet containing naturally occurring antioxidants is generally recommended as part of a healthy lifestyle. However, high-dose antioxidant supplements may not be appropriate for everyone and should not be used as a substitute for a healthy diet.
If you are pregnant, breastfeeding, have diabetes, kidney or liver disease, heart disease, or any other significant medical condition, or if you are taking prescription medications, consult your healthcare provider before beginning Time-Restricted Eating, major dietary changes, or antioxidant supplements.

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is for educational, informational, and wellness purposes only and does not constitute medical advice, diagnosis, or treatment.
• The recommendations contained within this application are based on current scientific literature and recognised healthy lifestyle principles but cannot guarantee prevention of cancer or any other disease.
• Any lifestyle modifications, including Time-Restricted Eating, dietary changes, exercise, meditation, stress-management practices, natural antioxidant intake, or antioxidant supplements, are undertaken voluntarily and entirely at your own discretion and risk.
• You are responsible for seeking advice from a qualified healthcare professional before making significant dietary or lifestyle changes, particularly if you have an existing medical condition or are taking medications.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, nutritional deficiency, supplement-related adverse effects, drug–nutrient interactions, medical complications, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance upon its recommendations.
• This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the information responsibly as part of a healthy lifestyle, while seeking professional medical advice whenever appropriate.`
    });
    console.log(`Created default payment gateway configuration.`);

    // 7. Seed General Public Disclaimer LegalDocument
    console.log('Seeding General Public Disclaimer legal document...');
    await LegalDocument.deleteMany({ type: 'Disclaimer' });
    await LegalDocument.create({
      type: 'Disclaimer',
      content: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #334155;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Lifestyle Guidance & Legal Disclaimer for the General Public</h2>
          <p style="font-size: 0.875rem; color: #64748b; font-style: italic; margin-bottom: 1.5rem;">(Primary Cancer Prevention and Healthy Living)</p>
          <p style="font-size: 0.875rem; margin-bottom: 1rem;">This application is designed to promote healthy lifestyle habits that are supported by current scientific evidence and public health recommendations. The goal is to encourage behaviours that may help reduce the risk of cancer and other chronic diseases while improving overall health and well-being.</p>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">The information provided by this application is intended for educational and wellness purposes only. It is not intended to diagnose, treat, cure, or prevent any disease and should not be considered a substitute for professional medical advice.</p>
          
          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">Recommended Healthy Lifestyle Practices</h3>
          <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">We encourage users to:</p>
          <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 1.5rem; list-style-type: disc; padding-left: 1rem;">
            <li style="margin-bottom: 0.5rem;">Finish their evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), where appropriate.</li>
            <li style="margin-bottom: 0.5rem;">Engage in at least 20–30 minutes of physical activity every day.</li>
            <li style="margin-bottom: 0.5rem;">Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.</li>
            <li style="margin-bottom: 0.5rem;">Limit ultra-processed foods, sugary beverages, processed meats, and excessive saturated fats.</li>
            <li style="margin-bottom: 0.5rem;">Spend at least 20 minutes each day doing an activity they enjoy to promote emotional well-being.</li>
            <li style="margin-bottom: 0.5rem;">Practice meditation, mindfulness, or deep breathing for 10–20 minutes daily.</li>
            <li style="margin-bottom: 0.5rem;">Maintain a healthy body weight, obtain adequate sleep, avoid tobacco in all forms, and limit or avoid alcohol consumption.</li>
          </ul>

          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">About Antioxidants</h3>
          <p style="font-size: 0.875rem; margin-bottom: 1rem;">This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to provide personalised wellness insights.</p>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">A balanced diet containing naturally occurring antioxidants is generally recommended as part of a healthy lifestyle. However, high-dose antioxidant supplements may not be appropriate for everyone and should not be used as a substitute for a healthy diet. If you are pregnant, breastfeeding, have diabetes, kidney or liver disease, heart disease, or any other significant medical condition, or if you are taking prescription medications, consult your healthcare provider before beginning Time-Restricted Eating, major dietary changes, or antioxidant supplements.</p>

          <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">Legal Disclaimer</h3>
          <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">By using this application, you acknowledge and agree that:</p>
          <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 1.5rem; list-style-type: disc; padding-left: 1rem;">
            <li style="margin-bottom: 0.5rem;">The information provided is for educational, informational, and wellness purposes only and does not constitute medical advice, diagnosis, or treatment.</li>
            <li style="margin-bottom: 0.5rem;">The recommendations contained within this application are based on current scientific literature and recognised healthy lifestyle principles but cannot guarantee prevention of cancer or any other disease.</li>
            <li style="margin-bottom: 0.5rem;">Any lifestyle modifications, including Time-Restricted Eating, dietary changes, exercise, meditation, stress-management practices, natural antioxidant intake, or antioxidant supplements, are undertaken voluntarily and entirely at your own discretion and risk.</li>
            <li style="margin-bottom: 0.5rem;">You are responsible for seeking advice from a qualified healthcare professional before making significant dietary or lifestyle changes, particularly if you have an existing medical condition or are taking medications.</li>
            <li style="margin-bottom: 0.5rem;">Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, nutritional deficiency, supplement-related adverse effects, drug–nutrient interactions, medical complications, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance upon its recommendations.</li>
            <li style="margin-bottom: 0.5rem;">This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.</li>
            <li style="margin-bottom: 0.5rem;">To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.</li>
          </ul>
          <p style="font-size: 0.875rem; font-weight: bold; margin-top: 1rem; color: #1e293b;">By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the information responsibly as part of a healthy lifestyle, while seeking professional medical advice whenever appropriate.</p>
        </div>
      `
    });
    console.log('Seeded general public disclaimer document.');

    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
