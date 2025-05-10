import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import userRoutes from './routes/userRoutes';
import callRoutes from './routes/callRoutes';
import queueRoutes from './routes/queueRoutes';
import evaluationRoutes from './routes/evaluationRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotalar
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Veritabanı bağlantısı
connectDB();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 