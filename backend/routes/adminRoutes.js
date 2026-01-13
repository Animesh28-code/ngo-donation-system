const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const {
  dashboard,
  getRegistrations,
  exportRegistrationsCSV,
  getDonations
} = require("../controllers/adminController");

// only ADMIN access
router.use(auth, requireRole("ADMIN"));

router.get("/dashboard", dashboard);
router.get("/registrations", getRegistrations);
router.get("/registrations/export/csv", exportRegistrationsCSV);
router.get("/donations", getDonations);

module.exports = router;
