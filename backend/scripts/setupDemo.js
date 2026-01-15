#!/usr/bin/env node

/**
 * Setup Demo Script
 * Creates admin and demo user accounts for testing
 */

const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Registration = require('../models/Registration');
const connectDB = require('../config/db');

const demoUsers = [
  {
    name: 'Admin',
    email: 'admin@ngo.com',
    phone: '9876543210',
    passwordHash: null, // Will be hashed
    role: 'ADMIN',
    registration: null // Admins don't need registration
  },
  {
    name: 'John Doe',
    email: 'user@example.com',
    phone: '9123456789',
    passwordHash: null, // Will be hashed
    role: 'USER',
    registration: {
      address: '123 Helping Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      cause: 'Education'
    }
  }
];

async function setupDemo() {
  try {
    console.log('🔧 Connecting to database...');
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Database connected');

    for (const userData of demoUsers) {
      const { name, email, phone, role, registration } = userData;
      const password = role === 'ADMIN' ? 'admin123' : 'user123';

      console.log(`\n📝 Processing ${role}: ${email}`);

      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        console.log(`   ℹ️  User already exists, updating...`);
        user.name = name;
        user.phone = phone;
        user.role = role;
        user.passwordHash = await bcrypt.hash(password, 10);
        await user.save();
      } else {
        console.log(`   ➕ Creating new user...`);
        user = await User.create({
          name,
          email,
          phone,
          passwordHash: await bcrypt.hash(password, 10),
          role
        });
      }

      // Create registration record if not admin
      if (registration) {
        let reg = await Registration.findOne({ userId: user._id });
        if (reg) {
          console.log(`   ℹ️  Registration already exists, updating...`);
          reg.address = registration.address;
          reg.city = registration.city;
          reg.state = registration.state;
          reg.pincode = registration.pincode;
          reg.cause = registration.cause;
          await reg.save();
        } else {
          console.log(`   ➕ Creating registration...`);
          await Registration.create({
            userId: user._id,
            ...registration
          });
        }
      }

      console.log(`   ✅ ${role} account ready!`);
      console.log(`      Email: ${email}`);
      console.log(`      Password: ${password}`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 Demo Setup Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📋 Test Credentials:\n');
    console.log('  👨‍💼 ADMIN:');
    console.log('     Email: admin@ngo.com');
    console.log('     Password: admin123');
    console.log('     Access: Admin Dashboard\n');
    console.log('  👤 USER:');
    console.log('     Email: user@example.com');
    console.log('     Password: user123');
    console.log('     Access: User Dashboard\n');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Run setup
setupDemo();
