import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { createStream } from 'rotating-file-stream';
import compression from 'compression';
import userRoutes from './routes/userRoutes';
import callRoutes from './routes/callRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import queueRoutes from './routes/queueRoutes';

const app = express();

// CORS ayarları
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Temel güvenlik headers
app.use(helmet());

// JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sıkıştırma middleware'i
app.use(compression());

// Rate limiting - IP başına dakikada en fazla 100 istek
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 100 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', limiter);

// Loglama ayarları
const logDirectory = path.join(__dirname, '../logs');
// Log dizini yoksa oluştur
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Log dosyası rotasyonu ayarları
const accessLogStream = createStream('access.log', {
  interval: '1d', // Her gün rotasyon
  path: logDirectory
});

// HTTP isteklerini logla
app.use(morgan('combined', { stream: accessLogStream }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Geliştirme ortamı için konsola da logla
}

// Statik dosyalar
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API rotaları
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/queues', queueRoutes);

// Ana rota
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Talos API Çalışıyor' });
});

// 404 hatası
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'İstenen sayfa bulunamadı'
  });
});

// Global hata yakalama middleware'i
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

export default app; 