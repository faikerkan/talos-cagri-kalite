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
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
function migratePenaltyType() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = `ALTER TABLE evaluation_details ADD COLUMN IF NOT EXISTS penalty_type VARCHAR(10) DEFAULT 'none';`;
            yield database_1.pool.query(query);
            console.log('penalty_type alanı başarıyla eklendi (veya zaten mevcut).');
            process.exit(0);
        }
        catch (error) {
            console.error('Migration hatası:', error);
            process.exit(1);
        }
    });
}
migratePenaltyType();
