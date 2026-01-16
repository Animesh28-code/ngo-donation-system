const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// PayHere payment routes
router.get('/init/:donationId', auth, paymentController.initPayment);
router.post('/notify', paymentController.paymentNotify); // Public endpoint for PayHere callback
router.get('/status/:donationId', auth, paymentController.getPaymentStatus);

// Legacy endpoints - Gateway will call this with a shared secret header 'x-gateway-secret'
router.post('/callback', paymentController.gatewayCallback);

// User endpoints for payment operations
router.post('/initiate', auth, paymentController.initiatePayment);
router.post('/verify', auth, paymentController.verifyPayment);

module.exports = router;