import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from './config/db.js';
import registerTelemetrySocket from './sockets/telemetry.js';

// Route Imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import vehicleRoutes from './routes/vehicles.js';
import bookingRoutes from './routes/bookings.js';
import stationRoutes from './routes/stations.js';
import sessionRoutes from './routes/sessions.js';
import communityRoutes from './routes/community.js';
import rewardsRoutes from './routes/rewards.js';
import emergencyRoutes from './routes/emergency.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import telemetryRoutes from './routes/telemetry.js';
import voiceRoutes from './routes/voice.js';
import navigationRoutes from './routes/navigation.js';
import adminRoutes from './routes/admin.js';
import locationRoutes from './routes/location.js';

// Model Imports (for seeding)
import Station from './models/Station.js';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Notification from './models/Notification.js';
import SavedLocation from './models/SavedLocation.js';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to MongoDB Atlas
connectDB().then(async (isConnected) => {
  if (isConnected) {
    await seedStations();
    await seedUsersAndData();
  } else {
    console.log('⚠️ [DB Seed] Skipping seed because database connection is offline.');
  }
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from all origins for local dev convenience
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Register Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/location', locationRoutes);

// Base route for connectivity verification
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'Smart EV Assistant API is fully operational' });
});

// Configure Live Telemetry streams
registerTelemetrySocket(io);

