import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '../utils/logger';

// Hata yanıt sınıfı
export class ErrorResponse extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Hata türlerini kontrol etme middleware'i
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Geçersiz ID formatı';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Bu veri zaten kayıtlı';
    error = new ErrorResponse(message, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message);
    error = new ErrorResponse('Doğrulama hatası', 400, message);
  }

  // Validation error from express-validator
  if (err.name === 'ValidatorError') {
    const errors = validationResult(req);
    error = new ErrorResponse('Doğrulama hatası', 400, errors.array());
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Sunucu hatası',
    errors: error.errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// 404 hatası için middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new ErrorResponse(`İstenen URL bulunamadı: ${req.originalUrl}`, 404);
  next(error);
};

// Express Validator middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new ErrorResponse('Doğrulama hatası', 400, errors.array());
    return next(error);
  }
  next();
}; 