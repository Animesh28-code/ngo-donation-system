#!/usr/bin/env node

/**
 * Update old PENDING donations to SUCCESS
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Donation = require('../models/Donation');
const connectDB = require('../config/db');

async function updateDonations() {
  try {
    console.log('🔧 Connecting to database...');
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Database connected');

    console.log('\n📝 Updating PENDING donations to SUCCESS...');
    
    const result = await Donation.updateMany(
      { status: 'PENDING' },
      { 
        $set: { 
          status: 'SUCCESS',
          verifiedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} donations from PENDING to SUCCESS`);
    console.log(`📊 Total matched: ${result.matchedCount}`);

    // Show updated donations
    const updated = await Donation.find({ status: 'SUCCESS' }).limit(5);
    console.log('\n📋 Sample of updated donations:');
    updated.forEach(d => {
      console.log(`   - Transaction: ${d.transactionId}, Amount: ₹${d.amount}, Status: ${d.status}`);
    });

    console.log('\n✅ Update complete!');

  } catch (error) {
    console.error('❌ Error during update:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

updateDonations();
