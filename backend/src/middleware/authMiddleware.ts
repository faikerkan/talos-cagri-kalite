import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ErrorResponse } from './errorHandler';
import logger from '../utils/logger';

// Request içinde user prop tanımla
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT token'ı doğrulama ve kullanıcıyı req nesnesine ekleme
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    // Authorization header'dan Bearer token'ı al
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Cookie'den token al (alternatif)
      token = req.cookies.token;
    }

    // Token yoksa hata fırlat
    if (!token) {
      return next(
        new ErrorResponse('Bu kaynağa erişim için yetkilendirme gerekli', 401)
      );
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Token'dan ID'yi alıp kullanıcıyı bul
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        new ErrorResponse('Bu kimliğe sahip kullanıcı bulunamadı', 401)
      );
    }

    // Kullanıcı inaktif ise erişimi engelle
    if (user.status === 'inactive') {
      return next(
        new ErrorResponse('Hesabınız devre dışı bırakılmış, yönetici ile iletişime geçin', 403)
      );
    }

    // Kullanıcıyı req objesine ekle
    req.user = user;
    next();
  } catch (error) {
    logger.error('Token doğrulama hatası:', error);
    return next(
      new ErrorResponse('Yetkilendirme başarısız, lütfen tekrar giriş yapın', 401)
    );
  }
};

// Belirli rollere erişimi kısıtlama
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ErrorResponse('Yetkilendirme bilgileri bulunamadı', 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `${req.user.role} rolü bu işlemi gerçekleştirmek için yeterli yetkiye sahip değil`,
          403
        )
      );
    }

    next();
  };
}; 