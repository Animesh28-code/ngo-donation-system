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

// Helpers
const md5 = (str) => crypto.createHash("md5").update(str).digest("hex");
const formatAmount = (amt) => Number(amt).toFixed(2);

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
app.use(express.urlencoded({ extended: false })); // handle PayHere form posts
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "NGO Donation System API - Test Server Running" });
});

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

// ✅ PAYHERE INIT (sandbox, creates pending donation and returns PayHere payload)
app.post("/api/payhere/init", authMiddleware, (req, res) => {
  try {
    const { amount, items = "NGO Donation", donor = {} } = req.body || {};
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 30) {
      return res.status(400).json({ message: "Invalid amount (minimum LKR 30)" });
    }

    const orderId = `DON_${Date.now()}`;
    const currency = "LKR";

    // Create pending donation attempt
    const donation = {
      _id: `don_${Date.now()}`,
      userId: req.user.id,
      amount: numAmount,
      status: "PENDING",
      paymentStatus: "PENDING",
      orderId,
      transactionId: orderId,
      paymentMethod: "payhere",
      paymentVerified: false,
      createdAt: new Date()
    };
    db.donations.push(donation);

    // Build PayHere payload
    const merchant_id = process.env.PAYHERE_MERCHANT_ID || "1211149";
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET || "sandbox_secret";
    const sandbox = String(process.env.PAYHERE_SANDBOX || "true") === "true";
    const frontend = process.env.FRONTEND_URL || "http://127.0.0.1:5173";
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:5000";
    const notify_url = process.env.PAYHERE_NOTIFY_URL || `${backend}/api/payhere/notify`;

    const amountFormatted = formatAmount(numAmount);
    const secretHash = md5(merchant_secret).toUpperCase();
    const hash = md5(
      merchant_id +
      orderId +
      amountFormatted +
      currency +
      secretHash
    ).toUpperCase();

    const payment = {
      sandbox,
      merchant_id,
      return_url: `${frontend}/payment/processing?order_id=${orderId}`,
      cancel_url: `${frontend}/payment/processing?order_id=${orderId}`,
      notify_url,
      order_id: orderId,
      items,
      amount: amountFormatted,
      currency,
      hash,
      first_name: donor.first_name || "Donor",
      last_name: donor.last_name || "",
      email: donor.email || "",
      phone: donor.phone || "",
      address: donor.address || "",
      city: donor.city || "",
      country: "Sri Lanka"
    };

    console.log("✅ PayHere init created order", orderId, "status=PENDING");
    return res.json(payment);
  } catch (err) {
    console.error("payhere/init error", err);
    return res.status(500).json({ message: "Failed to init PayHere" });
  }
});

// ✅ PAYHERE NOTIFY (webhook)
app.post("/api/payhere/notify", (req, res) => {
  try {
    const merchant_id = process.env.PAYHERE_MERCHANT_ID || "1211149";
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET || "sandbox_secret";

    const {
      order_id,
      status_code,
      payhere_amount,
      payhere_currency,
      md5sig,
    } = req.body || {};

    if (!order_id) {
      console.error("❌ Missing order_id in notify");
      return res.status(400).send("missing order_id");
    }

    const secretHash = md5(merchant_secret).toUpperCase();
    const expectedSig = md5(
      merchant_id +
      order_id +
      payhere_amount +
      payhere_currency +
      status_code +
      secretHash
    ).toUpperCase();

    const isValid = expectedSig === String(md5sig || "").toUpperCase();

    let newStatus = "FAILED";
    if (String(status_code) === "2") newStatus = "SUCCESS";
    else if (String(status_code) === "0") newStatus = "PENDING";
    else if (String(status_code) === "-1") newStatus = "CANCELED";
    else if (String(status_code) === "-3") newStatus = "CHARGEDBACK";

    const donation = db.donations.find((d) => d.orderId === order_id);
    if (donation) {
      donation.status = newStatus;
      donation.paymentStatus = newStatus;
      donation.paymentVerified = isValid && newStatus === "SUCCESS";
      donation.transactionDate = new Date();
      if (!isValid) {
        donation.failureReason = "Invalid payment signature";
      }
    }

    console.log("📨 PayHere notify", { order_id, status_code, isValid, newStatus });
    return res.status(200).send("OK");
  } catch (err) {
    console.error("notify error", err);
    return res.status(200).send("OK");
  }
});

// ✅ TEST WEBHOOK - Simulate PayHere webhook for development (70% success rate)
app.post("/api/payhere/notify-test", (req, res) => {
  try {
    const { order_id } = req.body || {};

    if (!order_id) {
      console.error("❌ Missing order_id in test-notify");
      return res.status(400).json({ message: "Missing order_id" });
    }

    const donation = db.donations.find((d) => d.orderId === order_id);
    if (!donation) {
      console.error("❌ Donation not found for order_id:", order_id);
      return res.status(404).json({ message: "Donation not found" });
    }

    // 70% success, 30% pending (for demo/testing)
    const randomStatus = Math.random() < 0.7 ? "SUCCESS" : "PENDING";
    
    donation.status = randomStatus;
    donation.paymentStatus = randomStatus;
    donation.paymentVerified = randomStatus === "SUCCESS";
    donation.transactionDate = new Date();

    console.log(`✅ Test webhook: ${order_id} → ${randomStatus}`);
    return res.json({ message: "Test webhook processed", status: randomStatus });
  } catch (err) {
    console.error("test-notify error", err);
    return res.status(500).json({ message: err.message });
  }
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

// ✅ ADMIN REGISTRATIONS LIST
app.get("/api/admin/registrations", authMiddleware, (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const regsWithUsers = db.registrations.map(reg => ({
    ...reg,
    userId: db.users.find(u => u._id === reg.userId)
  }));
  res.json(regsWithUsers);
});

// ✅ ADMIN EXPORT REGISTRATIONS CSV
app.get("/api/admin/registrations/export", authMiddleware, (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  
  let csv = "Name,Email,Address,City,State,Pincode,Cause\n";
  db.registrations.forEach(reg => {
    const user = db.users.find(u => u._id === reg.userId);
    csv += `${user?.name || ""},${user?.email || ""},"${reg.address || ""}","${reg.city || ""}","${reg.state || ""}","${reg.pincode || ""}","${reg.cause || ""}"\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
  res.send(csv);
});

// ✅ ADMIN DONATION STATS
app.get("/api/admin/stats", authMiddleware, (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const total = db.donations.length;
  const success = db.donations.filter(d => d.status === "SUCCESS").length;
  const failed = db.donations.filter(d => d.status === "FAILED").length;
  const totalAmount = db.donations.reduce((sum, d) => d.status === "SUCCESS" ? sum + d.amount : sum, 0);
  
  res.json({
    totalDonations: total,
    successCount: success,
    failedCount: failed,
    successPercentage: total ? ((success / total) * 100).toFixed(2) : 0,
    totalAmountCollected: totalAmount
  });
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
