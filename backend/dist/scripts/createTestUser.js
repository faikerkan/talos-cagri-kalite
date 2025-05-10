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
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createTestUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/call-center-qa');
        const testUser = new User_1.User({
            username: 'test2.user',
            password: 'test123',
            full_name: 'Test Kullanıcı 2',
            email: 'test2@example.com',
            role: 'manager',
        });
        yield testUser.save();
        console.log('Test kullanıcısı oluşturuldu:', testUser.username);
        process.exit(0);
    }
    catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
});
createTestUser();
