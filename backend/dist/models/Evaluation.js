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
exports.EvaluationModel = void 0;
const database_1 = require("../config/database");
class EvaluationModel {
    static create(evaluation, details) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield database_1.pool.connect();
            try {
                yield client.query('BEGIN');
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
                const evaluationResult = yield client.query(evaluationQuery, evaluationValues);
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
                    yield client.query(detailQuery, detailValues);
                }
                yield client.query('COMMIT');
                return newEvaluation;
            }
            catch (error) {
                yield client.query('ROLLBACK');
                throw error;
            }
            finally {
                client.release();
            }
        });
    }
    static findByCallId(callId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'SELECT * FROM evaluations WHERE call_id = $1';
            const result = yield database_1.pool.query(query, [callId]);
            return result.rows[0] || null;
        });
    }
    static getEvaluationDetails(evaluationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT ed.*, ec.name as criteria_name, ec.max_score
      FROM evaluation_details ed
      JOIN evaluation_criteria ec ON ed.criteria_id = ec.id
      WHERE ed.evaluation_id = $1
    `;
            const result = yield database_1.pool.query(query, [evaluationId]);
            return result.rows;
        });
    }
    static getEvaluationsByEvaluator(evaluatorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT e.*, c.customer_phone, c.call_duration, u.full_name as agent_name
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users u ON c.agent_id = u.id
      WHERE e.evaluator_id = $1
      ORDER BY e.evaluation_date DESC
    `;
            const result = yield database_1.pool.query(query, [evaluatorId]);
            return result.rows;
        });
    }
    static getAgentEvaluations(agentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT e.*, c.customer_phone, c.call_duration, u.full_name as evaluator_name
      FROM evaluations e
      JOIN calls c ON e.call_id = c.id
      JOIN users u ON e.evaluator_id = u.id
      WHERE c.agent_id = $1
      ORDER BY e.evaluation_date DESC
    `;
            const result = yield database_1.pool.query(query, [agentId]);
            return result.rows;
        });
    }
}
exports.EvaluationModel = EvaluationModel;
