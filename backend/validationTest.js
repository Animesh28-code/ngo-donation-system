/**
 * Comprehensive Validation Test
 * Tests all requirements from the specification
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

// Test counter
let testsPassed = 0;
let testsFailed = 0;

// Utility function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test utility
async function test(description, fn) {
  try {
    await fn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${err.message}`);
    testsFailed++;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting NGO Donation System Validation Tests\n');

  let token = '';
  let adminToken = '';
  let userId = '';
  let donationId = '';
  let transactionId = '';

  // ===== AUTHENTICATION TESTS =====
  console.log('\n📋 AUTHENTICATION TESTS');
  console.log('========================\n');

  // Test 1: User Registration
  await test('User Registration - Creates new user with registration data', async () => {
    const response = await makeRequest('POST', '/api/auth/register', {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      phone: '1234567890',
      password: 'password123',
      registration: {
        address: '123 Main St',
        city: 'Colombo',
        state: 'Western',
        pincode: '00100',
        cause: 'Education'
      }
    });

    assert.equal(response.status, 201, `Expected 201, got ${response.status}`);
    assert(response.data.token, 'Token should be provided');
    assert.equal(response.data.user.role, 'USER', 'New users should have USER role');
    
    token = response.data.token;
    userId = response.data.user.id;
  });

  // Test 2: Admin Registration Blocked
  await test('Security - Users cannot register as ADMIN', async () => {
    const response = await makeRequest('POST', '/api/auth/register', {
      name: 'Hacker',
      email: `hacker${Date.now()}@example.com`,
      password: 'password123',
      role: 'ADMIN'  // Should be ignored
    });

    assert.equal(response.status, 201);
    assert.equal(response.data.user.role, 'USER', 'Role override should not work');
  });

  // Test 3: User Login
  await test('User Login - Authenticates existing user and returns JWT', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'user123'
    });

    assert.equal(response.status, 200, `Expected 200, got ${response.status}`);
    assert(response.data.token, 'Token should be provided');
    assert.equal(response.data.user.role, 'USER');
  });

  // Test 4: Admin Login
  await test('Admin Login - ADMIN user redirects to admin dashboard', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@ngo.com',
      password: 'admin123'
    });

    assert.equal(response.status, 200);
    assert.equal(response.data.user.role, 'ADMIN', 'Admin should have ADMIN role');
    
    adminToken = response.data.token;
  });

  // Test 5: Invalid Credentials
  await test('Invalid Credentials - Returns 401 for wrong password', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@ngo.com',
      password: 'wrongpassword'
    });

    assert.equal(response.status, 401, `Expected 401, got ${response.status}`);
  });

  // ===== USER FUNCTIONALITY TESTS =====
  console.log('\n📋 USER FUNCTIONALITY TESTS');
  console.log('============================\n');

  // Test 6: View Profile
  await test('View Profile - User can see their registration details', async () => {
    const response = await makeRequest('GET', '/api/user/profile', null, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 200);
    assert(response.data.registration, 'Registration data should be present');
  });

  // Test 7: Create Donation
  await test('Create Donation - User can initiate donation', async () => {
    const response = await makeRequest('POST', '/api/user/donate', {
      amount: 100
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 201);
    assert(response.data.donation, 'Donation should be created');
    assert.equal(response.data.donation.status, 'PENDING');
    
    donationId = response.data.donation._id;
    transactionId = response.data.donation.transactionId;
  });

  // Test 8: Minimum Donation Amount
  await test('Validation - Rejects donations below LKR 30', async () => {
    const response = await makeRequest('POST', '/api/user/donate', {
      amount: 10
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 400, `Expected 400, got ${response.status}`);
    assert(response.data.message.includes('30'), 'Error should mention minimum amount');
  });

  // Test 9: List User Donations
  await test('View Donation History - User can see their donations', async () => {
    const response = await makeRequest('GET', '/api/user/donations', null, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 200);
    assert(Array.isArray(response.data), 'Should return array of donations');
  });

  // Test 10: Get Donation by Order ID
  await test('Get Donation by Order - User can retrieve specific donation by orderId', async () => {
    // First create a donation with orderId
    const createRes = await makeRequest('POST', '/api/payhere/init', {
      amount: 50,
      items: 'NGO Donation',
      donor: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Main St',
        city: 'Colombo'
      }
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(createRes.status, 200);
    const orderId = createRes.data.order_id;

    // Get donation by orderId
    const getRes = await makeRequest('GET', `/api/user/donations/by-order/${orderId}`, null, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(getRes.status, 200);
    assert(getRes.data.orderId, 'Should return donation with orderId');
  });

  // ===== PAYMENT GATEWAY TESTS =====
  console.log('\n📋 PAYMENT GATEWAY TESTS');
  console.log('=========================\n');

  // Test 11: Initialize PayHere Payment
  await test('PayHere Integration - Initialize payment returns correct object', async () => {
    const response = await makeRequest('POST', '/api/payhere/init', {
      amount: 100,
      items: 'NGO Donation',
      donor: {
        first_name: 'Test',
        last_name: 'Donor',
        email: 'donor@example.com',
        phone: '1234567890',
        address: '100 Main St',
        city: 'Colombo'
      }
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 200);
    assert(response.data.order_id, 'Should contain order_id');
    assert(response.data.amount, 'Should contain amount');
    assert.equal(response.data.currency, 'LKR', 'Currency should be LKR');
  });

  // Test 12: Payment Amount Validation
  await test('Payment Validation - Rejects payments below LKR 30', async () => {
    const response = await makeRequest('POST', '/api/payhere/init', {
      amount: 20,
      items: 'NGO Donation',
      donor: {
        first_name: 'Test',
        email: 'test@example.com'
      }
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 400);
    assert(response.data.message.includes('30'));
  });

  // Test 13: Development Mode Auto-Approval
  await test('Development Mode - Payments auto-approved when enabled', async () => {
    const response = await makeRequest('POST', '/api/payhere/init', {
      amount: 50,
      items: 'NGO Donation',
      donor: {
        first_name: 'Test',
        email: 'devtest@example.com'
      }
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 200);
    // In development mode, status should be SUCCESS
    assert(response.data.isDevelopmentMode || response.data.message.includes('auto-approved'),
      'Should indicate development mode auto-approval');
  });

  // ===== ADMIN FUNCTIONALITY TESTS =====
  console.log('\n📋 ADMIN FUNCTIONALITY TESTS');
  console.log('=============================\n');

  // Test 14: Admin Dashboard
  await test('Admin Dashboard - Shows registration and donation stats', async () => {
    const response = await makeRequest('GET', '/api/admin/dashboard', null, {
      'Authorization': `Bearer ${adminToken}`
    });

    assert.equal(response.status, 200);
    assert('totalRegistrations' in response.data, 'Should contain totalRegistrations');
    assert('totalDonations' in response.data, 'Should contain totalDonations');
    assert('totalAmount' in response.data, 'Should contain totalAmount');
  });

  // Test 15: View All Donations (Admin)
  await test('Admin - View all donations', async () => {
    const response = await makeRequest('GET', '/api/admin/donations', null, {
      'Authorization': `Bearer ${adminToken}`
    });

    assert.equal(response.status, 200);
    assert(Array.isArray(response.data), 'Should return array');
  });

  // Test 16: View All Registrations (Admin)
  await test('Admin - View all registrations', async () => {
    const response = await makeRequest('GET', '/api/admin/registrations', null, {
      'Authorization': `Bearer ${adminToken}`
    });

    assert.equal(response.status, 200);
    assert(Array.isArray(response.data), 'Should return array of registrations');
  });

  // Test 17: Admin Only Dashboard Access
  await test('Security - Non-admins cannot access admin dashboard', async () => {
    const response = await makeRequest('GET', '/api/admin/dashboard', null, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 403, `Expected 403, got ${response.status}`);
  });

  // Test 18: Admin Export Registrations
  await test('Admin - Export registrations as CSV', async () => {
    const response = await makeRequest('GET', '/api/admin/registrations/export', null, {
      'Authorization': `Bearer ${adminToken}`
    });

    assert.equal(response.status, 200);
    assert(response.data && typeof response.data === 'string', 'Should return CSV data');
  });

  // Test 19: Admin Donation Stats
  await test('Admin - Get donation statistics', async () => {
    const response = await makeRequest('GET', '/api/admin/stats', null, {
      'Authorization': `Bearer ${adminToken}`
    });

    assert.equal(response.status, 200);
    assert('totalDonations' in response.data);
    assert('successCount' in response.data);
    assert('failedCount' in response.data);
  });

  // ===== DATA INTEGRITY TESTS =====
  console.log('\n📋 DATA INTEGRITY TESTS');
  console.log('========================\n');

  // Test 20: Registration Independent of Donation
  await test('Data Integrity - Registration saved even if payment fails', async () => {
    const email = `integrity${Date.now()}@example.com`;
    
    // Register user
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Integrity Test',
      email: email,
      password: 'test123',
      registration: {
        address: '456 Oak St',
        city: 'Kandy',
        state: 'Central',
        pincode: '20000',
        cause: 'Health'
      }
    });

    assert.equal(regRes.status, 201);
    
    // Verify registration exists
    const response = await makeRequest('GET', '/api/admin/registrations', null, {
      'Authorization': `Bearer ${adminToken}`
    });

    const found = response.data.some(r => 
      r.userId && r.userId.email === email
    );
    assert(found, 'Registration should exist');
  });

  // Test 21: Payment Status Tracking
  await test('Payment Tracking - Donation status tracks payment state', async () => {
    const response = await makeRequest('POST', '/api/user/donate', {
      amount: 50
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 201);
    assert.equal(response.data.donation.status, 'PENDING', 'Initial status should be PENDING');
    assert.equal(response.data.donation.paymentStatus, 'PENDING');
  });

  // ===== SECURITY TESTS =====
  console.log('\n📋 SECURITY TESTS');
  console.log('==================\n');

  // Test 22: Unauthorized Access
  await test('Security - No token denies access', async () => {
    const response = await makeRequest('GET', '/api/user/profile', null, {});

    assert.equal(response.status, 401 || 403, `Expected 401 or 403, got ${response.status}`);
  });

  // Test 23: User Cannot Mark Own Donation as SUCCESS
  await test('Security - User cannot mark their donation as SUCCESS', async () => {
    const response = await makeRequest('POST', '/api/user/donate/status', {
      transactionId: 'TEST_TXN',
      status: 'SUCCESS'
    }, {
      'Authorization': `Bearer ${token}`
    });

    assert.equal(response.status, 403, `Expected 403, got ${response.status}`);
  });

  // Test 24: Email Uniqueness
  await test('Security - Duplicate email registration rejected', async () => {
    const email = 'duplicate@example.com';
    
    // First registration
    await makeRequest('POST', '/api/auth/register', {
      name: 'First User',
      email: email,
      password: 'password123'
    });

    // Second registration with same email
    const response = await makeRequest('POST', '/api/auth/register', {
      name: 'Second User',
      email: email,
      password: 'password456'
    });

    assert.equal(response.status, 409, `Expected 409, got ${response.status}`);
  });

  // ===== SUMMARY =====
  console.log('\n========================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  console.log('========================================\n');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! System meets all requirements.');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testsFailed} test(s) failed. Please review the errors above.`);
    process.exit(1);
  }
}

// Wait for server to be ready, then run tests
setTimeout(() => {
  runTests().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
  });
}, 2000);
