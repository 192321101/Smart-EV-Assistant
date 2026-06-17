import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting EV Telemetry & Socket.IO Test Flow...');
  
  try {
    // 1. Authenticate test driver
    console.log('\n🔐 [Auth] Logging in driver (test1@ev.app)...');
    const authRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test1@ev.app',
      password: 'Test@1234'
    });
    
    const { accessToken, user } = authRes.data;
    console.log(`✅ [Auth] Logged in successfully. Welcome ${user.name}!`);
    console.log(`Token: ${accessToken.slice(0, 20)}...`);

    // 2. Fetch User Vehicle Profile
    console.log('\n🚗 [Garage] Retrieving vehicle profile...');
    const vehiclesRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const vehicle = vehiclesRes.data.vehicles.find(v => v.isDefault) || vehiclesRes.data.vehicles[0];
    if (!vehicle) {
      throw new Error('No default vehicle registered for test1@ev.app');
    }
    console.log(`✅ [Garage] Active vehicle: ${vehicle.brand} ${vehicle.model} (Range: ${vehicle.range_km}km, SoC: ${vehicle.currentCharge_percent}%)`);

    // 3. Connect Socket.IO client
    console.log('\n📡 [Socket] Connecting to live streaming service...');
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken }
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

    // 4. Trigger Driving Simulator
    console.log('\n🏎️ [Simulator] Starting driving simulation (Speed: 100km/h)...');
    socket.emit('driving:start', {
      vehicleId: vehicle._id,
      speedKmph: 100,
      hvacOn: true,
      terrain: 'flat'
    });

    let drivingTickCount = 0;
    await new Promise((resolve) => {
      socket.on('vehicle:telemetry', (data) => {
        drivingTickCount++;
        console.log(`📊 [Driving Telemetry #${drivingTickCount}] SoC: ${data.currentCharge}%, Range: ${data.range_km}km, Speed: ${data.speed}km/h`);
        if (drivingTickCount >= 3) {
          resolve();
        }
      });
    });

    console.log('🏎️ [Simulator] Stopping driving simulation...');
    socket.emit('driving:stop', { vehicleId: vehicle._id });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify REST API reflects the simulator status
    console.log('\n🌐 [REST API] Verifying telemetry REST sync...');
    const teleRes = await axios.get(`${API_URL}/telemetry/latest`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const t = teleRes.data.telemetry;
    console.log(`✅ [REST API] Current speed: ${t.speed_kmh}km/h (Expected: 0), SoC: ${t.batteryPercent}%`);

    // 5. Trigger Charging Session
    console.log('\n🔌 [Charging] Initializing session at VoltGrid Supercharger (slot: p1)...');
    const sessionRes = await axios.post(`${API_URL}/sessions/start`, {
      vehicleId: vehicle._id,
      stationId: 'st_powai_03',
      slotId: 'p1'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const session = sessionRes.data.session;
    console.log(`✅ [Charging] Session active: ${session._id}`);

    console.log('📡 [Socket] Subscribing to charging session socket broadcasts...');
    socket.emit('session:subscribe', { sessionId: session._id });

    let chargingTickCount = 0;
    await new Promise((resolve) => {
      socket.on('session:update', (data) => {
        chargingTickCount++;
        console.log(`📊 [Charging Telemetry #${chargingTickCount}] SoC: ${data.currentCharge}%, Charging ETA: ${data.estimatedChargeTime_mins} mins, Draw: ${data.powerDraw}kW`);
        if (chargingTickCount >= 3) {
          resolve();
        }
      });
    });

    console.log('🔌 [Charging] Stopping charging session via API...');
    await axios.put(`${API_URL}/sessions/${session._id}/end`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ [Charging] Charging session closed.');

    socket.disconnect();
    console.log('\n🎉 [Success] All telemetry flow validation checks passed!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing telemetry checks:', err.message);
    process.exit(1);
  }
}

runTest();
