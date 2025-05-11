import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwtUtils';
import { ErrorResponse } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Kullanıcı girişi
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // Kullanıcı adı ve şifre gelmezse hata döndür
    if (!username || !password) {
      return next(new ErrorResponse('Kullanıcı adı ve şifre gereklidir', 400));
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Geçersiz kullanıcı bilgileri', 401));
    }

    // Kullanıcı inaktif ise erişimi engelle
    if (user.status === 'inactive') {
      return next(
        new ErrorResponse('Hesabınız devre dışı bırakılmış, yönetici ile iletişime geçin', 403)
      );
    }

    // Accesss ve refresh tokenları oluştur
    const tokenVersion = user.tokenVersion || 0;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, tokenVersion);

    // Cookie ayarları
    const secureCookie = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict' as 'strict'
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
  } catch (error) {
    logger.error('Giriş hatası:', error);
    next(error);
  }
};

// Kullanıcı çıkışı
export const logout = (req: Request, res: Response) => {
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

// Token yenileme
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Refresh token'ı cookie'den al
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new ErrorResponse('Yenileme token\'ı bulunamadı', 401));
    }

    // Token'ı doğrula
    const decoded = verifyToken(refreshToken, 'refresh');
    
    if (!decoded) {
      return next(new ErrorResponse('Geçersiz veya süresi dolmuş token', 401));
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 401));
    }

    // Token versiyonunu kontrol et (güvenlik için)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new ErrorResponse('Token geçersiz kılınmış', 401));
    }

    // Kullanıcı inaktif ise erişimi engelle
    if (user.status === 'inactive') {
      return next(
        new ErrorResponse('Hesabınız devre dışı bırakılmış, yönetici ile iletişime geçin', 403)
      );
    }

    // Yeni access token oluştur
    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    logger.error('Token yenileme hatası:', error);
    next(error);
  }
};

// Kullanıcı profili
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Kullanıcı bilgilerini getir (Auth middleware tarafından req.user'a ekleniyor)
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
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
  } catch (error) {
    logger.error('Profil getirme hatası:', error);
    next(error);
  }
};

// Şifre değiştirme
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Mevcut ve yeni şifre kontrolü
    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Mevcut şifre ve yeni şifre gereklidir', 400));
    }

    // Kullanıcıyı bul
    const user = await User.findById(req.user?.id).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Kullanıcı bulunamadı', 404));
    }

    // Mevcut şifreyi doğrula
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return next(new ErrorResponse('Mevcut şifre hatalı', 401));
    }

    // Yeni şifreyi ayarla
    user.password = newPassword;
    
    // Token versiyonunu arttır (Güvenlik için - tüm eski tokenları geçersiz kılar)
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    logger.error('Şifre değiştirme hatası:', error);
    next(error);
  }
}; 