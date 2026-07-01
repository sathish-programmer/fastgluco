import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowConfig extends Document {
  type: string; // e.g., 'SexualHealth'
  systemPrompt: string;
  firstMessage: string;
  whatsappNumber: string; // the doctor's contact number
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowConfigSchema: Schema = new Schema({
  type: { type: String, required: true, unique: true },
  systemPrompt: { type: String, required: true },
  firstMessage: { type: String, required: true },
  whatsappNumber: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IWorkflowConfig>('WorkflowConfig', WorkflowConfigSchema);
