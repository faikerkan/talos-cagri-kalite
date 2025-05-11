import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import path from 'path';
import fs from 'fs';

// .env dosyasını yükle
dotenv.config();

// Veritabanı bağlantısını yap
connectDB();

// Uploads dizinini kontrol et ve yoksa oluştur
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads dizini oluşturuldu');
}

// Sunucuyu başlat
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor (${process.env.NODE_ENV} modu)`);
});

// Beklenmeyen kapanmalarda sunucuyu düzgün şekilde durdur
process.on('unhandledRejection', (err: Error) => {
  console.error(`Yakalanmamış Hata: ${err.message}`);
  console.log('Sunucu kapatılıyor...');
  server.close(() => {
    process.exit(1);
  });
}); 