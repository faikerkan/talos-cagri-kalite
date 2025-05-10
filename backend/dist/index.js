"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const callRoutes_1 = __importDefault(require("./routes/callRoutes"));
const queueRoutes_1 = __importDefault(require("./routes/queueRoutes"));
const evaluationRoutes_1 = __importDefault(require("./routes/evaluationRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rotalar
app.use('/api/users', userRoutes_1.default);
app.use('/api/calls', callRoutes_1.default);
app.use('/api/queues', queueRoutes_1.default);
app.use('/api/evaluations', evaluationRoutes_1.default);
// Veritabanı bağlantısı
(0, database_1.default)();
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
