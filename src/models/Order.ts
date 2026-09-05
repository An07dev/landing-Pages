import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId?: string;
  productName: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string;
  total: number;
}

export interface IOrder extends Document {
  orderCode: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    district?: string;
    ward?: string;
  };
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'vietqr' | 'cod' | 'bank_transfer' | 'momo' | 'other';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingStatus: 'pending' | 'picking' | 'delivering' | 'delivered' | 'cancelled';
  shippingCarrier?: 'ghn' | 'ghtk' | 'viettel_post' | 'manual';
  trackingCode?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String },
    productName: { type: String, required: true },
    variant: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String, default: '' },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema<IOrder>(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true, index: true },
      email: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      ward: { type: String, trim: true, default: '' },
    },
    items: {
      type: [OrderItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['vietqr', 'cod', 'bank_transfer', 'momo', 'other'],
      default: 'vietqr',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    shippingStatus: {
      type: String,
      enum: ['pending', 'picking', 'delivering', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    shippingCarrier: {
      type: String,
      enum: ['ghn', 'ghtk', 'viettel_post', 'manual'],
      default: 'manual',
    },
    trackingCode: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
