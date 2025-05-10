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
exports.AIService = void 0;
const database_1 = require("../config/database");
const Evaluation_1 = require("../models/Evaluation");
class AIService {
    // Çağrı kaydını metne dönüştürme
    static transcribeCall(recordingPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Gerçek entegrasyon için, burada bir STT (Speech-to-Text) API'sine istek yapılmalı
                // Örnek amacıyla şimdilik sahte veri döndürüyoruz
                console.log(`Transcribe API çağrılacak: ${recordingPath}`);
                // Örnek sonuç
                return [
                    { speaker: 'agent', text: 'Merhaba, XYZ Çağrı Merkezi, size nasıl yardımcı olabilirim?', startTime: 0, endTime: 4.5 },
                    { speaker: 'customer', text: 'Merhaba, geçen hafta sipariş ettiğim ürün hala elime ulaşmadı.', startTime: 4.8, endTime: 9.2 },
                    // Daha fazla segment...
                ];
            }
            catch (error) {
                console.error('Transcription error:', error);
                throw new Error('Çağrı transkripsiyon hatası');
            }
        });
    }
    // Transkripsiyon kullanarak çağrıyı otomatik değerlendirme
    static evaluateTranscript(callId, transcript, evaluatorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Gerçek entegrasyon için, burada bir LLM API'sine istek yapılmalı
                // Örnek olarak OpenAI benzeri bir API'ye istek yapılabilir:
                /*
                const response = await axios.post(
                  'https://api.openai.com/v1/chat/completions',
                  {
                    model: 'gpt-4',
                    messages: [
                      {
                        role: 'system',
                        content: 'Çağrı merkezi görüşmelerini değerlendiren bir asistansın. Aşağıdaki transkripsiyon için her kriteri 1-10 arası puanla.'
                      },
                      {
                        role: 'user',
                        content: JSON.stringify(transcript)
                      }
                    ]
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                // API yanıtını işle
                const aiResponse = response.data.choices[0].message.content;
                */
                // Şimdilik örnek veri döndürüyoruz
                return {
                    totalScore: 78,
                    criteriaScores: [
                        { criteriaId: 1, score: 4, notes: 'Müşteriyi uygun şekilde karşıladı' },
                        { criteriaId: 2, score: 12, notes: 'Müşteriyi dikkatle dinledi' },
                        { criteriaId: 3, score: 10, notes: 'Kısmen analiz etti' },
                        { criteriaId: 4, score: 7, notes: 'Görüşmede gereksiz tekrarlama vardı' },
                        { criteriaId: 5, score: 8, notes: 'Ses tonu uygundu' },
                        { criteriaId: 6, score: 4, notes: 'Sorunu sahiplendi' },
                        { criteriaId: 7, score: 3, notes: 'Empati kurdu' },
                        { criteriaId: 8, score: 5, notes: 'Süreyi iyi yönetti' },
                        { criteriaId: 9, score: 8, notes: 'Doğru bilgi verdi' },
                        { criteriaId: 10, score: 8, notes: 'Bilgiyi açık şekilde paylaştı' },
                        { criteriaId: 11, score: 4, notes: 'Kapanış uygundu' },
                        { criteriaId: 12, score: 5, notes: 'Doğru ekip bilgisi verildi' }
                    ],
                    summary: 'Genel olarak iyi bir görüşme, ancak müşteriyi daha iyi anlama ve analiz etme konusunda gelişim alanı var.'
                };
            }
            catch (error) {
                console.error('AI evaluation error:', error);
                throw new Error('AI değerlendirme hatası');
            }
        });
    }
    // Otomatik değerlendirme sonucunu kaydetme
    static saveAutoEvaluation(callId, evaluatorId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ana değerlendirme nesnesini oluştur
                const evaluation = {
                    call_id: callId,
                    evaluator_id: evaluatorId,
                    total_score: result.totalScore,
                    notes: result.summary,
                    evaluation_date: new Date()
                };
                // Detay nesnelerini hazırla
                const evaluationDetails = result.criteriaScores.map(score => ({
                    evaluation_id: 0, // Bu değer createEvaluation'da otomatik atanacak
                    criteria_id: score.criteriaId,
                    score: score.score,
                    notes: score.notes,
                    penalty_type: score.penaltyType || 'none'
                }));
                // Veritabanına kaydet
                const savedEvaluation = yield Evaluation_1.EvaluationModel.create(evaluation, evaluationDetails);
                // Çağrı durumunu güncelle
                yield database_1.pool.query('UPDATE calls SET status = $1 WHERE id = $2', ['evaluated', callId]);
                return savedEvaluation;
            }
            catch (error) {
                console.error('Save auto evaluation error:', error);
                throw new Error('Otomatik değerlendirme kaydetme hatası');
            }
        });
    }
    // Tüm AI işlemlerini birleştiren ana fonksiyon
    static processCallWithAI(callId, recordingPath, evaluatorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Adım 1: Çağrıyı metne dönüştür
                const transcript = yield this.transcribeCall(recordingPath);
                // Adım 2: Metni değerlendir
                const evaluationResult = yield this.evaluateTranscript(callId, transcript, evaluatorId);
                // Adım 3: Değerlendirmeyi kaydet
                return yield this.saveAutoEvaluation(callId, evaluatorId, evaluationResult);
            }
            catch (error) {
                console.error('AI processing error:', error);
                throw new Error('AI işleme hatası');
            }
        });
    }
}
exports.AIService = AIService;
