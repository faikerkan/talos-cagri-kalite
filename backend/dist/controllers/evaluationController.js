"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportEvaluationStats = exports.getEvaluationStats = exports.getEvaluationsByAgent = exports.getEvaluationsByEvaluator = exports.getMyEvaluations = exports.getEvaluationByCallId = exports.createEvaluation = void 0;
const Evaluation_1 = require("../models/Evaluation");
const Call_1 = require("../models/Call");
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const exceljs_1 = __importDefault(require("exceljs"));
// Yeni değerlendirme oluşturma
const createEvaluation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { call, evaluator, total_score, notes, details } = req.body;
        // Çağrıyı kontrol et
        const callExists = yield Call_1.Call.findById(call);
        if (!callExists) {
            return next(new errorHandler_1.ErrorResponse('Belirtilen çağrı bulunamadı', 404));
        }
        // Değerlendirici kontrolü
        if (evaluator !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'manager') {
            return next(new errorHandler_1.ErrorResponse('Başka bir kullanıcı adına değerlendirme yapamazsınız', 403));
        }
        // Çağrı zaten değerlendirilmiş mi?
        const existingEvaluation = yield Evaluation_1.Evaluation.findOne({ call });
        if (existingEvaluation) {
            return next(new errorHandler_1.ErrorResponse('Bu çağrı zaten değerlendirilmiş', 400));
        }
        // Yeni değerlendirme oluştur
        const evaluation = new Evaluation_1.Evaluation({
            call,
            evaluator,
            total_score,
            notes,
            details,
            evaluation_date: new Date()
        });
        // Kaydet
        yield evaluation.save();
        // Çağrı durumunu güncelle
        yield Call_1.Call.findByIdAndUpdate(call, { status: 'evaluated' });
        // Düşük puan bildirimi kontrolü
        if (total_score < 70) {
            yield checkLowScore(evaluation);
        }
        res.status(201).json({
            success: true,
            data: evaluation
        });
    }
    catch (error) {
        logger_1.default.error('Değerlendirme oluşturma hatası:', error);
        next(error);
    }
});
exports.createEvaluation = createEvaluation;
// Değerlendirmeyi çağrı ID'sine göre getir
const getEvaluationByCallId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { callId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(callId)) {
            return next(new errorHandler_1.ErrorResponse('Geçersiz çağrı ID formatı', 400));
        }
        const evaluation = yield Evaluation_1.Evaluation.findOne({ call: callId })
            .populate('evaluator', 'full_name email')
            .populate('call')
            .populate('details.criteria_id');
        if (!evaluation) {
            return next(new errorHandler_1.ErrorResponse('Değerlendirme bulunamadı', 404));
        }
        res.status(200).json({
            success: true,
            data: evaluation
        });
    }
    catch (error) {
        logger_1.default.error('Değerlendirme getirme hatası:', error);
        next(error);
    }
});
exports.getEvaluationByCallId = getEvaluationByCallId;
// Kullanıcının değerlendirmelerini getirme
const getMyEvaluations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return next(new errorHandler_1.ErrorResponse('Kullanıcı bilgisi bulunamadı', 401));
        }
        let evaluations;
        if (userRole === 'agent') {
            // Müşteri temsilcisinin değerlendirmelerini getir
            evaluations = yield Evaluation_1.Evaluation.getAgentEvaluations(userId);
        }
        else if (userRole === 'quality_expert' || userRole === 'manager') {
            // Kalite uzmanının yaptığı değerlendirmeleri getir
            evaluations = yield Evaluation_1.Evaluation.getEvaluationsByEvaluator(userId);
        }
        else {
            return next(new errorHandler_1.ErrorResponse('Bu işlem için yetkiniz yok', 403));
        }
        res.status(200).json({
            success: true,
            count: evaluations.length,
            data: evaluations
        });
    }
    catch (error) {
        logger_1.default.error('Değerlendirme getirme hatası:', error);
        next(error);
    }
});
exports.getMyEvaluations = getMyEvaluations;
// Değerlendirmeleri değerlendiriciye göre getirme
const getEvaluationsByEvaluator = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { evaluatorId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(evaluatorId)) {
            return next(new errorHandler_1.ErrorResponse('Geçersiz değerlendirici ID formatı', 400));
        }
        // Değerlendirici var mı kontrol et
        const evaluator = yield User_1.User.findById(evaluatorId);
        if (!evaluator) {
            return next(new errorHandler_1.ErrorResponse('Belirtilen değerlendirici bulunamadı', 404));
        }
        // Manager değilse, sadece kendi değerlendirmelerini görebilir
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== evaluatorId) {
            return next(new errorHandler_1.ErrorResponse('Başka bir kullanıcının değerlendirmelerini görme yetkiniz yok', 403));
        }
        const evaluations = yield Evaluation_1.Evaluation.find({ evaluator: evaluatorId })
            .populate('call')
            .populate('evaluator', 'full_name email')
            .sort({ evaluation_date: -1 });
        res.status(200).json({
            success: true,
            count: evaluations.length,
            data: evaluations
        });
    }
    catch (error) {
        logger_1.default.error('Değerlendirme getirme hatası:', error);
        next(error);
    }
});
exports.getEvaluationsByEvaluator = getEvaluationsByEvaluator;
// Değerlendirmeleri çağrı görevlisine göre getirme
const getEvaluationsByAgent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { agentId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(agentId)) {
            return next(new errorHandler_1.ErrorResponse('Geçersiz çağrı görevlisi ID formatı', 400));
        }
        // Çağrı görevlisi var mı kontrol et
        const agent = yield User_1.User.findById(agentId);
        if (!agent) {
            return next(new errorHandler_1.ErrorResponse('Belirtilen çağrı görevlisi bulunamadı', 404));
        }
        // Agent rolündeki kullanıcı sadece kendi değerlendirmelerini görebilir
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'agent' && req.user.id !== agentId) {
            return next(new errorHandler_1.ErrorResponse('Başka bir çağrı görevlisinin değerlendirmelerini görme yetkiniz yok', 403));
        }
        const evaluations = yield Evaluation_1.Evaluation.getAgentEvaluations(agentId);
        res.status(200).json({
            success: true,
            count: evaluations.length,
            data: evaluations
        });
    }
    catch (error) {
        logger_1.default.error('Değerlendirme getirme hatası:', error);
        next(error);
    }
});
exports.getEvaluationsByAgent = getEvaluationsByAgent;
// Değerlendirme istatistiklerini getirme
const getEvaluationStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate, agentId, evaluatorId, minScore, maxScore } = req.query;
        // Filtre objesi oluştur
        const filter = {};
        // Tarih filtresini ekle
        if (startDate || endDate) {
            filter.evaluation_date = {};
            if (startDate) {
                filter.evaluation_date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.evaluation_date.$lte = new Date(endDate);
            }
        }
        // Puan filtresini ekle
        if (minScore || maxScore) {
            filter.total_score = {};
            if (minScore) {
                filter.total_score.$gte = parseInt(minScore);
            }
            if (maxScore) {
                filter.total_score.$lte = parseInt(maxScore);
            }
        }
        // Çağrı görevlisi filtresi için aggregate pipeline oluştur
        const pipeline = [];
        // Ana sorgu
        pipeline.push({ $match: filter });
        // Çağrı ile join
        pipeline.push({
            $lookup: {
                from: 'calls',
                localField: 'call',
                foreignField: '_id',
                as: 'callData'
            }
        });
        pipeline.push({ $unwind: '$callData' });
        // Çağrı görevlisi filtresi
        if (agentId && mongoose_1.default.Types.ObjectId.isValid(agentId)) {
            pipeline.push({
                $match: {
                    'callData.agent': new mongoose_1.default.Types.ObjectId(agentId)
                }
            });
        }
        // Değerlendirici filtresi
        if (evaluatorId && mongoose_1.default.Types.ObjectId.isValid(evaluatorId)) {
            pipeline.push({
                $match: {
                    evaluator: new mongoose_1.default.Types.ObjectId(evaluatorId)
                }
            });
        }
        // İstatistik hesaplama
        pipeline.push({
            $group: {
                _id: null,
                count: { $sum: 1 },
                averageScore: { $avg: '$total_score' },
                minScore: { $min: '$total_score' },
                maxScore: { $max: '$total_score' },
                evaluations: { $push: '$$ROOT' }
            }
        });
        // İstatistikleri al
        const stats = yield Evaluation_1.Evaluation.aggregate(pipeline);
        const result = stats.length > 0 ? {
            count: stats[0].count,
            averageScore: parseFloat(stats[0].averageScore.toFixed(2)),
            minScore: stats[0].minScore,
            maxScore: stats[0].maxScore,
            evaluations: stats[0].evaluations.slice(0, 100) // Performans için ilk 100 değerlendirmeyi gönder
        } : {
            count: 0,
            averageScore: 0,
            minScore: 0,
            maxScore: 0,
            evaluations: []
        };
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Değerlendirme istatistikleri hatası:', error);
        next(error);
    }
});
exports.getEvaluationStats = getEvaluationStats;
// Değerlendirme istatistiklerini Excel olarak dışa aktarma
const exportEvaluationStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate, agentId, evaluatorId, minScore, maxScore } = req.query;
        // Filtre objesi oluştur
        const filter = {};
        // Tarih filtresini ekle
        if (startDate || endDate) {
            filter.evaluation_date = {};
            if (startDate) {
                filter.evaluation_date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.evaluation_date.$lte = new Date(endDate);
            }
        }
        // Puan filtresini ekle
        if (minScore || maxScore) {
            filter.total_score = {};
            if (minScore) {
                filter.total_score.$gte = parseInt(minScore);
            }
            if (maxScore) {
                filter.total_score.$lte = parseInt(maxScore);
            }
        }
        // Değerlendirmeleri getir
        let query = Evaluation_1.Evaluation.find(filter)
            .populate('evaluator', 'full_name email')
            .populate({
            path: 'call',
            populate: {
                path: 'agent',
                select: 'full_name'
            }
        })
            .sort('-evaluation_date');
        // Değerlendirici filtresi
        if (evaluatorId && mongoose_1.default.Types.ObjectId.isValid(evaluatorId)) {
            query = query.find({ evaluator: evaluatorId });
        }
        const evaluations = yield query.exec();
        // Excel dosyasını oluştur
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Değerlendirmeler');
        // Sütun başlıklarını tanımla
        worksheet.columns = [
            { header: 'Değerlendirme Tarihi', key: 'date', width: 20 },
            { header: 'Çağrı Görevlisi', key: 'agent', width: 25 },
            { header: 'Değerlendirici', key: 'evaluator', width: 25 },
            { header: 'Toplam Puan', key: 'score', width: 15 },
            { header: 'Notlar', key: 'notes', width: 40 }
        ];
        // Verileri ekle
        evaluations.forEach(eval => {
            var _a, _b, _c;
            worksheet.addRow({
                date: eval.evaluation_date.toLocaleDateString('tr-TR'),
                agent: ((_b = (_a = eval.call) === null || _a === void 0 ? void 0 : _a.agent) === null || _b === void 0 ? void 0 : _b.full_name) || 'Bilinmiyor',
                evaluator: ((_c = eval.evaluator) === null || _c === void 0 ? void 0 : _c.full_name) || 'Bilinmiyor',
                score: eval.total_score,
                notes: eval.notes || ''
            });
        });
        // Başlık satırını formatla
        worksheet.getRow(1).font = { bold: true };
        // Excel dosyasını oluştur
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=degerlendirmeler.xlsx');
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        logger_1.default.error('Excel dışa aktarma hatası:', error);
        next(error);
    }
});
exports.exportEvaluationStats = exportEvaluationStats;
// Düşük puanlı değerlendirmeler için bildirim kontrol fonksiyonu
const checkLowScore = (evaluation) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (evaluation.total_score < 70) {
            // Bildirim mantığı burada uygulanır
            logger_1.default.info(`Düşük puanlı değerlendirme bildirimi - Puan: ${evaluation.total_score}, Değerlendirme ID: ${evaluation._id}`);
        }
    }
    catch (error) {
        logger_1.default.error('Düşük puan bildirimi hatası:', error);
    }
});
