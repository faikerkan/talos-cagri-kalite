"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
// JWT token'ı doğrulama ve kullanıcıyı req nesnesine ekleme
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token;
        // Authorization header'dan Bearer token'ı al
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            // Cookie'den token al (alternatif)
            token = req.cookies.token;
        }
        // Token yoksa hata fırlat
        if (!token) {
            return next(new errorHandler_1.ErrorResponse('Bu kaynağa erişim için yetkilendirme gerekli', 401));
        }
        // Token'ı doğrula
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Token'dan ID'yi alıp kullanıcıyı bul
        const user = yield User_1.User.findById(decoded.id);
        if (!user) {
            return next(new errorHandler_1.ErrorResponse('Bu kimliğe sahip kullanıcı bulunamadı', 401));
        }
        // Kullanıcı inaktif ise erişimi engelle
        if (user.status === 'inactive') {
            return next(new errorHandler_1.ErrorResponse('Hesabınız devre dışı bırakılmış, yönetici ile iletişime geçin', 403));
        }
        // Kullanıcıyı req objesine ekle
        req.user = user;
        next();
    }
    catch (error) {
        logger_1.default.error('Token doğrulama hatası:', error);
        return next(new errorHandler_1.ErrorResponse('Yetkilendirme başarısız, lütfen tekrar giriş yapın', 401));
    }
});
exports.protect = protect;
// Belirli rollere erişimi kısıtlama
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.ErrorResponse('Yetkilendirme bilgileri bulunamadı', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.ErrorResponse(`${req.user.role} rolü bu işlemi gerçekleştirmek için yeterli yetkiye sahip değil`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
