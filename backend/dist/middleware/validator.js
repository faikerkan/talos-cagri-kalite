"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectId = exports.queueValidationRules = exports.evaluationValidationRules = exports.callValidationRules = exports.userValidationRules = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
// User validation
exports.userValidationRules = {
    createUser: [
        (0, express_validator_1.check)('username')
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Kullanıcı adı 3-30 karakter arası olmalıdır')
            .isAlphanumeric()
            .withMessage('Kullanıcı adı sadece harf ve rakam içerebilir'),
        (0, express_validator_1.check)('email')
            .trim()
            .isEmail()
            .withMessage('Geçerli bir email adresi girin')
            .normalizeEmail(),
        (0, express_validator_1.check)('password')
            .isLength({ min: 6 })
            .withMessage('Şifre en az 6 karakter içermelidir'),
        (0, express_validator_1.check)('full_name')
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage('Ad soyad 3-100 karakter arası olmalıdır'),
        (0, express_validator_1.check)('role')
            .isIn(['agent', 'quality_expert', 'manager'])
            .withMessage('Geçerli bir rol seçin: agent, quality_expert, manager')
    ],
    updateUser: [
        (0, express_validator_1.check)('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Kullanıcı adı 3-30 karakter arası olmalıdır')
            .isAlphanumeric()
            .withMessage('Kullanıcı adı sadece harf ve rakam içerebilir'),
        (0, express_validator_1.check)('email')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Geçerli bir email adresi girin')
            .normalizeEmail(),
        (0, express_validator_1.check)('password')
            .optional()
            .isLength({ min: 6 })
            .withMessage('Şifre en az 6 karakter içermelidir'),
        (0, express_validator_1.check)('full_name')
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage('Ad soyad 3-100 karakter arası olmalıdır'),
        (0, express_validator_1.check)('role')
            .optional()
            .isIn(['agent', 'quality_expert', 'manager'])
            .withMessage('Geçerli bir rol seçin: agent, quality_expert, manager'),
        (0, express_validator_1.check)('status')
            .optional()
            .isIn(['active', 'inactive'])
            .withMessage('Geçerli bir durum seçin: active, inactive')
    ],
    login: [
        (0, express_validator_1.check)('username')
            .trim()
            .isLength({ min: 3 })
            .withMessage('Kullanıcı adı en az 3 karakter olmalıdır'),
        (0, express_validator_1.check)('password')
            .isLength({ min: 6 })
            .withMessage('Şifre en az 6 karakter olmalıdır')
    ]
};
// Call validation
exports.callValidationRules = {
    createCall: [
        (0, express_validator_1.check)('queue')
            .notEmpty()
            .withMessage('Kuyruk ID boş bırakılamaz')
            .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
            .withMessage('Geçerli bir kuyruk ID giriniz'),
        (0, express_validator_1.check)('agent')
            .notEmpty()
            .withMessage('Çağrı görevlisi ID boş bırakılamaz')
            .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
            .withMessage('Geçerli bir çağrı görevlisi ID giriniz'),
        (0, express_validator_1.check)('customer_number')
            .notEmpty()
            .withMessage('Müşteri numarası boş bırakılamaz')
            .matches(/^\+?[0-9]{8,15}$/)
            .withMessage('Geçerli bir telefon numarası giriniz'),
        (0, express_validator_1.check)('duration')
            .notEmpty()
            .withMessage('Süre boş bırakılamaz'),
        (0, express_validator_1.check)('date')
            .optional()
            .isISO8601()
            .withMessage('Geçerli bir tarih formatı giriniz (ISO 8601)'),
        (0, express_validator_1.check)('type')
            .isIn(['inbound', 'outbound', 'transfer'])
            .withMessage('Geçerli bir çağrı tipi seçin: inbound, outbound, transfer'),
        (0, express_validator_1.check)('status')
            .optional()
            .isIn(['pending', 'evaluated', 'archived'])
            .withMessage('Geçerli bir durum seçin: pending, evaluated, archived')
    ],
    updateCall: [
        (0, express_validator_1.check)('status')
            .optional()
            .isIn(['pending', 'evaluated', 'archived'])
            .withMessage('Geçerli bir durum seçin: pending, evaluated, archived'),
        (0, express_validator_1.check)('notes')
            .optional()
            .isString()
            .withMessage('Notlar metin olmalıdır')
    ]
};
// Evaluation validation
exports.evaluationValidationRules = {
    createEvaluation: [
        (0, express_validator_1.check)('call')
            .notEmpty()
            .withMessage('Çağrı ID boş bırakılamaz')
            .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
            .withMessage('Geçerli bir çağrı ID giriniz'),
        (0, express_validator_1.check)('evaluator')
            .notEmpty()
            .withMessage('Değerlendirici ID boş bırakılamaz')
            .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
            .withMessage('Geçerli bir değerlendirici ID giriniz'),
        (0, express_validator_1.check)('total_score')
            .notEmpty()
            .withMessage('Toplam puan boş bırakılamaz')
            .isNumeric()
            .withMessage('Toplam puan sayısal olmalıdır'),
        (0, express_validator_1.check)('details')
            .isArray()
            .withMessage('Değerlendirme detayları bir dizi olmalıdır')
            .notEmpty()
            .withMessage('En az bir değerlendirme detayı girilmelidir'),
        (0, express_validator_1.check)('details.*.criteria_id')
            .notEmpty()
            .withMessage('Kriter ID boş bırakılamaz')
            .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
            .withMessage('Geçerli bir kriter ID giriniz'),
        (0, express_validator_1.check)('details.*.score')
            .notEmpty()
            .withMessage('Puan boş bırakılamaz')
            .isNumeric()
            .withMessage('Puan sayısal olmalıdır')
    ]
};
// Queue validation
exports.queueValidationRules = {
    createQueue: [
        (0, express_validator_1.check)('name')
            .trim()
            .notEmpty()
            .withMessage('Kuyruk adı boş bırakılamaz')
            .isLength({ min: 2, max: 50 })
            .withMessage('Kuyruk adı 2-50 karakter arası olmalıdır')
    ]
};
// Genel ID validasyonu
const validateObjectId = (paramName) => {
    return [
        (0, express_validator_1.param)(paramName)
            .custom((value) => mongoose_1.default.Types.ObjectId.isValid(value))
            .withMessage(`Geçersiz ${paramName} formatı`)
    ];
};
exports.validateObjectId = validateObjectId;
