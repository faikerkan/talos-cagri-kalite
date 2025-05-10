import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';
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

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    // Gerekli alanların kontrolü
    if (!username || !password || !full_name || !email || !role) {
      return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
    }

    // Geçerli roller kontrolü
    const validRoles = ['agent', 'quality_expert', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol değeri.' });
    }

    // Kullanıcı adı veya email ile kullanıcı var mı kontrolü
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Bu kullanıcı adı veya email adresi zaten kullanımda.',
      });
    }

    // Yeni kullanıcı oluştur
    const newUser = new User({
      username,
      password, // Model içinde hash edilecek
      full_name,
      email,
      role,
    });

    await newUser.save();

    // Önbellekleri temizle çünkü kullanıcı listesi değişti
    cache.delete(CACHE_KEYS.USER_LIST);

    // Token oluştur
    const token = generateToken(newUser._id.toString());

    customLogger.info(`Yeni kullanıcı kaydı: ${username} (${role})`);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser._id,
        username: newUser.username,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    customLogger.error('Kullanıcı kaydı hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Gerekli alanların kontrolü
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ username });

    // Kullanıcı yoksa veya şifre yanlışsa
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
    }

    // Token oluştur
    const token = generateToken(user._id.toString());

    customLogger.info(`Kullanıcı girişi: ${username} (${user.role})`);

    res.status(200).json({
      message: 'Giriş başarılı',
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    customLogger.error('Kullanıcı girişi hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // UserId formatını kontrol et
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı.' });
    }

    // Önbellekten kullanıcı bilgilerini kontrol et
    const cacheKey = CACHE_KEYS.USER_BY_ID(userId);
    const cachedUser = cache.get<any>(cacheKey);
    
    if (cachedUser) {
      customLogger.debug(`Cache hit for user: ${userId}`);
      return res.status(200).json(cachedUser);
    }

    // Önbellekte yoksa veritabanından al
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Sonucu önbelleğe ekle
    const userData = {
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };
    
    cache.set(cacheKey, userData, CACHE_TTL.DETAIL);

    res.status(200).json(userData);
  } catch (error) {
    customLogger.error('Kullanıcı bilgisi getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Önbellekten kullanıcı listesini kontrol et
    const cachedUsers = cache.get<any[]>(CACHE_KEYS.USER_LIST);
    
    if (cachedUsers) {
      customLogger.debug('Cache hit for user list');
      return res.status(200).json(cachedUsers);
    }

    // Önbellekte yoksa veritabanından al
    const users = await User.find().select('-password');
    
    // Kullanıcı verilerini formatla
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    }));

    // Sonucu önbelleğe ekle
    cache.set(CACHE_KEYS.USER_LIST, formattedUsers, CACHE_TTL.LIST);

    res.status(200).json(formattedUsers);
  } catch (error) {
    customLogger.error('Kullanıcı listesi getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { full_name, email, role } = req.body;

    // UserId formatını kontrol et
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı.' });
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Rol değişimi için kontrol
    if (role && !['agent', 'quality_expert', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol değeri.' });
    }

    // Güncelleme alanlarını ayarla
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    // İlgili önbellekleri temizle
    cache.delete(CACHE_KEYS.USER_LIST);
    cache.delete(CACHE_KEYS.USER_BY_ID(userId));

    customLogger.info(`Kullanıcı güncellendi: ${user.username}`);

    res.status(200).json({
      message: 'Kullanıcı başarıyla güncellendi',
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    customLogger.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // UserId formatını kontrol et
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID formatı.' });
    }

    // Kullanıcıyı bul ve sil
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // İlgili önbellekleri temizle
    cache.delete(CACHE_KEYS.USER_LIST);
    cache.delete(CACHE_KEYS.USER_BY_ID(userId));

    customLogger.info(`Kullanıcı silindi: ${user.username}`);

    res.status(200).json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    customLogger.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // Auth middleware'inden gelen kullanıcı bilgisi
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme hatası' });
    }

    // Önbellekten kullanıcı bilgilerini kontrol et
    const cacheKey = CACHE_KEYS.USER_BY_ID(userId.toString());
    const cachedUser = cache.get<any>(cacheKey);
    
    if (cachedUser) {
      customLogger.debug(`Cache hit for user profile: ${userId}`);
      return res.status(200).json(cachedUser);
    }

    // Önbellekte yoksa veritabanından al
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Sonucu önbelleğe ekle
    const userData = {
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };
    
    cache.set(cacheKey, userData, CACHE_TTL.DETAIL);

    res.status(200).json(userData);
  } catch (error) {
    customLogger.error('Profil bilgisi getirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Yetkilendirme hatası' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir.' });
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Mevcut şifreyi kontrol et
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mevcut şifre yanlış.' });
    }

    // Yeni şifreyi ayarla
    user.password = newPassword;
    await user.save();

    customLogger.info(`Kullanıcı şifresi değiştirildi: ${user.username}`);

    res.status(200).json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    customLogger.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

// --- Kullanıcı Yönetimi ---

// Tüm kullanıcıları listele (sadece manager)
export const listUsers = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role !== 'manager') {
      return res.status(403).json({ error: 'Yetkiniz yok.' });
    }
    const users = await User.find().select('-password').sort({ full_name: 1 });
    res.json(users);
  } catch (error) {
    customLogger.error('Kullanıcıları listeleme hatası', { error });
    res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
  }
};

// Tüm agent (müşteri temsilcisi) kullanıcıları listele
export const listAgents = async (req: Request, res: Response) => {
  try {
    const agents = await User.find({ role: 'agent', status: 'active' })
      .select('-password')
      .sort({ full_name: 1 });
    res.json(agents);
  } catch (error) {
    customLogger.error('Temsilcileri listeleme hatası', { error });
    res.status(500).json({ error: 'Temsilciler alınamadı.' });
  }
}; 