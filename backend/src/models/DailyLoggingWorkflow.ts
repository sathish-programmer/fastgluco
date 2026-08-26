import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowStep {
  stepId: string;
  title: string;
  questionPrompt: string;
  inputType: 'YES_NO' | 'OPTIONS' | 'NUMBER' | 'TEXT' | 'FILE';
  options?: string[];
  order: number;
  isEnabled: boolean;
}

export interface IDailyLoggingWorkflow extends Document {
  name: string;
  targetMode: 'STANDARD' | 'CANCER_PATIENT' | 'SECONDARY_PREVENTION' | 'ALL';
  isActive: boolean;
  steps: IWorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema: Schema = new Schema({
  stepId: { type: String, required: true },
  title: { type: String, required: true },
  questionPrompt: { type: String, required: true },
  inputType: {
    type: String,
    enum: ['YES_NO', 'OPTIONS', 'NUMBER', 'TEXT', 'FILE'],
    default: 'YES_NO'
  },
  options: [{ type: String }],
  order: { type: Number, required: true, default: 1 },
  isEnabled: { type: Boolean, default: true }
});

const DailyLoggingWorkflowSchema: Schema = new Schema({
  name: { type: String, required: true },
  targetMode: {
    type: String,
    enum: ['STANDARD', 'CANCER_PATIENT', 'SECONDARY_PREVENTION', 'ALL'],
    default: 'STANDARD'
  },
  isActive: { type: Boolean, default: true },
  steps: [WorkflowStepSchema]
}, { timestamps: true });

export default mongoose.model<IDailyLoggingWorkflow>('DailyLoggingWorkflow', DailyLoggingWorkflowSchema);
