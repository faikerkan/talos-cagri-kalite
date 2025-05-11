import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';
import { customLogger } from '../utils/logger';
import cache from '../utils/cache';

// Önbellek anahtarları için sabitler
const CACHE_KEYS = {
  USER_LIST: 'users:list',
  USER_BY_ID: (id: string) => `users:id:${id}`,
  USER_ROLES: 'users:roles',
};

// Önbellek TTL değerleri (millisaniye)
const CACHE_TTL = {
  LIST: 5 * 60 * 1000, // 5 dakika
  DETAIL: 10 * 60 * 1000, // 10 dakika
  ROLES: 30 * 60 * 1000, // 30 dakika
};

// Kullanıcı kaydı
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, full_name, email, role, status } = req.body;
    if (!username || !password || !full_name || !email || !role) {
      return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
    }
    const validRoles = ['agent', 'quality_expert', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol değeri.' });
    }
    // Kullanıcı adı veya email var mı kontrol et
    const existing = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanımda.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, full_name, email, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, email, role, status',
      [username, hashed, full_name, email, role, status || 'active']
    );
    const user = result.rows[0];
    const token = generateToken(user.id.toString(), user.username, user.role);
    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user,
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Kullanıcı girişi
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
    }
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }
    const token = generateToken(user.id.toString(), user.username, user.role);
    res.status(200).json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Profil bilgisi
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı.' });
    }
    const result = await pool.query('SELECT id, username, full_name, email, role, status FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Kullanıcı güncelleme
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { full_name, email, role, status } = req.body;
    const validRoles = ['agent', 'quality_expert', 'manager'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol değeri.' });
    }
    const result = await pool.query('UPDATE users SET full_name = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING id, username, full_name, email, role, status', [full_name, email, role, status, userId]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json({ message: 'Kullanıcı başarıyla güncellendi', user });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Kullanıcı silme
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// Tüm kullanıcıları listele (sadece manager)
export const listUsers = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const result = await pool.query('SELECT id, username, full_name, email, role, status FROM users ORDER BY full_name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
  }
};

// Tüm agent kullanıcıları listele
export const listAgents = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT id, username, full_name, email, role, status FROM users WHERE role = 'agent' ORDER BY full_name ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Temsilciler alınamadı.' });
  }
}; 