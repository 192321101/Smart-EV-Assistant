import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTest() {
  console.log('🧪 Starting Booking System & Real-Time Slot Validation Test Flow...');
  
  try {
    // 1. Authenticate test driver
    console.log('\n🔐 [Auth] Logging in driver (test1@ev.app)...');
    const authRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test1@ev.app',
      password: 'Test@1234'
    });
    
    const { accessToken, user } = authRes.data;
    console.log(`✅ [Auth] Logged in successfully. Welcome ${user.name}!`);

    // Get a vehicle
    const vehiclesRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const vehicle = vehiclesRes.data.vehicles[0];
    if (!vehicle) throw new Error('No vehicle found for testing.');

    // 2. Connect Socket.IO client
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

    // Capture slot status updates
    const updates = [];
    socket.on('station:status_update', (data) => {
      console.log(`🔌 [Socket Event Recieved] Station: ${data.stationId}, Slot: ${data.slotId} is now ${data.status}`);
      updates.push(data);
    });

    // 3. Ensure station slot is available
    console.log('\n🏪 [Station] Fetching details for PulseCharge HyperHub (st_bandra_01)...');
    const stationBefore = await axios.get(`${API_URL}/stations/st_bandra_01`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    let s1 = stationBefore.data.station.slots.find(s => s.id === 's1');
    console.log(`Slot s1 status before booking: ${s1.status}`);

    // If s1 is currently occupied (from some previous test), reset it first via override
    if (s1.status === 'occupied') {
      console.log('🔧 [Station] Slot s1 is currently occupied. Resetting it to available for testing...');
      await axios.put(`${API_URL}/stations/st_bandra_01/slots/s1`, { status: 'available' }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }

    // 4. Create slot booking
    console.log('\n📅 [Booking] Reserving slot s1 for today at 14:00...');
    const bookingRes = await axios.post(`${API_URL}/bookings`, {
      stationId: 'st_bandra_01',
      slotId: 's1',
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      duration_min: 60,
      vehicleId: vehicle._id,
      paymentId: 'PAY-TESTING123'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const booking = bookingRes.data.booking;
    console.log(`✅ [Booking] Created booking: ${booking._id} (Status: ${booking.status})`);

    // Allow socket thread to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify slot status is occupied
    const stationAfter = await axios.get(`${API_URL}/stations/st_bandra_01`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    s1 = stationAfter.data.station.slots.find(s => s.id === 's1');
    console.log(`Slot s1 status after booking: ${s1.status} (Expected: occupied)`);
    if (s1.status !== 'occupied') throw new Error('Slot status was not set to occupied.');

    // 5. Try to double-book slot s1
    console.log('\n🛡️ [Booking] Attempting to double-book occupied slot s1 (expecting 400 rejection)...');
    try {
      await axios.post(`${API_URL}/bookings`, {
        stationId: 'st_bandra_01',
        slotId: 's1',
        scheduledTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        duration_min: 60,
        vehicleId: vehicle._id,
        paymentId: 'PAY-DOUBLEBOOK'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      throw new Error('Double-booking succeeded! Validation check failed.');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ [Booking] Rejection successful: 400 - ${err.response.data.message}`);
      } else {
        throw err;
      }
    }

    // 6. Retrieve upcoming reservations
    console.log('\n📜 [Booking] Fetching upcoming reservations...');
    const upcomingRes = await axios.get(`${API_URL}/bookings/upcoming`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const upcoming = upcomingRes.data.bookings;
    console.log(`Found ${upcoming.length} upcoming reservations.`);
    const hasMyBooking = upcoming.some(b => b._id === booking._id);
    console.log(`Reservations contain newly created booking: ${hasMyBooking}`);
    if (!hasMyBooking) throw new Error('New booking not found in upcoming bookings list.');

    // 7. Cancel slot booking
    console.log(`\n❌ [Booking] Cancelling booking ${booking._id}...`);
    const cancelRes = await axios.put(`${API_URL}/bookings/${booking._id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Booking] Cancellation status: 200 - ${cancelRes.data.message}`);

    // Allow socket thread to process
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify slot status is available again
    const stationFinal = await axios.get(`${API_URL}/stations/st_bandra_01`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    s1 = stationFinal.data.station.slots.find(s => s.id === 's1');
    console.log(`Slot s1 status after cancellation: ${s1.status} (Expected: available)`);
    if (s1.status !== 'available') throw new Error('Slot status was not reverted to available.');

    // 8. Fetch Booking History
    console.log('\n📜 [Booking] Fetching booking history...');
    const historyRes = await axios.get(`${API_URL}/bookings/history`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const historyList = historyRes.data.bookings;
    console.log(`Found ${historyList.length} past/cancelled reservations.`);
    const hasCancelledBooking = historyList.some(b => b._id === booking._id);
    console.log(`History contains cancelled booking: ${hasCancelledBooking}`);
    if (!hasCancelledBooking) throw new Error('Cancelled booking not found in history list.');

    // 9. Check Socket Events received
    console.log('\n📡 [Socket] Summary of received slot status updates:');
    updates.forEach((update, idx) => {
      console.log(`   Update #${idx + 1}: Station ${update.stationId}, Slot ${update.slotId} -> ${update.status}`);
    });
    
    const hasOccupiedEvent = updates.some(u => u.stationId === 'st_bandra_01' && u.slotId === 's1' && u.status === 'occupied');
    const hasAvailableEvent = updates.some(u => u.stationId === 'st_bandra_01' && u.slotId === 's1' && u.status === 'available');
    console.log(`Socket received 'occupied' update event: ${hasOccupiedEvent}`);
    console.log(`Socket received 'available' update event: ${hasAvailableEvent}`);

    if (!hasOccupiedEvent || !hasAvailableEvent) {
      throw new Error('Missing real-time Socket.IO broadcasts for status updates.');
    }

    socket.disconnect();
    console.log('\n🎉 [Success] All booking system validation checks passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing booking checks:', err.message);
    if (err.response && err.response.data) {
      console.error('Details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
