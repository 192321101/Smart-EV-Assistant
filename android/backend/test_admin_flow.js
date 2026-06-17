import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting EV Admin Supervisory Controls & Sockets Test Flow...');
  
  try {
    // 1. Authenticate standard driver first
    console.log('\n🔐 [Auth Guard] Logging in standard driver (test1@ev.app)...');
    const driverAuthRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test1@ev.app',
      password: 'Test@1234'
    });
    
    const driverToken = driverAuthRes.data.accessToken;
    console.log('🔐 [Auth Guard] Attempting to access admin directory as standard driver...');
    try {
      await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      throw new Error('Access should have been denied to a standard driver account!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`✅ [Auth Guard] Successfully blocked unauthorized driver role. Code: 403, Message: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 2. Authenticate admin user
    console.log('\n🔑 [Admin Auth] Logging in administrator (admin@ev.app)...');
    const adminAuthRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ev.app',
      password: 'Admin@1234'
    });
    
    const adminToken = adminAuthRes.data.accessToken;
    const adminUser = adminAuthRes.data.user;
    console.log(`✅ [Admin Auth] Welcome Master Admin, ${adminUser.name}!`);

    // 3. User directory retrieval
    console.log('\n👥 [User Directory] Querying all registered accounts...');
    const usersRes = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const totalUsers = usersRes.data.users.length;
    console.log(`✅ [User Directory] Found ${totalUsers} users in DB.`);
    
    // Choose first driver to edit
    const targetDriver = usersRes.data.users.find(u => u.role === 'driver');
    if (!targetDriver) {
      throw new Error('No driver found in database seeds to perform admin updates!');
    }
    console.log(`👉 Target driver chosen for update: "${targetDriver.name}" (ID: ${targetDriver._id})`);

    // 4. Update driver specifications
    console.log(`\n👥 [User Edit] Upgrading "${targetDriver.name}" carbon points to 600 and tier to "gold"...`);
    const editRes = await axios.put(`${API_URL}/admin/users/${targetDriver._id}`, {
      name: targetDriver.name,
      tier: 'gold',
      points: 600
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const updatedDriver = editRes.data.user;
    console.log(`✅ [User Edit] Status: "${editRes.data.message}"`);
    console.log(`✅ [User Edit] Verification: Tier="${updatedDriver.tier}", Points=${updatedDriver.points}`);
    if (updatedDriver.tier !== 'gold' || updatedDriver.points !== 600) {
      throw new Error('User edits did not persist correctly!');
    }

    // 5. Booking auditing monitor
    console.log('\n📖 [Bookings Monitor] Auditing slot reservation logs...');
    const bookingsRes = await axios.get(`${API_URL}/admin/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ [Bookings Monitor] Found ${bookingsRes.data.bookings.length} slot reservations logged.`);

    // 6. Systems analytics overview
    console.log('\n📊 [Analytics Monitor] Retrieving power grid loads & connected drivers analytics...');
    const analyticsRes = await axios.get(`${API_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const { metrics, recentBookings } = analyticsRes.data;
    console.log(`✅ [Analytics Monitor] Metrics:`);
    console.log(`   - Online Registered Drivers: ${metrics.totalDrivers}`);
    console.log(`   - Active Grid Telemetry Load: ${metrics.activeLoadKw} kW`);
    console.log(`   - Completed Energy Consumption: ${metrics.totalEnergyDelivered} kWh`);
    console.log(`   - Completed Grid Billing Revenue: Rs. ${metrics.totalRevenue}`);
    console.log(`✅ [Analytics Monitor] Verified ${recentBookings.length} recent bookings in feed.`);

    // 7. CSV report downloading
    console.log('\n📄 [Reports] Fetching user directories CSV report spreadsheet...');
    const reportsRes = await axios.get(`${API_URL}/admin/reports/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ [Reports] Received report file: "${reportsRes.data.filename}"`);
    console.log(`✅ [Reports] Preview (header rows):`);
    console.log(reportsRes.data.data.split('\n').slice(0, 3).join('\n'));
    if (!reportsRes.data.data.startsWith('Name,Email,Phone,Role,Tier,CarbonPoints')) {
      throw new Error('CSV report headers generated incorrectly!');
    }

    // 8. Socket.IO admin channel testing
    console.log('\n📡 [Socket] Connecting to live streaming service as administrator...');
    const socket = io(SOCKET_URL, {
      auth: { token: adminToken }
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('🔌 [Socket] Handshake completed successfully!');
        resolve();
      });
      socket.on('connect_error', (err) => {
        reject(err);
      });
    });

    console.log('📡 [Socket] Emitting admin:subscribe channel request...');
    socket.emit('admin:subscribe');

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for admin:telemetry update events!'));
      }, 8000);

      socket.on('admin:telemetry', (data) => {
        console.log(`📊 [Live Socket Event] admin:telemetry -> Connected sockets: ${data.metrics.totalSockets}, Active Load: ${data.metrics.activeLoadKw}kW`);
        console.log(`📊 [Live Socket Event] Alerts active count: ${data.alerts.length}`);
        clearTimeout(timeout);
        resolve();
      });
    });

    socket.emit('admin:unsubscribe');
    socket.disconnect();
    console.log('\n🎉 [Success] All admin-only guards, CRUD endpoints, CSV reports, and Socket.IO supervisory channels passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing Admin Supervisory checks:', err.message);
    if (err.response) {
      console.error('Response details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
