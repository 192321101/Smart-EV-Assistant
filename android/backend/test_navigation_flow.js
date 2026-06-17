import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting EV Route Planning & Geolocation Sockets Test Flow...');
  
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

    // 3. Query Nearby Stations with filters
    console.log('\n🗺️ [Directory] Fetching nearby stations filtering for connector: ccs...');
    const stationsRes = await axios.get(`${API_URL}/stations/nearby?connectorType=ccs`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Directory] Found ${stationsRes.data.stations.length} CCS stations in directory.`);

    // 4. Request Route Optimization under normal battery range
    console.log('\n🧭 [Route Optimization] Requesting route to "Powai" (Normal Battery)...');
    const routeRes = await axios.post(`${API_URL}/navigation/route`, {
      startCoords: [72.8311, 19.0596],
      destination: 'Powai'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const route = routeRes.data.route;
    console.log(`✅ [Route Optimization] Path to ${route.destinationName}:`);
    console.log(`   - Distance: ${route.distance} km`);
    console.log(`   - Time: ${route.timeMinutes} mins`);
    console.log(`   - Energy Needed: ${route.energyKwhNeeded} kWh`);
    console.log(`   - Elevation Peak: +${route.elevationGain}m`);
    console.log(`   - Suggested Intermediate Stops: ${route.recommendedStop ? route.recommendedStop.name : 'None (Battery Range Safe)'}`);

    if (route.recommendedStop !== null) {
      throw new Error('Should not suggest charging stops for high battery range!');
    }

    // 5. Mock low battery SoC (15%) and re-request route
    console.log('\n🔋 [Battery Telemetry] Simulating low battery state (SoC: 15%)...');
    const batteryRes = await axios.put(`${API_URL}/vehicles/${vehicle._id}/battery`, {
      batteryPercent: 15
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const lowRange = batteryRes.data.vehicle.range_km;
    console.log(`✅ [Battery Telemetry] Vehicle range updated to: ${lowRange} km (SoC: 15%)`);

    console.log('\n🧭 [Route Optimization] Requesting route to "Powai" (Low Battery suggestion alert)...');
    const routeRes2 = await axios.post(`${API_URL}/navigation/route`, {
      startCoords: [72.8311, 19.0596],
      destination: 'Powai'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const route2 = routeRes2.data.route;
    console.log(`✅ [Route Optimization] Path to ${route2.destinationName}:`);
    console.log(`   - Suggested Intermediate Stops: ${route2.recommendedStop ? route2.recommendedStop.name : 'None'}`);

    if (route2.recommendedStop === null) {
      throw new Error('Failed to suggest intermediate charging stop for low battery range!');
    }
    console.log(`📍 Recommended Stop details: ${JSON.stringify(route2.recommendedStop)}`);

    // 6. Connect via Socket.io
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

    // 7. Emit Geolocation update over socket
    console.log('\n📡 [Socket] Emitting location:update event...');
    
    let isLocationSynced = false;
    let syncedCoords = [];
    let nearbyPinsCount = 0;

    socket.on('location:updated', (data) => {
      console.log('📡 [Socket Event] location:updated -> coordinates synced!');
      isLocationSynced = true;
      syncedCoords = data.coordinates;
      nearbyPinsCount = data.stations.length;
    });

    socket.emit('location:update', { lat: 19.0596, lng: 72.8311, speedKmph: 60 });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for location:updated socket event!'));
      }, 5000);

      const checkInterval = setInterval(() => {
        if (isLocationSynced) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    console.log(`📍 Coordinates synced on server: [${syncedCoords}]`);
    console.log(`📍 Nearby charging pins returned: ${nearbyPinsCount}`);

    // Restore battery percent to 45% for subsequent telemetry tests
    console.log('\n🔋 [Battery Restore] Restoring vehicle battery to normal (45%)...');
    await axios.put(`${API_URL}/vehicles/${vehicle._id}/battery`, {
      batteryPercent: 45
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    socket.disconnect();
    console.log('\n🎉 [Success] All Route Planning & Socket.IO GPS checks passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing GPS checks:', err.message);
    if (err.response) {
      console.error('Response details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
