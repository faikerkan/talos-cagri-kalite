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
exports.changePassword = exports.getProfile = exports.refreshToken = exports.logout = exports.login = void 0;
const User_1 = require("../models/User");
const jwtUtils_1 = require("../utils/jwtUtils");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
// Kullanıcı girişi
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // Kullanıcı adı ve şifre gelmezse hata döndür
        if (!username || !password) {
            return next(new errorHandler_1.ErrorResponse('Kullanıcı adı ve şifre gereklidir', 400));
        }
        // Kullanıcıyı bul
        const user = yield User_1.User.findOne({ username }).select('+password');
        if (!user) {
            return next(new errorHandler_1.ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
        }
        // Şifreyi kontrol et
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return next(new errorHandler_1.ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
        }
        // Kullanıcı inaktif ise erişimi engelle
        if (user.status === 'inactive') {
            return next(new errorHandler_1.ErrorResponse('Hesabınız devre dışı bırakılmış, yönetici ile iletişime geçin', 403));
        }
        // Accesss ve refresh tokenları oluştur
        const tokenVersion = user.tokenVersion || 0;
        const accessToken = (0, jwtUtils_1.generateAccessToken)(user);
        const refreshToken = (0, jwtUtils_1.generateRefreshToken)(user, tokenVersion);
        // Cookie ayarları
        const secureCookie = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
            httpOnly: true,
            secure: secureCookie,
            sameSite: 'strict'
        };
        // Refresh token'ı httpOnly cookie olarak ayarla
        res.cookie('refreshToken', refreshToken, cookieOptions);
        // Kullanıcı bilgileri ve access token'ı döndür
        res.status(200).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        logger_1.default.error('Giriş hatası:', error);
        next(error);
    }
});
exports.login = login;
// Kullanıcı çıkışı
const logout = (req, res) => {
    // Refresh token cookie'sini temizle
    res.cookie('refreshToken', '', {
        expires: new Date(0),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        message: 'Başarıyla çıkış yapıldı'
    });
};
exports.logout = logout;
// Token yenileme
const refreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Refresh token'ı cookie'den al
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return next(new errorHandler_1.ErrorResponse('Yenileme token\'ı bulunamadı', 401));
        }
        // Token'ı doğrula
        const decoded = (0, jwtUtils_1.verifyToken)(refreshToken, 'refresh');
        if (!decoded) {
            return next(new errorHandler_1.ErrorResponse('Geçersiz veya süresi dolmuş token', 401));
        }
        // Kullanıcıyı bul
        const user = yield User_1.User.findById(decoded.id);
        if (!user) {
            return next(new errorHandler_1.ErrorResponse('Kullanıcı bulunamadı', 401));
        }
        // Token versiyonunu kontrol et (güvenlik için)
        if (user.tokenVersion !== decoded.tokenVersion) {
            return next(new errorHandler_1.ErrorResponse('Token geçersiz kılınmış', 401));
        }
        // Kullanıcı inaktif ise erişimi engelle
        if (user.status === 'inactive') {
            return next(new errorHandler_1.ErrorResponse('Hesabınız devre dışı bırakılmış, yönetici ile iletişime geçin', 403));
        }
        // Yeni access token oluştur
        const accessToken = (0, jwtUtils_1.generateAccessToken)(user);
        res.status(200).json({
            success: true,
            accessToken
        });
    }
    catch (error) {
        logger_1.default.error('Token yenileme hatası:', error);
        next(error);
    }
});
exports.refreshToken = refreshToken;
// Kullanıcı profili
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Kullanıcı bilgilerini getir (Auth middleware tarafından req.user'a ekleniyor)
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            return next(new errorHandler_1.ErrorResponse('Kullanıcı bulunamadı', 404));
        }
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        logger_1.default.error('Profil getirme hatası:', error);
        next(error);
    }
});
exports.getProfile = getProfile;
// Şifre değiştirme
const changePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { currentPassword, newPassword } = req.body;
        // Mevcut ve yeni şifre kontrolü
        if (!currentPassword || !newPassword) {
            return next(new errorHandler_1.ErrorResponse('Mevcut şifre ve yeni şifre gereklidir', 400));
        }
        // Kullanıcıyı bul
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id).select('+password');
        if (!user) {
            return next(new errorHandler_1.ErrorResponse('Kullanıcı bulunamadı', 404));
        }
        // Mevcut şifreyi doğrula
        const isMatch = yield user.comparePassword(currentPassword);
        if (!isMatch) {
            return next(new errorHandler_1.ErrorResponse('Mevcut şifre hatalı', 401));
        }
        // Yeni şifreyi ayarla
        user.password = newPassword;
        // Token versiyonunu arttır (Güvenlik için - tüm eski tokenları geçersiz kılar)
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        yield user.save();
        res.status(200).json({
            success: true,
            message: 'Şifre başarıyla değiştirildi'
        });
    }
    catch (error) {
        logger_1.default.error('Şifre değiştirme hatası:', error);
        next(error);
    }
});
exports.changePassword = changePassword;
