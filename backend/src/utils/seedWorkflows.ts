/**
 * seedWorkflows.ts
 * 
 * Automatically deletes all existing DailyLoggingWorkflow documents
 * and reseeds fresh, correct workflows for all 3 journey modes:
 *  - STANDARD          → Cancer Prevention
 *  - CANCER_PATIENT    → Cancer Treatment
 *  - SECONDARY_PREVENTION → Secondary Prevention (Survivor)
 * 
 * Each workflow's stepIds and habit types EXACTLY match what the
 * manual dashboard screens save to the database.
 */

import DailyLoggingWorkflow from '../models/DailyLoggingWorkflow';

const PREVENTION_STEPS = [
  // ── 11 Damage Habits ──
  {
    stepId: 'stress', title: 'Metabolic Stress Check',
    questionPrompt: 'How was your stress level today? Managing stress lowers cortisol, supporting immune balance and overall longevity.',
    inputType: 'OPTIONS' as const,
    options: ['No Stress (Calm)', 'Mild Stress', 'Moderate Stress', 'High Stress'],
    order: 1, isEnabled: true
  },
  {
    stepId: 'sleep', title: 'Sleep Duration & Debt',
    questionPrompt: 'How many hours of quality sleep did you get last night? (Enter number, e.g., 7.5)',
    inputType: 'NUMBER' as const, options: [],
    order: 2, isEnabled: true
  },
  {
    stepId: 'smoking', title: 'Smoking & Chewing Tobacco',
    questionPrompt: 'Did you smoke cigarettes/bidis or chew tobacco (gutkha, khaini, paan with tobacco) today?',
    inputType: 'YES_NO' as const,
    options: ['No (Clean Day)', 'Yes (Smoked / Chewed Tobacco)'],
    order: 3, isEnabled: true
  },
  {
    stepId: 'alcohol', title: 'Alcohol Intake Check',
    questionPrompt: 'Did you consume any alcoholic beverages today?',
    inputType: 'OPTIONS' as const,
    options: ['No Alcohol (Clean Day)', '1-2 Drinks', '3+ Drinks (Heavy)'],
    order: 4, isEnabled: true
  },
  {
    stepId: 'substances', title: 'Chemical & Industrial Substances',
    questionPrompt: 'Were you exposed to harmful industrial chemicals, asbestos, or hazardous substances today?',
    inputType: 'YES_NO' as const,
    options: ['No (Clean Day)', 'Yes (Chemical Exposure)'],
    order: 5, isEnabled: true
  },
  {
    stepId: 'environmental', title: 'Environmental Toxins & Air Quality',
    questionPrompt: 'Did you encounter heavy traffic air pollution, smog, passive smoke, microplastics, or pesticides today?',
    inputType: 'YES_NO' as const,
    options: ['No (Clean Environment)', 'Yes (Pollution / Smog / Toxins)'],
    order: 6, isEnabled: true
  },
  {
    stepId: 'kitchen', title: 'Check Your Kitchen Audit',
    questionPrompt: 'Is your kitchen free of heated plastic containers, synthetic non-stick teflon pans, and plastic drinking water cans?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Safe / Non-Plastic)', 'No (Plastic / Teflon Risk)'],
    order: 7, isEnabled: true
  },
  {
    stepId: 'obesity', title: 'Obesity & Weight Check',
    questionPrompt: 'Do you face difficulty managing weight, high visceral fat, or BMI above healthy range?',
    inputType: 'YES_NO' as const,
    options: ['No (Healthy Weight)', 'Yes (Weight Difficulty / Elevated BMI)'],
    order: 8, isEnabled: true
  },
  {
    stepId: 'dental', title: 'Dental & Oral Health Check',
    questionPrompt: 'Do you have any sharp tooth, bleeding gums, non-healing oral ulcers, or oral discomfort?',
    inputType: 'YES_NO' as const,
    options: ['No Issues (Healthy)', 'Yes (Dental Discomfort / Sharp Tooth)'],
    order: 9, isEnabled: true
  },
  {
    stepId: 'gastritis', title: 'Gastritis & Gut Health Check',
    questionPrompt: 'Did you experience acidity, heartburn, acid reflux, or gastritis discomfort today?',
    inputType: 'YES_NO' as const,
    options: ['No Issues (Healthy)', 'Yes (Gastritis / Acidity Discomfort)'],
    order: 10, isEnabled: true
  },
  {
    stepId: 'genetic', title: 'Genetic Risk & Family History',
    questionPrompt: 'Do you have anybody in your immediate family with cancer, or a personal history of cancer?',
    inputType: 'YES_NO' as const,
    options: ['No Family History', 'Yes (Family History of Cancer)'],
    order: 11, isEnabled: true
  },

  // ── 8 Repair Habits ──
  {
    stepId: 'fasting', title: 'Intermittent Fasting',
    questionPrompt: 'Did you complete your intermittent fasting window today? (e.g., 14-16h overnight fast)',
    inputType: 'OPTIONS' as const,
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 12, isEnabled: true
  },
  {
    stepId: 'diet', title: 'Diet & Nutrition Check',
    questionPrompt: 'Did you follow a balanced clean diet (vegetables, clean protein, complex carbs) and avoid ultra-processed junk food today?',
    inputType: 'OPTIONS' as const,
    options: ['Balanced Clean Diet (+1)', 'Clean Meals (No Junk)', 'Junk Food / Ultra-Processed (-1)', 'Both Balanced & Junk'],
    order: 13, isEnabled: true
  },
  {
    stepId: 'antioxidants', title: 'Antioxidants & Repair Foods',
    questionPrompt: 'Did you consume antioxidant-rich foods (berries, greens, amla, turmeric) or repair supplements today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Consumed)', 'Not Today'],
    order: 14, isEnabled: true
  },
  {
    stepId: 'movement', title: 'Exercise & Movement',
    questionPrompt: 'Did you complete any physical movement, walking, or exercise today?',
    inputType: 'OPTIONS' as const,
    options: ['30+ min Walk / Run', 'Yoga / Stretching (20+ min)', 'Strength Training', 'Light Activity (<20 min)', 'No Movement Today'],
    order: 15, isEnabled: true
  },
  {
    stepId: 'stillness', title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, quiet meditation, or mindfulness for at least 10 minutes today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (10+ min)', 'Not Today'],
    order: 16, isEnabled: true
  },
  {
    stepId: 'breath', title: 'Power of Breath',
    questionPrompt: 'Did you practice 5 to 10 minutes of conscious breathwork (box breathing, 4-7-8, or pranayama) today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Practiced 5-10 min)', 'Not Today'],
    order: 17, isEnabled: true
  },
  {
    stepId: 'joy', title: 'Things You Love',
    questionPrompt: 'Did you spend time doing something you love today (hobbies, music, family, art, gratitude)?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Done)', 'Not Today'],
    order: 18, isEnabled: true
  },
  {
    stepId: 'safer_products', title: 'Safer Personal Care Products',
    questionPrompt: 'Did you use paraben-free, sulfate-free, and phthalate-free personal care / household products today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Safe Products Used)', 'Not Today'],
    order: 19, isEnabled: true
  }
];

