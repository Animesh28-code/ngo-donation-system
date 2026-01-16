require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const payhereRoutes = require("./routes/payhereRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "NGO Registration & Donation API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payhere", payhereRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Fail fast if JWT secret isn't set or is still the default placeholder
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_this_secret") {
    console.error("⚠️ JWT_SECRET is not set or is using the default insecure value. Set a strong JWT_SECRET in your .env before starting the server.");
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("⚠️ MONGO_URI is not set. Please set your MongoDB connection string in .env.");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  await connectDB(process.env.MONGO_URI);
  console.log("✅ Database connected");

  console.log(`🚀 Starting server on port ${PORT}...`);
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Server listening on all interfaces`);
      console.log('🎉 Server is ready to accept requests');
      // Give the server a moment to fully stabilize
      setTimeout(() => resolve(server), 100);
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
      reject(err);
    });
  });
}

// If run directly, start the server. When required (for tests), the test harness can call startServer() or connectDB() directly.
if (require.main === module) {
  startServer()
    .then(() => {
      console.log('✅ Server initialized successfully');
      // Keep the process alive
      process.on('SIGINT', () => {
        console.log('\n\nServer shutting down...');
        process.exit(0);
      });
    })
    .catch((err) => {
      console.error("❌ Server start failed:", err);
      process.exit(1);
    });
}

module.exports = { app, startServer };
