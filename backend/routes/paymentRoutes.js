const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Public endpoint - Gateway will call this with a shared secret header 'x-gateway-secret'
router.post('/callback', paymentController.gatewayCallback);

// User endpoints for payment operations
router.post('/initiate', auth, paymentController.initiatePayment);
router.post('/verify', auth, paymentController.verifyPayment);

module.exports = router;