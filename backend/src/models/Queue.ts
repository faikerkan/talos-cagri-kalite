import mongoose, { Document, Schema } from 'mongoose';

export interface IQueue extends Document {
  name: string;
  description?: string;
}

const queueSchema = new Schema<IQueue>({
  name: { type: String, required: true, unique: true },
  description: { type: String }
});

export const Queue = mongoose.model<IQueue>('Queue', queueSchema); 