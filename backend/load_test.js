import { performance } from 'perf_hooks';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5000/api/health';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);
const DURATION_MS = parseInt(process.env.DURATION_MS || '60000', 10);

async function runLoadTest() {
  console.log(`==================================================`);
  console.log(`🚀 Starting API Load Test`);
  console.log(`🎯 Target URL : ${TARGET_URL}`);
  console.log(`👥 Users      : ${CONCURRENCY} concurrent virtual users`);
  console.log(`⏱️  Duration   : ${DURATION_MS / 1000} seconds`);
  console.log(`==================================================\n`);

  let running = true;
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies = [];

  // Launch worker loop
  async function worker(workerId) {
    while (running) {
      const start = performance.now();
      try {
        const res = await fetch(TARGET_URL);
        await res.text(); // Fully consume the response body
        const elapsed = performance.now() - start;
        
        if (res.status >= 200 && res.status < 300) {
          successfulRequests++;
          latencies.push(elapsed);
        } else {
          failedRequests++;
          latencies.push(elapsed);
        }
      } catch (err) {
        const elapsed = performance.now() - start;
        failedRequests++;
        latencies.push(elapsed);
      }
    }
  }

  const startTime = performance.now();

  // Start all concurrent workers
  const workerPromises = Array.from({ length: CONCURRENCY }).map((_, idx) => worker(idx + 1));

  // Print progress updates every 5 seconds
  const progressInterval = setInterval(() => {
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const totalRequests = successfulRequests + failedRequests;
    const currentRps = (totalRequests / elapsedSeconds).toFixed(1);
    console.log(`[Progress] Running: ${elapsedSeconds.toFixed(1)}s | Total requests: ${totalRequests} | Current RPS: ${currentRps}`);
  }, 5000);

  // Set timeout to stop test execution
  await new Promise((resolve) => {
    setTimeout(() => {
      running = false;
      clearInterval(progressInterval);
      resolve();
    }, DURATION_MS);
  });

  // Wait for all workers to complete current request loops
  await Promise.all(workerPromises);

  const endTime = performance.now();
  const totalElapsedMs = endTime - startTime;
  const totalSeconds = totalElapsedMs / 1000;
  const totalRequests = successfulRequests + failedRequests;
  const rps = (totalRequests / totalSeconds).toFixed(1);

  console.log(`\n==================================================`);
  console.log(`📊 Load Test Finished`);
  console.log(`==================================================`);
  console.log(`Total Requests Sent : ${totalRequests}`);
  console.log(`Successful Requests : ${successfulRequests} (Status 2xx)`);
  console.log(`Failed Requests     : ${failedRequests}`);
  console.log(`Total Elapsed Time  : ${totalSeconds.toFixed(2)} seconds`);
  console.log(`Requests Per Second : ${rps} RPS`);
  console.log(`--------------------------------------------------`);

  if (latencies.length > 0) {
    // Sort to find percentiles, min, and max safely without call stack limit
    const sorted = [...latencies].sort((a, b) => a - b);
    const min = sorted[0].toFixed(2);
    const max = sorted[sorted.length - 1].toFixed(2);
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = (sum / latencies.length).toFixed(2);

    const p95 = sorted[Math.floor(sorted.length * 0.95)].toFixed(2);
    const p99 = sorted[Math.floor(sorted.length * 0.99)].toFixed(2);

    console.log(`Response Time Latency Metrics:`);
    console.log(`  Min (Fastest)     : ${min} ms`);
    console.log(`  Average           : ${avg} ms`);
    console.log(`  Max (Slowest)     : ${max} ms`);
    console.log(`  95th Percentile   : ${p95} ms`);
    console.log(`  99th Percentile   : ${p99} ms`);
  } else {
    console.log(`No responses recorded.`);
  }
  console.log(`==================================================\n`);
}

runLoadTest().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
