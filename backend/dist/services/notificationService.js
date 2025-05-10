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
exports.NotificationService = void 0;
const database_1 = require("../config/database");
const nodemailer_1 = __importDefault(require("nodemailer"));
class NotificationService {
    // Konfigurasyon ayarları
    static setConfig(config) {
        this.config = Object.assign(Object.assign({}, this.config), config);
    }
    // Düşük puan kontrolü
    static checkLowScore(evaluationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Değerlendirme detaylarını getir
                const evaluationQuery = `
        SELECT 
          e.*, 
          u.email as agent_email,
          u.full_name as agent_name,
          m.email as manager_email,
          ev.email as evaluator_email
        FROM evaluations e
        JOIN calls c ON e.call_id = c.id
        JOIN users u ON c.agent_id = u.id
        JOIN users ev ON e.evaluator_id = ev.id
        LEFT JOIN users m ON u.manager_id = m.id
        WHERE e.id = $1
      `;
                const evaluationResult = yield database_1.pool.query(evaluationQuery, [evaluationId]);
                if (evaluationResult.rows.length === 0) {
                    return false;
                }
                const evaluation = evaluationResult.rows[0];
                // Toplam puan eşiğin altında mı?
                const totalScorePercent = (evaluation.total_score / 100) * 100;
                if (totalScorePercent < this.config.threshold) {
                    // Eşiğin altındaki kriter sayısını kontrol et
                    const criteriaQuery = `
          SELECT 
            COUNT(*) as low_criteria_count
          FROM evaluation_details ed
          JOIN evaluation_criteria ec ON ed.criteria_id = ec.id
          WHERE 
            ed.evaluation_id = $1 AND
            (ed.score / ec.max_score) * 100 < $2
        `;
                    const criteriaResult = yield database_1.pool.query(criteriaQuery, [evaluationId, this.config.threshold]);
                    const lowCriteriaCount = parseInt(criteriaResult.rows[0].low_criteria_count);
                    if (lowCriteriaCount >= this.config.criteriaThreshold) {
                        // Bildirim gönder
                        yield this.sendNotification(evaluation);
                        return true;
                    }
                }
                return false;
            }
            catch (error) {
                console.error('Düşük puan kontrolü hatası:', error);
                return false;
            }
        });
    }
    // Bildirim gönderme (e-posta)
    static sendNotification(evaluation) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // E-posta göndermek için nodemailer konfigurasyonu
                const transporter = nodemailer_1.default.createTransport({
                    host: process.env.MAIL_HOST || 'smtp.example.com',
                    port: parseInt(process.env.MAIL_PORT || '587'),
                    secure: process.env.MAIL_SECURE === 'true',
                    auth: {
                        user: process.env.MAIL_USER || 'user@example.com',
                        pass: process.env.MAIL_PASS || 'password',
                    },
                });
                // Alıcıları belirle (temsilci, yönetici ve değerlendiren)
                const recipients = [
                    evaluation.agent_email,
                    evaluation.manager_email,
                    evaluation.evaluator_email
                ].filter(Boolean); // null veya undefined değerleri filtrele
                if (recipients.length === 0) {
                    console.log('Bildirim için alıcı bulunamadı');
                    return;
                }
                // E-posta içeriğini hazırla
                const mailOptions = {
                    from: `"Talos Çağrı Merkezi" <${process.env.MAIL_FROM || 'noreply@example.com'}>`,
                    to: recipients.join(', '),
                    subject: `Düşük Puan Bildirimi - Değerlendirme #${evaluation.id}`,
                    html: `
          <h2>Düşük Puanlı Değerlendirme Bildirimi</h2>
          <p>Sayın İlgili,</p>
          <p>${evaluation.agent_name} isimli temsilci için yapılan değerlendirmede düşük puan tespit edilmiştir.</p>
          <ul>
            <li><strong>Değerlendirme ID:</strong> ${evaluation.id}</li>
            <li><strong>Tarih:</strong> ${new Date(evaluation.evaluation_date).toLocaleDateString('tr-TR')}</li>
            <li><strong>Toplam Puan:</strong> ${evaluation.total_score}</li>
          </ul>
          <p>Lütfen değerlendirme detaylarına bakarak gerekli iyileştirme aksiyonlarını planlayınız.</p>
          <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/evaluations/${evaluation.id}">Değerlendirme Detaylarını Görüntüle</a></p>
          <p>Saygılarımızla,<br>Talos Çağrı Merkezi Kalite Ekibi</p>
        `,
                };
                // E-posta gönder
                yield transporter.sendMail(mailOptions);
                console.log(`Düşük puan bildirimi gönderildi: ${evaluation.id}`);
            }
            catch (error) {
                console.error('Bildirim gönderme hatası:', error);
            }
        });
    }
}
exports.NotificationService = NotificationService;
NotificationService.config = {
    threshold: 60, // Varsayılan değerler
    criteriaThreshold: 3,
};
