import axios from 'axios';

async function runTest() {
  const baseURL = 'http://localhost:5000/api';
  const testEmail = `driver_${Date.now()}@example.com`;
  console.log('--- Testing Register ---');
  try {
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Temp Driver',
      email: testEmail,
      password: 'TestPassword@123',
      phone: '+919999999999',
      evModel: '4 Wheeler'
    });
    console.log('Register Response:', regRes.data);
  } catch (err) {
    console.error('Register failed:', err.response?.data || err.message);
  }

  console.log('\n--- Testing Login ---');
  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: testEmail,
      password: 'TestPassword@123'
    });
    console.log('Login Response:', loginRes.data);
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
  }
}

runTest();
