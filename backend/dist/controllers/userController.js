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
exports.listAgents = exports.listUsers = exports.changePassword = exports.getProfile = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.getUserById = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const cache_1 = __importDefault(require("../utils/cache"));
// Önbellek anahtarları için sabitler
const CACHE_KEYS = {
    USER_LIST: 'users:list',
    USER_BY_ID: (id) => `users:id:${id}`,
    USER_ROLES: 'users:roles',
};
// Önbellek TTL değerleri (millisaniye)
const CACHE_TTL = {
    LIST: 5 * 60 * 1000, // 5 dakika
    DETAIL: 10 * 60 * 1000, // 10 dakika
    ROLES: 30 * 60 * 1000, // 30 dakika
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, full_name, email, role } = req.body;
        // Gerekli alanların kontrolü
        if (!username || !password || !full_name || !email || !role) {
            return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
        }
        // Geçerli roller kontrolü
        const validRoles = ['agent', 'quality_expert', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Geçersiz rol değeri.' });
        }
        // Kullanıcı adı veya email ile kullanıcı var mı kontrolü
        const existingUser = yield User_1.User.findOne({
            $or: [{ username }, { email }],
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'Bu kullanıcı adı veya email adresi zaten kullanımda.',
            });
        }
        // Yeni kullanıcı oluştur
        const newUser = new User_1.User({
            username,
            password, // Model içinde hash edilecek
            full_name,
            email,
            role,
        });
        yield newUser.save();
        // Önbellekleri temizle çünkü kullanıcı listesi değişti
        cache_1.default.delete(CACHE_KEYS.USER_LIST);
        // Token oluştur
        const token = (0, auth_1.generateToken)(newUser._id.toString());
        logger_1.customLogger.info(`Yeni kullanıcı kaydı: ${username} (${role})`);
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: {
                id: newUser._id,
                username: newUser.username,
                full_name: newUser.full_name,
                email: newUser.email,
                role: newUser.role,
            },
            token,
        });
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcı kaydı hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // Gerekli alanların kontrolü
        if (!username || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
        }
        // Kullanıcıyı bul
        const user = yield User_1.User.findOne({ username });
        // Kullanıcı yoksa veya şifre yanlışsa
        if (!user || !(yield user.comparePassword(password))) {
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
        }
        // Token oluştur
        const token = (0, auth_1.generateToken)(user._id.toString());
        logger_1.customLogger.info(`Kullanıcı girişi: ${username} (${user.role})`);
        res.status(200).json({
            message: 'Giriş başarılı',
            user: {
                id: user._id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcı girişi hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.login = login;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        // UserId formatını kontrol et
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı.' });
        }
        // Önbellekten kullanıcı bilgilerini kontrol et
        const cacheKey = CACHE_KEYS.USER_BY_ID(userId);
        const cachedUser = cache_1.default.get(cacheKey);
        if (cachedUser) {
            logger_1.customLogger.debug(`Cache hit for user: ${userId}`);
            return res.status(200).json(cachedUser);
        }
        // Önbellekte yoksa veritabanından al
        const user = yield User_1.User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        // Sonucu önbelleğe ekle
        const userData = {
            id: user._id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        };
        cache_1.default.set(cacheKey, userData, CACHE_TTL.DETAIL);
        res.status(200).json(userData);
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcı bilgisi getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getUserById = getUserById;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Önbellekten kullanıcı listesini kontrol et
        const cachedUsers = cache_1.default.get(CACHE_KEYS.USER_LIST);
        if (cachedUsers) {
            logger_1.customLogger.debug('Cache hit for user list');
            return res.status(200).json(cachedUsers);
        }
        // Önbellekte yoksa veritabanından al
        const users = yield User_1.User.find().select('-password');
        // Kullanıcı verilerini formatla
        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        }));
        // Sonucu önbelleğe ekle
        cache_1.default.set(CACHE_KEYS.USER_LIST, formattedUsers, CACHE_TTL.LIST);
        res.status(200).json(formattedUsers);
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcı listesi getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getAllUsers = getAllUsers;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const { full_name, email, role } = req.body;
        // UserId formatını kontrol et
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı.' });
        }
        // Kullanıcıyı bul
        const user = yield User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        // Rol değişimi için kontrol
        if (role && !['agent', 'quality_expert', 'manager'].includes(role)) {
            return res.status(400).json({ error: 'Geçersiz rol değeri.' });
        }
        // Güncelleme alanlarını ayarla
        if (full_name)
            user.full_name = full_name;
        if (email)
            user.email = email;
        if (role)
            user.role = role;
        yield user.save();
        // İlgili önbellekleri temizle
        cache_1.default.delete(CACHE_KEYS.USER_LIST);
        cache_1.default.delete(CACHE_KEYS.USER_BY_ID(userId));
        logger_1.customLogger.info(`Kullanıcı güncellendi: ${user.username}`);
        res.status(200).json({
            message: 'Kullanıcı başarıyla güncellendi',
            user: {
                id: user._id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcı güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        // UserId formatını kontrol et
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı.' });
        }
        // Kullanıcıyı bul ve sil
        const user = yield User_1.User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        // İlgili önbellekleri temizle
        cache_1.default.delete(CACHE_KEYS.USER_LIST);
        cache_1.default.delete(CACHE_KEYS.USER_BY_ID(userId));
        logger_1.customLogger.info(`Kullanıcı silindi: ${user.username}`);
        res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcı silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.deleteUser = deleteUser;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Auth middleware'inden gelen kullanıcı bilgisi
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkilendirme hatası' });
        }
        // Önbellekten kullanıcı bilgilerini kontrol et
        const cacheKey = CACHE_KEYS.USER_BY_ID(userId.toString());
        const cachedUser = cache_1.default.get(cacheKey);
        if (cachedUser) {
            logger_1.customLogger.debug(`Cache hit for user profile: ${userId}`);
            return res.status(200).json(cachedUser);
        }
        // Önbellekte yoksa veritabanından al
        const user = yield User_1.User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        // Sonucu önbelleğe ekle
        const userData = {
            id: user._id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        };
        cache_1.default.set(cacheKey, userData, CACHE_TTL.DETAIL);
        res.status(200).json(userData);
    }
    catch (error) {
        logger_1.customLogger.error('Profil bilgisi getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getProfile = getProfile;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Yetkilendirme hatası' });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir.' });
        }
        // Kullanıcıyı bul
        const user = yield User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        // Mevcut şifreyi kontrol et
        const isPasswordValid = yield user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Mevcut şifre yanlış.' });
        }
        // Yeni şifreyi ayarla
        user.password = newPassword;
        yield user.save();
        logger_1.customLogger.info(`Kullanıcı şifresi değiştirildi: ${user.username}`);
        res.status(200).json({ message: 'Şifre başarıyla değiştirildi' });
    }
    catch (error) {
        logger_1.customLogger.error('Şifre değiştirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.changePassword = changePassword;
// --- Kullanıcı Yönetimi ---
// Tüm kullanıcıları listele (sadece manager)
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Yetkiniz yok.' });
        }
        const users = yield User_1.User.find().select('-password').sort({ full_name: 1 });
        res.json(users);
    }
    catch (error) {
        logger_1.customLogger.error('Kullanıcıları listeleme hatası', { error });
        res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
    }
});
exports.listUsers = listUsers;
// Tüm agent (müşteri temsilcisi) kullanıcıları listele
const listAgents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agents = yield User_1.User.find({ role: 'agent', status: 'active' })
            .select('-password')
            .sort({ full_name: 1 });
        res.json(agents);
    }
    catch (error) {
        logger_1.customLogger.error('Temsilcileri listeleme hatası', { error });
        res.status(500).json({ error: 'Temsilciler alınamadı.' });
    }
});
exports.listAgents = listAgents;
