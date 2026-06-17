import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('🧪 Starting EV Driver Profile & Garage Settings APIs Test Flow...');
  
  try {
    // 1. Authenticate driver (test1@ev.app)
    console.log('\n🔐 [Auth] Logging in driver (test1@ev.app)...');
    const authRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test1@ev.app',
      password: 'Test@1234'
    });
    
    const { accessToken, user: initialUser } = authRes.data;
    console.log(`✅ [Auth] Welcome back, ${initialUser.name}! Initial carbon points: ${initialUser.points}`);

    // 2. Test profile updating
    console.log('\n👤 [Profile] Updating name, email, and phone...');
    const updateProfileRes = await axios.put(`${API_URL}/users/profile`, {
      name: 'Amit Sharma Edited',
      email: 'test1@ev.app',
      phone: '+919999999999'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const updatedUser = updateProfileRes.data.user;
    console.log(`✅ [Profile] Updated: Name="${updatedUser.name}", Phone="${updatedUser.phone}"`);
    if (updatedUser.name !== 'Amit Sharma Edited' || updatedUser.phone !== '+919999999999') {
      throw new Error('Profile updates did not persist correctly!');
    }

    // 3. Test validation check (invalid email)
    console.log('\n👤 [Profile Validation] Attempting to update with an invalid email formatting...');
    try {
      await axios.put(`${API_URL}/users/profile`, {
        name: 'Amit',
        email: 'invalid-email-address',
        phone: '123'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      throw new Error('Should have failed due to invalid email address format!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`✅ [Profile Validation] Blocked invalid email. Message: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 4. Test changing password
    console.log('\n🔑 [Security] Testing password change (invalid current password first)...');
    try {
      await axios.put(`${API_URL}/users/password`, {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword@123'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      throw new Error('Should have rejected incorrect current password!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`✅ [Security] Blocked incorrect current password. Message: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    console.log('🔑 [Security] Attempting correct password change...');
    const changePassRes = await axios.put(`${API_URL}/users/password`, {
      currentPassword: 'Test@1234',
      newPassword: 'NewPassword@123'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Security] Status: "${changePassRes.data.message}"`);

    // Let's reset the password back immediately to keep DB seeding happy on subsequent runs
    console.log('🔑 [Security] Resetting password back to "Test@1234" to clean up test states...');
    await axios.put(`${API_URL}/users/password`, {
      currentPassword: 'NewPassword@123',
      newPassword: 'Test@1234'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ [Security] Password restored.');

    // 5. Test preferences
    console.log('\n⚙️ [Preferences] Saving SoC charging limits target and notification preferences...');
    const prefRes = await axios.put(`${API_URL}/users/preferences`, {
      targetCharge: 85,
      allowPush: false,
      allowSmsAlert: true
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const prefUser = prefRes.data.user;
    console.log(`✅ [Preferences] Target SoC Charge Limit: ${prefUser.targetCharge}%`);
    console.log(`✅ [Preferences] Push Notifications Allowed: ${prefUser.allowPush}`);
    console.log(`✅ [Preferences] SMS Telemetry Allowed: ${prefUser.allowSmsAlert}`);
    if (prefUser.targetCharge !== 85 || prefUser.allowPush !== false || prefUser.allowSmsAlert !== true) {
      throw new Error('Notification Preferences did not persist correctly!');
    }

    // 6. Test base64 image upload
    console.log('\n🖼️ [Avatar Upload] Sending tiny mock PNG base64 string to /api/users/profile-image...');
    const mockPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await axios.post(`${API_URL}/users/profile-image`, {
      image: mockPngBase64
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log(`✅ [Avatar Upload] Status: "${uploadRes.data.message}"`);
    console.log(`✅ [Avatar Upload] File serving path: ${uploadRes.data.profileImage}`);

    // Verify file exists on server disk
    const diskPath = path.join(__dirname, uploadRes.data.profileImage);
    if (fs.existsSync(diskPath)) {
      console.log(`✅ [Avatar Upload] Verified image written to disk successfully: ${diskPath}`);
    } else {
      throw new Error(`Profile image file was not found on server disk: ${diskPath}`);
    }

    // 7. Test Garage Vehicles CRUD
    console.log('\n🚗 [Garage] Fetching existing vehicles list...');
    const getVehiclesRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ [Garage] Driver has ${getVehiclesRes.data.vehicles.length} vehicles registered.`);
    const activeVehicle = getVehiclesRes.data.vehicles.find(v => v.isDefault) || getVehiclesRes.data.vehicles[0];
    console.log(`👉 [Garage] Active vehicle: "${activeVehicle.name}" (Model: ${activeVehicle.brand} ${activeVehicle.model}, ID: ${activeVehicle._id})`);

    // Update vehicle specs
    console.log(`\n🚗 [Garage] Modifying active vehicle connector type to "Type 2" and color to "#ffffff"...`);
    const updateVehicleRes = await axios.put(`${API_URL}/vehicles/${activeVehicle._id}`, {
      name: 'Nexon EV Upgraded',
      brand: activeVehicle.brand,
      plateNumber: activeVehicle.plateNumber,
      batteryCapacity_kWh: 42.5,
      connectorType: 'Type 2',
      color: '#ffffff'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const updatedVeh = updateVehicleRes.data.vehicle;
    console.log(`✅ [Garage] Updated specifications: Name="${updatedVeh.name}", Capacity=${updatedVeh.batteryCapacity_kWh}kWh, Connector="${updatedVeh.connectorType}", Color="${updatedVeh.color}"`);
    if (updatedVeh.connectorType !== 'Type 2' || updatedVeh.color !== '#ffffff' || updatedVeh.batteryCapacity_kWh !== 42.5) {
      throw new Error('Vehicle updates did not persist correctly!');
    }

    // Add a new secondary vehicle
    console.log('\n🚗 [Garage] Registering a secondary EV profile in garage...');
    const addVehRes = await axios.post(`${API_URL}/vehicles`, {
      name: 'Secondary Tiago EV',
      brand: 'Tata',
      model: 'Tiago EV',
      year: 2024,
      batteryCapacity_kWh: 24,
      currentCharge_percent: 60,
      connectorType: 'CCS',
      color: '#10b981',
      plateNumber: 'MH02CP5555',
      isDefault: false
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const newVeh = addVehRes.data.vehicle;
    console.log(`✅ [Garage] Registered new EV: "${newVeh.name}" (ID: ${newVeh._id})`);

    // Toggle default status
    console.log(`\n🚗 [Garage] Setting "${newVeh.name}" as the default active vehicle...`);
    const setDefRes = await axios.put(`${API_URL}/vehicles/${newVeh._id}/default`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ [Garage] Default update successful. Active vehicle: "${setDefRes.data.vehicle.name}", Default status: ${setDefRes.data.vehicle.isDefault}`);
    
    // Check if Nexon was automatically unset from default
    const checkVehListRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const oldVehState = checkVehListRes.data.vehicles.find(v => v._id === activeVehicle._id);
    console.log(`✅ [Garage] Verified original Nexon EV default status is now: ${oldVehState.isDefault}`);
    if (oldVehState.isDefault === true) {
      throw new Error('Original default vehicle was not unset after marking a new one default!');
    }

    // Delete the temporary secondary vehicle
    console.log(`\n🚗 [Garage] Removing temporary vehicle "${newVeh.name}" to restore clean test state...`);
    const delRes = await axios.delete(`${API_URL}/vehicles/${newVeh._id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ [Garage] Delete: "${delRes.data.message}"`);

    // Double check that Nexon is default again (it should auto-fallback to default since deleted one was default)
    const finalCheckRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const finalNexon = finalCheckRes.data.vehicles.find(v => v._id === activeVehicle._id);
    console.log(`✅ [Garage] Fallback verify: original Nexon EV default status: ${finalNexon.isDefault}`);
    if (!finalNexon.isDefault) {
      throw new Error('Original vehicle should have returned to default status!');
    }

    console.log('\n🎉 [Success] All Profile, Security, Preferences, Avatar upload, and Garage Vehicle CRUD checks completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing Settings and Profile checks:', err.message);
    if (err.response) {
      console.error('Response details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
