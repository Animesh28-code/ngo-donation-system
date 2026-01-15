const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your environment before running this script.');
    process.exit(1);
  }

  await connectDB(process.env.MONGO_URI);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Admin',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'ADMIN'
    });
    console.log('Admin user created:', user.email);
  } else {
    user.role = 'ADMIN';
    if (password) user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    console.log('Admin user updated:', user.email);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});