#!/usr/bin/env node
/**
 * Quick Validation Test - Tests core functionality
 */

const http = require('http');

let passed = 0;
let failed = 0;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, body: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('\n🧪 NGO Donation System - Validation Tests\n');

  let userToken = '';
  let adminToken = '';
  let orderId = '';

  // Test 1: Server is running
  await test('Server responds', async () => {
    const res = await request('GET', '/');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 2: Admin login
  await test('Admin login works', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@ngo.com',
      password: 'admin123'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.token) throw new Error('No token');
    if (res.body.user.role !== 'ADMIN') throw new Error('Not admin');
    adminToken = res.body.token;
  });

  // Test 3: User login
  await test('User login works', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'user123'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.token) throw new Error('No token');
    userToken = res.body.token;
  });

  // Test 4: User registration
  await test('User registration works', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'test123',
      registration: {
        address: '123 Main',
        city: 'Colombo',
        state: 'Western',
        cause: 'Education'
      }
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.raw}`);
  });

  // Test 5: Minimum donation amount enforced
  await test('Minimum LKR 30 donation enforced', async () => {
    const res = await request('POST', '/api/user/donate', {
      amount: 10
    }, userToken);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 6: Valid donation created
  await test('Valid donation can be created', async () => {
    const res = await request('POST', '/api/user/donate', {
      amount: 50
    }, userToken);
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.raw}`);
  });

  // Test 7: PayHere payment initialization
  await test('PayHere payment initialization works', async () => {
    const res = await request('POST', '/api/payhere/init', {
      amount: 100,
      items: 'Donation',
      donor: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      }
    }, userToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.raw}`);
    if (!res.body.order_id) throw new Error('No order_id');
    orderId = res.body.order_id;
  });

  // Test 8: Payment amount minimum validation
  await test('PayHere minimum amount validation', async () => {
    const res = await request('POST', '/api/payhere/init', {
      amount: 15,
      donor: { first_name: 'Test', email: 'test@example.com' }
    }, userToken);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // Test 9: User can view profile
  await test('User profile endpoint works', async () => {
    const res = await request('GET', '/api/user/profile', null, userToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 10: User can list donations
  await test('User donation history works', async () => {
    const res = await request('GET', '/api/user/donations', null, userToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Not array');
  });

  // Test 11: Admin dashboard
  await test('Admin dashboard works', async () => {
    const res = await request('GET', '/api/admin/dashboard', null, adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.totalDonations === undefined) throw new Error('Missing data');
  });

  // Test 12: Admin can list donations
  await test('Admin donations list works', async () => {
    const res = await request('GET', '/api/admin/donations', null, adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Not array');
  });

  // Test 13: Admin can list registrations
  await test('Admin registrations list works', async () => {
    const res = await request('GET', '/api/admin/registrations', null, adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Not array');
  });

  // Test 14: Non-admin cannot access admin endpoints
  await test('Security - Non-admin blocked from admin', async () => {
    const res = await request('GET', '/api/admin/dashboard', null, userToken);
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // Test 15: Admin can export registrations
  await test('Admin can export registrations CSV', async () => {
    const res = await request('GET', '/api/admin/registrations/export', null, adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.raw || !res.raw.includes('Name')) throw new Error('Invalid CSV');
  });

  // Test 16: Admin stats endpoint
  await test('Admin stats endpoint works', async () => {
    const res = await request('GET', '/api/admin/stats', null, adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.totalDonations === undefined) throw new Error('Missing totalDonations');
  });

  // Test 17: Registration independent of donation
  await test('Registration saved independently', async () => {
    const email = `indep${Date.now()}@test.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Indep Test',
      email: email,
      password: 'test123',
      registration: {
        address: '999 Test St',
        city: 'Galle',
        cause: 'Health'
      }
    });
    if (regRes.status !== 201) throw new Error('Registration failed');

    const listRes = await request('GET', '/api/admin/registrations', null, adminToken);
    if (listRes.status !== 200) throw new Error('List failed');
    
    const found = listRes.body.some(r => r.userId && r.userId.email === email);
    if (!found) throw new Error('Registration not found');
  });

  // Test 18: Role-based access control
  await test('Role-based access control works', async () => {
    const noTokenRes = await request('GET', '/api/user/profile', null, '');
    if (noTokenRes.status !== 401) throw new Error('Should require token');
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  Some tests failed.\n`);
    process.exit(1);
  }
}

setTimeout(() => run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}), 1000);
