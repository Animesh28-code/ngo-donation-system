require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

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

  await connectDB(process.env.MONGO_URI);

  const server = app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  return server;
}

// If run directly, start the server. When required (for tests), the test harness can call startServer() or connectDB() directly.
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
