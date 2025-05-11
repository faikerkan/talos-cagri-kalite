"use strict";
/**
 * Basit bir loglama utility'si
 * Winston benzeri bir yapı kurabiliriz ama şu an için basit bir logger yeterli olacaktır
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Log dosyalarının kaydedileceği dizin
const logDir = path_1.default.join(__dirname, '../../logs');
// Log dizini yoksa oluştur
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Winston format ayarları
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Log seviyesi için environment değişkenini kullan veya varsayılan olarak info
const logLevel = process.env.LOG_LEVEL || 'info';
// Logger oluştur
const logger = winston_1.default.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'talos-api' },
    transports: [
        // Hata logları için dosya taşıyıcısı
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error'
        }),
        // Tüm loglar için dosya taşıyıcısı
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log')
        })
    ]
});
// Geliştirme ortamında konsolda göster
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
exports.default = logger;
