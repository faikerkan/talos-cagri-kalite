/**
 * Basit bir loglama utility'si
 * Winston benzeri bir yapı kurabiliriz ama şu an için basit bir logger yeterli olacaktır
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Log dosyalarının kaydedileceği dizin
const logDir = path.join(__dirname, '../../logs');

// Log dizini yoksa oluştur
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Winston format ayarları
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Log seviyesi için environment değişkenini kullan veya varsayılan olarak info
const logLevel = process.env.LOG_LEVEL || 'info';

// Logger oluştur
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'talos-api' },
  transports: [
    // Hata logları için dosya taşıyıcısı
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Tüm loglar için dosya taşıyıcısı
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

// Geliştirme ortamında konsolda göster
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger; 