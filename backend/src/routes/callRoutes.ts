import express from 'express';
import { createCall, getCalls, getCallById, updateCallStatus, getPendingCalls, deleteCall } from '../controllers/callController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Tüm çağrıları listele
router.get('/', auth, getCalls);

// Bekleyen çağrıları listele
router.get('/pending', auth, getPendingCalls);

// Yeni çağrı oluştur
router.post('/', auth, createCall);

// Çağrı detayı getir
router.get('/:id', auth, getCallById);

// Çağrı durumunu güncelle
router.patch('/:id/status', auth, updateCallStatus);

// Çağrı sil
router.delete('/:id', auth, deleteCall);

export default router; 