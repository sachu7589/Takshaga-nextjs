import mongoose from 'mongoose';

export type CertificateType = 'experience' | 'internship';
export type ValidityType = 'lifelong' | 'date';
export type CertificateStatus = 'active' | 'disabled';

export interface ICertificate extends mongoose.Document {
  certId: string;
  certificateType: CertificateType;
  fromDate: Date;
  toDate: Date;
  validityType: ValidityType;
  validityDate?: Date | null;
  name: string;
  jobDesignation: string;
  content: string;
  status: CertificateStatus;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new mongoose.Schema<ICertificate>(
  {
    certId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    certificateType: {
      type: String,
      enum: ['experience', 'internship'],
      required: [true, 'Certificate type is required'],
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required'],
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
    },
    validityType: {
      type: String,
      enum: ['lifelong', 'date'],
      required: [true, 'Validity type is required'],
    },
    validityDate: {
      type: Date,
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    jobDesignation: {
      type: String,
      required: [true, 'Job designation is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [1000, 'Content cannot exceed 1000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default (mongoose.models.Certificate as mongoose.Model<ICertificate>) ||
  mongoose.model<ICertificate>('Certificate', certificateSchema);
