import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`🔌 [MongoDB] Connected to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ [MongoDB] Main database connection failed: ${error.message}`);
    console.log(`🚀 [Memory DB] Spinning up an in-memory MongoDB database...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`🔌 [MongoDB] Connected to in-memory DB at: ${mongoUri}`);
      return true;
    } catch (memError) {
      console.error(`❌ [Memory DB] Failed to start in-memory database: ${memError.message}`);
      console.error(`👉 Please configure MONGODB_URI with your MongoDB Atlas string in backend/.env`);
      return false;
    }
  }
};

export default connectDB;
