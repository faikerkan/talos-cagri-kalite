const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.PG_URI || 'postgresql://postgres:postgres@localhost:5432/call_center_qa',
});

const agents = [
  { username: 'agent1', full_name: 'Ahmet Yılmaz' },
  { username: 'agent2', full_name: 'Ayşe Demir' },
  { username: 'agent3', full_name: 'Mustafa Çelik' },
  { username: 'agent4', full_name: 'Gülşen Aydın' }
];
const managers = [
  { username: 'manager1', full_name: 'Mehmet Kaya' },
  { username: 'manager2', full_name: 'Zeynep Şahin' }
];

const months = [4, 5, 6]; // Nisan, Mayıs, Haziran

function randomScore() {
  return Math.floor(Math.random() * 41) + 60; // 60-100 arası
}

function randomPhone() {
  return '555' + Math.floor(1000000 + Math.random() * 9000000);
}

async function seed() {
  try {
    // Temizle
    await pool.query('DELETE FROM evaluations');
    await pool.query('DELETE FROM calls');
    await pool.query('DELETE FROM users');

    // Şifreleri hashle
    const agentHash = await bcrypt.hash('123456', 10);
    const managerHash = await bcrypt.hash('123456', 10);

    // Kullanıcıları ekle
    const agentIds = [];
    for (const agent of agents) {
      const res = await pool.query(
        `INSERT INTO users (username, password, full_name, role, status) VALUES ($1, $2, $3, 'agent', 'active') RETURNING id`,
        [agent.username, agentHash, agent.full_name]
      );
      agentIds.push(res.rows[0].id);
    }
    const managerIds = [];
    for (const manager of managers) {
      const res = await pool.query(
        `INSERT INTO users (username, password, full_name, role, status) VALUES ($1, $2, $3, 'manager', 'active') RETURNING id`,
        [manager.username, managerHash, manager.full_name]
      );
      managerIds.push(res.rows[0].id);
    }

    // Her ay için 50 çağrı ve değerlendirme ekle
    let callCount = 1;
    for (const month of months) {
      for (let i = 1; i <= 50; i++) {
        const agentIdx = Math.floor(Math.random() * agentIds.length);
        const managerIdx = Math.floor(Math.random() * managerIds.length);
        const agentId = agentIds[agentIdx];
        const managerId = managerIds[managerIdx];
        const day = Math.floor(Math.random() * 28) + 1;
        const callDate = new Date(2024, month - 1, day, 10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
        const callRes = await pool.query(
          `INSERT INTO calls (agent_id, customer_phone, call_duration, call_date, status) VALUES ($1, $2, $3, $4, 'evaluated') RETURNING id`,
          [agentId, randomPhone(), 180 + Math.floor(Math.random() * 300), callDate]
        );
        const callId = callRes.rows[0].id;
        await pool.query(
          `INSERT INTO evaluations (call_id, evaluator_id, total_score, notes, evaluation_date) VALUES ($1, $2, $3, $4, $5)`,
          [callId, managerId, randomScore(), 'Otomatik test değerlendirmesi', callDate]
        );
        callCount++;
      }
    }
    console.log('Büyük test veri seti başarıyla eklendi!');
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed(); 