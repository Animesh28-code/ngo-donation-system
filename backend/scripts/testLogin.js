#!/usr/bin/env node

/**
 * Test Login Script
 * Verifies admin login works
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

async function testLogin() {
  try {
    console.log('🔧 Connecting to database...');
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Database connected\n');

    // Find admin user
    const user = await User.findOne({ email: 'admin@ngo.com' });
    
    if (!user) {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('📝 Found user:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`);

    // Test password comparison
    const password = 'admin123';
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    console.log(`\n🔐 Testing password '${password}':`);
    console.log(`   Match: ${isMatch ? '✅ YES' : '❌ NO'}`);

    if (isMatch) {
      console.log('\n✅ Login would succeed!');
    } else {
      console.log('\n❌ Login would fail - password mismatch!');
      
      // Try to create a new hash and compare
      const newHash = await bcrypt.hash(password, 10);
      const newMatch = await bcrypt.compare(password, newHash);
      console.log(`   Fresh hash test: ${newMatch ? '✅ Fresh hash works' : '❌ Fresh hash also fails'}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testLogin();
