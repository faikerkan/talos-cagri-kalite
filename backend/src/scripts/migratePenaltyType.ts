import { pool } from '../config/database';

async function migratePenaltyType() {
  try {
    const query = `ALTER TABLE evaluation_details ADD COLUMN IF NOT EXISTS penalty_type VARCHAR(10) DEFAULT 'none';`;
    await pool.query(query);
    console.log('penalty_type alanı başarıyla eklendi (veya zaten mevcut).');
    process.exit(0);
  } catch (error) {
    console.error('Migration hatası:', error);
    process.exit(1);
  }
}

migratePenaltyType(); 