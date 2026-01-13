const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");

const userController = require("../controllers/userController");

// only USER access
router.use(auth, requireRole("USER"));

router.get("/me/registration", userController.getMyRegistration);
router.get("/me/donations", userController.getMyDonations);

router.post("/donations", userController.createDonation);
router.post("/donations/:transactionId/verify", userController.verifyDonation);

module.exports = router;
