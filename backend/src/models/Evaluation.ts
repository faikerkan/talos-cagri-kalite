import { pool } from '../config/database';

export interface Evaluation {
  id?: number;
  call_id: number;
  evaluator_id: number;
  total_score?: number;
  notes?: string;
  evaluation_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface EvaluationDetail {
  id?: number;
  evaluation_id: number;
  criteria_id: number;
  score: number;
  notes?: string;
  penalty_type?: 'none' | 'half' | 'zero';
  created_at?: Date;
  updated_at?: Date;
}

export class EvaluationModel {
  static async create(evaluation: Evaluation, details: EvaluationDetail[]): Promise<Evaluation> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ana değerlendirme kaydını oluştur
      const evaluationQuery = `
        INSERT INTO evaluations (call_id, evaluator_id, total_score, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const evaluationValues = [
        evaluation.call_id,
        evaluation.evaluator_id,
        evaluation.total_score,
        evaluation.notes
      ];
      const evaluationResult = await client.query(evaluationQuery, evaluationValues);
      const newEvaluation = evaluationResult.rows[0];

      // Değerlendirme detaylarını ekle
      for (const detail of details) {
        const detailQuery = `
          INSERT INTO evaluation_details (evaluation_id, criteria_id, score, notes, penalty_type)
          VALUES ($1, $2, $3, $4, $5)
        `;
        const detailValues = [
          newEvaluation.id,
          detail.criteria_id,
          detail.score,
          detail.notes,
          detail.penalty_type || 'none'
        ];
        await client.query(detailQuery, detailValues);
      }

      await client.query('COMMIT');
      return newEvaluation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByCallId(callId: number): Promise<Evaluation | null> {
    const query = 'SELECT * FROM evaluations WHERE call_id = $1';
    const result = await pool.query(query, [callId]);
    return result.rows[0] || null;
  }

  static async getEvaluationDetails(evaluationId: number): Promise<EvaluationDetail[]> {
    const query = `
      SELECT ed.*, ec.name as criteria_name, ec.max_score
      FROM evaluation_details ed
      JOIN evaluation_criteria ec ON ed.criteria_id = ec.id
      WHERE ed.evaluation_id = $1
    `;
    const result = await pool.query(query, [evaluationId]);
    return result.rows;
  }

  static async getEvaluationsByEvaluator(evaluatorId: number): Promise<Evaluation[]> {
    const query = `
      SELECT e.*, c.customer_phone, c.call_duration, u.full_name as agent_name
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users u ON c.agent_id = u.id
      WHERE e.evaluator_id = $1
      ORDER BY e.evaluation_date DESC
    `;
    const result = await pool.query(query, [evaluatorId]);
    return result.rows;
  }

  static async getAgentEvaluations(agentId: number): Promise<Evaluation[]> {
    const query = `
      SELECT e.*, c.customer_phone, c.call_duration, u.full_name as evaluator_name
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users u ON e.evaluator_id = u.id
      WHERE c.agent_id = $1
      ORDER BY e.evaluation_date DESC
    `;
    const result = await pool.query(query, [agentId]);
    return result.rows;
  }
} 