import mongoose from 'mongoose';

export interface IClient extends mongoose.Document {
  name: string;
  email: string;
  phone: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new mongoose.Schema<IClient>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema); 