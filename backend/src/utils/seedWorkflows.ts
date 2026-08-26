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
  {
    stepId: 'stress', title: 'Metabolic Stress Check',
    questionPrompt: 'How was your stress level today? Managing stress lowers cortisol, supporting immune balance and overall longevity.',
    inputType: 'OPTIONS' as const,
    options: ['No Stress (Calm)', 'Mild Stress', 'Moderate Stress', 'High Stress'],
    order: 1, isEnabled: true
  },
  {
    stepId: 'sleep', title: 'Sleep Duration',
    questionPrompt: 'How many hours of quality sleep did you get last night? (Enter number, e.g., 7.5)',
    inputType: 'NUMBER' as const, options: [],
    order: 2, isEnabled: true
  },
  {
    stepId: 'fasting', title: 'Circadian Fasting',
    questionPrompt: 'Did you complete your intermittent fasting window today?',
    inputType: 'OPTIONS' as const,
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 3, isEnabled: true
  },
  {
    stepId: 'movement', title: 'Exercise & Movement',
    questionPrompt: 'Did you complete any physical movement or exercise today?',
    inputType: 'OPTIONS' as const,
    options: ['30+ min Walk / Run', 'Yoga / Stretching (20+ min)', 'Strength Training', 'Light Activity (<20 min)', 'No Movement Today'],
    order: 4, isEnabled: true
  },
  {
    stepId: 'smoking', title: 'Smoking Exposure',
    questionPrompt: 'Did you smoke or get exposed to tobacco smoke today?',
    inputType: 'YES_NO' as const,
    options: ['No (Clean Day)', 'Yes (Smoke / Exposed)'],
    order: 5, isEnabled: true
  },
  {
    stepId: 'alcohol', title: 'Alcohol Intake Check',
    questionPrompt: 'Did you consume any alcoholic beverages today?',
    inputType: 'OPTIONS' as const,
    options: ['No Alcohol (Clean Day)', '1-2 Drinks', '3+ Drinks (Heavy)'],
    order: 6, isEnabled: true
  },
  {
    stepId: 'antioxidants', title: 'Antioxidants & Repair Foods',
    questionPrompt: 'Did you consume antioxidant-rich foods (berries, greens, amla, turmeric) or repair supplements today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Consumed)', 'Not Today'],
    order: 7, isEnabled: true
  },
  {
    stepId: 'damage_habits', title: 'Processed Foods & Chemical Exposure',
    questionPrompt: 'Did you consume high-glycemic/junk foods or face environmental chemical exposures today?',
    inputType: 'OPTIONS' as const,
    options: ['None (Clean Day)', 'High-GI Foods', 'Processed / Junk Food', 'Chemical Exposure'],
    order: 8, isEnabled: true
  },
  {
    stepId: 'gut_health', title: 'Gut & Oral Health Check',
    questionPrompt: 'Did you experience acidity/gastritis or oral/dental discomfort today?',
    inputType: 'OPTIONS' as const,
    options: ['No Issues (Healthy)', 'Gastritis / Acidity', 'Dental Discomfort', 'Both'],
    order: 9, isEnabled: true
  },
  {
    stepId: 'genetics_substances', title: 'Genetics & Risk Factors',
    questionPrompt: 'Do you have family history of chronic illness or exposure to harmful substances?',
    inputType: 'OPTIONS' as const,
    options: ['No (Clean)', 'Family History Present', 'Substance Exposure', 'Both'],
    order: 10, isEnabled: true
  },
  {
    stepId: 'joy_stillness', title: 'Joy & Stillness',
    questionPrompt: 'Did you spend time on something you love or practice stillness / mindfulness today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Practiced)', 'Not Today'],
    order: 11, isEnabled: true
  }
];

// Cancer Treatment — stepIds match EXACT habit types from manual screens:
//   fasting → 'Fasting', movement → 'Movement' (minutes), stillness → 'Stillness' (sat),
//   joy → 'Joy' (done), stress → 'Stress'
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
    stepId: 'stillness', title: 'Stillness',
    questionPrompt: 'Did you practice stillness or deep breathing meditation today?',
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
    stepId: 'damage_habits', title: 'Risk Habit Avoidance',
    questionPrompt: 'Did you avoid known recurrence-risk factors today (alcohol, smoking, processed foods, chemical exposure)?',
    inputType: 'OPTIONS' as const,
    options: ['Clean Day (All Avoided)', 'Occasional Alcohol', 'Processed Foods', 'Chemical Exposure', 'Multiple Risk Factors'],
    order: 5, isEnabled: true
  },
  {
    stepId: 'repair_habits', title: 'Antioxidant & Repair Nutrition',
    questionPrompt: 'Did you include anti-cancer repair foods today (cruciferous vegetables, berries, turmeric, omega-3s)?',
    inputType: 'OPTIONS' as const,
    options: ['Yes (Anti-cancer Meal)', 'Partial (1-2 items)', 'Hydration Goal Met', 'Supplements Taken', 'No Specific Nutrition'],
    order: 6, isEnabled: true
  },
  {
    stepId: 'stillness', title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, meditation, or deep breathing today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Practiced)', 'Not Today'],
    order: 7, isEnabled: true
  },
  {
    stepId: 'joy', title: 'Joy & Gratitude',
    questionPrompt: 'Did you practice gratitude or engage in activities that bring you joy today?',
    inputType: 'YES_NO' as const,
    options: ['Yes (Done)', 'Not Today'],
    order: 8, isEnabled: true
  },
  {
    stepId: 'screening', title: 'Screening & Follow-up Compliance',
    questionPrompt: 'Did you have any follow-up appointment, imaging, or blood work today? Are your next screenings scheduled?',
    inputType: 'OPTIONS' as const,
    options: ['Appointment Today (Done)', 'Upcoming Scheduled', 'Need to Schedule', 'No Follow-up Required'],
    order: 9, isEnabled: true
  },
  {
    stepId: 'report_upload', title: 'Follow-up Report Upload',
    questionPrompt: 'Do you have new follow-up labs, imaging reports (PET/CT/MRI), or tumor markers to upload? I will process and update your dashboard.',
    inputType: 'FILE' as const,
    options: ['Skip for Now'],
    order: 10, isEnabled: true
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
    console.log('   → STANDARD          (Cancer Prevention)    — 11 steps');
    console.log('   → CANCER_PATIENT    (Cancer Treatment)     — 7 steps');
    console.log('   → SECONDARY_PREVENTION (Survivor Recovery) — 10 steps');
  } catch (err) {
    console.error('❌ [WorkflowSeed] Failed to seed workflows:', err);
  }
};
