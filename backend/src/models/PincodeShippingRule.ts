import mongoose, { Schema, Document } from 'mongoose';

export interface IDistanceRange {
  minDistanceKm: number;
  maxDistanceKm: number;
  shippingCharge: number;
  estimatedDeliveryTime: string; // e.g. "Same Day (2-4 hrs)", "24-48 Hours", "2-3 Days"
  isDefaultRange?: boolean;
}

export interface IPincodeShippingRule extends Document {
  pincode: string; // e.g. "560001"
  localityName: string; // e.g. "Indiranagar, Bangalore"
  city: string; // e.g. "Bangalore"
  state: string; // e.g. "Karnataka"
  isServiceable: boolean;
  pincodeCenterLat?: number;
  pincodeCenterLon?: number;
  baseShippingFee?: number; // Optional override
  distanceRanges: IDistanceRange[];
  createdAt: Date;
  updatedAt: Date;
}

const DistanceRangeSchema = new Schema<IDistanceRange>({
  minDistanceKm: { type: Number, required: true, default: 0 },
  maxDistanceKm: { type: Number, required: true, default: 5 },
  shippingCharge: { type: Number, required: true, default: 40 },
  estimatedDeliveryTime: { type: String, required: true, default: 'Same Day Delivery' },
  isDefaultRange: { type: Boolean, default: false }
});

const PincodeShippingRuleSchema = new Schema<IPincodeShippingRule>(
  {
    pincode: { type: String, required: true, unique: true, index: true, trim: true },
    localityName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, default: 'India' },
    state: { type: String, required: true, trim: true, default: 'India' },
    isServiceable: { type: Boolean, default: true },
    pincodeCenterLat: { type: Number, default: 12.9716 },
    pincodeCenterLon: { type: Number, default: 77.5946 },
    baseShippingFee: { type: Number },
    distanceRanges: [DistanceRangeSchema]
  },
  { timestamps: true }
);

export const PincodeShippingRule = mongoose.model<IPincodeShippingRule>(
  'PincodeShippingRule',
  PincodeShippingRuleSchema
);
