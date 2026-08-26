import { Request, Response } from 'express';
import DailyLoggingWorkflow, { IWorkflowStep } from '../models/DailyLoggingWorkflow';

// ─────────────────────────────────────────────────────────────────────────────
// CANCER PREVENTION (Mode: PREVENTION)
// Mirrors all manual items available in Cancer Prevention dashboard
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PREVENTION_STEPS: IWorkflowStep[] = [
  {
    stepId: 'stress',
    title: 'Metabolic Stress Check',
    questionPrompt: 'How was your stress level today? Managing stress lowers cortisol, supporting immune balance and overall longevity.',
    inputType: 'OPTIONS',
    options: ['No Stress (Calm)', 'Mild Stress', 'Moderate Stress', 'High Stress'],
    order: 1,
    isEnabled: true
  },
  {
    stepId: 'sleep',
    title: 'Sleep Duration',
    questionPrompt: 'How many hours of quality sleep did you get last night? (Enter number, e.g., 7.5)',
    inputType: 'NUMBER',
    options: [],
    order: 2,
    isEnabled: true
  },
  {
    stepId: 'fasting',
    title: 'Circadian Fasting Window',
    questionPrompt: 'Did you complete your circadian fasting window today? (e.g., 16:8 intermittent fasting)',
    inputType: 'OPTIONS',
    options: ['Yes (16+ hrs)', 'Yes (12-16 hrs)', 'Partial (<12 hrs)', 'No (Skipped)'],
    order: 3,
    isEnabled: true
  },
  {
    stepId: 'movement',
    title: 'Movement & Exercise',
    questionPrompt: 'Did you complete any physical movement or exercise today?',
    inputType: 'OPTIONS',
    options: ['30+ min Walk / Run', 'Yoga / Stretching (20+ min)', 'Strength Training', 'Light Activity (<20 min)', 'No Movement Today'],
    order: 4,
    isEnabled: true
  },
  {
    stepId: 'stillness',
    title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, quiet meditation, or deep breathing for at least 10 minutes today?',
    inputType: 'YES_NO',
    options: ['Yes (10+ min)', 'Not Today'],
    order: 5,
    isEnabled: true
  },
  {
    stepId: 'joy',
    title: 'Things You Love',
    questionPrompt: 'Did you spend time doing something you love today (hobbies, music, family, art, gratitude)?',
    inputType: 'YES_NO',
    options: ['Yes (Done)', 'Not Today'],
    order: 6,
    isEnabled: true
  },
  {
    stepId: 'smoking',
    title: 'Smoking Exposure',
    questionPrompt: 'Did you smoke or get exposed to tobacco smoke today?',
    inputType: 'YES_NO',
    options: ['No (Clean Day)', 'Yes (Smoke / Exposed)'],
    order: 7,
    isEnabled: true
  },
  {
    stepId: 'alcohol',
    title: 'Alcohol Intake Check',
    questionPrompt: 'Did you consume any alcoholic beverages today?',
    inputType: 'OPTIONS',
    options: ['No Alcohol (Clean Day)', '1-2 Drinks', '3+ Drinks (Heavy)'],
    order: 8,
    isEnabled: true
  },
  {
    stepId: 'antioxidants',
    title: 'Antioxidants & Repair Foods',
    questionPrompt: 'Did you consume antioxidant-rich foods (berries, greens, amla, turmeric) or repair supplements today?',
    inputType: 'YES_NO',
    options: ['Yes (Consumed)', 'Not Today'],
    order: 9,
    isEnabled: true
  },
  {
    stepId: 'env_air',
    title: 'Air Pollution Exposure',
    questionPrompt: 'Did you commute in heavy traffic (>30 min) or experience indoor smoke/incense/mosquito coil exposure today?',
    inputType: 'YES_NO',
    options: ['No (Clean Air)', 'Yes (Smog / Smoke Exposure)'],
    order: 10,
    isEnabled: true
  },
  {
    stepId: 'env_water',
    title: 'Water Carcinogens Check',
    questionPrompt: 'Do you use safe filtered drinking water (RO / carbon filtered, free of heavy metals, chlorine byproducts, and PFAS)?',
    inputType: 'YES_NO',
    options: ['Yes (Safe Filtered)', 'No / Unfiltered Tap'],
    order: 11,
    isEnabled: true
  },
  {
    stepId: 'env_pesticides',
    title: 'Pesticides Exposure',
    questionPrompt: 'Did you consume unwashed non-organic high-pesticide produce (Dirty Dozen) or use chemical bug sprays today?',
    inputType: 'YES_NO',
    options: ['No (Clean / Organic)', 'Yes (Pesticide Exposure)'],
    order: 12,
    isEnabled: true
  },
  {
    stepId: 'env_microplastics',
    title: 'Microplastics Exposure',
    questionPrompt: 'Did you drink from heated plastic bottles, microwave food in plastic containers, or drink hot beverages from paper/plastic cups today?',
    inputType: 'YES_NO',
    options: ['No (Plastic-Free)', 'Yes (Plastic / Hot Cup Exposure)'],
    order: 13,
    isEnabled: true
  },
  {
    stepId: 'gut_health',
    title: 'Gut & Oral Health Check',
    questionPrompt: 'Did you experience acidity/gastritis or oral/dental discomfort today?',
    inputType: 'OPTIONS',
    options: ['No Issues (Healthy)', 'Gastritis / Acidity', 'Dental Discomfort', 'Both'],
    order: 14,
    isEnabled: true
  },
  {
    stepId: 'genetics',
    title: 'Family History of Cancer',
    questionPrompt: 'Do you have anybody in your family with cancer, or a self-diagnosis of cancer?',
    inputType: 'YES_NO',
    options: ['No Family History', 'Yes (Family History of Cancer)'],
    order: 15,
    isEnabled: true
  },
  {
    stepId: 'substances',
    title: 'Chemical & Industrial Substances',
    questionPrompt: 'Were you exposed to harmful industrial chemicals, asbestos, or hazardous substances today?',
    inputType: 'YES_NO',
    options: ['No (Clean Day)', 'Yes (Chemical Exposure)'],
    order: 16,
    isEnabled: true
  },
  {
    stepId: 'report_upload',
    title: 'Lab / CGM Report Upload',
    questionPrompt: 'Do you have a new CGM report, HbA1c, or cancer screening result to upload today? Tap below to upload.',
    inputType: 'FILE',
    options: ['Skip for Now', 'Upload Report (PDF / CSV)'],
    order: 17,
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
    stepId: 'movement',
    title: 'Movement',
    questionPrompt: 'Did you complete any movement or gentle exercise today? Even light walking supports recovery.',
    inputType: 'OPTIONS',
    options: ['30+ min Walk', 'Yoga / Stretching (20+ min)', 'Light Walk (<20 min)', 'Bed Rest Only'],
    order: 2,
    isEnabled: true
  },
  {
    stepId: 'stillness',
    title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, quiet meditation, or deep breathing for at least 10 minutes today?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced)', 'Not Today'],
    order: 3,
    isEnabled: true
  },
  {
    stepId: 'joy',
    title: 'Things You Love',
    questionPrompt: 'Did you spend time doing something you love today — music, family, art, hobbies?',
    inputType: 'YES_NO',
    options: ['Yes (Done)', 'Not Today'],
    order: 4,
    isEnabled: true
  },
  {
    stepId: 'stress',
    title: 'Are You Stressed / Worried?',
    questionPrompt: 'How is your emotional state today? Stress management is a key part of recovery.',
    inputType: 'OPTIONS',
    options: ['Calm / Positive', 'Mild Worry', 'Moderate Stress', 'High Stress / Anxious'],
    order: 5,
    isEnabled: true
  },
  {
    stepId: 'sleep',
    title: 'Rest & Recovery Sleep',
    questionPrompt: 'How many hours of restful sleep did you get last night?',
    inputType: 'NUMBER',
    options: [],
    order: 6,
    isEnabled: true
  },
  {
    stepId: 'report_upload',
    title: 'Oncology / CGM Report Upload',
    questionPrompt: 'Do you have new lab reports, tumor markers (CEA / CA-125), chemo reports, or CGM data to upload? I will process and load them into your dashboard.',
    inputType: 'FILE',
    options: ['Skip for Now'],
    order: 7,
    isEnabled: true
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY PREVENTION (Mode: SECONDARY_PREVENTION)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SECONDARY_PREVENTION_STEPS: IWorkflowStep[] = [
  {
    stepId: 'stress',
    title: 'Survivor Stress & Emotional Health',
    questionPrompt: 'How is your emotional wellbeing today? Post-cancer anxiety, fear of recurrence, or caregiver stress?',
    inputType: 'OPTIONS',
    options: ['Positive / Calm', 'Mild Anxiety', 'Fear of Recurrence', 'Caregiver Stress', 'Emotionally Drained'],
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
    stepId: 'fasting',
    title: 'Metabolic Fasting Window',
    questionPrompt: 'Did you complete your metabolic fasting window today? Fasting helps suppress recurrence risk.',
    inputType: 'OPTIONS',
    options: ['Yes (16+ hours)', 'Yes (12-16 hours)', 'Partial (Under 12h)', 'No (Skipped)'],
    order: 3,
    isEnabled: true
  },
  {
    stepId: 'movement',
    title: 'Active Recovery Movement',
    questionPrompt: 'What physical activity did you complete today? Exercise is a proven recurrence-risk reducer.',
    inputType: 'OPTIONS',
    options: ['30+ min Walk / Jog', 'Yoga / Tai Chi', 'Strength Training', 'Swimming / Cycling', 'Light Stretching', 'Rest Day'],
    order: 4,
    isEnabled: true
  },
  {
    stepId: 'stillness',
    title: 'Stillness & Meditation',
    questionPrompt: 'Did you practice stillness, meditation, or deep breathing today?',
    inputType: 'YES_NO',
    options: ['Yes (Practiced)', 'Not Today'],
    order: 5,
    isEnabled: true
  },
  {
    stepId: 'joy',
    title: 'Joy & Gratitude',
    questionPrompt: 'Did you practice gratitude or engage in activities that bring you joy today?',
    inputType: 'YES_NO',
    options: ['Yes (Done)', 'Not Today'],
    order: 6,
    isEnabled: true
  },
  {
    stepId: 'repair_habits',
    title: 'Antioxidant & Repair Nutrition',
    questionPrompt: 'Did you include anti-cancer repair foods today (cruciferous vegetables, berries, turmeric, omega-3s)?',
    inputType: 'OPTIONS',
    options: ['Yes (Anti-cancer Meal)', 'Partial (1-2 items)', 'Hydration Goal Met', 'Supplements Taken', 'No Specific Nutrition'],
    order: 7,
    isEnabled: true
  },
  {
    stepId: 'env_air',
    title: 'Air Pollution Exposure',
    questionPrompt: 'Did you commute in heavy traffic (>30 min) or experience indoor smoke/incense/mosquito coil exposure today?',
    inputType: 'YES_NO',
    options: ['No (Clean Air)', 'Yes (Smog / Smoke Exposure)'],
    order: 8,
    isEnabled: true
  },
  {
    stepId: 'env_water',
    title: 'Water Carcinogens Check',
    questionPrompt: 'Do you use safe filtered drinking water (RO / carbon filtered, free of heavy metals, chlorine byproducts, and PFAS)?',
    inputType: 'YES_NO',
    options: ['Yes (Safe Filtered)', 'No / Unfiltered Tap'],
    order: 9,
    isEnabled: true
  },
  {
    stepId: 'env_pesticides',
    title: 'Pesticides Exposure',
    questionPrompt: 'Did you consume unwashed non-organic high-pesticide produce (Dirty Dozen) or use chemical bug sprays today?',
    inputType: 'YES_NO',
    options: ['No (Clean / Organic)', 'Yes (Pesticide Exposure)'],
    order: 10,
    isEnabled: true
  },
  {
    stepId: 'env_microplastics',
    title: 'Microplastics Exposure',
    questionPrompt: 'Did you drink from heated plastic bottles, microwave food in plastic containers, or drink hot beverages from paper/plastic cups today?',
    inputType: 'YES_NO',
    options: ['No (Plastic-Free)', 'Yes (Plastic / Hot Cup Exposure)'],
    order: 11,
    isEnabled: true
  },
  {
    stepId: 'genetics',
    title: 'Family History of Cancer',
    questionPrompt: 'Do you have anybody in your family with cancer, or a self-diagnosis of cancer?',
    inputType: 'YES_NO',
    options: ['No Family History', 'Yes (Family History of Cancer)'],
    order: 12,
    isEnabled: true
  },
  {
    stepId: 'screening',
    title: 'Screening & Follow-up Compliance',
    questionPrompt: 'Did you have any follow-up appointment, imaging, or blood work today? Are your next screenings scheduled?',
    inputType: 'OPTIONS',
    options: ['Appointment Today (Done)', 'Upcoming Scheduled', 'Need to Schedule', 'No Follow-up Required'],
    order: 13,
    isEnabled: true
  },
  {
    stepId: 'report_upload',
    title: 'Follow-up Report Upload',
    questionPrompt: 'Do you have new follow-up labs, imaging reports (PET/CT/MRI), or tumor markers to upload? I will process and update your dashboard.',
    inputType: 'FILE',
    options: ['Skip for Now'],
    order: 14,
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

    let workflow = await DailyLoggingWorkflow.findOne({
      isActive: true,
      targetMode: targetMode
    }).sort({ updatedAt: -1 });

    if (!workflow) {
      // Auto-seed the correct default workflow if none exists
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

      workflow = await DailyLoggingWorkflow.create({
        name: workflowName,
        targetMode: targetMode,
        isActive: true,
        steps: defaultSteps
      });
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
