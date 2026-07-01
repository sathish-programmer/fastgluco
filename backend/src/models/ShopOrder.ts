import mongoose, { Schema, Document } from 'mongoose';

export interface IShopOrder extends Document {
  userId: mongoose.Types.ObjectId;
  products: {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    qty: number;
  }[];
  totalAmount: number;
  gstAmount: number;
  discountAmount: number;
  couponCode?: string;
  currency: 'INR' | 'USD';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const ShopOrderSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'ShopProduct', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  gstAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model<IShopOrder>('ShopOrder', ShopOrderSchema);
