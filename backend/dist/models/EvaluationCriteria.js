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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationCriteria = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const evaluationCriteriaSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// İndeksler
evaluationCriteriaSchema.index({ name: 1 });
evaluationCriteriaSchema.index({ category: 1 });
evaluationCriteriaSchema.index({ status: 1 });
exports.EvaluationCriteria = mongoose_1.default.model('EvaluationCriteria', evaluationCriteriaSchema);
