"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const rotating_file_stream_1 = require("rotating-file-stream");
const compression_1 = __importDefault(require("compression"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const callRoutes_1 = __importDefault(require("./routes/callRoutes"));
const evaluationRoutes_1 = __importDefault(require("./routes/evaluationRoutes"));
const queueRoutes_1 = __importDefault(require("./routes/queueRoutes"));
const app = (0, express_1.default)();
// CORS ayarları
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Temel güvenlik headers
app.use((0, helmet_1.default)());
// JSON body parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Sıkıştırma middleware'i
app.use((0, compression_1.default)());
// Rate limiting - IP başına dakikada en fazla 100 istek
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 100 istek
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', limiter);
// Loglama ayarları
const logDirectory = path_1.default.join(__dirname, '../logs');
// Log dizini yoksa oluştur
if (!fs_1.default.existsSync(logDirectory)) {
    fs_1.default.mkdirSync(logDirectory, { recursive: true });
}
// Log dosyası rotasyonu ayarları
const accessLogStream = (0, rotating_file_stream_1.createStream)('access.log', {
    interval: '1d', // Her gün rotasyon
    path: logDirectory
});
// HTTP isteklerini logla
app.use((0, morgan_1.default)('combined', { stream: accessLogStream }));
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev')); // Geliştirme ortamı için konsola da logla
}
// Statik dosyalar
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API rotaları
app.use('/api/users', userRoutes_1.default);
app.use('/api/calls', callRoutes_1.default);
app.use('/api/evaluations', evaluationRoutes_1.default);
app.use('/api/queues', queueRoutes_1.default);
// Ana rota
app.get('/', (req, res) => {
    res.json({ message: 'Talos API Çalışıyor' });
});
// 404 hatası
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'İstenen sayfa bulunamadı'
    });
});
// Global hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
    });
});
exports.default = app;
