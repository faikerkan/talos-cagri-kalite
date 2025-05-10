"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// JWT token'ı doğrulama middleware'i
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Erişim hatası: Token bulunamadı' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        // req objesine user bilgilerini ekle
        req.user = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Erişim hatası: Geçersiz token' });
    }
};
exports.authenticateToken = authenticateToken;
