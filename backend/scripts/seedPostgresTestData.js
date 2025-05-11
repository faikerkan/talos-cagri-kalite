const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.PG_URI || 'postgresql://postgres:postgres@localhost:5432/call_center_qa',
});

async function seed() {
  try {
    // Şifreleri hashle
    const hash1 = await bcrypt.hash('123456', 10);
    const hash2 = await bcrypt.hash('123456', 10);
    // 1. Test kullanıcıları ekle
    const userRes1 = await pool.query(`INSERT INTO users (username, password, full_name, role) VALUES ('testagent', $1, 'Test Agent', 'agent') ON CONFLICT (username) DO NOTHING RETURNING id`, [hash1]);
    const userRes2 = await pool.query(`INSERT INTO users (username, password, full_name, role) VALUES ('testmanager', $1, 'Test Manager', 'manager') ON CONFLICT (username) DO NOTHING RETURNING id`, [hash2]);
    const agentId = userRes1.rows[0]?.id || (await pool.query(`SELECT id FROM users WHERE username='testagent'`)).rows[0].id;
    const managerId = userRes2.rows[0]?.id || (await pool.query(`SELECT id FROM users WHERE username='testmanager'`)).rows[0].id;

    // 2. Çağrı ekle
    const callRes = await pool.query(`INSERT INTO calls (agent_id, customer_phone, call_duration, call_date, status) VALUES ($1, '5551234567', 263, NOW(), 'pending') RETURNING id`, [agentId]);
    const callId = callRes.rows[0].id;

    // 3. Değerlendirme ekle
    await pool.query(`INSERT INTO evaluations (call_id, evaluator_id, total_score, notes, evaluation_date) VALUES ($1, $2, 85, 'Başarılı bir görüşme', NOW())`, [callId, managerId]);

    console.log('PostgreSQL test verileri başarıyla eklendi!');
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed(); 