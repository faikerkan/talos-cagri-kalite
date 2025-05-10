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
exports.getQueues = void 0;
const Queue_1 = require("../models/Queue");
const getQueues = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queues = yield Queue_1.Queue.find();
        res.json(queues);
    }
    catch (error) {
        res.status(500).json({ error: 'Kuyruklar alınırken bir hata oluştu.' });
    }
});
exports.getQueues = getQueues;