// Cancer Treatment — stepIds match EXACT habit types from manual screens:
const TREATMENT_STEPS = [
  {
    stepId: 'fasting', title: 'Intermittent Fasting',
    questionPrompt: 'Did you complete your intermittent fasting window today? Fasting supports cellular healing during cancer treatment.',
    inputType: 'OPTIONS' as const,
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 1, isEnabled: true
  },
  {
    stepId: 'movement', title: 'Movement',
    questionPrompt: 'Did you complete any movement or gentle exercise today? Even light walking supports recovery.',
    inputType: 'OPTIONS' as const,
    options: ['30+ min Walk', 'Yoga / Stretching (20+ min)', 'Light Walk (<20 min)', 'Bed Rest Only'],
    order: 2, isEnabled: true
  },
  {
    stepId: 'stillness', title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, quiet meditation, or deep breathing for at least 10 minutes today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Practiced)', 'Not Today'],
    order: 3, isEnabled: true
  },
  {
    stepId: 'joy', title: 'Things You Love',
    questionPrompt: 'Did you spend time doing something you love today — music, family, art, hobbies?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Done)', 'Not Today'],
    order: 4, isEnabled: true
  },
  {
    stepId: 'stress', title: 'Are You Stressed / Worried?',
    questionPrompt: 'How is your emotional state today? Stress management is a key part of recovery.',
    inputType: 'OPTIONS' as const,
    options: ['Calm / Positive', 'Mild Worry', 'Moderate Stress', 'High Stress / Anxious'],
    order: 5, isEnabled: true
  },
  {
    stepId: 'sleep', title: 'Rest & Recovery Sleep',
    questionPrompt: 'How many hours of restful sleep did you get last night? Sleep is critical for cellular repair during treatment.',
    inputType: 'NUMBER' as const, options: [],
    order: 6, isEnabled: true
  },
  {
    stepId: 'report_upload', title: 'Oncology & Lab Report Upload',
    questionPrompt: 'Do you have new lab reports, tumor markers (CEA / CA-125), chemo reports, or CGM data to upload today?',
    inputType: 'FILE' as const,
    options: ['No New Reports Today', 'Upload Report (PDF / CSV)'],
    order: 7, isEnabled: true
  }
];

