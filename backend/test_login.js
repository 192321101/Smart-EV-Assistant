import './config/env.js';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

async function diagnose() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to DB');
    process.exit(1);
  }

  try {
    // Replicate User seeding code
    console.log('Seeding users...');
    const driver = await User.create({
      name: 'Amit Sharma',
      email: 'test1@ev.app',
      password: 'Test@1234',
      phone: '+919876543210',
      evModel: '4 Wheeler',
      role: 'driver',
      points: 450,
      tier: 'silver'
    });

    const user_prabha = await User.create({
      name: 'Prabha User',
      email: 'prabha02102005@gmail.com',
      password: '123456789',
      phone: '+919876543219',
      evModel: '4 Wheeler',
      role: 'driver',
      points: 450,
      tier: 'silver'
    });

    const users = await User.find({});
    console.log(`Found ${users.length} users in DB:`);
    for (const u of users) {
      const matchTest = await bcrypt.compare('Test@1234', u.password);
      const matchPrabha = await bcrypt.compare('123456789', u.password);
      console.log(`- Name: ${u.name}, Email: ${u.email}, Password Hash: ${u.password}`);
      console.log(`  Is 'Test@1234': ${matchTest}, Is '123456789': ${matchPrabha}`);
    }
  } catch (err) {
    console.error('Error during diagnosis:', err);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
