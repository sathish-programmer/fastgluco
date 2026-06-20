import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Founder } from './models/Founder';

// Setup environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env.production') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const SAMPLE_FOUNDERS = [
  {
    name: 'Dr. Krithika',
    role: 'Co-Founder & Chief Medical Officer',
    background: 'Dr. Krithika holds a Ph.D. in Molecular Nutrition and metabolic sciences. She has dedicated over 15 years to studying the impact of circadian rhythms on cellular health and insulin resistance.',
    workDone: 'Conducted multiple clinical trials analyzing blood glucose profiles in patients following intermittent fasting protocols. She led the research team that developed our proprietary glycemic scoring logic.',
    achievements: 'Author of over 20 peer-reviewed articles in prestigious medical journals. Awarded the Metabolic Health Innovation Award in 2024.',
    tryingToSolve: 'We are trying to eliminate the guesswork from health and nutrition by providing continuous biofeedback, enabling people to understand exactly how their daily diet spikes their blood glucose levels in real-time.',
    videoUrl: 'https://www.youtube.com/watch?v=mlOQWxjDr-4'
  },
  {
    name: 'Dr. Lohith',
    role: 'Co-Founder & Lead Clinician',
    background: 'Dr. Lohith is a practicing physician specializing in Endocrinology and Preventative Medicine. He has treated thousands of patients suffering from type 2 diabetes and metabolic disorders.',
    workDone: 'Pioneered CGM-guided metabolic recovery programs in clinical settings. He oversees the clinical accuracy of the coaching modules and patient care protocols.',
    achievements: 'Recognized as a leading expert in diabetes reversal protocols. Guest speaker at international endocrinology conferences.',
    tryingToSolve: 'To empower individuals to reverse chronic metabolic conditions naturally through customized lifestyle changes, smart dietary adjustments, and science-backed circadian fasting techniques instead of relying solely on life-long medication.',
    videoUrl: 'https://www.youtube.com/watch?v=mlOQWxjDr-4'
  },
  {
    name: 'Dr. Thomas Seyfried',
    role: 'Scientific Advisor & Cancer Metabolism Specialist',
    background: 'Dr. Thomas Seyfried is a Professor of Biology at Boston College and a world-renowned researcher in the field of cancer genetics and lipid biochemistry. He holds a Ph.D. in Genetics.',
    workDone: 'Pioneered research into the metabolic theory of cancer, demonstrating how cellular metabolism and ketogenic protocols influence therapeutic outcomes. He advises on the app\'s secondary prevention screening features.',
    achievements: 'Author of the groundbreaking medical textbook "Cancer as a Metabolic Disease". Recipient of numerous scientific lifetime achievement awards.',
    tryingToSolve: 'To translate state-of-the-art biochemistry and metabolic research into practical, daily tools that allow people to optimize their mitochondrial health and promote long-term disease prevention.',
    videoUrl: 'https://www.youtube.com/watch?v=mlOQWxjDr-4'
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';
  console.log('Connecting to database:', uri);
  await mongoose.connect(uri);
  console.log('Database connected successfully.');

  try {
    console.log('Deleting existing founders database records...');
    await Founder.deleteMany({});
    
    console.log('Seeding sample founders...');
    const inserted = await Founder.insertMany(SAMPLE_FOUNDERS);
    console.log(`Seeding completed successfully! Seeded ${inserted.length} founders.`);
    process.exit(0);
  } catch (err: any) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

seed();