// Secondary Prevention (Survivor) — same manual items as cancer prevention + recurrence tracking
const SECONDARY_PREVENTION_STEPS = [
  {
    stepId: 'stress', title: 'Survivor Stress & Emotional Health',
    questionPrompt: 'How is your emotional wellbeing today? Post-cancer anxiety, fear of recurrence, or caregiver stress?',
    inputType: 'OPTIONS' as const,
    options: ['Positive / Calm', 'Mild Anxiety', 'Fear of Recurrence', 'Caregiver Stress', 'Emotionally Drained'],
    order: 1, isEnabled: true
  },
  {
    stepId: 'sleep', title: 'Recovery Sleep Quality',
    questionPrompt: 'How many hours of restorative sleep did you get last night?',
    inputType: 'NUMBER' as const, options: [],
    order: 2, isEnabled: true
  },
  {
    stepId: 'fasting', title: 'Metabolic Fasting Window',
    questionPrompt: 'Did you complete your metabolic fasting window today? Fasting helps suppress recurrence risk.',
    inputType: 'OPTIONS' as const,
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 3, isEnabled: true
  },
  {
    stepId: 'movement', title: 'Active Recovery Movement',
    questionPrompt: 'What physical activity did you complete today? Exercise is a proven recurrence-risk reducer.',
    inputType: 'OPTIONS' as const,
    options: ['30+ min Walk / Jog', 'Yoga / Tai Chi', 'Strength Training', 'Swimming / Cycling', 'Light Stretching', 'Rest Day'],
    order: 4, isEnabled: true
  },
  {
    stepId: 'stillness', title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, meditation, or deep breathing today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Practiced)', 'Not Today'],
    order: 5, isEnabled: true
  },
  {
    stepId: 'joy', title: 'Joy & Gratitude',
    questionPrompt: 'Did you practice gratitude or engage in activities that bring you joy today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Done)', 'Not Today'],
    order: 6, isEnabled: true
  },
  {
    stepId: 'repair_habits', title: 'Antioxidant & Repair Nutrition',
    questionPrompt: 'Did you include anti-cancer repair foods today (cruciferous vegetables, berries, turmeric, omega-3s)?',
    inputType: 'OPTIONS' as const,
    options: ['Yes (Anti-cancer Meal)', 'Partial (1-2 items)', 'Hydration Goal Met', 'Supplements Taken', 'No Specific Nutrition'],
    order: 7, isEnabled: true
  },
  {
    stepId: 'env_air', title: 'Air Pollution & Passive Smoke',
    questionPrompt: 'Did you commute in heavy traffic (>30 min), encounter passive smoking (second-hand smoke), or experience indoor smoke/incense/mosquito coil exposure today?',
    inputType: 'YES_NO' as const,
    options: ['No (Clean Air)', 'Yes (Smog / Smoke / Passive Smoke)'],
    order: 8, isEnabled: true
  },
  {
    stepId: 'env_water', title: 'Water Carcinogens Check',
    questionPrompt: 'Do you use safe filtered drinking water (RO / carbon filtered, free of heavy metals, chlorine byproducts, and PFAS)?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Safe Filtered)', 'No / Unfiltered Tap'],
    order: 9, isEnabled: true
  },
  {
    stepId: 'env_pesticides', title: 'Pesticides Exposure',
    questionPrompt: 'Did you consume unwashed non-organic high-pesticide produce (Dirty Dozen) or use chemical bug sprays today?',
    inputType: 'YES_NO' as const,
    options: ['No (Clean / Organic)', 'Yes (Pesticide Exposure)'],
    order: 10, isEnabled: true
  },
  {
    stepId: 'env_microplastics', title: 'Microplastics Exposure',
    questionPrompt: 'Did you drink from heated plastic bottles, microwave food in plastic containers, or drink hot beverages from paper/plastic cups today?',
    inputType: 'YES_NO' as const,
    options: ['No (Plastic-Free)', 'Yes (Plastic / Hot Cup Exposure)'],
    order: 11, isEnabled: true
  },
  {
    stepId: 'genetics', title: 'Family History of Cancer',
    questionPrompt: 'Do you have anybody in your family with cancer, or a self-diagnosis of cancer?',
    inputType: 'YES_NO' as const,
    options: ['No Family History', 'Yes (Family History of Cancer)'],
    order: 12, isEnabled: true
  },
  {
    stepId: 'screening', title: 'Screening & Follow-up Compliance',
    questionPrompt: 'Did you have any follow-up appointment, imaging, or blood work today? Are your next screenings scheduled?',
    inputType: 'OPTIONS' as const,
    options: ['Appointment Today (Done)', 'Upcoming Scheduled', 'Need to Schedule', 'No Follow-up Required'],
    order: 13, isEnabled: true
  },
  {
    stepId: 'report_upload', title: 'Follow-up Report Upload',
    questionPrompt: 'Do you have new follow-up labs, imaging reports (PET/CT/MRI), or tumor markers to upload? I will process and update your dashboard.',
    inputType: 'FILE' as const,
    options: ['Skip for Now'],
    order: 14, isEnabled: true
  }
];

