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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAutoEvaluation = exports.getTrendData = exports.exportEvaluationStats = exports.getEvaluationStats = exports.getEvaluationDetail = exports.getEvaluationsByAgent = exports.getEvaluationsByEvaluator = exports.getMyEvaluations = exports.getEvaluationByCallId = exports.createEvaluation = void 0;
const Evaluation_1 = require("../models/Evaluation");
const database_1 = require("../config/database");
const aiService_1 = require("../services/aiService");
const notificationService_1 = require("../services/notificationService");
// Yeni değerlendirme oluşturma
const createEvaluation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { call_id, total_score, notes, status, details } = req.body;
        if (!call_id || !details || !Array.isArray(details)) {
            return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }
        // Değerlendirmeyi yapan kullanıcının ID'sini alıyoruz
        const evaluatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!evaluatorId) {
            return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı' });
        }
        // Değerlendirme nesnesini oluştur
        const evaluation = {
            call_id: parseInt(call_id),
            evaluator_id: parseInt(evaluatorId),
            total_score,
            notes,
            evaluation_date: new Date()
        };
        // Detay nesnelerini hazırla
        const evaluationDetails = details.map((detail) => {
            let score = detail.score;
            if (detail.penalty_type === 'half') {
                score = score / 2;
            }
            else if (detail.penalty_type === 'zero') {
                score = 0;
            }
            return {
                evaluation_id: 0, // Bu değer createEvaluation'da otomatik atanacak
                criteria_id: detail.criteria_id,
                score,
                notes: detail.notes || '',
                penalty_type: detail.penalty_type || 'none'
            };
        });
        // Veritabanına kaydet
        const result = yield Evaluation_1.EvaluationModel.create(evaluation, evaluationDetails);
        // Çağrı durumunu güncelle
        yield database_1.pool.query('UPDATE calls SET status = $1 WHERE id = $2', ['evaluated', call_id]);
        // Düşük puan bildirimi kontrolü
        if (result.id) {
            yield notificationService_1.NotificationService.checkLowScore(result.id);
        }
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Değerlendirme oluşturma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.createEvaluation = createEvaluation;
// Bir çağrının değerlendirmesini alma
const getEvaluationByCallId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { callId } = req.params;
        if (!callId) {
            return res.status(400).json({ error: 'Çağrı ID parametresi gereklidir' });
        }
        const evaluation = yield Evaluation_1.EvaluationModel.findByCallId(parseInt(callId));
        if (!evaluation) {
            return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
        }
        // Değerlendirme detaylarını al
        const details = yield Evaluation_1.EvaluationModel.getEvaluationDetails(evaluation.id);
        res.json(Object.assign(Object.assign({}, evaluation), { details }));
    }
    catch (error) {
        console.error('Değerlendirme getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getEvaluationByCallId = getEvaluationByCallId;
// Kullanıcının kendi değerlendirmelerini getirme (Müşteri temsilcisi için)
const getMyEvaluations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı' });
        }
        // Kullanıcı rolüne göre değerlendirmeleri getir
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (userRole === 'agent') {
            // Müşteri temsilcisiyse, kendisine yapılan değerlendirmeleri getir
            const evaluations = yield Evaluation_1.EvaluationModel.getAgentEvaluations(parseInt(userId));
            res.json(evaluations);
        }
        else if (userRole === 'quality_expert') {
            // Kalite uzmanıysa, kendi yaptığı değerlendirmeleri getir
            const evaluations = yield Evaluation_1.EvaluationModel.getEvaluationsByEvaluator(parseInt(userId));
            res.json(evaluations);
        }
        else {
            res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }
    }
    catch (error) {
        console.error('Değerlendirme getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getMyEvaluations = getMyEvaluations;
// Değerlendirmeleri kalite uzmanına göre getirme
const getEvaluationsByEvaluator = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const evaluatorId = req.query.evaluatorId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!evaluatorId) {
            return res.status(400).json({ error: 'Değerlendirici ID parametresi gereklidir' });
        }
        const evaluations = yield Evaluation_1.EvaluationModel.getEvaluationsByEvaluator(parseInt(evaluatorId.toString()));
        res.json(evaluations);
    }
    catch (error) {
        console.error('Değerlendirme getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getEvaluationsByEvaluator = getEvaluationsByEvaluator;
// Değerlendirmeleri müşteri temsilcisine göre getirme
const getEvaluationsByAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { agentId } = req.params;
        if (!agentId) {
            return res.status(400).json({ error: 'Temsilci ID parametresi gereklidir' });
        }
        // Kendi değerlendirmelerini görüntüleyen bir temsilciyse, yalnızca kendi ID'sini kullanmasına izin ver
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'agent' && req.user.id !== agentId) {
            return res.status(403).json({ error: 'Yalnızca kendi değerlendirmelerinizi görüntüleyebilirsiniz' });
        }
        const evaluations = yield Evaluation_1.EvaluationModel.getAgentEvaluations(parseInt(agentId));
        res.json(evaluations);
    }
    catch (error) {
        console.error('Değerlendirme getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getEvaluationsByAgent = getEvaluationsByAgent;
// Tek bir değerlendirmenin detaylarını getirme
const getEvaluationDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Değerlendirme ID parametresi gereklidir' });
        }
        // Değerlendirmeyi getir
        const query = `
      SELECT e.*, c.customer_phone, c.call_duration, 
             a.full_name as agent_name, ev.full_name as evaluator_name
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users a ON c.agent_id = a.id
      JOIN users ev ON e.evaluator_id = ev.id
      WHERE e.id = $1
    `;
        const evaluationResult = yield database_1.pool.query(query, [id]);
        if (evaluationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
        }
        const evaluation = evaluationResult.rows[0];
        // Değerlendirme detaylarını getir
        const details = yield Evaluation_1.EvaluationModel.getEvaluationDetails(parseInt(id));
        res.json(Object.assign(Object.assign({}, evaluation), { details }));
    }
    catch (error) {
        console.error('Değerlendirme detayı getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getEvaluationDetail = getEvaluationDetail;
// Değerlendirme istatistiklerini getirme
const getEvaluationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Tarih aralığı filtreleri
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const agentId = req.query.agentId || '';
        const evaluatorId = req.query.evaluatorId || '';
        const minScore = req.query.minScore || '';
        const maxScore = req.query.maxScore || '';
        let whereConditions = [];
        const params = [];
        let paramIndex = 1;
        // Filtre koşullarını oluştur
        if (startDate) {
            whereConditions.push(`e.evaluation_date >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            whereConditions.push(`e.evaluation_date <= $${paramIndex}`);
            params.push(endDate);
            paramIndex++;
        }
        if (agentId) {
            whereConditions.push(`c.agent_id = $${paramIndex}`);
            params.push(agentId);
            paramIndex++;
        }
        if (evaluatorId) {
            whereConditions.push(`e.evaluator_id = $${paramIndex}`);
            params.push(evaluatorId);
            paramIndex++;
        }
        if (minScore) {
            whereConditions.push(`e.total_score >= $${paramIndex}`);
            params.push(minScore);
            paramIndex++;
        }
        if (maxScore) {
            whereConditions.push(`e.total_score <= $${paramIndex}`);
            params.push(maxScore);
            paramIndex++;
        }
        const whereClause = whereConditions.length
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        // Genel istatistikler
        const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_evaluations,
        AVG(total_score) as average_score,
        MAX(total_score) as highest_score,
        MIN(total_score) as lowest_score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      ${whereClause}
    `;
        const generalStatsResult = yield database_1.pool.query(generalStatsQuery, params);
        // Temsilcilere göre ortalama puanlar
        const agentStatsQuery = `
      SELECT 
        a.id as agent_id,
        a.full_name as agent_name,
        COUNT(e.id) as evaluation_count,
        AVG(e.total_score) as average_score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users a ON c.agent_id = a.id
      ${whereClause}
      GROUP BY a.id, a.full_name
      ORDER BY average_score DESC
    `;
        const agentStatsResult = yield database_1.pool.query(agentStatsQuery, params);
        // Kriterlere göre ortalama puanlar ve penalty istatistikleri
        const criteriaStatsQuery = `
      SELECT 
        ec.id as criteria_id,
        ec.name as criteria_name,
        AVG(ed.score) as average_score,
        (AVG(ed.score) / ec.max_score * 100) as percentage,
        COUNT(*) FILTER (WHERE ed.penalty_type != 'none') as penalty_count,
        (COUNT(*) FILTER (WHERE ed.penalty_type != 'none')::float / COUNT(*)) as penalty_ratio
      FROM evaluation_details ed
      JOIN evaluations e ON ed.evaluation_id = e.id
      JOIN evaluation_criteria ec ON ed.criteria_id = ec.id
      JOIN calls c ON e.call_id = c.id
      ${whereClause}
      GROUP BY ec.id, ec.name, ec.max_score
      ORDER BY criteria_id
    `;
        const criteriaStatsResult = yield database_1.pool.query(criteriaStatsQuery, params);
        // Değerlendirme listesi (ilk 100)
        const evaluationsQuery = `
      SELECT 
        e.id,
        e.evaluation_date as date,
        a.full_name as agent_name,
        c.id as call_ref,
        ev.full_name as evaluator_name,
        e.total_score as score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users a ON c.agent_id = a.id
      JOIN users ev ON e.evaluator_id = ev.id
      ${whereClause}
      ORDER BY e.evaluation_date DESC
      LIMIT 100
    `;
        const evaluationsResult = yield database_1.pool.query(evaluationsQuery, params);
        // Genel penalty istatistikleri
        const penaltyCount = criteriaStatsResult.rows.reduce((acc, c) => acc + Number(c.penalty_count), 0);
        const penaltyRatio = criteriaStatsResult.rows.length > 0 ?
            (criteriaStatsResult.rows.reduce((acc, c) => acc + Number(c.penalty_count), 0) /
                criteriaStatsResult.rows.reduce((acc, c) => acc + Number(c.penalty_count) / (Number(c.penalty_ratio) || 1), 0)) : 0;
        res.json({
            general: Object.assign(Object.assign({}, generalStatsResult.rows[0]), { penalty_count: penaltyCount, penalty_ratio: penaltyRatio }),
            agents: agentStatsResult.rows || [],
            criteria: criteriaStatsResult.rows || [],
            evaluations: evaluationsResult.rows || []
        });
    }
    catch (error) {
        console.error('İstatistik getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getEvaluationStats = getEvaluationStats;
// Penalty istatistiklerini Excel olarak export eden endpoint
const exportEvaluationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Aynı filtreleri kullan
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = 'WHERE e.evaluation_date BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }
        else if (startDate) {
            dateFilter = 'WHERE e.evaluation_date >= $1';
            params.push(startDate);
        }
        else if (endDate) {
            dateFilter = 'WHERE e.evaluation_date <= $1';
            params.push(endDate);
        }
        // Genel istatistikler
        const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_evaluations,
        AVG(total_score) as average_score,
        MAX(total_score) as highest_score,
        MIN(total_score) as lowest_score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      ${dateFilter}
    `;
        const generalStatsResult = yield database_1.pool.query(generalStatsQuery, params);
        // Temsilcilere göre ortalama puanlar
        const agentStatsQuery = `
      SELECT 
        a.id as agent_id,
        a.full_name as agent_name,
        COUNT(e.id) as evaluation_count,
        AVG(e.total_score) as average_score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users a ON c.agent_id = a.id
      ${dateFilter}
      GROUP BY a.id, a.full_name
      ORDER BY average_score DESC
    `;
        const agentStatsResult = yield database_1.pool.query(agentStatsQuery, params);
        // Kriterlere göre ortalama puanlar ve penalty istatistikleri
        const criteriaStatsQuery = `
      SELECT 
        ec.id as criteria_id,
        ec.name as criteria_name,
        AVG(ed.score) as average_score,
        (AVG(ed.score) / ec.max_score * 100) as percentage,
        COUNT(*) FILTER (WHERE ed.penalty_type != 'none') as penalty_count,
        (COUNT(*) FILTER (WHERE ed.penalty_type != 'none')::float / COUNT(*)) as penalty_ratio
      FROM evaluation_details ed
      JOIN evaluations e ON ed.evaluation_id = e.id
      JOIN evaluation_criteria ec ON ed.criteria_id = ec.id
      JOIN calls c ON e.call_id = c.id
      ${dateFilter}
      GROUP BY ec.id, ec.name, ec.max_score
      ORDER BY criteria_id
    `;
        const criteriaStatsResult = yield database_1.pool.query(criteriaStatsQuery, params);
        // Değerlendirme listesi (ilk 100)
        const evaluationsQuery = `
      SELECT 
        e.id,
        e.evaluation_date as date,
        a.full_name as agent_name,
        c.id as call_ref,
        ev.full_name as evaluator_name,
        e.total_score as score
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users a ON c.agent_id = a.id
      JOIN users ev ON e.evaluator_id = ev.id
      ${dateFilter}
      ORDER BY e.evaluation_date DESC
      LIMIT 100
    `;
        const evaluationsResult = yield database_1.pool.query(evaluationsQuery, params);
        // Genel penalty istatistikleri
        const penaltyCount = criteriaStatsResult.rows.reduce((acc, c) => acc + Number(c.penalty_count), 0);
        const penaltyRatio = criteriaStatsResult.rows.length > 0 ?
            (criteriaStatsResult.rows.reduce((acc, c) => acc + Number(c.penalty_count), 0) /
                criteriaStatsResult.rows.reduce((acc, c) => acc + Number(c.penalty_count) / (Number(c.penalty_ratio) || 1), 0)) : 0;
        res.json({
            general: Object.assign(Object.assign({}, generalStatsResult.rows[0]), { penalty_count: penaltyCount, penalty_ratio: penaltyRatio }),
            agents: agentStatsResult.rows || [],
            criteria: criteriaStatsResult.rows || [],
            evaluations: evaluationsResult.rows || []
        });
    }
    catch (error) {
        console.error('İstatistik getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.exportEvaluationStats = exportEvaluationStats;
// Trend verilerini getirme
const getTrendData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timeRange = req.query.timeRange || 'month';
        let intervalUnit = 'day';
        let intervalCount = 30; // Varsayılan aylık
        // Zaman aralığına göre uygun parametreleri belirle
        switch (timeRange) {
            case 'week':
                intervalUnit = 'day';
                intervalCount = 7;
                break;
            case 'month':
                intervalUnit = 'day';
                intervalCount = 30;
                break;
            case 'quarter':
                intervalUnit = 'week';
                intervalCount = 12;
                break;
            case 'year':
                intervalUnit = 'month';
                intervalCount = 12;
                break;
            default:
                intervalUnit = 'day';
                intervalCount = 30;
        }
        // Zaman dilimlerine göre verileri getir (PostgreSQL'in date_trunc fonksiyonu ile)
        const query = `
      WITH date_series AS (
        SELECT 
          date_trunc($1, evaluation_date) as time_bucket
        FROM 
          evaluations
        WHERE 
          evaluation_date >= NOW() - ($2 || ' ' || $1)::INTERVAL
        GROUP BY 
          date_trunc($1, evaluation_date)
        ORDER BY 
          time_bucket
      )
      SELECT 
        to_char(ds.time_bucket, 'YYYY-MM-DD') as date,
        COALESCE(AVG(e.total_score), 0) as average_score,
        COALESCE(
          COUNT(*) FILTER (WHERE ed.penalty_type != 'none')::float / NULLIF(COUNT(*), 0), 
          0
        ) as penalty_ratio
      FROM 
        date_series ds
      LEFT JOIN 
        evaluations e ON date_trunc($1, e.evaluation_date) = ds.time_bucket
      LEFT JOIN 
        evaluation_details ed ON ed.evaluation_id = e.id
      GROUP BY 
        ds.time_bucket
      ORDER BY 
        ds.time_bucket
    `;
        const result = yield database_1.pool.query(query, [intervalUnit, intervalCount.toString()]);
        // Verileri uygun formata dönüştürüp gönder
        const trendData = result.rows.map(row => ({
            date: row.date,
            averageScore: parseFloat(row.average_score || 0),
            penaltyRatio: parseFloat(row.penalty_ratio || 0)
        }));
        res.json(trendData);
    }
    catch (error) {
        console.error('Trend verisi getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getTrendData = getTrendData;
// AI ile otomatik değerlendirme oluşturma
const createAutoEvaluation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { callId } = req.params;
        if (!callId) {
            return res.status(400).json({ error: 'Çağrı ID parametresi gereklidir' });
        }
        // Değerlendirmeyi yapan kullanıcının ID'sini alıyoruz
        const evaluatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!evaluatorId) {
            return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı' });
        }
        // Çağrı detaylarını getir
        const callQuery = 'SELECT * FROM calls WHERE id = $1';
        const callResult = yield database_1.pool.query(callQuery, [callId]);
        if (callResult.rows.length === 0) {
            return res.status(404).json({ error: 'Çağrı bulunamadı' });
        }
        const call = callResult.rows[0];
        if (!call.recording_path) {
            return res.status(400).json({ error: 'Bu çağrı için kayıt bulunamadı' });
        }
        // Zaten değerlendirilmiş mi kontrol et
        const existingEvaluation = yield Evaluation_1.EvaluationModel.findByCallId(parseInt(callId));
        if (existingEvaluation) {
            return res.status(400).json({ error: 'Bu çağrı zaten değerlendirilmiş' });
        }
        // AI servisi ile değerlendirme yap
        const evaluation = yield aiService_1.AIService.processCallWithAI(parseInt(callId), call.recording_path, parseInt(evaluatorId));
        // Düşük puan bildirimi kontrolü
        if (evaluation.id) {
            yield notificationService_1.NotificationService.checkLowScore(evaluation.id);
        }
        res.status(201).json({
            message: 'Otomatik değerlendirme başarıyla oluşturuldu',
            evaluation
        });
    }
    catch (error) {
        console.error('Otomatik değerlendirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.createAutoEvaluation = createAutoEvaluation;
