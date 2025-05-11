"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.notFound = exports.errorHandler = exports.ErrorResponse = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("../utils/logger"));
// Hata yanıt sınıfı
class ErrorResponse extends Error {
    constructor(message, statusCode, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
exports.ErrorResponse = ErrorResponse;
// Hata türlerini kontrol etme middleware'i
const errorHandler = (err, req, res, next) => {
    let error = Object.assign({}, err);
    error.message = err.message;
    // Log the error
    logger_1.default.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
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
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ErrorResponse('Doğrulama hatası', 400, message);
    }
    // Validation error from express-validator
    if (err.name === 'ValidatorError') {
        const errors = (0, express_validator_1.validationResult)(req);
        error = new ErrorResponse('Doğrulama hatası', 400, errors.array());
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Sunucu hatası',
        errors: error.errors,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
// 404 hatası için middleware
const notFound = (req, res, next) => {
    const error = new ErrorResponse(`İstenen URL bulunamadı: ${req.originalUrl}`, 404);
    next(error);
};
exports.notFound = notFound;
// Express Validator middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const error = new ErrorResponse('Doğrulama hatası', 400, errors.array());
        return next(error);
    }
    next();
};
exports.validateRequest = validateRequest;
