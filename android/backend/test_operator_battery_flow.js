import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting Operator Battery Update Voice Integration Test Flow...');
  
  try {
    // 1. Authenticate test operator
    console.log('\n🔐 [Auth] Logging in operator (operator@ev.app)...');
    const authRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'operator@ev.app',
      password: 'Operator@1234'
    });
    
    const { accessToken, user } = authRes.data;
    console.log(`✅ [Auth] Logged in successfully. Welcome ${user.name}!`);

    // 2. Fetch initial vehicle status
    console.log('\n🚗 [Garage] Retrieving default vehicle profile...');
    const vehiclesRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const vehicle = vehiclesRes.data.vehicles.find(v => v.isDefault) || vehiclesRes.data.vehicles[0];
    if (!vehicle) {
      throw new Error('Operator has no default vehicle profile!');
    }
    console.log(`✅ [Garage] Current Charge in DB: ${vehicle.currentCharge_percent}%, Range: ${vehicle.range_km} km`);

    // 3. Connect Socket.io
    console.log('\n📡 [Socket] Connecting...');
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken }
    });

    await new Promise((resolve) => socket.on('connect', resolve));
    console.log('🔌 [Socket] Connected!');

    // Helper function to emit and await response
    const sendVoiceCommand = (commandText) => {
      return new Promise((resolve) => {
        socket.once('assistant:response', (data) => {
          resolve(data.text);
        });
        socket.emit('voice:command', { command: commandText });
      });
    };

    // 4. Ask current battery percentage
    console.log('\n🎙️ Asking: "what is the current battery percentage of my car?"...');
    const reply1 = await sendVoiceCommand('what is the current battery percentage of my car?');
    console.log(`💬 AI Reply: "${reply1}"`);

    // 5. Update battery percentage to 80%
    console.log('\n🎙️ Telling: "update my battery percentage as 80%"...');
    const reply2 = await sendVoiceCommand('update my battery percentage as 80%');
    console.log(`💬 AI Reply: "${reply2}"`);

    // 6. Verify vehicle database record is updated
    const updatedVehiclesRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const updatedVehicle = updatedVehiclesRes.data.vehicles.find(v => v.isDefault) || updatedVehiclesRes.data.vehicles[0];
    console.log(`✅ [DB Check] Vehicle Current Charge in DB: ${updatedVehicle.currentCharge_percent}%, Range: ${updatedVehicle.range_km} km`);
    if (updatedVehicle.currentCharge_percent !== 80) {
      throw new Error(`Expected battery to be 80% in DB but found ${updatedVehicle.currentCharge_percent}%`);
    }

    // 7. Ask current battery percentage again
    console.log('\n🎙️ Asking again: "what is the current battery percentage of my car?"...');
    const reply3 = await sendVoiceCommand('what is the current battery percentage of my car?');
    console.log(`💬 AI Reply: "${reply3}"`);
    if (!reply3.includes('80')) {
      throw new Error(`Expected reply to contain "80" but got: "${reply3}"`);
    }

    // 8. Restore to 45% (to leave database clean for other tests)
    console.log('\n🎙️ Restoring: "update my battery percentage as 45%"...');
    const reply4 = await sendVoiceCommand('update my battery percentage as 45%');
    console.log(`💬 AI Reply: "${reply4}"`);

    socket.disconnect();
    console.log('\n🎉 [Success] Operator Battery Update Voice Flow test passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed]:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response body:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
