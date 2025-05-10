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
const database_1 = __importDefault(require("./database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Veritabanı bağlantısını test et
            const client = yield database_1.default.connect();
            console.log('Veritabanı bağlantısı başarılı!');
            // SQL şemasını oku ve çalıştır
            const schemaPath = path_1.default.join(__dirname, 'schema.sql');
            const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
            yield client.query(schema);
            console.log('Veritabanı şeması başarıyla oluşturuldu!');
            client.release();
        }
        catch (error) {
            console.error('Veritabanı başlatma hatası:', error);
            process.exit(1);
        }
    });
}
initializeDatabase();
