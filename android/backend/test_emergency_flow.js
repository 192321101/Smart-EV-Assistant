import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting EV Emergency SOS & Tow Responder Sockets Test Flow...');
  
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

    // 2. Query Nearby Support Services Directory
    console.log('\n🗺️ [Directory] Retrieving nearby towing and repair clinics...');
    const nearbyRes = await axios.get(`${API_URL}/emergency/nearby`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ [Directory] Found ${nearbyRes.data.services.length} services nearby:`);
    nearbyRes.data.services.forEach(s => console.log(`   - ${s.name} (${s.type}) Distance: ${s.distance_km} km`));

    // 3. Trigger Emergency SOS Request
    console.log('\n🚨 [SOS Request] Broadcasting distress beacon coordinates [19.0596, 72.8311]...');
    const requestRes = await axios.post(`${API_URL}/emergency/request`, {
      lat: 19.0596,
      lng: 72.8311,
      message: 'EV Battery depleted. Need towing to charging hub.'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const request = requestRes.data.request;
    const rescueStation = requestRes.data.nearestStation;

    console.log(`✅ [SOS Request] Request created: ${request._id}`);
    console.log(`📡 [SOS Request] Status: ${request.status}`);
    console.log(`🚒 [SOS Request] Dispatcher: ${request.responderDetails.name} (Unit: ${request.responderDetails.unitId}, ETA: ${request.responderDetails.eta_mins} mins)`);
    console.log(`📍 [SOS Request] Nearest station match: ${rescueStation.name} at ${rescueStation.location.address}`);

    // 4. Emulate SMS contacts alert dispatch
    console.log('\n📲 [Alert System] Dispatching cellular notifications warning emergency contacts...');
    const contactRes = await axios.post(`${API_URL}/emergency/contacts/notify`, {
      requestId: request._id
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Alert System] SMS dispatch warning complete. Notified:`);
    contactRes.data.notified.forEach(c => console.log(`   - ${c}`));

    // 5. Connect Socket.IO client
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

    // 6. Subscribe to Emergency real-time updates over socket
    console.log('\n📡 [Socket] Subscribing to live responder tracking stream...');
    socket.emit('emergency:subscribe', { requestId: request._id });

    let updatesCount = 0;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for real-time responder update events!'));
      }, 10000);

      socket.on('emergency:update', (data) => {
        updatesCount++;
        const r = data.request;
        console.log(`📊 [Live SOS Update #${updatesCount}] Status: ${r.status}, ETA: ${r.responderDetails.eta_mins}m, Responder Coordinates: [${r.responderDetails.location.coordinates[0].toFixed(5)}, ${r.responderDetails.location.coordinates[1].toFixed(5)}]`);
        
        if (updatesCount >= 3) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    // 7. Cancel/Deactivate distress beacon
    console.log('\n🚨 [SOS Deactivate] Deactivating distress signal beacon...');
    const cancelRes = await axios.post(`${API_URL}/emergency/cancel`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [SOS Deactivate] Status: ${cancelRes.data.message}`);

    // 8. Verify active request status is updated to cancelled
    const activeCheckRes = await axios.get(`${API_URL}/emergency/active`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [REST API Check] Active request exists: ${activeCheckRes.data.active}`);

    if (activeCheckRes.data.active) {
      throw new Error('Distress beacon should have been deactivated but is still reporting active!');
    }

    socket.disconnect();
    console.log('\n🎉 [Success] All Emergency SOS API and Socket validation checks passed!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing Emergency SOS checks:', err.message);
    if (err.response) {
      console.error('Response details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
