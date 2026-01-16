const router = require("express").Router();
const { initPayment, notifyPayment } = require("../controllers/payhereController");
const auth = require("../middleware/auth");

router.post("/init", auth, initPayment);     // creates pending + returns payment object + hash
router.post("/notify", notifyPayment); // PayHere server callback (public, no auth needed)

module.exports = router;
