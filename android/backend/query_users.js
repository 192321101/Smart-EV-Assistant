import './config/env.js';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

async function queryUsers() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to DB');
    process.exit(1);
  }

  try {
    const users = await User.find({});
    console.log(`--- Users in Database (${users.length}) ---`);
    for (const u of users) {
      console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    }
  } catch (err) {
    console.error('Error querying users:', err);
  } finally {
    await mongoose.disconnect();
  }
}

queryUsers();
