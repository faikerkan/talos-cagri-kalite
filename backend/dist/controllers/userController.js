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
exports.listAgents = exports.listUsers = exports.deleteUser = exports.updateUser = exports.getProfile = exports.login = exports.register = void 0;
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../middleware/auth");
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
// Kullanıcı kaydı
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, full_name, email, role, status } = req.body;
        if (!username || !password || !full_name || !email || !role) {
            return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
        }
        const validRoles = ['agent', 'quality_expert', 'manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Geçersiz rol değeri.' });
        }
        // Kullanıcı adı veya email var mı kontrol et
        const existing = yield database_1.pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanımda.' });
        }
        const hashed = yield bcrypt_1.default.hash(password, 10);
        const result = yield database_1.pool.query('INSERT INTO users (username, password, full_name, email, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, email, role, status', [username, hashed, full_name, email, role, status || 'active']);
        const user = result.rows[0];
        const token = (0, auth_1.generateToken)(user.id.toString(), user.username, user.role);
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user,
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.register = register;
// Kullanıcı girişi
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
        }
        const result = yield database_1.pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
        }
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
        }
        const token = (0, auth_1.generateToken)(user.id.toString(), user.username, user.role);
        res.status(200).json({
            message: 'Giriş başarılı',
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.login = login;
// Profil bilgisi
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı.' });
        }
        const result = yield database_1.pool.query('SELECT id, username, full_name, email, role, status FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.getProfile = getProfile;
// Kullanıcı güncelleme
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const { full_name, email, role, status } = req.body;
        const validRoles = ['agent', 'quality_expert', 'manager'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ error: 'Geçersiz rol değeri.' });
        }
        const result = yield database_1.pool.query('UPDATE users SET full_name = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING id, username, full_name, email, role, status', [full_name, email, role, status, userId]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        res.status(200).json({ message: 'Kullanıcı başarıyla güncellendi', user });
    }
    catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.updateUser = updateUser;
// Kullanıcı silme
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const result = yield database_1.pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
    }
    catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});
exports.deleteUser = deleteUser;
// Tüm kullanıcıları listele (sadece manager)
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'manager') {
            return res.status(403).json({ error: 'Yetkiniz yok.' });
        }
        const result = yield database_1.pool.query('SELECT id, username, full_name, email, role, status FROM users ORDER BY full_name ASC');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
    }
});
exports.listUsers = listUsers;
// Tüm agent kullanıcıları listele
const listAgents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.pool.query("SELECT id, username, full_name, email, role, status FROM users WHERE role = 'agent' ORDER BY full_name ASC");
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Temsilciler alınamadı.' });
    }
});
exports.listAgents = listAgents;
