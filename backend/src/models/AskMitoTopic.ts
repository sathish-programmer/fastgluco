import mongoose, { Schema, Document } from 'mongoose';

export interface IAskMitoTopic extends Document {
  title: string;
  category: string;
  keywords: string[];
  answer: string;
  suggestedPrompt: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AskMitoTopicSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, default: 'General' },
    keywords: [{ type: String, trim: true }],
    answer: { type: String, required: true, trim: true },
    suggestedPrompt: { type: String, required: true, trim: true },
    icon: { type: String, default: '💡', trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IAskMitoTopic>('AskMitoTopic', AskMitoTopicSchema);
