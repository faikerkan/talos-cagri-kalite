"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
// Kullanıcı rollerini kontrol eden middleware
const checkRole = (roles) => {
    return (req, res, next) => {
        // Kullanıcı bilgisi yoksa veya rol belirtilmemişse erişimi reddet
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Erişim hatası: Yetkilendirme eksik' });
        }
        // Kullanıcının rolü izin verilen roller arasında mı kontrol et
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Erişim hatası: Bu işlem için yetkiniz yok' });
        }
        // Yetki doğruysa bir sonraki middleware'e geç
        next();
    };
};
exports.checkRole = checkRole;
