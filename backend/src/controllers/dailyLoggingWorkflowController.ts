import { Request, Response } from 'express';
import DailyLoggingWorkflow, { IWorkflowStep } from '../models/DailyLoggingWorkflow';

// ─────────────────────────────────────────────────────────────────────────────
// CANCER PREVENTION (Mode: PREVENTION)
// Mirrors all manual items available in Cancer Prevention dashboard
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PREVENTION_STEPS: IWorkflowStep[] = [
  // ── 11 Damage Habits ──
  {
    stepId: 'stress',
    title: 'Stress & Emotional Wellbeing',
    questionPrompt: 'How are you feeling emotionally today? Are you experiencing stress, worry, or feeling overwhelmed?',
    inputType: 'OPTIONS',
    options: ['No Stress (Calm)', 'Mild Stress', 'Moderate Stress', 'High Stress'],
    order: 1,
    isEnabled: true
  },
  {
    stepId: 'sleep',
    title: 'Sleep Duration & Debt',
    questionPrompt: 'How many hours of quality sleep did you get last night? (Enter number, e.g., 7.5)',
    inputType: 'NUMBER',
    options: [],
    order: 2,
    isEnabled: true
  },
  {
    stepId: 'smoking',
    title: 'Smoking & Chewing Tobacco',
    questionPrompt: 'Did you smoke cigarettes/bidis or chew tobacco (gutkha, khaini, paan with tobacco) today?',
    inputType: 'YES_NO',
    options: ['No (Clean Day)', 'Yes (Smoked / Chewed Tobacco)'],
    order: 3,
    isEnabled: true
  },
  {
    stepId: 'alcohol',
    title: 'Alcohol Intake Check',
    questionPrompt: 'Did you consume any alcoholic beverages today?',
    inputType: 'OPTIONS',
    options: ['No Alcohol (Clean Day)', '1-2 Drinks', '3+ Drinks (Heavy)'],
    order: 4,
    isEnabled: true
  },
  {
    stepId: 'substances',
    title: 'Chemical & Industrial Substances',
    questionPrompt: 'Were you exposed to harmful industrial chemicals, asbestos, or hazardous substances today?',
    inputType: 'YES_NO',
    options: ['No (Clean Day)', 'Yes (Chemical Exposure)'],
    order: 5,
    isEnabled: true
  },
  {
    stepId: 'environmental',
    title: 'Environmental Toxins & Air Quality',
    questionPrompt: 'Did you encounter heavy traffic air pollution, smog, smoke, fumes, or fog today?',
    inputType: 'YES_NO',
    options: ['No (Clean Environment)', 'Yes (Pollution / Smog / Toxins)'],
    order: 6,
    isEnabled: true
  },
  {
    stepId: 'kitchen',
    title: 'Safe Kitchen Audit',
    questionPrompt: 'Is your kitchen free of heated plastic containers, synthetic non-stick pans, and plastic drinking water cans?',
    inputType: 'YES_NO',
    options: ['Yes (Safe / Non-Plastic)', 'No (Plastic / Non-Stick Risk)'],
    order: 7,
    isEnabled: true
  },
  {
    stepId: 'obesity',
    title: 'Obesity & Weight Check',
    questionPrompt: 'Do you face difficulty managing weight, high visceral fat, or BMI above healthy range?',
    inputType: 'YES_NO',
    options: ['No (Healthy Weight)', 'Yes (Weight Difficulty / Elevated BMI)'],
    order: 8,
    isEnabled: true
  },
  {
    stepId: 'dental',
    title: 'Dental & Oral Health Check',
    questionPrompt: 'Do you have any persistent sharp tooth, bleeding gums, non-healing oral ulcers, or oral discomfort?',
    inputType: 'YES_NO',
    options: ['No Issues (Healthy)', 'Yes (Dental Discomfort / Sharp Tooth)'],
    order: 9,
    isEnabled: true
  },
  {
    stepId: 'gastritis',
    title: 'Gastritis & Gut Health Check',
    questionPrompt: 'Did you experience acidity, heartburn, acid reflux, or gastritis discomfort today?',
    inputType: 'YES_NO',
    options: ['No Issues (Healthy)', 'Yes (Gastritis / Acidity Discomfort)'],
    order: 10,
    isEnabled: true
  },
  {
    stepId: 'genetic',
    title: 'Genetic Risk & Family History',
    questionPrompt: 'Do you have a family history of cancer or chronic health risks in immediate family members?',
    inputType: 'YES_NO',
    options: ['No Family History', 'Yes (Family History Present)'],
    order: 11,
    isEnabled: true
  },

  // ── 8 Repair Habits ──
  {
    stepId: 'fasting',
    title: 'Intermittent Fasting',
    questionPrompt: 'Did you complete your intermittent fasting window today? (e.g., 14-16h overnight fast)',
    inputType: 'OPTIONS',
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 12,
    isEnabled: true
  },
  {
    stepId: 'diet',
    title: 'Diet & Nutrition Check',
    questionPrompt: 'Did you follow a balanced clean diet (vegetables, clean protein, complex carbs) and avoid ultra-processed junk food today?',
    inputType: 'OPTIONS',
    options: ['Balanced Clean Diet (+1)', 'Clean Meals (No Junk)', 'Junk Food / Ultra-Processed (-1)', 'Both Balanced & Junk'],
    order: 13,
    isEnabled: true
  },
  {
    stepId: 'antioxidants',
    title: 'Antioxidants & Repair Foods',
    questionPrompt: 'Did you consume antioxidant-rich foods (berries, greens, amla, turmeric) or repair supplements today?',
    inputType: 'YES_NO',
    options: ['Yes (Consumed)', 'Not Today'],
    order: 14,
    isEnabled: true
  },
  {
    stepId: 'movement',
    title: 'Movement & Exercise',
    questionPrompt: 'Did you complete any physical movement, walking, or exercise today?',
    inputType: 'OPTIONS',
    options: ['30+ min Walk / Run', 'Yoga / Stretching (20+ min)', 'Strength Training', 'Light Activity (<20 min)', 'No Movement Today'],
    order: 15,
    isEnabled: true
  },
  {
    stepId: 'stillness',
    title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, quiet meditation, or mindfulness for at least 10 minutes today?',
    inputType: 'YES_NO',
    options: ['Yes (10+ min)', 'Not Today'],
    order: 16,
    isEnabled: true
  },
  {
    stepId: 'breath',
    title: 'Power of Breath',
    questionPrompt: 'Did you practice 5 to 10 minutes of conscious breathwork (box breathing, 4-7-8, or pranayama) today to restore cellular oxygenation?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced 5-10 min)', 'Not Today'],
    order: 17,
    isEnabled: true
  },
  {
    stepId: 'joy',
    title: 'Things You Love',
    questionPrompt: 'Did you spend time doing something you love today (hobbies, music, family, art, gratitude)?',
    inputType: 'YES_NO',
    options: ['Yes (Done)', 'Not Today'],
    order: 18,
    isEnabled: true
  },
  {
    stepId: 'safer_products',
    title: 'Safer Personal Care Products',
    questionPrompt: 'Did you use paraben-free, sulfate-free, and phthalate-free personal care / household products today?',
    inputType: 'YES_NO',
    options: ['Yes (Safe Products Used)', 'Not Today'],
    order: 19,
    isEnabled: true
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// CANCER TREATMENT (Mode: TREATMENT / CANCER_PATIENT)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TREATMENT_STEPS: IWorkflowStep[] = [
  {
    stepId: 'fasting',
    title: 'Intermittent Fasting',
    questionPrompt: 'Did you complete your intermittent fasting window today? Fasting supports cellular healing during cancer treatment.',
    inputType: 'OPTIONS',
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 1,
    isEnabled: true
  },
  {
    stepId: 'diet',
    title: 'Healing Nutrition & Diet',
    questionPrompt: 'Did you eat clean, cancer-fighting whole foods (50% vegetables, clean protein, complex carbs) and avoid junk foods today?',
    inputType: 'OPTIONS',
    options: ['Balanced Clean Diet (+1)', 'Clean Meals (No Junk)', 'Junk Food / Processed (-1)', 'Both Balanced & Junk'],
    order: 2,
    isEnabled: true
  },
  {
    stepId: 'movement',
    title: 'Movement',
    questionPrompt: 'Did you complete any movement or gentle exercise today? Even light walking supports recovery.',
    inputType: 'OPTIONS',
    options: ['30+ min Walk', 'Yoga / Stretching (20+ min)', 'Light Walk (<20 min)', 'Bed Rest Only'],
    order: 3,
    isEnabled: true
  },
  {
    stepId: 'stillness',
    title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, quiet meditation, or mindfulness for at least 10 minutes today?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced)', 'Not Today'],
    order: 4,
    isEnabled: true
  },
  {
    stepId: 'breath',
    title: 'Power of Breath',
    questionPrompt: 'Did you practice 5 to 10 minutes of gentle conscious breathwork (box breathing or slow pranayama) today?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced)', 'Not Today'],
    order: 5,
    isEnabled: true
  },
  {
    stepId: 'joy',
    title: 'Things You Love',
    questionPrompt: 'Did you spend time doing something you love today — music, family, art, hobbies?',
    inputType: 'YES_NO',
    options: ['Yes (Done)', 'Not Today'],
    order: 6,
    isEnabled: true
  },
  {
    stepId: 'stress',
    title: 'Are You Stressed / Worried?',
    questionPrompt: 'How is your emotional state today? Stress management is a key part of recovery.',
    inputType: 'OPTIONS',
    options: ['Calm / Positive', 'Mild Worry', 'Moderate Stress', 'High Stress / Anxious'],
    order: 7,
    isEnabled: true
  },
  {
    stepId: 'sleep',
    title: 'Rest & Recovery Sleep',
    questionPrompt: 'How many hours of restful sleep did you get last night?',
    inputType: 'NUMBER',
    options: [],
    order: 8,
    isEnabled: true
  },
  {
    stepId: 'snoring',
    title: 'Sleep Snoring & Airway Check',
    questionPrompt: 'Do you snore loudly during sleep, gasp for breath, or wake up unrefreshed?',
    inputType: 'YES_NO',
    options: ['No (Quiet Sleep)', 'Yes (Snoring / Airway Gasps)'],
    order: 9,
    isEnabled: true
  },
  {
    stepId: 'kitchen',
    title: 'Safe Kitchen Audit',
    questionPrompt: 'Is your food cooked and stored in safe, non-toxic cookware (glass, steel, clay) free of heated plastics and synthetic non-stick pans?',
    inputType: 'YES_NO',
    options: ['Yes (Safe / Non-Toxic)', 'No (Plastic / Non-Stick Risk)'],
    order: 10,
    isEnabled: true
  },
  {
    stepId: 'report_upload',
    title: 'Oncology / CGM Report Upload',
    questionPrompt: 'Do you have new lab reports, tumor markers (CEA / CA-125), chemo reports, or CGM data to upload? I will process and load them into your dashboard.',
    inputType: 'FILE',
    options: ['Skip for Now'],
    order: 11,
    isEnabled: true
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY PREVENTION (Mode: SECONDARY_PREVENTION)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SECONDARY_PREVENTION_STEPS: IWorkflowStep[] = [
  {
    stepId: 'stress',
    title: 'Stress & Emotional Wellbeing',
    questionPrompt: 'How are you feeling emotionally today? Are you experiencing stress, worry, or feeling overwhelmed?',
    inputType: 'OPTIONS',
    options: ['No Stress (Calm)', 'Mild Stress', 'Moderate Stress', 'High Stress'],
    order: 1,
    isEnabled: true
  },
  {
    stepId: 'sleep',
    title: 'Recovery Sleep Quality',
    questionPrompt: 'How many hours of restorative sleep did you get last night?',
    inputType: 'NUMBER',
    options: [],
    order: 2,
    isEnabled: true
  },
  {
    stepId: 'snoring',
    title: 'Sleep Snoring & Airway Check',
    questionPrompt: 'Do you snore loudly during sleep, gasp for breath, or wake up unrefreshed?',
    inputType: 'YES_NO',
    options: ['No (Quiet Sleep)', 'Yes (Snoring / Airway Gasps)'],
    order: 3,
    isEnabled: true
  },
  {
    stepId: 'fasting',
    title: 'Metabolic Fasting Window',
    questionPrompt: 'Did you complete your metabolic fasting window today? Fasting supports cellular autophagy and metabolic vitality.',
    inputType: 'OPTIONS',
    options: ['Yes (16+ hours)', 'Yes (12-16 hours)', 'Partial (Under 12h)', 'No (Skipped)'],
    order: 4,
    isEnabled: true
  },
  {
    stepId: 'diet',
    title: 'Diet & Cellular Nutrition',
    questionPrompt: 'Did you follow a balanced diet (50% vegetables, clean protein, complex carbs) or consume junk/ultra-processed foods today?',
    inputType: 'OPTIONS',
    options: ['Balanced Clean Diet (+1)', 'Clean Meals (No Junk)', 'Junk Food / Ultra-Processed (-1)', 'Both Balanced & Junk'],
    order: 5,
    isEnabled: true
  },
  {
    stepId: 'movement',
    title: 'Active Movement & Exercise',
    questionPrompt: 'What physical activity did you complete today? Daily movement strengthens cellular immunity and stamina.',
    inputType: 'OPTIONS',
    options: ['30+ min Walk / Jog', 'Yoga / Tai Chi', 'Strength Training', 'Swimming / Cycling', 'Light Stretching', 'No Movement Today'],
    order: 6,
    isEnabled: true
  },
  {
    stepId: 'stillness',
    title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, meditation, or mindfulness today?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced)', 'Not Today'],
    order: 7,
    isEnabled: true
  },
  {
    stepId: 'breath',
    title: 'Power of Breath',
    questionPrompt: 'Did you practice 5 to 10 minutes of conscious breathwork (box breathing, 4-7-8, or pranayama) today?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced 5-10 min)', 'Not Today'],
    order: 8,
    isEnabled: true
  },
  {
    stepId: 'joy',
    title: 'Joy & Gratitude',
    questionPrompt: 'Did you practice gratitude or engage in activities that bring you joy today?',
    inputType: 'YES_NO',
    options: ['Yes (Done)', 'Not Today'],
    order: 9,
    isEnabled: true
  },
  {
    stepId: 'repair_habits',
    title: 'Antioxidant & Repair Nutrition',
    questionPrompt: 'Did you include antioxidant-rich repair foods today (cruciferous vegetables, berries, turmeric, omega-3s)?',
    inputType: 'OPTIONS',
    options: ['Yes (Antioxidant-Rich Meal)', 'Partial (1-2 items)', 'Hydration Goal Met', 'Supplements Taken', 'No Specific Nutrition'],
    order: 10,
    isEnabled: true
  },
  {
    stepId: 'env_air',
    title: 'Air Pollution & Passive Smoke',
    questionPrompt: 'Did you commute in heavy traffic (>30 min), encounter passive smoking (second-hand smoke), or experience indoor smoke/incense/mosquito coil exposure today?',
    inputType: 'YES_NO',
    options: ['No (Clean Air)', 'Yes (Smog / Smoke / Passive Smoke)'],
    order: 11,
    isEnabled: true
  },
  {
    stepId: 'env_water',
    title: 'Water Carcinogens Check',
    questionPrompt: 'Do you use safe filtered drinking water (RO / carbon filtered, free of heavy metals, chlorine byproducts, and PFAS)?',
    inputType: 'YES_NO',
    options: ['Yes (Safe Filtered)', 'No / Unfiltered Tap'],
    order: 12,
    isEnabled: true
  },
  {
    stepId: 'env_pesticides',
    title: 'Pesticides Exposure',
    questionPrompt: 'Did you consume unwashed non-organic high-pesticide produce (Dirty Dozen) or use chemical bug sprays today?',
    inputType: 'YES_NO',
    options: ['No (Clean / Organic)', 'Yes (Pesticide Exposure)'],
    order: 13,
    isEnabled: true
  },
  {
    stepId: 'env_microplastics',
    title: 'Microplastics Exposure',
    questionPrompt: 'Did you drink from heated plastic bottles, microwave food in plastic containers, or drink hot beverages from paper/plastic cups today?',
    inputType: 'YES_NO',
    options: ['No (Plastic-Free)', 'Yes (Plastic / Hot Cup Exposure)'],
    order: 14,
    isEnabled: true
  },
  {
    stepId: 'kitchen',
    title: 'Safe Kitchen Audit',
    questionPrompt: 'Is your kitchen free of heated plastic containers, synthetic non-stick pans, and plastic drinking water cans?',
    inputType: 'YES_NO',
    options: ['Yes (Safe / Non-Plastic)', 'No (Plastic / Non-Stick Risk)'],
    order: 15,
    isEnabled: true
  },
  {
    stepId: 'dental',
    title: 'Dental Health Check',
    questionPrompt: 'Do you have any sharp tooth, bleeding gums, non-healing oral ulcers, or oral discomfort?',
    inputType: 'YES_NO',
    options: ['No Issues (Healthy)', 'Yes (Dental Discomfort / Sharp Tooth)'],
    order: 16,
    isEnabled: true
  },
  {
    stepId: 'genetics',
    title: 'Family History & Genetic Risk',
    questionPrompt: 'Do you have a family history of cancer or chronic health risks in immediate family members?',
    inputType: 'YES_NO',
    options: ['No Family History', 'Yes (Family History Present)'],
    order: 17,
    isEnabled: true
  },
  {
    stepId: 'screening',
    title: 'Screening & Follow-up Compliance',
    questionPrompt: 'Did you have any follow-up appointment, imaging, or blood work today? Are your next screenings scheduled?',
    inputType: 'OPTIONS',
    options: ['Appointment Today (Done)', 'Upcoming Scheduled', 'Need to Schedule', 'No Follow-up Required'],
    order: 18,
    isEnabled: true
  },
  {
    stepId: 'report_upload',
    title: 'Follow-up Report Upload',
    questionPrompt: 'Do you have new follow-up labs, imaging reports (PET/CT/MRI), or tumor markers to upload? I will process and update your dashboard.',
    inputType: 'FILE',
    options: ['Skip for Now'],
    order: 19,
    isEnabled: true
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Controller: Get Active Workflow by Mode
// Maps frontend mode (PREVENTION/TREATMENT/SECONDARY_PREVENTION) to DB mode
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveWorkflow = async (req: Request, res: Response) => {
  try {
    const { mode } = req.query;
    
    // Map frontend journey mode → DB targetMode
    let targetMode: string;
    if (mode === 'CANCER_PATIENT' || mode === 'TREATMENT') {
      targetMode = 'CANCER_PATIENT';
    } else if (mode === 'SECONDARY_PREVENTION') {
      targetMode = 'SECONDARY_PREVENTION';
    } else {
      targetMode = 'STANDARD'; // PREVENTION default
    }

    let defaultSteps: IWorkflowStep[];
    let workflowName: string;
    
    if (targetMode === 'CANCER_PATIENT') {
      defaultSteps = DEFAULT_TREATMENT_STEPS;
      workflowName = 'Cancer Treatment Daily Workflow';
    } else if (targetMode === 'SECONDARY_PREVENTION') {
      defaultSteps = DEFAULT_SECONDARY_PREVENTION_STEPS;
      workflowName = 'Secondary Prevention Daily Workflow';
    } else {
      defaultSteps = DEFAULT_PREVENTION_STEPS;
      workflowName = 'Cancer Prevention Daily Workflow';
    }

    let workflow = await DailyLoggingWorkflow.findOne({
      isActive: true,
      targetMode: targetMode
    }).sort({ updatedAt: -1 });

    if (!workflow) {
      workflow = await DailyLoggingWorkflow.create({
        name: workflowName,
        targetMode: targetMode,
        isActive: true,
        steps: defaultSteps
      });
    } else {
      const defaultStepMap = new Map(defaultSteps.map(s => [s.stepId, s]));
      let hasChanges = false;

      if (workflow.steps.length !== defaultSteps.length) {
        // Sync workflow steps if DB has stale step count
        workflow.steps = defaultSteps as any;
        workflow.name = workflowName;
        hasChanges = true;
      } else {
        // Always synchronize step prompts, titles, and options with clean defaultSteps
        workflow.steps = workflow.steps.map(step => {
          const def = defaultStepMap.get(step.stepId);
          if (def) {
            if (
              step.questionPrompt !== def.questionPrompt ||
              step.title !== def.title ||
              JSON.stringify(step.options) !== JSON.stringify(def.options)
            ) {
              step.questionPrompt = def.questionPrompt;
              step.title = def.title;
              step.options = def.options;
              step.inputType = def.inputType;
              hasChanges = true;
            }
          }
          return step;
        });
      }

      if (hasChanges) {
        workflow.markModified('steps');
        await workflow.save();
      }
    }

    res.json(workflow);
  } catch (error: any) {
    console.error('Error fetching active logging workflow:', error);
    res.status(500).json({ error: 'Failed to fetch logging workflow' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Controller: Admin - Get All Workflows
// Prefills all 3 mode workflows if DB is empty
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminWorkflows = async (req: Request, res: Response) => {
  try {
    let workflows = await DailyLoggingWorkflow.find().sort({ createdAt: -1 });
    
    if (workflows.length === 0) {
      // Seed all 3 default workflows
      const preventionWf = await DailyLoggingWorkflow.create({
        name: 'Cancer Prevention Daily Workflow',
        targetMode: 'STANDARD',
        isActive: true,
        steps: DEFAULT_PREVENTION_STEPS
      });
      const treatmentWf = await DailyLoggingWorkflow.create({
        name: 'Cancer Treatment Daily Workflow',
        targetMode: 'CANCER_PATIENT',
        isActive: true,
        steps: DEFAULT_TREATMENT_STEPS
      });
      const secondaryWf = await DailyLoggingWorkflow.create({
        name: 'Secondary Prevention Daily Workflow',
        targetMode: 'SECONDARY_PREVENTION',
        isActive: true,
        steps: DEFAULT_SECONDARY_PREVENTION_STEPS
      });
      workflows = [preventionWf, treatmentWf, secondaryWf];
    } else {
      // Ensure all 3 modes have at least one workflow seeded
      const modes = ['STANDARD', 'CANCER_PATIENT', 'SECONDARY_PREVENTION'];
      const existingModes = new Set(workflows.map(w => w.targetMode));
      
      const missing: string[] = modes.filter(m => !existingModes.has(m as any));
      for (const m of missing) {
        let steps = DEFAULT_PREVENTION_STEPS;
        let name = 'Cancer Prevention Daily Workflow';
        if (m === 'CANCER_PATIENT') { steps = DEFAULT_TREATMENT_STEPS; name = 'Cancer Treatment Daily Workflow'; }
        if (m === 'SECONDARY_PREVENTION') { steps = DEFAULT_SECONDARY_PREVENTION_STEPS; name = 'Secondary Prevention Daily Workflow'; }
        const newWf = await DailyLoggingWorkflow.create({ name, targetMode: m, isActive: true, steps });
        workflows.push(newWf);
      }
    }
    
    res.json(workflows);
  } catch (error: any) {
    console.error('Error fetching admin workflows:', error);
    res.status(500).json({ error: 'Failed to fetch admin workflows' });
  }
};

export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const { name, targetMode, isActive, steps } = req.body;
    if (isActive) {
      await DailyLoggingWorkflow.updateMany({ targetMode: targetMode }, { isActive: false });
    }
    
    let defaultSteps = DEFAULT_PREVENTION_STEPS;
    if (targetMode === 'CANCER_PATIENT') defaultSteps = DEFAULT_TREATMENT_STEPS;
    if (targetMode === 'SECONDARY_PREVENTION') defaultSteps = DEFAULT_SECONDARY_PREVENTION_STEPS;
    
    const workflow = await DailyLoggingWorkflow.create({
      name,
      targetMode: targetMode || 'STANDARD',
      isActive: isActive !== undefined ? isActive : true,
      steps: steps || defaultSteps
    });
    res.status(201).json(workflow);
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, targetMode, isActive, steps } = req.body;
    if (isActive) {
      await DailyLoggingWorkflow.updateMany({ _id: { $ne: id }, targetMode: targetMode }, { isActive: false });
    }
    const workflow = await DailyLoggingWorkflow.findByIdAndUpdate(id, { name, targetMode, isActive, steps }, { new: true });
    res.json(workflow);
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
};

export const deleteWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await DailyLoggingWorkflow.findByIdAndDelete(id);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};
