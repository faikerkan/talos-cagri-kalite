import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
    }

    const user = new User({
      username,
      password,
      full_name,
      email,
      role,
    });

    await user.save();

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: 'Kullanıcı oluşturulamadı.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: 'Giriş yapılamadı.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Profil bilgileri alınamadı.' });
  }
};

// --- Kullanıcı Yönetimi ---

// Tüm kullanıcıları listele (sadece manager)
export const listUsers = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'manager') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
  }
};

// Kullanıcı sil (sadece manager)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'manager') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID.' });
    }
    await User.findByIdAndDelete(id);
    res.json({ message: 'Kullanıcı silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı silinemedi.' });
  }
};

// Kullanıcı güncelle (sadece manager)
export const updateUser = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'manager') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID.' });
    }
    const { username, full_name, email, role, status } = req.body;
    // Eğer username değişiyorsa, başka bir kullanıcıda var mı kontrol et
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });
      }
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, full_name, email, role, status },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı güncellenemedi.' });
  }
};

// Yeni kullanıcı ekle (sadece manager)
export const addUser = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'manager') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const { username, password, full_name, email, role } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
    }
    const user = new User({ username, password, full_name, email, role });
    await user.save();
    res.status(201).json({ message: 'Kullanıcı başarıyla eklendi.' });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı eklenemedi.' });
  }
};

// Tüm agent (müşteri temsilcisi) kullanıcıları listele
export const listAgents = async (req: Request, res: Response) => {
  try {
    const agents = await User.find({ role: 'agent' }).select('-password');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Temsilciler alınamadı.' });
  }
}; 