import { check, body, param, ValidationChain } from 'express-validator';
import mongoose from 'mongoose';

// User validation
export const userValidationRules = {
  createUser: [
    check('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Kullanıcı adı 3-30 karakter arası olmalıdır')
      .isAlphanumeric()
      .withMessage('Kullanıcı adı sadece harf ve rakam içerebilir'),
    check('email')
      .trim()
      .isEmail()
      .withMessage('Geçerli bir email adresi girin')
      .normalizeEmail(),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter içermelidir'),
    check('full_name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Ad soyad 3-100 karakter arası olmalıdır'),
    check('role')
      .isIn(['agent', 'quality_expert', 'manager'])
      .withMessage('Geçerli bir rol seçin: agent, quality_expert, manager')
  ],
  updateUser: [
    check('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Kullanıcı adı 3-30 karakter arası olmalıdır')
      .isAlphanumeric()
      .withMessage('Kullanıcı adı sadece harf ve rakam içerebilir'),
    check('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Geçerli bir email adresi girin')
      .normalizeEmail(),
    check('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter içermelidir'),
    check('full_name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Ad soyad 3-100 karakter arası olmalıdır'),
    check('role')
      .optional()
      .isIn(['agent', 'quality_expert', 'manager'])
      .withMessage('Geçerli bir rol seçin: agent, quality_expert, manager'),
    check('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Geçerli bir durum seçin: active, inactive')
  ],
  login: [
    check('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Kullanıcı adı en az 3 karakter olmalıdır'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter olmalıdır')
  ]
};

// Call validation
export const callValidationRules = {
  createCall: [
    check('queue')
      .notEmpty()
      .withMessage('Kuyruk ID boş bırakılamaz')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Geçerli bir kuyruk ID giriniz'),
    check('agent')
      .notEmpty()
      .withMessage('Çağrı görevlisi ID boş bırakılamaz')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Geçerli bir çağrı görevlisi ID giriniz'),
    check('customer_number')
      .notEmpty()
      .withMessage('Müşteri numarası boş bırakılamaz')
      .matches(/^\+?[0-9]{8,15}$/)
      .withMessage('Geçerli bir telefon numarası giriniz'),
    check('duration')
      .notEmpty()
      .withMessage('Süre boş bırakılamaz'),
    check('date')
      .optional()
      .isISO8601()
      .withMessage('Geçerli bir tarih formatı giriniz (ISO 8601)'),
    check('type')
      .isIn(['inbound', 'outbound', 'transfer'])
      .withMessage('Geçerli bir çağrı tipi seçin: inbound, outbound, transfer'),
    check('status')
      .optional()
      .isIn(['pending', 'evaluated', 'archived'])
      .withMessage('Geçerli bir durum seçin: pending, evaluated, archived')
  ],
  updateCall: [
    check('status')
      .optional()
      .isIn(['pending', 'evaluated', 'archived'])
      .withMessage('Geçerli bir durum seçin: pending, evaluated, archived'),
    check('notes')
      .optional()
      .isString()
      .withMessage('Notlar metin olmalıdır')
  ]
};

// Evaluation validation
export const evaluationValidationRules = {
  createEvaluation: [
    check('call')
      .notEmpty()
      .withMessage('Çağrı ID boş bırakılamaz')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Geçerli bir çağrı ID giriniz'),
    check('evaluator')
      .notEmpty()
      .withMessage('Değerlendirici ID boş bırakılamaz')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Geçerli bir değerlendirici ID giriniz'),
    check('total_score')
      .notEmpty()
      .withMessage('Toplam puan boş bırakılamaz')
      .isNumeric()
      .withMessage('Toplam puan sayısal olmalıdır'),
    check('details')
      .isArray()
      .withMessage('Değerlendirme detayları bir dizi olmalıdır')
      .notEmpty()
      .withMessage('En az bir değerlendirme detayı girilmelidir'),
    check('details.*.criteria_id')
      .notEmpty()
      .withMessage('Kriter ID boş bırakılamaz')
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage('Geçerli bir kriter ID giriniz'),
    check('details.*.score')
      .notEmpty()
      .withMessage('Puan boş bırakılamaz')
      .isNumeric()
      .withMessage('Puan sayısal olmalıdır')
  ]
};

// Queue validation
export const queueValidationRules = {
  createQueue: [
    check('name')
      .trim()
      .notEmpty()
      .withMessage('Kuyruk adı boş bırakılamaz')
      .isLength({ min: 2, max: 50 })
      .withMessage('Kuyruk adı 2-50 karakter arası olmalıdır')
  ]
};

// Genel ID validasyonu
export const validateObjectId = (paramName: string): ValidationChain[] => {
  return [
    param(paramName)
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage(`Geçersiz ${paramName} formatı`)
  ];
}; 