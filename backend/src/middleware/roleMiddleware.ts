import { Request, Response, NextFunction } from 'express';

type Role = 'agent' | 'quality_expert' | 'manager';

// Kullanıcı rollerini kontrol eden middleware
export const checkRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Kullanıcı bilgisi yoksa veya rol belirtilmemişse erişimi reddet
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Erişim hatası: Yetkilendirme eksik' });
    }

    // Kullanıcının rolü izin verilen roller arasında mı kontrol et
    if (!roles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: 'Erişim hatası: Bu işlem için yetkiniz yok' });
    }

    // Yetki doğruysa bir sonraki middleware'e geç
    next();
  };
}; 