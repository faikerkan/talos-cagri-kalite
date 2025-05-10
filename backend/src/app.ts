import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import callRoutes from './routes/callRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import queueRoutes from './routes/queueRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/queues', queueRoutes);

export default app; 