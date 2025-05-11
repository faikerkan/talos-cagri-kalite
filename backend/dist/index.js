"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// .env dosyasını yükle
dotenv_1.default.config();
// Veritabanı bağlantısını yap
(0, database_1.default)();
// Uploads dizinini kontrol et ve yoksa oluştur
const uploadsDir = path_1.default.join(__dirname, '..', 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads dizini oluşturuldu');
}
// Sunucuyu başlat
const PORT = process.env.PORT || 3001;
const server = app_1.default.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor (${process.env.NODE_ENV} modu)`);
});
// Beklenmeyen kapanmalarda sunucuyu düzgün şekilde durdur
process.on('unhandledRejection', (err) => {
    console.error(`Yakalanmamış Hata: ${err.message}`);
    console.log('Sunucu kapatılıyor...');
    server.close(() => {
        process.exit(1);
    });
});
