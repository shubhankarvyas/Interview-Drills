import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '10s', target: 50 },   
    { duration: '30s', target: 100 },  
    { duration: '60s', target: 300 }, 
    { duration: '10s', target: 0 },   
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'], 
    http_req_failed: ['rate<0.1'],    
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:5001';

export default function () {
  // Test /api/health endpoint
  let healthRes = http.get(`${BASE_URL}/api/health`);
  let healthCheck = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 50ms': (r) => r.timings.duration < 50,
    'health has ok field': (r) => JSON.parse(r.body).ok === true,
  });
  errorRate.add(!healthCheck);

  sleep(0.1);

  // Test /api/drills endpoint (cached)
  let drillsRes = http.get(`${BASE_URL}/api/drills`);
  let drillsCheck = check(drillsRes, {
    'drills status is 200': (r) => r.status === 200,
    'drills response time < 150ms': (r) => r.timings.duration < 150,
    'drills returns array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  errorRate.add(!drillsCheck);

  // Test individual drill endpoint if drills exist
  if (drillsRes.status === 200) {
    const drills = JSON.parse(drillsRes.body);
    if (drills && drills.length > 0) {
      const randomDrillId = drills[Math.floor(Math.random() * drills.length)]._id;
      
      sleep(0.1);
      
      let drillRes = http.get(`${BASE_URL}/api/drills/${randomDrillId}`);
      let drillCheck = check(drillRes, {
        'drill status is 200': (r) => r.status === 200,
        'drill response time < 150ms': (r) => r.timings.duration < 150,
        'drill has questions': (r) => {
          const drill = JSON.parse(r.body);
          return drill.questions && drill.questions.length > 0;
        },
      });
      errorRate.add(!drillCheck);
    }
  }

  sleep(0.5);
}

// Summary function to display results
export function handleSummary(data) {
  return {
    'k6-results.json': JSON.stringify(data, null, 2),
    stdout: `
Performance Test Results:
========================
Total Requests: ${data.metrics.http_reqs.values.count}
Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

Endpoints Tested:
- GET /api/health (basic health check)
- GET /api/drills (cached endpoint - target <150ms)
- GET /api/drills/:id (individual drill fetch)

Target: 300 requests/sec for 60 seconds
Threshold: <150ms for cached drills endpoint
`,
  };
}
