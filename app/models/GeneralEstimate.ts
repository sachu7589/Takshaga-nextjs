import mongoose from 'mongoose';

export interface IGeneralEstimate extends mongoose.Document {
  userId: string;
  clientId: string;
  estimateName: string;
  estimateType: string;
  items: Array<{
    id: string;
    particulars: string;
    amountPerSqFt: number;
    sqFeet: number;
    totalAmount: number;
  }>;
  totalAmount: number;
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  status: 'pending' | 'approved' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const generalEstimateSchema = new mongoose.Schema<IGeneralEstimate>(
  {
    userId: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    estimateName: {
      type: String,
      required: true,
      trim: true,
    },
    estimateType: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [
        {
          id: String,
          particulars: String,
          amountPerSqFt: Number,
          sqFeet: Number,
          totalAmount: Number,
        }
      ],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.GeneralEstimate || mongoose.model<IGeneralEstimate>('GeneralEstimate', generalEstimateSchema);

