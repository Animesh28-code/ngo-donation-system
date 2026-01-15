const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/profile", auth, userController.getProfile);

router.post("/donate", auth, userController.createDonation);
router.post("/donate/status", auth, userController.updateDonationStatus);
router.get("/donations", auth, userController.listDonations);

module.exports = router;
