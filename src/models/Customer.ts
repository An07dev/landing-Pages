import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  phone: string;
  name: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  notes?: string;
  lastOrderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema<ICustomer>(
  {
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    totalOrders: {
      type: Number,
      default: 1,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: ['lead'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    lastOrderAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
