import pool from './database';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  try {
    // Veritabanı bağlantısını test et
    const client = await pool.connect();
    console.log('Veritabanı bağlantısı başarılı!');

    // SQL şemasını oku ve çalıştır
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('Veritabanı şeması başarıyla oluşturuldu!');

    client.release();
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
    process.exit(1);
  }
}

initializeDatabase(); 