import { Request, Response } from 'express';
import { Queue } from '../models/Queue';

export const getQueues = async (req: Request, res: Response) => {
  try {
    const queues = await Queue.find();
    res.json(queues);
  } catch (error) {
    res.status(500).json({ error: 'Kuyruklar alınırken bir hata oluştu.' });
  }
}; 