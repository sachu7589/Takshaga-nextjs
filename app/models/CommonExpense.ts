import mongoose from 'mongoose';

export interface ICommonExpense extends mongoose.Document {
  userId: string;
  category: string;
  notes: string;
  amount: number;
  date: Date;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const commonExpenseSchema = new mongoose.Schema<ICommonExpense>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['rent', 'electricity', 'wifi', 'employee salary', 'traveling', 'others'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    addedBy: {
      type: String,
      required: [true, 'Added by is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CommonExpense || mongoose.model<ICommonExpense>('CommonExpense', commonExpenseSchema);

