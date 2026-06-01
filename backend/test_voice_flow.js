import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting EV AI Voice Assistant & Socket.IO Test Flow...');
  
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
    console.log(`✅ [Garage] Active vehicle: ${vehicle.brand} ${vehicle.model}`);

    // 3. Retrieve Conversation Logs History (REST)
    console.log('\n🎙️ [REST API] Fetching initial voice command logs history...');
    const historyRes = await axios.get(`${API_URL}/voice/history`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const initialHistoryLength = historyRes.data.history.length;
    console.log(`✅ [REST API] Initial logs count in DB: ${initialHistoryLength}`);

    // 4. Send Voice Command via REST API (HTTP POST)
    console.log('\n🎙️ [REST API] Sending command: "what is the splash screen 1?"...');
    const commandRes = await axios.post(`${API_URL}/voice/command`, {
      command: 'what is the splash screen 1?'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ [REST API] Response received:`);
    console.log(`💬 AI: "${commandRes.data.reply}"`);

    // 5. Verify REST history logs updated
    const historyRes2 = await axios.get(`${API_URL}/voice/history`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const newHistoryLength = historyRes2.data.history.length;
    console.log(`✅ [REST API] Updated logs count in DB: ${newHistoryLength} (Expected: ${initialHistoryLength + 2})`);

    if (newHistoryLength !== initialHistoryLength + 2) {
      throw new Error('History logs did not increment correctly after REST command!');
    }

    // 6. Connect Socket.IO client
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

    // 7. Send Voice Command via Socket.io
    console.log('\n🎙️ [Socket] Emitting command: "can I travel 150 km at 90 km/h?"...');
    
    let isTypingReceived = false;
    let isFinishedTypingReceived = false;
    let isResponseReceived = false;
    let socketReply = '';

    socket.on('assistant:typing', (data) => {
      console.log(`📡 [Socket Event] assistant:typing -> isProcessing: ${data.isProcessing}`);
      if (data.isProcessing) {
        isTypingReceived = true;
      } else {
        isFinishedTypingReceived = true;
      }
    });

    socket.on('assistant:response', (data) => {
      console.log(`📡 [Socket Event] assistant:response -> reply received!`);
      isResponseReceived = true;
      socketReply = data.text;
    });

    socket.emit('voice:command', { command: 'can I travel 150 km at 90 km/h?' });

    // Wait for response and typing indicators (simulated latency is 800ms)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for socket voice assistant events!'));
      }, 5000);

      const checkInterval = setInterval(() => {
        if (isTypingReceived && isFinishedTypingReceived && isResponseReceived) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    console.log(`💬 AI Reply over Socket: "${socketReply}"`);

    // 8. Verify Socket history logs updated
    const historyRes3 = await axios.get(`${API_URL}/voice/history`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [DB Log Check] Updated logs count in DB: ${historyRes3.data.history.length} (Expected: ${newHistoryLength + 2})`);

    if (historyRes3.data.history.length !== newHistoryLength + 2) {
      throw new Error('History logs did not increment correctly after Socket command!');
    }

    socket.disconnect();
    console.log('\n🎉 [Success] All voice flow validation checks passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing voice checks:', err.message);
    if (err.response) {
      console.error('Response details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
