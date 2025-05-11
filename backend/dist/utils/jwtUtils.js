"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenExpiringSoon = exports.verifyToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Access token oluşturur
 * @param user Kullanıcı bilgisi
 * @returns JWT access token
 */
const generateAccessToken = (user) => {
    const payload = {
        id: user._id.toString(),
        username: user.username,
        role: user.role
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Refresh token oluşturur
 * @param user Kullanıcı bilgisi
 * @param tokenVersion Token versiyonu (güvenlik için)
 * @returns JWT refresh token
 */
const generateRefreshToken = (user, tokenVersion = 0) => {
    const payload = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        tokenVersion
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Token doğrulama fonksiyonu
 * @param token Doğrulanacak token
 * @param type Token tipi (access veya refresh)
 * @returns Başarılı ise payload, değilse null
 */
const verifyToken = (token, type) => {
    try {
        const secret = type === 'access'
            ? process.env.JWT_SECRET
            : process.env.JWT_REFRESH_SECRET;
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        logger_1.default.error(`Token doğrulama hatası (${type}):`, error);
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Token'ın süresi dolmaya yakın mı kontrol eder
 * @param token Kontrol edilecek token
 * @returns Süresinin %75'ini doldurduysa true, aksi halde false
 */
const isTokenExpiringSoon = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp)
            return true;
        // Token'ın geçerlilik süresinin %75'i geçtiyse yenile
        const expirationTime = decoded.exp * 1000; // Milisaniye cinsinden
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        const totalDuration = expirationTime - jsonwebtoken_1.default.decode(token).iat * 1000;
        return timeUntilExpiration < totalDuration * 0.25;
    }
    catch (error) {
        logger_1.default.error('Token süre kontrolü hatası:', error);
        return true;
    }
};
exports.isTokenExpiringSoon = isTokenExpiringSoon;
