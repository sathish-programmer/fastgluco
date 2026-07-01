import { Request, Response } from 'express';
import CancerScreeningTest from '../models/CancerScreeningTest';
import WorkflowConfig from '../models/WorkflowConfig';

// --- ADMIN CANCER SCREENING ---

export const getAdminScreeningTests = async (req: Request, res: Response) => {
  try {
    let tests = await CancerScreeningTest.find().sort({ createdAt: -1 });
    
    // Seed default template if empty
    if (tests.length === 0) {
      const defaults = [
        { name: 'Serum PSA', description: 'Prostate marker. Above 4 ng/mL warrants follow-up.', frequency: 'Yearly from 50', category: 'Male', isActive: true },
        { name: 'CA-125', description: 'Ovarian cancer marker. Used with transvaginal ultrasound.', frequency: 'Yearly for high-risk', category: 'Female', isActive: true },
        { name: 'Mammogram', description: 'Breast cancer screening imaging.', frequency: 'Yearly from 40', category: 'Female', isActive: true },
        { name: 'Pap Smear', description: 'Cervical cancer screening.', frequency: 'Every 3 years from 21', category: 'Female', isActive: true },
        { name: 'Serum CEA', description: 'Marker for colorectal, lung, breast and GI cancers.', frequency: 'Yearly, or as advised', category: 'Universal', isActive: true },
        { name: 'Whole-Body MRI', description: 'Comprehensive imaging to detect solid tumors early.', frequency: 'Optional baseline', category: 'Universal', isActive: true },
        { name: 'Liquid Biopsy', description: 'Blood test to detect circulating tumor DNA.', frequency: 'Consult your doctor', category: 'Universal', isActive: true }
      ];
      await CancerScreeningTest.insertMany(defaults);
      tests = await CancerScreeningTest.find().sort({ createdAt: -1 });
    }
    
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching screening tests' });
  }
};

export const createAdminScreeningTest = async (req: Request, res: Response) => {
  try {
    const newTest = new CancerScreeningTest(req.body);
    await newTest.save();
    res.status(201).json(newTest);
  } catch (err) {
    res.status(500).json({ message: 'Error creating screening test' });
  }
};

export const updateAdminScreeningTest = async (req: Request, res: Response) => {
  try {
    const test = await CancerScreeningTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: 'Error updating screening test' });
  }
};

export const deleteAdminScreeningTest = async (req: Request, res: Response) => {
  try {
    await CancerScreeningTest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Screening test deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting screening test' });
  }
};

// --- ADMIN WORKFLOW CONFIG ---

export const getAdminWorkflowConfig = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    let config = await WorkflowConfig.findOne({ type });
    if (!config) {
      config = new WorkflowConfig({
        type,
        systemPrompt: 'You are an AI assistant helping with sexual health queries...',
        firstMessage: 'Hi there, how can I help you today?',
        whatsappNumber: '+1234567890'
      });
      await config.save();
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching workflow config' });
  }
};

export const updateAdminWorkflowConfig = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const config = await WorkflowConfig.findOneAndUpdate({ type }, req.body, { new: true, upsert: true });
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error updating workflow config' });
  }
};

// --- USER ROUTES ---

export const getScreeningTests = async (req: Request, res: Response) => {
  try {
    let tests = await CancerScreeningTest.find({ isActive: true });
    
    if (tests.length === 0) {
      const allTests = await CancerScreeningTest.find();
      if (allTests.length === 0) {
        const defaults = [
          { name: 'Serum PSA', description: 'Prostate marker. Above 4 ng/mL warrants follow-up.', frequency: 'Yearly from 50', category: 'Male', isActive: true },
          { name: 'CA-125', description: 'Ovarian cancer marker. Used with transvaginal ultrasound.', frequency: 'Yearly for high-risk', category: 'Female', isActive: true },
          { name: 'Mammogram', description: 'Breast cancer screening imaging.', frequency: 'Yearly from 40', category: 'Female', isActive: true },
          { name: 'Pap Smear', description: 'Cervical cancer screening.', frequency: 'Every 3 years from 21', category: 'Female', isActive: true },
          { name: 'Serum CEA', description: 'Marker for colorectal, lung, breast and GI cancers.', frequency: 'Yearly, or as advised', category: 'Universal', isActive: true },
          { name: 'Whole-Body MRI', description: 'Comprehensive imaging to detect solid tumors early.', frequency: 'Optional baseline', category: 'Universal', isActive: true },
          { name: 'Liquid Biopsy', description: 'Blood test to detect circulating tumor DNA.', frequency: 'Consult your doctor', category: 'Universal', isActive: true }
        ];
        await CancerScreeningTest.insertMany(defaults);
        tests = await CancerScreeningTest.find({ isActive: true });
      }
    }
    
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tests' });
  }
};

export const getWorkflowConfig = async (req: Request, res: Response) => {
  try {
    const config = await WorkflowConfig.findOne({ type: req.params.type });
    if (!config) {
      return res.json({
        systemPrompt: '',
        firstMessage: 'Service not configured yet.',
        whatsappNumber: ''
      });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching workflow config' });
  }
};
