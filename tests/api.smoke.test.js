import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.API_BASE_URL || 'http://localhost:3000/api';
test('ApexStay API health endpoint responds', async (t) => {
  let response;
  try { response = await fetch(`${base}/health`); }
  catch { t.skip('Start XianFire before running API smoke tests.'); return; }
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'online');
});
