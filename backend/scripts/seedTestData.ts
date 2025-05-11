import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../src/models/User';
import { Call } from '../src/models/Call';
import { Evaluation } from '../src/models/Evaluation';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/talos';

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Kullanıcıları bul
  const agent = await User.findOne({ role: 'agent' });
  const manager = await User.findOne({ role: 'manager' });
  const qualityExpert = await User.findOne({ role: 'quality_expert' });

  if (!agent || !manager) {
    console.log('Test için en az bir agent ve bir manager kullanıcı olmalı!');
    process.exit(1);
  }

  // Çağrı ekle
  const call1 = await Call.create({
    agent: agent._id,
    customer_number: '5551234567',
    duration: '00:04:23',
    date: new Date('2024-05-08T14:23:45'),
    status: 'pending'
  });
  const call2 = await Call.create({
    agent: agent._id,
    customer_number: '5559876543',
    duration: '00:03:15',
    date: new Date('2024-05-07T10:15:22'),
    status: 'evaluated'
  });

  // Değerlendirme ekle
  await Evaluation.create({
    call_id: call2._id,
    evaluator_id: manager._id,
    total_score: 85,
    notes: 'Başarılı bir görüşme',
    evaluation_date: new Date('2024-05-07T10:20:00')
  });

  console.log('Test verileri başarıyla eklendi!');
  process.exit(0);
}

seed(); 