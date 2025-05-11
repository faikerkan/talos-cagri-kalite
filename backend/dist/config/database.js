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
const mongoose_1 = __importDefault(require("mongoose"));
// Mongoose bağlantı seçenekleri
const mongooseOptions = {
    autoIndex: true,
    connectTimeoutMS: 10000, // 10 saniye
    socketTimeoutMS: 45000, // 45 saniye
    serverSelectionTimeoutMS: 30000, // 30 saniye
    retryWrites: true,
    retryReads: true,
};
// MongoDB'ye bağlanma fonksiyonu
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/call-center-qa';
        // Bağlantıyı oluştur
        const conn = yield mongoose_1.default.connect(mongoURI, mongooseOptions);
        console.log(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
        // Bağlantı hata yakalama
        mongoose_1.default.connection.on('error', (err) => {
            console.error(`MongoDB bağlantı hatası: ${err}`);
        });
        // Bağlantı koptuğunda
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('MongoDB bağlantısı koptu, yeniden bağlanmaya çalışılacak...');
        });
        // Bağlantı yeniden kurulduğunda
        mongoose_1.default.connection.on('reconnected', () => {
            console.info('MongoDB ile yeniden bağlantı kuruldu');
        });
    }
    catch (error) {
        console.error('MongoDB bağlantı hatası:', error);
        // 3 saniye sonra yeniden deneme
        console.log('Yeniden bağlanmaya çalışılıyor...');
        setTimeout(connectDB, 3000);
    }
});
exports.default = connectDB;
