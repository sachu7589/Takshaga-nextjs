import mongoose from 'mongoose';

export interface IBank extends mongoose.Document {
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
  upiId: string;
  createdAt: Date;
  updatedAt: Date;
}

const bankSchema = new mongoose.Schema<IBank>(
  {
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
    },
    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      trim: true,
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      trim: true,
      uppercase: true,
    },
    upiId: {
      type: String,
      required: [true, 'UPI ID is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Bank || mongoose.model<IBank>('Bank', bankSchema); 