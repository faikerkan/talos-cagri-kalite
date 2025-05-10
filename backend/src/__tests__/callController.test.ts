import { createCall, getCalls, getCallById, updateCallStatus, getPendingCalls, deleteCall } from '../controllers/callController';
import { Call } from '../models/Call';
import mongoose from 'mongoose';

// Mock the Call model and its chainable methods
type CallType = any;

jest.mock('../models/Call', () => {
  const actual = jest.requireActual('../models/Call');
  return {
    ...actual,
    Call: jest.fn(),
  };
});

const validId = new mongoose.Types.ObjectId().toHexString();

// Helper to mock chainable methods (populate, sort)
function mockChain(result: any) {
  return {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue(result),
    exec: jest.fn().mockResolvedValue(result),
    then: (cb: any) => Promise.resolve(cb(result)),
  };
}

describe('Call Controller', () => {
  let mockReq: any;
  let mockRes: any;

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

  it('should create a new call', async () => {
    const newCall = { agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending', _id: validId };
    mockReq.body = { customer_number: '1234567890', duration: '5', date: '2023-01-01' };
    (require('../models/Call').Call as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(newCall),
      ...newCall,
    }));

    await createCall(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(newCall));
  });

  it('should get all calls', async () => {
    const calls = [{ _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending' }];
    (require('../models/Call').Call.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(calls),
    });

    await getCalls(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(calls);
  });

  it('should get a call by id', async () => {
    const call = { _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending' };
    mockReq.params.id = validId;
    (require('../models/Call').Call.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(call),
    });

    await getCallById(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(call);
  });

  it('should return error for invalid call id in getCallById', async () => {
    mockReq.params.id = 'invalid-id';
    await getCallById(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Geçersiz çağrı ID.' });
  });

  it('should update call status', async () => {
    const call = { _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'evaluated' };
    mockReq.params.id = validId;
    mockReq.body.status = 'evaluated';
    (require('../models/Call').Call.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(call),
    });

    await updateCallStatus(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(call);
  });

  it('should return error for invalid call id in updateCallStatus', async () => {
    mockReq.params.id = 'invalid-id';
    mockReq.body.status = 'evaluated';
    await updateCallStatus(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Geçersiz çağrı ID.' });
  });

  it('should get pending calls', async () => {
    const calls = [{ _id: validId, agent: validId, customer_number: '1234567890', duration: '5', date: '2023-01-01', status: 'pending' }];
    (require('../models/Call').Call.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(calls),
    });

    await getPendingCalls(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(calls);
  });

  it('should delete a call', async () => {
    mockReq.params.id = validId;
    (require('../models/Call').Call.findByIdAndDelete as jest.Mock).mockResolvedValue({});

    await deleteCall(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Çağrı silindi.' });
  });

  it('should return error for invalid call id in deleteCall', async () => {
    mockReq.params.id = 'invalid-id';
    await deleteCall(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Geçersiz çağrı ID.' });
  });
}); 