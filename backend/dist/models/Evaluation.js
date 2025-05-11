"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evaluation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const evaluationDetailSchema = new mongoose_1.Schema({
    criteria_id: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const evaluationSchema = new mongoose_1.Schema({
    call: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Call',
        required: true
    },
    evaluator: {
        type: mongoose_1.Schema.Types.ObjectId,
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
evaluationSchema.statics.findByCallId = function (callId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.findOne({ call: callId })
            .populate('evaluator', 'full_name email')
            .populate('call')
            .exec();
    });
};
// Değerlendirici ID'sine göre değerlendirmeleri getir
evaluationSchema.statics.getEvaluationsByEvaluator = function (evaluatorId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({ evaluator: evaluatorId })
            .populate('call')
            .populate('evaluator', 'full_name email')
            .sort({ evaluation_date: -1 })
            .exec();
    });
};
// Çağrı görevlisi ID'sine göre değerlendirmeleri getir
evaluationSchema.statics.getAgentEvaluations = function (agentId) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    'callData.agent': new mongoose_1.default.Types.ObjectId(agentId)
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
    });
};
exports.Evaluation = mongoose_1.default.model('Evaluation', evaluationSchema);
