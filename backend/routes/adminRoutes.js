// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const adminController = require("../controllers/adminController");

// Protect all admin routes
router.get("/dashboard", auth, role("ADMIN"), adminController.getDashboard);
router.get("/donations", auth, role("ADMIN"), adminController.getAllDonations);
router.get("/stats", auth, role("ADMIN"), adminController.getDonationStats);
router.get("/summary", auth, role("ADMIN"), adminController.getAdminSummary);

// Admin may update any donation status (audit recorded)
router.patch("/donations/:transactionId", auth, role("ADMIN"), adminController.updateDonationStatus);

router.get("/registrations", auth, role("ADMIN"), adminController.getAllRegistrations);
router.get("/registrations/export", auth, role("ADMIN"), adminController.exportRegistrationsCSV);

module.exports = router;
