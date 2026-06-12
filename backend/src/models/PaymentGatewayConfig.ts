import { Schema, model, Document } from 'mongoose';

export interface IPaymentGatewayConfig extends Document {
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  isSandbox: boolean;
  enablePayments: boolean;
  enableSubscriptions: boolean; // Subscription Required ON/OFF
  gstPercentage: number; // GST Percentage configured by admin (e.g. 18)
  safeGlucoseThreshold: number; // Safe limit (default 90)
  moderateGlucoseThreshold: number; // Moderate limit (default 110)
  aiSpikeThreshold: number; // AI triggers coaching above this
  aiQuestions: string[]; // Array of questions to ask sequentially
  aiCompletionMessage: string; // Final message when all answered
  updatedBy?: Schema.Types.ObjectId; // ref: AdminUser
  createdAt: Date;
  updatedAt: Date;
}

const paymentGatewayConfigSchema = new Schema<IPaymentGatewayConfig>(
  {
    razorpayKeyId: { type: String, trim: true },
    razorpayKeySecret: { type: String, trim: true },
    isSandbox: { type: Boolean, default: true, required: true },
    enablePayments: { type: Boolean, default: false, required: true },
    enableSubscriptions: { type: Boolean, default: false, required: true },
    gstPercentage: { type: Number, default: 18, min: 0, required: true },
    safeGlucoseThreshold: { type: Number, default: 90, required: true },
    moderateGlucoseThreshold: { type: Number, default: 110, required: true },
    aiSpikeThreshold: { type: Number, default: 110 },
    aiQuestions: { 
      type: [String], 
      default: ["You recently logged a food that spiked your glucose. Why did you consume this when it's advised to avoid it?", "Did you take a walk afterwards?"] 
    },
    aiCompletionMessage: { type: String, default: "Thank you for sharing this context. We have recorded your activity. Remember to stay hydrated and walk 15 mins after heavy meals!" },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true
  }
);

export const PaymentGatewayConfig = model<IPaymentGatewayConfig>('PaymentGatewayConfig', paymentGatewayConfigSchema);