// Database Seeding Logic for Default Charging Stations
async function seedStations() {
  try {
    const count = await Station.countDocuments({});
    if (count === 0) {
      console.log('⚡ [DB Seed] Stations collection is empty. Seeding default charging nodes...');
      const seedList = [
        {
          _id: 'st_bandra_01',
          name: 'PulseCharge HyperHub',
          location: {
            type: 'Point',
            coordinates: [72.8311, 19.0596],
            address: 'Linking Road, Bandra West, Mumbai'
          },
          operator: 'PulseCharge India',
          amenities: ['WiFi', 'Cafe', 'Restroom', 'Lounge'],
          rating: 4.8,
          reviewsCount: 2,
          reviews: [
            { userName: 'Amit Sharma', rating: 5, comment: 'Incredible speed! Charged my Nexon EV Max in under 30 minutes.' },
            { userName: 'Rohan Mehta', rating: 4, comment: 'Good cafe nearby, slots are clean and operators are helpful.' }
          ],
          pricing_per_kWh: 15.5,
          slots: [
            { id: 's1', type: 'DC Fast (CCS)', power_kW: 150, status: 'available' },
            { id: 's2', type: 'DC Fast (CCS)', power_kW: 150, status: 'occupied' },
            { id: 's3', type: 'AC (Type 2)', power_kW: 22, status: 'available' },
            { id: 's4', type: 'AC (Type 2)', power_kW: 22, status: 'occupied' }
          ]
        },
        {
          _id: 'st_andheri_02',
          name: 'EcoVoltage Plaza',
          location: {
            type: 'Point',
            coordinates: [72.8696, 19.1176],
            address: 'Metro Station Road, Andheri East, Mumbai'
          },
          operator: 'EcoVoltage',
          amenities: ['Restroom', 'Shopping Mall', 'Food Court'],
          rating: 4.2,
          reviewsCount: 2,
          reviews: [
            { userName: 'Neha K.', rating: 4, comment: 'Great location next to the mall, easy to charge while shopping.' },
            { userName: 'Suresh P.', rating: 3.5, comment: 'Reliable chargers, but type 2 ports can be busy during evenings.' }
          ],
          pricing_per_kWh: 12.0,
          slots: [
            { id: 'a1', type: 'AC (Type 2)', power_kW: 22, status: 'available' },
            { id: 'a2', type: 'AC (Type 2)', power_kW: 22, status: 'available' },
            { id: 'a3', type: 'AC (Type 2)', power_kW: 22, status: 'occupied' },
            { id: 'a4', type: 'AC (Type 2)', power_kW: 11, status: 'available' }
          ]
        },
        {
          _id: 'st_powai_03',
          name: 'VoltGrid Supercharger',
          location: {
            type: 'Point',
            coordinates: [72.9114, 19.1197],
            address: 'Hiranandani Gardens, Powai, Mumbai'
          },
          operator: 'VoltGrid Corp',
          amenities: ['Cafe', 'Work Pods', 'Supermarket'],
          rating: 4.9,
          reviewsCount: 3,
          reviews: [
            { userName: 'Vikram S.', rating: 5, comment: 'Outstanding DC hypercharger, highly recommended!' },
            { userName: 'Priya R.', rating: 5, comment: 'Very fast charging, super convenient lounge area.' },
            { userName: 'Anil M.', rating: 4.7, comment: 'Amazing 240kW output, charges in no time.' }
          ],
          pricing_per_kWh: 18.0,
          slots: [
            { id: 'p1', type: 'DC Hyper (CCS)', power_kW: 240, status: 'available' },
            { id: 'p2', type: 'DC Hyper (CCS)', power_kW: 240, status: 'occupied' },
            { id: 'p3', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' },
            { id: 'p4', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' }
          ]
        },
        {
          _id: 'st_chembur_04',
          name: 'ZonEV Charging Hub',
          location: {
            type: 'Point',
            coordinates: [72.8992, 19.0617],
            address: 'Eastern Express Highway, Chembur, Mumbai'
          },
          operator: 'ZonEV',
          amenities: ['Restroom', 'Dining', 'EV Repair Shop'],
          rating: 4.5,
          reviewsCount: 1,
          reviews: [
            { userName: 'Kunal G.', rating: 4.5, comment: 'Clean slots, average speed but reliable pricing.' }
          ],
          pricing_per_kWh: 14.2,
          slots: [
            { id: 'z1', type: 'DC Fast (CCS)', power_kW: 60, status: 'available' },
            { id: 'z2', type: 'DC Fast (CHAdeMO)', power_kW: 50, status: 'occupied' },
            { id: 'z3', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_thane_05',
          name: 'NexDrive Express Station',
          location: {
            type: 'Point',
            coordinates: [72.9780, 19.2183],
            address: 'Ghodbunder Road, Thane West, Mumbai'
          },
          operator: 'NexDrive',
          amenities: ['Restroom', 'Coffee Shop'],
          rating: 4.0,
          reviewsCount: 1,
          reviews: [
            { userName: 'Sneha L.', rating: 4, comment: 'Nice coffee shop near the bays. Speed is good.' }
          ],
          pricing_per_kWh: 13.0,
          slots: [
            { id: 'n1', type: 'DC Fast (CCS)', power_kW: 60, status: 'available' },
            { id: 'n2', type: 'AC (Type 2)', power_kW: 11, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_poonamallee_01',
          name: 'PulseCharge Poonamallee Hub',
          location: {
            type: 'Point',
            coordinates: [80.0950, 13.0480],
            address: 'Poonamallee High Road, Chennai'
          },
          operator: 'PulseCharge India',
          amenities: ['Restroom', 'WiFi', 'Cafe'],
          rating: 4.7,
          reviewsCount: 1,
          reviews: [{ userName: 'Vijay K.', rating: 5, comment: 'Very convenient location right on the highway.' }],
          pricing_per_kWh: 15.0,
          slots: [
            { id: 'c1_1', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' },
            { id: 'c1_2', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' },
            { id: 'c1_3', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_nazarathpet_02',
          name: 'EcoVoltage Nazarathpet',
          location: {
            type: 'Point',
            coordinates: [80.0650, 13.0410],
            address: 'Bangalore National Highway, Nazarathpet, Chennai'
          },
          operator: 'EcoVoltage',
          amenities: ['Restroom', 'Lounge'],
          rating: 4.3,
          reviewsCount: 1,
          reviews: [{ userName: 'Ajay S.', rating: 4, comment: 'Good charging speeds, located near the bypass.' }],
          pricing_per_kWh: 13.5,
          slots: [
            { id: 'c2_1', type: 'DC Fast (CCS)', power_kW: 80, status: 'available' },
            { id: 'c2_2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_porur_03',
          name: 'VoltGrid Porur Supercharger',
          location: {
            type: 'Point',
            coordinates: [80.1550, 13.0380],
            address: 'Porur Bypass Road, Chennai'
          },
          operator: 'VoltGrid Corp',
          amenities: ['WiFi', 'Supermarket', 'Cafe'],
          rating: 4.8,
          reviewsCount: 2,
          reviews: [
            { userName: 'Ramya N.', rating: 5, comment: 'Amazing 240kW output chargers!' },
            { userName: 'Karthik P.', rating: 4.6, comment: 'Clean slots and quick charging.' }
          ],
          pricing_per_kWh: 17.5,
          slots: [
            { id: 'c3_1', type: 'DC Hyper (CCS)', power_kW: 240, status: 'available' },
            { id: 'c3_2', type: 'DC Hyper (CCS)', power_kW: 240, status: 'occupied' },
            { id: 'c3_3', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_guindy_04',
          name: 'PulseCharge Guindy Hub',
          location: {
            type: 'Point',
            coordinates: [80.2150, 13.0080],
            address: 'Guindy Industrial Estate, Chennai'
          },
          operator: 'PulseCharge India',
          amenities: ['WiFi', 'Restroom', 'Cafe'],
          rating: 4.5,
          reviewsCount: 1,
          reviews: [{ userName: 'Srinivasan R.', rating: 4, comment: 'Quick charging, very close to metro station.' }],
          pricing_per_kWh: 15.5,
          slots: [
            { id: 'c4_1', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' },
            { id: 'c4_2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_thiruvanmiyur_05',
          name: 'EcoVoltage Thiruvanmiyur',
          location: {
            type: 'Point',
            coordinates: [80.2550, 12.9840],
            address: 'ECR Road, Thiruvanmiyur, Chennai'
          },
          operator: 'EcoVoltage',
          amenities: ['Restroom', 'Lounge'],
          rating: 4.6,
          reviewsCount: 1,
          reviews: [{ userName: 'Prakash M.', rating: 5, comment: 'Excellent setup next to ECR entrance.' }],
          pricing_per_kWh: 14.0,
          slots: [
            { id: 'c5_1', type: 'DC Fast (CCS)', power_kW: 80, status: 'available' },
            { id: 'c5_2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_sriperumbudur_06',
          name: 'PulseCharge Sriperumbudur Hub',
          location: {
            type: 'Point',
            coordinates: [79.9722, 12.9734],
            address: 'NH 48, Sriperumbudur, Tamil Nadu'
          },
          operator: 'PulseCharge India',
          amenities: ['WiFi', 'Restroom', 'Cafe', 'Dining'],
          rating: 4.6,
          reviewsCount: 1,
          reviews: [{ userName: 'Venkat S.', rating: 5, comment: 'Perfect highway stop for charging.' }],
          pricing_per_kWh: 15.0,
          slots: [
            { id: 'c6_1', type: 'DC Fast (CCS)', power_kW: 120, status: 'available' },
            { id: 'c6_2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_sunguvarchatram_07',
          name: 'EcoVoltage Sunguvarchatram',
          location: {
            type: 'Point',
            coordinates: [79.8653, 12.9234],
            address: 'Bangalore Highway, Sunguvarchatram, Tamil Nadu'
          },
          operator: 'EcoVoltage',
          amenities: ['Restroom', 'Lounge'],
          rating: 4.2,
          reviewsCount: 1,
          reviews: [{ userName: 'Murugan K.', rating: 4, comment: 'Good charging speed, next to a motel.' }],
          pricing_per_kWh: 13.5,
          slots: [
            { id: 'c7_1', type: 'DC Fast (CCS)', power_kW: 80, status: 'available' },
            { id: 'c7_2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        },
        {
          _id: 'st_chennai_kanchipuram_08',
          name: 'VoltGrid Kanchipuram Hub',
          location: {
            type: 'Point',
            coordinates: [79.7050, 12.8350],
            address: 'Temple Town Road, Kanchipuram, Tamil Nadu'
          },
          operator: 'VoltGrid Corp',
          amenities: ['WiFi', 'Cafe', 'Lounge'],
          rating: 4.8,
          reviewsCount: 2,
          reviews: [
            { userName: 'Dinesh B.', rating: 5, comment: 'Excellent DC hypercharger, highly recommended!' }
          ],
          pricing_per_kWh: 17.5,
          slots: [
            { id: 'c8_1', type: 'DC Hyper (CCS)', power_kW: 240, status: 'available' },
            { id: 'c8_2', type: 'AC (Type 2)', power_kW: 22, status: 'available' }
          ]
        }
      ];

      await Station.insertMany(seedList);
      console.log('⚡ [DB Seed] Charging nodes successfully loaded!');
    }
  } catch (err) {
    console.error('❌ [DB Seed] Seeding error:', err.message);
  }
}

async function seedUsersAndData() {
  try {
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      console.log('⚡ [DB Seed] User collection is empty. Seeding default driver, admin, and operator accounts...');
      
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

      const admin = await User.create({
        name: 'Admin Master',
        email: 'admin@ev.app',
        password: 'Admin@1234',
        phone: '+919876543214',
        role: 'admin',
        points: 1000,
        tier: 'gold'
      });

      const operator = await User.create({
        name: 'Operator Station',
        email: 'operator@ev.app',
        password: 'Operator@1234',
        phone: '+919876543215',
        role: 'station_operator',
        points: 200,
        tier: 'bronze'
      });

      console.log('⚡ [DB Seed] Default accounts created: test1@ev.app / admin@ev.app / operator@ev.app');

      // Seed vehicle for the driver
      await Vehicle.create({
        userId: driver._id,
        name: 'My Nexon EV',
        brand: 'Tata',
        model: 'Nexon EV Max',
        year: 2023,
        batteryCapacity_kWh: 40.5,
        currentCharge_percent: 45,
        range_km: 243,
        plateNumber: 'MH02CP4321',
        isDefault: true
      });

      console.log('⚡ [DB Seed] Seeded default vehicle for test1@ev.app');

      // Seed initial notifications for the driver
      await Notification.create([
        {
          userId: driver._id,
          title: '🔋 Charge High Alert',
          body: 'Nexon EV is at 80%. Unplug to optimize long-term health.',
          type: 'charge_low',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          userId: driver._id,
          title: '⏰ Shift Start Reminder',
          body: 'Your reserved slot at Powai VoltGrid begins in 15 minutes.',
          type: 'booking',
          isRead: false,
          createdAt: new Date(Date.now() - 10 * 60 * 1000)
        },
        {
          userId: driver._id,
          title: '🌱 Carbon Reward Credited',
          body: 'Earned 50 Carbon Coins for eco slot charging.',
          type: 'promo',
          isRead: false,
          createdAt: new Date(Date.now() - 60 * 60 * 1000)
        }
      ]);

      console.log('⚡ [DB Seed] Seeded initial notifications for test1@ev.app');

      // Seed default saved/favorite locations for the driver
      await SavedLocation.create([
        { userId: driver._id, name: 'Home (Bandra)', address: 'Linking Road, Bandra West, Mumbai', coordinates: [72.8311, 19.0596], isFavorite: true, type: 'favorite' },
        { userId: driver._id, name: 'Work (Powai)', address: 'Hiranandani Gardens, Powai, Mumbai', coordinates: [72.9114, 19.1197], isFavorite: true, type: 'favorite' },
        { userId: driver._id, name: 'EcoVoltage Andheri', address: 'Metro Station Road, Andheri East, Mumbai', coordinates: [72.8696, 19.1176], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'ZonEV Chembur Hub', address: 'Eastern Express Highway, Chembur, Mumbai', coordinates: [72.8992, 19.0617], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'Gateway of India', address: 'Apollo Bandar, Colaba, Mumbai', coordinates: [72.8347, 18.9220], isFavorite: false, type: 'landmark' },
        { userId: driver._id, name: 'Juhu Beach', address: 'Juhu Tara Road, Vile Parle West, Mumbai', coordinates: [72.8273, 19.0988], isFavorite: false, type: 'landmark' },
        // Chennai Seeds
        { userId: driver._id, name: 'Home (Poonamallee)', address: 'Poonamallee High Road, Chennai', coordinates: [80.0945, 13.0473], isFavorite: true, type: 'favorite' },
        { userId: driver._id, name: 'PulseCharge Poonamallee Hub', address: 'Poonamallee High Road, Chennai', coordinates: [80.0950, 13.0480], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'EcoVoltage Nazarathpet', address: 'Bangalore National Highway, Chennai', coordinates: [80.0650, 13.0410], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'VoltGrid Porur Supercharger', address: 'Porur Bypass Road, Chennai', coordinates: [80.1550, 13.0380], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'Thiruvanmiyur', address: 'East Coast Road, Thiruvanmiyur, Chennai', coordinates: [80.2586, 12.9830], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'Guindy', address: 'Guindy National Highway, Chennai', coordinates: [80.2200, 13.0060], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'Velachery', address: 'Velachery Bypass Road, Chennai', coordinates: [80.2250, 12.9800], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'Kanchipuram', address: 'Kanchipuram, Tamil Nadu', coordinates: [79.7016, 12.8342], isFavorite: false, type: 'destination' },
        { userId: driver._id, name: 'Sriperumbudur', address: 'Sriperumbudur Highway, Tamil Nadu', coordinates: [79.9722, 12.9734], isFavorite: false, type: 'destination' }
      ]);
      console.log('⚡ [DB Seed] Seeded default saved and favorite locations.');
    }

    // Ensure all existing users have at least one default vehicle
    const allUsers = await User.find({});
    for (const u of allUsers) {
      const vCount = await Vehicle.countDocuments({ userId: u._id });
      if (vCount === 0) {
        console.log(`⚡ [DB Seed] Auto-creating default vehicle for user: ${u.name} (${u.email})`);
        await Vehicle.create({
          userId: u._id,
          name: `${u.role === 'admin' ? 'Admin' : u.role === 'station_operator' ? 'Operator' : 'My'} Nexon EV`,
          brand: 'Tata',
          model: 'Nexon EV Max',
          year: 2023,
          batteryCapacity_kWh: 40.5,
          currentCharge_percent: 45,
          range_km: 243,
          plateNumber: u.role === 'admin' ? 'MH02CP9999' : u.role === 'station_operator' ? 'MH02CP8888' : 'MH02CP4321',
          isDefault: true
        });
      }
    }
  } catch (err) {
    console.error('❌ [DB Seed] Seeding users failed:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 [Server] Operational on port ${PORT}`);
});
