import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB successfully connected.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
