import express from 'express';
import { getQueues } from '../controllers/queueController';

const router = express.Router();

router.get('/', getQueues);

export default router; 