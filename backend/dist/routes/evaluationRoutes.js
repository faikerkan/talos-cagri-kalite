"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const evaluationController_1 = require("../controllers/evaluationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
// Değerlendirme oluşturma (Kalite uzmanları için)
router.post('/', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert']), evaluationController_1.createEvaluation);
// AI ile otomatik değerlendirme oluşturma
router.post('/auto/:callId', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert', 'manager']), evaluationController_1.createAutoEvaluation);
// Kendi değerlendirmelerini getirme (Rol bazlı)
router.get('/my-evaluations', authMiddleware_1.authenticateToken, evaluationController_1.getMyEvaluations);
// Çağrı ID'sine göre değerlendirme getirme
router.get('/call/:callId', authMiddleware_1.authenticateToken, evaluationController_1.getEvaluationByCallId);
// Değerlendirmeleri kalite uzmanına göre getirme
router.get('/by-evaluator', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert', 'manager']), evaluationController_1.getEvaluationsByEvaluator);
// Değerlendirmeleri müşteri temsilcisine göre getirme
router.get('/by-agent/:agentId', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert', 'manager', 'agent']), evaluationController_1.getEvaluationsByAgent);
// Tek bir değerlendirmenin detaylarını getirme
router.get('/:id', authMiddleware_1.authenticateToken, evaluationController_1.getEvaluationDetail);
// İstatistikleri getirme
router.get('/stats/summary', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert', 'manager']), evaluationController_1.getEvaluationStats);
// Trend verilerini getirme
router.get('/stats/trend', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert', 'manager']), evaluationController_1.getTrendData);
// Excel export
router.get('/stats/export', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.checkRole)(['quality_expert', 'manager']), evaluationController_1.exportEvaluationStats);
exports.default = router;
