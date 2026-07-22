import mongoose from 'mongoose';

export interface IPaymentStage {
  stage: string;
  amount: number;
}

export interface IWorkDetailPoint {
  id: string;
  text: string;
  isCustom?: boolean;
}

export interface IWorkDetailSection {
  id: string;
  number: number;
  title: string;
  points: IWorkDetailPoint[];
  isCustom?: boolean;
}

export interface IProjectCostItem {
  id: string;
  name: string;
  type: 'per_sqft' | 'fixed';
  rate?: number;
  sqFeet?: number;
  fixedAmount?: number;
  totalAmount: number;
}

export interface IProjectCostRow {
  id: string;
  name: string;
  type: 'per_sqft' | 'fixed';
  rate?: number;
  fixedAmount?: number;
  itemSqFeet?: number;
  isCore?: 'construction' | 'interior';
}

export interface IGeneralEstimate extends mongoose.Document {
  userId: string;
  clientId: string;
  estimateName: string;
  estimateType: string;
  sqFeet?: number;
  constructionCostPerSqFt?: number;
  interiorCostType?: 'per_sqft' | 'fixed';
  interiorCostPerSqFt?: number;
  interiorFixedCost?: number;
  projectCustomItems?: IProjectCostItem[];
  projectCostRows?: IProjectCostRow[];
  paymentStages?: IPaymentStage[];
  workDetails?: IWorkDetailSection[];
  additionalWorks?: Array<{ id: string; text: string; isCustom?: boolean }>;
  materialsUsed?: Array<{ id: string; material: string; details: string; isCustom?: boolean }>;
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
    sqFeet: {
      type: Number,
      default: 0,
    },
    constructionCostPerSqFt: {
      type: Number,
      default: 0,
    },
    interiorCostType: {
      type: String,
      enum: ['per_sqft', 'fixed'],
      default: 'per_sqft',
    },
    interiorCostPerSqFt: {
      type: Number,
      default: 0,
    },
    interiorFixedCost: {
      type: Number,
      default: 0,
    },
    projectCustomItems: {
      type: [
        {
          id: String,
          name: String,
          type: { type: String, enum: ['per_sqft', 'fixed'] },
          rate: Number,
          sqFeet: Number,
          fixedAmount: Number,
          totalAmount: Number,
        },
      ],
      default: [],
    },
    projectCostRows: {
      type: [
        {
          id: String,
          name: String,
          type: { type: String, enum: ['per_sqft', 'fixed'] },
          rate: Number,
          fixedAmount: Number,
          itemSqFeet: Number,
          isCore: { type: String, enum: ['construction', 'interior'] },
        },
      ],
      default: [],
    },
    paymentStages: {
      type: [
        {
          stage: String,
          amount: Number,
        }
      ],
      default: [],
    },
    workDetails: {
      type: [
        {
          id: String,
          number: Number,
          title: String,
          isCustom: Boolean,
          points: [
            {
              id: String,
              text: String,
              isCustom: Boolean,
            },
          ],
        },
      ],
      default: [],
    },
    additionalWorks: {
      type: [
        {
          id: String,
          text: String,
          isCustom: Boolean,
        },
      ],
      default: [],
    },
    materialsUsed: {
      type: [
        {
          id: String,
          material: String,
          details: String,
          isCustom: Boolean,
        },
      ],
      default: [],
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

// In dev, drop cached model so hot-reload picks up new schema paths
if (process.env.NODE_ENV !== "production" && mongoose.models.GeneralEstimate) {
  delete mongoose.models.GeneralEstimate;
}

export default (
  mongoose.models.GeneralEstimate ||
  mongoose.model<IGeneralEstimate>("GeneralEstimate", generalEstimateSchema)
) as mongoose.Model<IGeneralEstimate>;

