import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/call-center-qa');

    const testUser = new User({
      username: 'test2.user',
      password: 'test123',
      full_name: 'Test Kullanıcı 2',
      email: 'test2@example.com',
      role: 'manager',
    });

    await testUser.save();
    console.log('Test kullanıcısı oluşturuldu:', testUser.username);
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createTestUser(); 