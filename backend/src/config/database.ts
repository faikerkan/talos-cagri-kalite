import mongoose from 'mongoose';

// Mongoose bağlantı seçenekleri
const mongooseOptions = {
  autoIndex: true,
  connectTimeoutMS: 10000, // 10 saniye
  socketTimeoutMS: 45000,   // 45 saniye
  serverSelectionTimeoutMS: 30000, // 30 saniye
  retryWrites: true,
  retryReads: true,
};

// MongoDB'ye bağlanma fonksiyonu
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/call-center-qa';
    
    // Bağlantıyı oluştur
    const conn = await mongoose.connect(mongoURI, mongooseOptions);
    
    console.log(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
    
    // Bağlantı hata yakalama
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB bağlantı hatası: ${err}`);
    });

    // Bağlantı koptuğunda
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB bağlantısı koptu, yeniden bağlanmaya çalışılacak...');
    });

    // Bağlantı yeniden kurulduğunda
    mongoose.connection.on('reconnected', () => {
      console.info('MongoDB ile yeniden bağlantı kuruldu');
    });
    
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    // 3 saniye sonra yeniden deneme
    console.log('Yeniden bağlanmaya çalışılıyor...');
    setTimeout(connectDB, 3000);
  }
};

export default connectDB; 