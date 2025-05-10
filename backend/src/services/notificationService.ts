import { pool } from '../config/database';
import nodemailer from 'nodemailer';

interface NotificationConfig {
  threshold: number; // Bildirim eşiği (örn: 60 -> %60'ın altındaki puanlar için bildirim)
  criteriaThreshold: number; // Kriter eşiği (örn: 3 -> 3 ve daha fazla kriterde düşük puan olursa bildirim)
}

export class NotificationService {
  private static config: NotificationConfig = {
    threshold: 60, // Varsayılan değerler
    criteriaThreshold: 3,
  };
  
  // Konfigurasyon ayarları
  static setConfig(config: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  // Düşük puan kontrolü
  static async checkLowScore(evaluationId: number): Promise<boolean> {
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
      
      const evaluationResult = await pool.query(evaluationQuery, [evaluationId]);
      
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
        
        const criteriaResult = await pool.query(
          criteriaQuery, 
          [evaluationId, this.config.threshold]
        );
        
        const lowCriteriaCount = parseInt(criteriaResult.rows[0].low_criteria_count);
        
        if (lowCriteriaCount >= this.config.criteriaThreshold) {
          // Bildirim gönder
          await this.sendNotification(evaluation);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Düşük puan kontrolü hatası:', error);
      return false;
    }
  }
  
  // Bildirim gönderme (e-posta)
  private static async sendNotification(evaluation: any): Promise<void> {
    try {
      // E-posta göndermek için nodemailer konfigurasyonu
      const transporter = nodemailer.createTransport({
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
      await transporter.sendMail(mailOptions);
      
      console.log(`Düşük puan bildirimi gönderildi: ${evaluation.id}`);
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
    }
  }
} 