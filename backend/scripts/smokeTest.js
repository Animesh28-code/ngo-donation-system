(async () => {
  try {
    require('dotenv').config({ path: './.env' });
    const fetch = global.fetch || (await import('node-fetch')).default;

    console.log('1) Registering donor...');
    const regResp = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Donor', email: 'donor@example.com', password: 'pass123', registration: { address: 'Addr', city: 'City', cause: 'Education' } })
    });
    const regJson = await regResp.json();
    console.log('register status', regResp.status, regJson);

    console.log('2) Logging in donor...');
    const loginResp = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'donor@example.com', password: 'pass123' })
    });
    const loginJson = await loginResp.json();
    console.log('login status', loginResp.status, loginJson);
    const token = loginJson.token;
    if (!token) throw new Error('No token returned from login');

    console.log('3) Creating donation (PENDING)...');
    const donateResp = await fetch('http://localhost:5000/api/user/donate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: 50 })
    });
    const donateJson = await donateResp.json();
    console.log('donate status', donateResp.status, donateJson);
    const txn = donateJson.donation?.transactionId;
    if (!txn) throw new Error('No transactionId returned');

    console.log('4) Attempting to mark SUCCESS as user (should be forbidden)...');
    const userMarkResp = await fetch('http://localhost:5000/api/user/donate/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ transactionId: txn, status: 'SUCCESS' })
    });
    console.log('user mark status', userMarkResp.status);
    try { console.log(await userMarkResp.json()); } catch(e){}

    console.log('5) Gateway callback marking SUCCESS...');
    const gwSecret = process.env.PAYMENT_GATEWAY_SECRET || '7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6';
    const gwResp = await fetch('http://localhost:5000/api/payment/callback', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-gateway-secret': gwSecret }, body: JSON.stringify({ transactionId: txn, status: 'SUCCESS' })
    });
    const gwJson = await gwResp.json();
    console.log('gateway status', gwResp.status, gwJson);

    console.log('6) Creating/promoting admin user directly in DB...');
    // Promote or create an admin directly so we can test admin-only endpoint
    const mongoose = require('mongoose');
    const connectDB = require('../config/db');
    await connectDB(process.env.MONGO_URI);
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: await bcrypt.hash('adminpass', 10), role: 'ADMIN' });
      console.log('Admin created');
    } else {
      admin.role = 'ADMIN'; await admin.save(); console.log('Admin promoted');
    }

    console.log('7) Login as admin...');
    const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'adminpass' })
    });
    const adminLoginJson = await adminLogin.json();
    console.log('admin login status', adminLogin.status, adminLoginJson);
    const adminToken = adminLoginJson.token;

    console.log('8) Admin updating donation to FAILED (audit)...');
    const adminUpdate = await fetch(`http://localhost:5000/api/admin/donations/${txn}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ status: 'FAILED', failureReason: 'bank timeout' })
    });
    const adminUpdateJson = await adminUpdate.json();
    console.log('admin update status', adminUpdate.status, adminUpdateJson);

    console.log('Smoke test complete');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
})();