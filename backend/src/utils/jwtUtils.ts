import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import logger from './logger';

// Token tipleri
export type TokenType = 'access' | 'refresh';

// JWT payload tipi
export interface JwtPayload {
  id: string;
  username: string;
  role: string;
  tokenVersion?: number;
}

/**
 * Access token oluşturur
 * @param user Kullanıcı bilgisi
 * @returns JWT access token
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: JwtPayload = {
    id: user._id.toString(),
    username: user.username,
    role: user.role
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

/**
 * Refresh token oluşturur
 * @param user Kullanıcı bilgisi
 * @param tokenVersion Token versiyonu (güvenlik için)
 * @returns JWT refresh token
 */
export const generateRefreshToken = (user: IUser, tokenVersion = 0): string => {
  const payload: JwtPayload = {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    tokenVersion
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Token doğrulama fonksiyonu
 * @param token Doğrulanacak token
 * @param type Token tipi (access veya refresh)
 * @returns Başarılı ise payload, değilse null
 */
export const verifyToken = (token: string, type: TokenType): JwtPayload | null => {
  try {
    const secret = type === 'access' 
      ? process.env.JWT_SECRET as string
      : process.env.JWT_REFRESH_SECRET as string;
      
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    logger.error(`Token doğrulama hatası (${type}):`, error);
    return null;
  }
};

/**
 * Token'ın süresi dolmaya yakın mı kontrol eder
 * @param token Kontrol edilecek token
 * @returns Süresinin %75'ini doldurduysa true, aksi halde false
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp: number };
    if (!decoded || !decoded.exp) return true;
    
    // Token'ın geçerlilik süresinin %75'i geçtiyse yenile
    const expirationTime = decoded.exp * 1000; // Milisaniye cinsinden
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    const totalDuration = expirationTime - (jwt.decode(token) as any).iat * 1000;
    
    return timeUntilExpiration < totalDuration * 0.25;
  } catch (error) {
    logger.error('Token süre kontrolü hatası:', error);
    return true;
  }
}; 