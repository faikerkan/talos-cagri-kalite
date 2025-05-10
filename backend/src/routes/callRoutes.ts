import express from 'express';
import { createCall, getCalls, getCallById, updateCallStatus, getPendingCalls, deleteCall, uploadRecording } from '../controllers/callController';
import { auth } from '../middleware/auth';
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, path.join(__dirname, '../../uploads/recordings'));
  },
  filename: function (req: any, file: any, cb: any) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

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

// MP3 dosya yükleme
router.post('/:id/upload-recording', auth, upload.single('recording'), uploadRecording);

export default router; 