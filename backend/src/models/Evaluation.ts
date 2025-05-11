import mongoose, { Document, Schema } from 'mongoose';

export interface IEvaluationDetail {
  criteria_id: mongoose.Types.ObjectId;
  criteria_name?: string;
  max_score?: number;
  score: number;
  notes?: string;
  penalty_type?: 'none' | 'half' | 'zero';
}

export interface IEvaluation extends Document {
  call: mongoose.Types.ObjectId;
  evaluator: mongoose.Types.ObjectId;
  total_score: number;
  details: IEvaluationDetail[];
  notes?: string;
  evaluation_date: Date;
}

const evaluationDetailSchema = new Schema<IEvaluationDetail>({
  criteria_id: { 
    type: Schema.Types.ObjectId,
    ref: 'EvaluationCriteria',
    required: true 
  },
  score: { 
    type: Number, 
    required: true 
  },
  notes: { 
    type: String 
  },
  penalty_type: { 
    type: String, 
    enum: ['none', 'half', 'zero'], 
    default: 'none' 
  }
}, { _id: true });

const evaluationSchema = new Schema<IEvaluation>({
  call: { 
    type: Schema.Types.ObjectId, 
    ref: 'Call', 
    required: true 
  },
  evaluator: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  total_score: { 
    type: Number, 
    required: true 
  },
  notes: { 
    type: String 
  },
  details: [evaluationDetailSchema],
  evaluation_date: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// MongoDB'deki çağrı ID'sine göre değerlendirme bul
evaluationSchema.statics.findByCallId = async function(callId: mongoose.Types.ObjectId) {
  return this.findOne({ call: callId })
    .populate('evaluator', 'full_name email')
    .populate('call')
    .exec();
};

// Değerlendirici ID'sine göre değerlendirmeleri getir
evaluationSchema.statics.getEvaluationsByEvaluator = async function(evaluatorId: mongoose.Types.ObjectId) {
  return this.find({ evaluator: evaluatorId })
    .populate('call')
    .populate('evaluator', 'full_name email')
    .sort({ evaluation_date: -1 })
    .exec();
};

// Çağrı görevlisi ID'sine göre değerlendirmeleri getir
evaluationSchema.statics.getAgentEvaluations = async function(agentId: mongoose.Types.ObjectId) {
  return this.aggregate([
    {
      $lookup: {
        from: 'calls',
        localField: 'call',
        foreignField: '_id',
        as: 'callData'
      }
    },
    {
      $unwind: '$callData'
    },
    {
      $match: {
        'callData.agent': new mongoose.Types.ObjectId(agentId)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'evaluator',
        foreignField: '_id',
        as: 'evaluatorData'
      }
    },
    {
      $unwind: '$evaluatorData'
    },
    {
      $project: {
        _id: 1,
        call: 1,
        evaluator: 1,
        total_score: 1,
        details: 1,
        notes: 1,
        evaluation_date: 1,
        createdAt: 1,
        updatedAt: 1,
        'evaluatorData.full_name': 1,
        'callData.customer_number': 1,
        'callData.duration': 1
      }
    },
    {
      $sort: { evaluation_date: -1 }
    }
  ]);
};

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', evaluationSchema); 