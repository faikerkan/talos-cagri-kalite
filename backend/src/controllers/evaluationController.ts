import { Request, Response } from 'express';
import { EvaluationModel, Evaluation, EvaluationDetail } from '../models/Evaluation';
import { CallModel } from '../models/Call';
import pool from '../config/database';

// Yeni değerlendirme oluşturma
export const createEvaluation = async (req: Request, res: Response) => {
  try {
    const { call_id, total_score, notes, status, details } = req.body;
    
    if (!call_id || !details || !Array.isArray(details)) {
      return res.status(400).json({ error: 'Geçersiz veri formatı' });
    }
    
    // Değerlendirmeyi yapan kullanıcının ID'sini alıyoruz
    const evaluatorId = req.user?.id;
    
    if (!evaluatorId) {
      return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı' });
    }
    
    // Değerlendirme nesnesini oluştur
    const evaluation: Evaluation = {
      call_id: parseInt(call_id),
      evaluator_id: parseInt(evaluatorId),
      total_score,
      notes,
      evaluation_date: new Date()
    };
    
    // Detay nesnelerini hazırla
    const evaluationDetails: EvaluationDetail[] = details.map((detail: any) => ({
      evaluation_id: 0, // Bu değer createEvaluation'da otomatik atanacak
      criteria_id: detail.criteria_id,
      score: detail.score,
      notes: detail.notes || ''
    }));
    
    // Veritabanına kaydet
    const result = await EvaluationModel.create(evaluation, evaluationDetails);
    
    // Çağrı durumunu güncelle
    await pool.query('UPDATE calls SET status = $1 WHERE id = $2', ['evaluated', call_id]);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Değerlendirme oluşturma hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Bir çağrının değerlendirmesini alma
export const getEvaluationByCallId = async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    
    if (!callId) {
      return res.status(400).json({ error: 'Çağrı ID parametresi gereklidir' });
    }
    
    const evaluation = await EvaluationModel.findByCallId(parseInt(callId));
    
    if (!evaluation) {
      return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
    }
    
    // Değerlendirme detaylarını al
    const details = await EvaluationModel.getEvaluationDetails(evaluation.id!);
    
    res.json({ ...evaluation, details });
  } catch (error) {
    console.error('Değerlendirme getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Kullanıcının kendi değerlendirmelerini getirme (Müşteri temsilcisi için)
export const getMyEvaluations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı' });
    }
    
    // Kullanıcı rolüne göre değerlendirmeleri getir
    const userRole = req.user?.role;
    
    if (userRole === 'agent') {
      // Müşteri temsilcisiyse, kendisine yapılan değerlendirmeleri getir
      const evaluations = await EvaluationModel.getAgentEvaluations(parseInt(userId));
      res.json(evaluations);
    } else if (userRole === 'quality_expert') {
      // Kalite uzmanıysa, kendi yaptığı değerlendirmeleri getir
      const evaluations = await EvaluationModel.getEvaluationsByEvaluator(parseInt(userId));
      res.json(evaluations);
    } else {
      res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
  } catch (error) {
    console.error('Değerlendirme getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Değerlendirmeleri kalite uzmanına göre getirme
export const getEvaluationsByEvaluator = async (req: Request, res: Response) => {
  try {
    const evaluatorId = req.query.evaluatorId || req.user?.id;
    
    if (!evaluatorId) {
      return res.status(400).json({ error: 'Değerlendirici ID parametresi gereklidir' });
    }
    
    const evaluations = await EvaluationModel.getEvaluationsByEvaluator(parseInt(evaluatorId.toString()));
    res.json(evaluations);
  } catch (error) {
    console.error('Değerlendirme getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Değerlendirmeleri müşteri temsilcisine göre getirme
export const getEvaluationsByAgent = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Temsilci ID parametresi gereklidir' });
    }
    
    // Kendi değerlendirmelerini görüntüleyen bir temsilciyse, yalnızca kendi ID'sini kullanmasına izin ver
    if (req.user?.role === 'agent' && req.user.id !== agentId) {
      return res.status(403).json({ error: 'Yalnızca kendi değerlendirmelerinizi görüntüleyebilirsiniz' });
    }
    
    const evaluations = await EvaluationModel.getAgentEvaluations(parseInt(agentId));
    res.json(evaluations);
  } catch (error) {
    console.error('Değerlendirme getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Tek bir değerlendirmenin detaylarını getirme
export const getEvaluationDetail = async (req: Request, res: Response) => {
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
    
    const evaluationResult = await pool.query(query, [id]);
    
    if (evaluationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Değerlendirme bulunamadı' });
    }
    
    const evaluation = evaluationResult.rows[0];
    
    // Değerlendirme detaylarını getir
    const details = await EvaluationModel.getEvaluationDetails(parseInt(id));
    
    res.json({ ...evaluation, details });
  } catch (error) {
    console.error('Değerlendirme detayı getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Değerlendirme istatistiklerini getirme
export const getEvaluationStats = async (req: Request, res: Response) => {
  try {
    // Tarih aralığı filtreleri
    const startDate = req.query.startDate as string || '';
    const endDate = req.query.endDate as string || '';
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE e.evaluation_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE e.evaluation_date >= $1';
      params.push(startDate);
    } else if (endDate) {
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
      ${dateFilter}
    `;
    
    const generalStatsResult = await pool.query(generalStatsQuery, params);
    
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
    
    const agentStatsResult = await pool.query(agentStatsQuery, params);
    
    // Kriterlere göre ortalama puanlar
    const criteriaStatsQuery = `
      SELECT 
        ec.id as criteria_id,
        ec.name as criteria_name,
        AVG(ed.score) as average_score,
        (AVG(ed.score) / ec.max_score * 100) as percentage
      FROM evaluation_details ed
      JOIN evaluations e ON ed.evaluation_id = e.id
      JOIN evaluation_criteria ec ON ed.criteria_id = ec.id
      ${dateFilter}
      GROUP BY ec.id, ec.name, ec.max_score
      ORDER BY criteria_id
    `;
    
    const criteriaStatsResult = await pool.query(criteriaStatsQuery, params);
    
    res.json({
      general: generalStatsResult.rows[0] || { total_evaluations: 0, average_score: 0 },
      agents: agentStatsResult.rows || [],
      criteria: criteriaStatsResult.rows || []
    });
  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}; 