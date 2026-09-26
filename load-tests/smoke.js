import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Phase 4 load-test scaffold.
 * Usage: k6 run -e API_URL=https://api-staging.jsonvault.app load-tests/smoke.js
 */
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:8787';

export default function () {
  const res = http.get(`${API_URL}/health`);
  check(res, {
    'health status 200': (r) => r.status === 200,
  });
  sleep(1);
}
