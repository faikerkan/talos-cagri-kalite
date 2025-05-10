import express from 'express';
import { 
  createEvaluation, 
  getEvaluationByCallId,
  getMyEvaluations,
  getEvaluationsByEvaluator,
  getEvaluationsByAgent,
  getEvaluationDetail,
  getEvaluationStats,
  exportEvaluationStats,
  getTrendData,
  createAutoEvaluation
} from '../controllers/evaluationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/roleMiddleware';

const router = express.Router();

// Değerlendirme oluşturma (Kalite uzmanları için)
router.post('/', authenticateToken, checkRole(['quality_expert']), createEvaluation);

// AI ile otomatik değerlendirme oluşturma
router.post('/auto/:callId', authenticateToken, checkRole(['quality_expert', 'manager']), createAutoEvaluation);

// Kendi değerlendirmelerini getirme (Rol bazlı)
router.get('/my-evaluations', authenticateToken, getMyEvaluations);

// Çağrı ID'sine göre değerlendirme getirme
router.get('/call/:callId', authenticateToken, getEvaluationByCallId);

// Değerlendirmeleri kalite uzmanına göre getirme
router.get('/by-evaluator', authenticateToken, checkRole(['quality_expert', 'manager']), getEvaluationsByEvaluator);

// Değerlendirmeleri müşteri temsilcisine göre getirme
router.get('/by-agent/:agentId', authenticateToken, checkRole(['quality_expert', 'manager', 'agent']), getEvaluationsByAgent);

// Tek bir değerlendirmenin detaylarını getirme
router.get('/:id', authenticateToken, getEvaluationDetail);

// İstatistikleri getirme
router.get('/stats/summary', authenticateToken, checkRole(['quality_expert', 'manager']), getEvaluationStats);

// Trend verilerini getirme
router.get('/stats/trend', authenticateToken, checkRole(['quality_expert', 'manager']), getTrendData);

// Excel export
router.get('/stats/export', authenticateToken, checkRole(['quality_expert', 'manager']), exportEvaluationStats);

export default router; 