import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp-up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp-up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate below 10%
  },
};

const BASE_URL = 'http://localhost:5001';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health endpoint returns ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.ok === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test drills endpoint (public)
  const drillsRes = http.get(`${BASE_URL}/api/drills`);
  check(drillsRes, {
    'drills endpoint status is 200': (r) => r.status === 200,
    'drills endpoint returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (e) {
        return false;
      }
    },
    'drills response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test individual drill endpoint
  if (drillsRes.status === 200) {
    try {
      const drills = JSON.parse(drillsRes.body);
      if (drills.length > 0) {
        const firstDrillId = drills[0]._id;
        const drillRes = http.get(`${BASE_URL}/api/drills/${firstDrillId}`);
        
        check(drillRes, {
          'single drill endpoint status is 200': (r) => r.status === 200,
          'single drill contains questions': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.questions && Array.isArray(body.questions);
            } catch (e) {
              return false;
            }
          },
          'single drill response time < 150ms': (r) => r.timings.duration < 150,
        }) || errorRate.add(1);
      }
    } catch (e) {
      errorRate.add(1);
    }
  }

  sleep(2);

  // Test rate limiting
  const rapidRequests = [];
  for (let i = 0; i < 5; i++) {
    rapidRequests.push(http.get(`${BASE_URL}/api/health`));
  }
  
  let rateLimitHit = false;
  rapidRequests.forEach(res => {
    if (res.status === 429) {
      rateLimitHit = true;
    }
  });

  // Rate limiting should not be hit with reasonable requests
  check(rapidRequests[0], {
    'rate limiting allows reasonable requests': () => !rateLimitHit || rapidRequests.length > 100,
  });

  sleep(1);
}

// Setup function - runs once at the beginning
export function setup() {
  console.log('Starting Upivot performance tests...');
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed. Status: ${healthCheck.status}`);
  }
  
  console.log('API health check passed. Starting load tests...');
  return {};
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('Performance tests completed.');
}

export { errorRate };
