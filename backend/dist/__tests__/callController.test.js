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
const callController_1 = require("../controllers/callController");
const mongoose_1 = __importDefault(require("mongoose"));
jest.mock('../models/Call', () => {
    const actual = jest.requireActual('../models/Call');
    return Object.assign(Object.assign({}, actual), { Call: jest.fn() });
});
const validId = new mongoose_1.default.Types.ObjectId().toHexString();
// Helper to mock chainable methods (populate, sort)
function mockChain(result) {
    return {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(result),
        exec: jest.fn().mockResolvedValue(result),
        then: (cb) => Promise.resolve(cb(result)),
    };
}
describe('Call Controller', () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: validId, role: 'agent' },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        // Reset all mocks
        jest.clearAllMocks();
        // Statik fonksiyonları jest.fn() olarak mock'la
        const CallMock = require('../models/Call').Call;
        CallMock.find = jest.fn();
        CallMock.findById = jest.fn();
        CallMock.findByIdAndUpdate = jest.fn();
        CallMock.findByIdAndDelete = jest.fn();
    });
    it('should create a new call', () => __awaiter(void 0, void 0, void 0, function* () {
        const newCall = { agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending', _id: validId };
        mockReq.body = { customer_number: '1234567890', duration: '5', date: '2023-01-01' };
        require('../models/Call').Call.mockImplementation(() => (Object.assign({ save: jest.fn().mockResolvedValue(newCall) }, newCall)));
        yield (0, callController_1.createCall)(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(newCall));
    }));
    it('should get all calls', () => __awaiter(void 0, void 0, void 0, function* () {
        const calls = [{ _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending' }];
        require('../models/Call').Call.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(calls),
        });
        yield (0, callController_1.getCalls)(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(calls);
    }));
    it('should get a call by id', () => __awaiter(void 0, void 0, void 0, function* () {
        const call = { _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending' };
        mockReq.params.id = validId;
        require('../models/Call').Call.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(call),
        });
        yield (0, callController_1.getCallById)(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(call);
    }));
    it('should return error for invalid call id in getCallById', () => __awaiter(void 0, void 0, void 0, function* () {
        mockReq.params.id = 'invalid-id';
        yield (0, callController_1.getCallById)(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Geçersiz çağrı ID.' });
    }));
    it('should update call status', () => __awaiter(void 0, void 0, void 0, function* () {
        const call = { _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'evaluated' };
        mockReq.params.id = validId;
        mockReq.body.status = 'evaluated';
        require('../models/Call').Call.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValue(call),
        });
        yield (0, callController_1.updateCallStatus)(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(call);
    }));
    it('should return error for invalid call id in updateCallStatus', () => __awaiter(void 0, void 0, void 0, function* () {
        mockReq.params.id = 'invalid-id';
        mockReq.body.status = 'evaluated';
        yield (0, callController_1.updateCallStatus)(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Geçersiz çağrı ID.' });
    }));
    it('should get pending calls', () => __awaiter(void 0, void 0, void 0, function* () {
        const calls = [{ _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending' }];
        require('../models/Call').Call.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(calls),
        });
        yield (0, callController_1.getPendingCalls)(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(calls);
    }));
    it('should delete a call', () => __awaiter(void 0, void 0, void 0, function* () {
        mockReq.params.id = validId;
        require('../models/Call').Call.findByIdAndDelete.mockResolvedValue({});
        yield (0, callController_1.deleteCall)(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Çağrı silindi.' });
    }));
    it('should return error for invalid call id in deleteCall', () => __awaiter(void 0, void 0, void 0, function* () {
        mockReq.params.id = 'invalid-id';
        yield (0, callController_1.deleteCall)(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Geçersiz çağrı ID.' });
    }));
});
