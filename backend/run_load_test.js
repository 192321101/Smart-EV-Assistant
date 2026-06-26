import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady(url) {
  try {
    const res = await fetch(url);
    if (res.status === 200) {
      return true;
    }
  } catch (err) {
    // Expect connection refused during initial startup
  }
  return false;
}

async function runOrchestratedLoadTest() {
  console.log('🔄 Starting local backend server in test mode...');
  
  // Start backend server as a background child process
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

  // Log server console output to assist debugging if startup fails
  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg.includes('[Server]') || msg.includes('[MongoDB]')) {
      console.log(`  [Server Out] ${msg}`);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`  [Server Err] ${data.toString().trim()}`);
  });

  const healthUrl = 'http://localhost:5000/api/health';
  const maxAttempts = 30;
  let attempts = 0;
  let ready = false;

  console.log('⏳ Waiting for backend server and in-memory DB to boot...');
  
  while (attempts < maxAttempts) {
    attempts++;
    ready = await isServerReady(healthUrl);
    if (ready) {
      break;
    }
    await wait(1000);
  }

  if (!ready) {
    console.error('❌ Timeout waiting for local server to become operational.');
    serverProcess.kill('SIGINT');
    process.exit(1);
  }

  console.log('✅ Server operational. Initiating load test benchmark...');

  // Spawn load test process
  const loadTestProcess = spawn('node', ['load_test.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      TARGET_URL: healthUrl,
      CONCURRENCY: '100',
      DURATION_MS: '60000'
    }
  });

  loadTestProcess.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });

  loadTestProcess.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  // Wait for the load test runner process to exit
  const exitCode = await new Promise((resolve) => {
    loadTestProcess.on('close', (code) => {
      resolve(code);
    });
  });

  console.log('🛑 Shutting down backend Express server...');
  serverProcess.kill('SIGINT');

  // Wait a moment for cleanup
  await wait(2000);
  console.log('Done.');
  process.exit(exitCode || 0);
}

runOrchestratedLoadTest().catch((err) => {
  console.error('Orchestrator encountered a fatal error:', err);
  process.exit(1);
});
