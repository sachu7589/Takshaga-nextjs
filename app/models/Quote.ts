import mongoose from 'mongoose';

export interface IQuote extends mongoose.Document {
  name: string;
  phone: string;
  request_call: boolean;
  service_interest: string;
  sq_feet: number;
  package: string;
  additional_info?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quoteSchema = new mongoose.Schema<IQuote>(
  {
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    request_call: {
      type: Boolean,
      default: false,
    },
    service_interest: {
      type: String,
      trim: true,
    },
    sq_feet: {
      type: Number,
    },
    package: {
      type: String,
      trim: true,
    },
    additional_info: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Quote || mongoose.model<IQuote>('Quote', quoteSchema); 