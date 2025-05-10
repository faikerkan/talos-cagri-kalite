"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const callController_1 = require("../controllers/callController");
const auth_1 = require("../middleware/auth");
const multer = require('multer');
const path = require('path');
const router = express_1.default.Router();
// Multer konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/recordings'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });
// Tüm çağrıları listele
router.get('/', auth_1.auth, callController_1.getCalls);
// Bekleyen çağrıları listele
router.get('/pending', auth_1.auth, callController_1.getPendingCalls);
// Yeni çağrı oluştur
router.post('/', auth_1.auth, callController_1.createCall);
// Çağrı detayı getir
router.get('/:id', auth_1.auth, callController_1.getCallById);
// Çağrı durumunu güncelle
router.patch('/:id/status', auth_1.auth, callController_1.updateCallStatus);
// Çağrı sil
router.delete('/:id', auth_1.auth, callController_1.deleteCall);
// MP3 dosya yükleme
router.post('/:id/upload-recording', auth_1.auth, upload.single('recording'), callController_1.uploadRecording);
exports.default = router;
