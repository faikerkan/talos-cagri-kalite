import { Request, Response } from 'express';
import { Call } from '../models/Call';
import mongoose from 'mongoose';
import { pool } from '../config/database';

// Multer ile dosya yükleme için Request tipini genişlet
interface MulterRequest extends Request {
  file?: any;
}

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
    const user = req.user;
    let query = 'SELECT c.id, c.customer_phone, c.call_duration, c.call_date, c.status, u.id as agent_id, u.full_name as agent_full_name, u.username as agent_username FROM calls c JOIN users u ON c.agent_id = u.id';
    const params: any[] = [];
    const where: string[] = [];
    if (status) {
      where.push('c.status = $' + (params.length + 1));
      params.push(status);
    }
    if (user && user.role === 'agent') {
      where.push('c.agent_id = $' + (params.length + 1));
      params.push(user.id);
    }
    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    query += ' ORDER BY c.call_date DESC';
    const result = await pool.query(query, params);
    // Frontend ile uyumlu veri formatı
    const calls = result.rows.map(row => ({
      id: row.id,
      agent: { full_name: row.agent_full_name, username: row.agent_username },
      customer_number: row.customer_phone,
      duration: row.call_duration,
      date: row.call_date,
      status: row.status
    }));
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

// MP3 dosya yükleme
export const uploadRecording = async (req: MulterRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz çağrı ID.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }
    const call = await Call.findByIdAndUpdate(
      id,
      { recording_path: req.file.path },
      { new: true }
    );
    if (!call) {
      return res.status(404).json({ error: 'Çağrı bulunamadı.' });
    }
    res.json({ message: 'Kayıt başarıyla yüklendi.', call });
  } catch (error) {
    res.status(500).json({ error: 'Kayıt yüklenirken bir hata oluştu.' });
  }
}; 