export const seedWorkflows = async () => {
  try {
    console.log('🔄 [WorkflowSeed] Deleting all existing workflow documents...');
    const deleted = await DailyLoggingWorkflow.deleteMany({});
    console.log(`✅ [WorkflowSeed] Deleted ${deleted.deletedCount} old workflow(s).`);

    await DailyLoggingWorkflow.insertMany([
      {
        name: 'Cancer Prevention Daily Workflow',
        targetMode: 'STANDARD',
        isActive: true,
        steps: PREVENTION_STEPS
      },
      {
        name: 'Cancer Treatment Daily Workflow',
        targetMode: 'CANCER_PATIENT',
        isActive: true,
        steps: TREATMENT_STEPS
      },
      {
        name: 'Secondary Prevention Daily Workflow',
        targetMode: 'SECONDARY_PREVENTION',
        isActive: true,
        steps: SECONDARY_PREVENTION_STEPS
      }
    ]);

    console.log('✅ [WorkflowSeed] 3 workflows seeded successfully:');
    console.log('   → STANDARD          (Cancer Prevention)    — 19 steps');
    console.log('   → CANCER_PATIENT    (Cancer Treatment)     — 7 steps');
    console.log('   → SECONDARY_PREVENTION (Survivor Recovery) — 10 steps');
  } catch (err) {
    console.error('❌ [WorkflowSeed] Failed to seed workflows:', err);
  }
};
