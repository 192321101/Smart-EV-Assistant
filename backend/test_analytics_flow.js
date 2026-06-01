import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('🧪 Starting Performance Analytics Backend Verification Flow...');
  
  try {
    // 1. Authenticate test driver
    console.log('\n🔐 [Auth] Logging in driver (test1@ev.app)...');
    const authRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test1@ev.app',
      password: 'Test@1234'
    });
    
    const { accessToken, user } = authRes.data;
    console.log(`✅ [Auth] Logged in successfully. Welcome ${user.name}!`);

    // 2. Fetch User Vehicle Profile
    console.log('\n🚗 [Garage] Retrieving vehicle profile...');
    const vehiclesRes = await axios.get(`${API_URL}/vehicles`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const vehicle = vehiclesRes.data.vehicles[0];
    if (!vehicle) throw new Error('No vehicle registered for test driver');

    // 3. Trigger endpoint tests
    console.log('\n📈 [Analytics] Querying /analytics/energy...');
    const energyRes = await axios.get(`${API_URL}/analytics/energy`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Energy response:', energyRes.data.success);
    console.log(`   Labels: ${energyRes.data.labels}`);
    console.log(`   Data points: ${energyRes.data.data}`);
    console.log(`   Total energy: ${energyRes.data.total_kwh} kWh`);
    if (!energyRes.data.labels || !energyRes.data.data) {
      throw new Error('Energy response is missing labels or data arrays.');
    }

    console.log('\n💰 [Analytics] Querying /analytics/spending...');
    const spendingRes = await axios.get(`${API_URL}/analytics/spending`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Spending response:', spendingRes.data.success);
    console.log(`   Total Spent: ₹ ${spendingRes.data.total_spent}`);
    console.log(`   Breakdown elements:`, spendingRes.data.breakdown.map(b => `${b.name}: ${b.value}%`).join(', '));
    if (!spendingRes.data.history || spendingRes.data.total_spent === undefined) {
      throw new Error('Spending response is missing history or total cost.');
    }

    console.log('\n🌱 [Analytics] Querying /analytics/co2...');
    const co2Res = await axios.get(`${API_URL}/analytics/co2`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ CO2 response:', co2Res.data.success);
    console.log(`   CO2 saved: ${co2Res.data.co2_saved_kg} kg`);
    console.log(`   Trees equivalency: ${co2Res.data.equivalences.trees} trees`);
    if (co2Res.data.co2_saved_kg === undefined || !co2Res.data.chart_data) {
      throw new Error('CO2 response is missing kg data or chart offsets.');
    }

    console.log('\n📜 [Analytics] Querying /analytics/history...');
    const historyRes = await axios.get(`${API_URL}/analytics/history`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ History response:', historyRes.data.success);
    console.log(`   Found ${historyRes.data.history.length} completed charging sessions in ledger.`);
    if (!Array.isArray(historyRes.data.history)) {
      throw new Error('History response is not an array.');
    }

    console.log('\n⚡ [Analytics] Querying /analytics/efficiency...');
    const efficiencyRes = await axios.get(`${API_URL}/analytics/efficiency`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Efficiency response:', efficiencyRes.data.success);
    console.log(`   Average Efficiency: ${efficiencyRes.data.average_wh_km} Wh/km`);
    console.log(`   Performance Score: ${efficiencyRes.data.performance_score}/100`);
    if (efficiencyRes.data.average_wh_km === undefined || !efficiencyRes.data.data) {
      throw new Error('Efficiency response is missing Wh/km reading or labels.');
    }

    console.log('\n🎉 [Success] All performance analytics backend validation checks passed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ [Test Failed] Error executing analytics verification:', err.message);
    if (err.response && err.response.data) {
      console.error('Details:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
