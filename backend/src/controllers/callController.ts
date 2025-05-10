import { Request, Response } from 'express';
import { Call } from '../models/Call';
import mongoose from 'mongoose';

export const createCall = async (req: Request, res: Response) => {
  try {
    const { customer_number, duration, date, status } = req.body;
    const agent = (req as any).user.id;

    const call = new Call({
      agent,
      customer_number,
      duration,
      date,
      status: status || 'pending'
    });
    await call.save();

    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ error: 'Çağrı kaydı oluşturulurken bir hata oluştu.' });
  }
};

export const getCalls = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const user = (req as any).user;

    let query = {};
    if (status) {
      query = { status };
    }

    if (user.role === 'agent') {
      query = { ...query, agent: user.id };
    }

    const calls = await Call.find(query)
      .populate('agent', 'full_name username')
      .sort({ date: -1 });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: 'Çağrılar alınırken bir hata oluştu.' });
  }
};

export const getCallById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
    }

    const call = await Call.findById(id).populate('agent', 'full_name username');
    if (!call) {
      return res.status(404).json({ error: 'Çağrı bulunamadı.' });
    }

    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Çağrı detayları alınırken bir hata oluştu.' });
  }
};

export const updateCallStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
    }

    if (!['pending', 'evaluated', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum değeri.' });
    }

    const call = await Call.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('agent', 'full_name username');

    if (!call) {
      return res.status(404).json({ error: 'Çağrı bulunamadı.' });
    }

    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Çağrı durumu güncellenirken bir hata oluştu.' });
  }
};

export const getPendingCalls = async (req: Request, res: Response) => {
  try {
    const calls = await Call.find({ status: 'pending' })
      .populate('agent', 'full_name username')
      .sort({ date: -1 });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: 'Bekleyen çağrılar alınırken bir hata oluştu.' });
  }
};

export const deleteCall = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
    }
    await Call.findByIdAndDelete(id);
    res.json({ message: 'Çağrı silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Çağrı silinemedi.' });
  }
}; 