#!/usr/bin/env node

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const morgan = require("morgan");
const crypto = require("crypto");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory database
const db = {
  users: [
    {
      _id: "admin_1",
      name: "Admin User",
      email: "admin@ngo.com",
      phone: "9876543210",
      passwordHash: bcrypt.hashSync("admin123", 10),
      role: "ADMIN"
    },
    {
      _id: "user_1",
      name: "John Doe",
      email: "user@example.com",
      phone: "9123456789",
      passwordHash: bcrypt.hashSync("user123", 10),
      role: "USER"
    }
  ],
  donations: [],
  registrations: []
};

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test_secret");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ✅ LOGIN ENDPOINT
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email & password required" });
    }

    const user = db.users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "7d" }
    );

    console.log(`✅ Login successful for ${email}`);
    return res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ✅ REGISTER ENDPOINT
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }

    if (db.users.some(u => u.email === email)) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = {
      _id: "user_" + Date.now(),
      name,
      email,
      phone: req.body.phone || "",
      passwordHash: bcrypt.hashSync(password, 10),
      role: "USER"
    };

    db.users.push(user);

    db.registrations.push({
      _id: "reg_" + Date.now(),
      userId: user._id,
      address: req.body.registration?.address || "",
      city: req.body.registration?.city || "",
      state: req.body.registration?.state || "",
      pincode: req.body.registration?.pincode || "",
      cause: req.body.registration?.cause || ""
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "7d" }
    );

    console.log(`✅ User registered: ${email}`);
    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ✅ USER PROFILE
app.get("/api/user/profile", authMiddleware, (req, res) => {
  const user = db.users.find(u => u._id === req.user.id);
  const registration = db.registrations.find(r => r.userId === req.user.id);
  res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, registration });
});

// ✅ DONATE
app.post("/api/user/donate", authMiddleware, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 30) {
    return res.status(400).json({ message: "Invalid amount (minimum LKR 30)" });
  }

  const donation = {
    _id: "don_" + Date.now(),
    userId: req.user.id,
    amount: parseFloat(amount),
    status: "SUCCESS",
    orderId: `DON_${Date.now()}`,
    transactionId: `TXN_${crypto.randomUUID()}`,
    paymentMethod: "payhere",
    paymentVerified: true,
    createdAt: new Date()
  };

  db.donations.push(donation);
  console.log(`✅ Donation received: LKR ${amount}`);
  res.status(201).json({ message: "Donation successful", donation });
});

// ✅ LIST DONATIONS
app.get("/api/user/donations", authMiddleware, (req, res) => {
  const donations = db.donations.filter(d => d.userId === req.user.id);
  res.json(donations);
});

// ✅ GET DONATION BY ORDER ID
app.get("/api/user/donations/by-order/:orderId", authMiddleware, (req, res) => {
  const donation = db.donations.find(d => d.orderId === req.params.orderId && d.userId === req.user.id);
  if (!donation) return res.status(404).json({ message: "Donation not found" });
  res.json(donation);
});

// ✅ PAYHERE INIT
app.post("/api/payhere/init", authMiddleware, (req, res) => {
  const { amount } = req.body;
  const order_id = `DON_${Date.now()}`;
  res.json({
    devMode: true,
    message: "DEVELOPMENT MODE: Payment auto-approved",
    order_id,
    amount: parseFloat(amount).toFixed(2),
    status: "SUCCESS"
  });
});

// ✅ ADMIN DASHBOARD
app.get("/api/admin/dashboard", authMiddleware, (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  res.json({
    totalUsers: db.users.length,
    totalDonations: db.donations.length,
    totalAmount: db.donations.reduce((sum, d) => sum + d.amount, 0),
    successDonations: db.donations.filter(d => d.status === "SUCCESS").length
  });
});

// ✅ ADMIN DONATIONS LIST
app.get("/api/admin/donations", authMiddleware, (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  res.json(db.donations);
});

// ✅ START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n🎉 TEST SERVER STARTED (In-Memory Database)");
  console.log(`✅ http://localhost:${PORT}\n`);
  console.log("📝 Test Credentials:");
  console.log("   Admin:  admin@ngo.com / admin123");
  console.log("   User:   user@example.com / user123\n");
  console.log("⚠️  Data will be lost on server restart\n");
});
