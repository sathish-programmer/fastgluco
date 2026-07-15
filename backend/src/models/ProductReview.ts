import mongoose, { Schema, Document } from 'mongoose';

export interface IProductReview extends Document {
  productId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  patientName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ProductReviewSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'ShopProduct', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'ShopOrder', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }
}, { timestamps: true });

export default mongoose.model<IProductReview>('ProductReview', ProductReviewSchema);
