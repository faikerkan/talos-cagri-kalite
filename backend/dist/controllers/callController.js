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
exports.uploadRecording = exports.deleteCall = exports.getPendingCalls = exports.updateCallStatus = exports.getCallById = exports.getCalls = exports.createCall = void 0;
const Call_1 = require("../models/Call");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const createCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customer_number, duration, date, status } = req.body;
        const agent = req.user.id;
        const call = new Call_1.Call({
            agent,
            customer_number,
            duration,
            date,
            status: status || 'pending'
        });
        yield call.save();
        res.status(201).json(call);
    }
    catch (error) {
        res.status(500).json({ error: 'Çağrı kaydı oluşturulurken bir hata oluştu.' });
    }
});
exports.createCall = createCall;
const getCalls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        const user = req.user;
        // MongoDB sorgusu için filtre oluştur
        const filter = {};
        // Status filtresi
        if (status) {
            filter.status = status;
        }
        // Kullanıcı agent ise, sadece kendi çağrılarını görsün
        if (user && user.role === 'agent') {
            filter.agent = user.id;
        }
        // Çağrıları getir
        const calls = yield Call_1.Call.find(filter)
            .populate('agent', 'full_name username')
            .sort({ date: -1 });
        res.json(calls);
    }
    catch (error) {
        logger_1.default.error('Çağrılar alınırken bir hata oluştu:', error);
        res.status(500).json({ error: 'Çağrılar alınırken bir hata oluştu.' });
    }
});
exports.getCalls = getCalls;
const getCallById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
        }
        const call = yield Call_1.Call.findById(id).populate('agent', 'full_name username');
        if (!call) {
            return res.status(404).json({ error: 'Çağrı bulunamadı.' });
        }
        res.json(call);
    }
    catch (error) {
        res.status(500).json({ error: 'Çağrı detayları alınırken bir hata oluştu.' });
    }
});
exports.getCallById = getCallById;
const updateCallStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
        }
        if (!['pending', 'evaluated', 'archived'].includes(status)) {
            return res.status(400).json({ error: 'Geçersiz durum değeri.' });
        }
        const call = yield Call_1.Call.findByIdAndUpdate(id, { status }, { new: true }).populate('agent', 'full_name username');
        if (!call) {
            return res.status(404).json({ error: 'Çağrı bulunamadı.' });
        }
        res.json(call);
    }
    catch (error) {
        res.status(500).json({ error: 'Çağrı durumu güncellenirken bir hata oluştu.' });
    }
});
exports.updateCallStatus = updateCallStatus;
const getPendingCalls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const calls = yield Call_1.Call.find({ status: 'pending' })
            .populate('agent', 'full_name username')
            .sort({ date: -1 });
        res.json(calls);
    }
    catch (error) {
        res.status(500).json({ error: 'Bekleyen çağrılar alınırken bir hata oluştu.' });
    }
});
exports.getPendingCalls = getPendingCalls;
const deleteCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
        }
        yield Call_1.Call.findByIdAndDelete(id);
        res.json({ message: 'Çağrı silindi.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Çağrı silinemedi.' });
    }
});
exports.deleteCall = deleteCall;
// MP3 dosya yükleme
const uploadRecording = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }
        const call = yield Call_1.Call.findByIdAndUpdate(id, { recording_path: req.file.path }, { new: true });
        if (!call) {
            return res.status(404).json({ error: 'Çağrı bulunamadı.' });
        }
        res.json({ message: 'Kayıt başarıyla yüklendi.', call });
    }
    catch (error) {
        res.status(500).json({ error: 'Kayıt yüklenirken bir hata oluştu.' });
    }
});
exports.uploadRecording = uploadRecording;
