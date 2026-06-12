import { Schema, model, Document } from 'mongoose';

export interface ILegalDocument extends Document {
  type: 'PrivacyPolicy' | 'TermsOfService';
  content: string;
  updatedAt: Date;
}

const legalDocumentSchema = new Schema<ILegalDocument>(
  {
    type: { 
      type: String, 
      enum: ['PrivacyPolicy', 'TermsOfService'], 
      required: true, 
      unique: true 
    },
    content: { 
      type: String, 
      required: true 
    }
  },
  {
    timestamps: true
  }
);

export const LegalDocument = model<ILegalDocument>('LegalDocument', legalDocumentSchema);
