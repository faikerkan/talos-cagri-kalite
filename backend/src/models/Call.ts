import mongoose, { Document, Schema } from 'mongoose';

export interface ICall extends Document {
  queue: mongoose.Types.ObjectId;
  agent: mongoose.Types.ObjectId;
  customer_number: string;
  duration: string;
  date: Date;
  status: 'pending' | 'evaluated' | 'archived';
  type: 'inbound' | 'outbound' | 'transfer';
  notes?: string;
}

const callSchema = new Schema<ICall>(
  {
    queue: { type: Schema.Types.ObjectId, ref: 'Queue', required: true },
    agent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer_number: { type: String, required: true },
    duration: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ['pending', 'evaluated', 'archived'], default: 'pending' },
    type: { type: String, enum: ['inbound', 'outbound', 'transfer'], default: 'inbound' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Call = mongoose.model<ICall>('Call', callSchema); 