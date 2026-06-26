import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isServerReady(url) {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

async function executeTestScript(scriptName) {
  console.log(`\n--------------------------------------------------`);
  console.log(`🏃 Running Integration Test: ${scriptName}`);
  console.log(`--------------------------------------------------`);
  
  const child = spawn('node', [scriptName], {
    cwd: __dirname,
    env: { ...process.env, MONGODB_URI: '' } // Force in-memory DB instances
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  return new Promise((resolve) => {
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function runAllIntegrationTests() {
  console.log('🔄 Starting local Express server in in-memory test mode...');
  
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: '5000',
      NODE_ENV: 'test',
      DISABLE_RATE_LIMIT: 'true',
      MONGODB_URI: '' // Forces fallback to MongoMemoryServer
    }
  });

  // Track if server output is operational
  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg.includes('[Server]') || msg.includes('[MongoDB]')) {
      console.log(`  [Server Out] ${msg}`);
    }
  });

  const healthUrl = 'http://localhost:5000/api/health';
  let attempts = 0;
  let ready = false;
  
  while (attempts < 30) {
    attempts++;
    ready = await isServerReady(healthUrl);
    if (ready) break;
    await wait(1000);
  }

  if (!ready) {
    console.error('❌ Timeout waiting for local server to become operational.');
    serverProcess.kill('SIGINT');
    process.exit(1);
  }

  console.log('✅ Server operational. Running test scripts...');

  const tests = [
    'test_auth.js',
    'test_login.js',
    'test_telemetry_flow.js',
    'test_user_battery_flow.js',
    'test_operator_battery_flow.js',
    'test_voice_flow.js',
    'test_navigation_flow.js',
    'test_bookings_flow.js',
    'test_analytics_flow.js',
    'test_community_flow.js',
    'test_emergency_flow.js',
    'test_settings_flow.js',
    'test_admin_flow.js'
  ];

  const results = {};
  for (const t of tests) {
    const success = await executeTestScript(t);
    results[t] = success ? 'PASS' : 'FAIL';
  }

  console.log('\n🛑 Shutting down backend Express server...');
  serverProcess.kill('SIGINT');
  await wait(2000);

  console.log('\n==================================================');
  console.log('📊 Integration Test Results Summary');
  console.log('==================================================');
  let hasFailures = false;
  for (const [name, status] of Object.entries(results)) {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${status}] - ${name}`);
    if (status === 'FAIL') hasFailures = true;
  }
  console.log('==================================================\n');

  process.exit(hasFailures ? 1 : 0);
}

runAllIntegrationTests().catch(err => {
  console.error('Fatal error running integration tests:', err);
  process.exit(1);
});
