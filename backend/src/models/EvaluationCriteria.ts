import mongoose, { Document, Schema } from 'mongoose';

export interface IEvaluationCriteria extends Document {
  name: string;
  description: string;
  max_score: number;
  weight: number;
  category: string;
  is_required: boolean;
  status: 'active' | 'inactive';
}

const evaluationCriteriaSchema = new Schema<IEvaluationCriteria>(
  {
    name: {
      type: String,
      required: [true, 'Kriter adı gereklidir'],
      trim: true,
      maxlength: [50, 'Kriter adı en fazla 50 karakter olmalıdır']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Açıklama en fazla 500 karakter olmalıdır']
    },
    max_score: {
      type: Number,
      required: [true, 'Maksimum puan gereklidir'],
      min: [1, 'Maksimum puan en az 1 olmalıdır'],
      max: [100, 'Maksimum puan en fazla 100 olmalıdır']
    },
    weight: {
      type: Number,
      required: [true, 'Ağırlık gereklidir'],
      min: [0, 'Ağırlık en az 0 olmalıdır'],
      max: [10, 'Ağırlık en fazla 10 olmalıdır'],
      default: 1
    },
    category: {
      type: String,
      required: [true, 'Kategori gereklidir'],
      trim: true
    },
    is_required: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Durum active veya inactive olmalıdır'
      },
      default: 'active'
    }
  },
  { timestamps: true }
);

// İndeksler
evaluationCriteriaSchema.index({ name: 1 });
evaluationCriteriaSchema.index({ category: 1 });
evaluationCriteriaSchema.index({ status: 1 });

export const EvaluationCriteria = mongoose.model<IEvaluationCriteria>(
  'EvaluationCriteria',
  evaluationCriteriaSchema
); 