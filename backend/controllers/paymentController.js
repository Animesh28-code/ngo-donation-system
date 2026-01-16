const crypto = require('crypto');
const Donation = require("../models/Donation");

// Generate PayHere payment hash
function generatePaymentHash(merchantSecret, orderId, merchantId, amount, currency) {
  const hashString = `${merchantId}${orderId}${amount}${currency}${merchantSecret}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

// Verify PayHere notify hash
function verifyNotifyHash(merchantSecret, merchantId, orderId, amount, currency, hash) {
  const expectedHash = generatePaymentHash(merchantSecret, orderId, merchantId, amount, currency);
  return hash === expectedHash;
}

// Initialize PayHere payment
exports.initPayment = async (req, res) => {
  try {
    const { donationId } = req.params;

    // Find donation
    const donation = await Donation.findById(donationId).populate('userId');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      return res.status(500).json({ message: 'Payment gateway not configured' });
    }

    // Generate order ID
    const orderId = `DON-${donation._id.toString().substring(0, 12).toUpperCase()}`;

    // Get user details
    const user = donation.userId;
    const amount = donation.amount.toFixed(2);
    const currency = 'LKR';

    // Generate hash
    const hash = generatePaymentHash(merchantSecret, orderId, merchantId, amount, currency);

    // Return payment initialization data
    return res.json({
      order_id: orderId,
      items: 'NGO Donation',
      amount: amount,
      currency: currency,
      first_name: user.name.split(' ')[0] || 'Donor',
      last_name: user.name.split(' ')[1] || user.name,
      email: user.email,
      phone: user.phone || '0771234567',
      address: donation.address || 'Not provided',
      city: donation.city || 'Not provided',
      hash: hash,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/donations`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/donations`,
      notify_url: `${process.env.NOTIFY_URL || 'http://localhost:5000'}/api/payment/notify`
    });
  } catch (err) {
    console.error('Payment init error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// PayHere payment notification callback
exports.paymentNotify = async (req, res) => {
  try {
    console.log('PayHere notification received:', req.body);

    const { merchant_id, order_id, payhere_amount, payhere_currency, payhere_payment_id, payhere_method, status_code, md5sig } = req.body;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    // Verify hash signature
    const isValid = verifyNotifyHash(
      merchantSecret,
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      md5sig
    );

    console.log('Hash verification:', isValid);

    if (!isValid) {
      console.error('Invalid payment signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Extract donation ID from order_id (format: DON-XXXXX)
    const donationId = order_id.split('-')[1];

    // Find and update donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      console.error('Donation not found:', donationId);
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Update donation status based on PayHere response
    if (status_code === 2) {
      // 2 = Success
      donation.paymentStatus = 'SUCCESS';
      donation.paymentId = payhere_payment_id;
      donation.paymentMethod = payhere_method || 'payhere';
      donation.transactionDate = new Date();
      await donation.save();
      console.log('Payment successful:', donationId);
    } else if (status_code === 0) {
      // 0 = Pending
      donation.paymentStatus = 'PENDING';
      await donation.save();
      console.log('Payment pending:', donationId);
    } else {
      // Payment failed
      donation.paymentStatus = 'FAILED';
      await donation.save();
      console.log('Payment failed:', donationId);
    }

    // PayHere expects a 200 response
    return res.json({ message: 'Notification processed' });
  } catch (err) {
    console.error('Payment notify error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    return res.json({
      status: donation.paymentStatus || 'PENDING',
      amount: donation.amount,
      date: donation.transactionDate || donation.createdAt
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Legacy endpoints for compatibility
exports.initiatePayment = async (req, res) => {
  try {
    const { donationId, amount } = req.body;

    if (!donationId || !amount) {
      return res.status(400).json({ message: "donationId and amount are required" });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Use PayHere init endpoint instead
    return res.json({
      message: "Use /api/payment/payhere/init/{donationId} endpoint",
      redirectUrl: `/api/payment/init/${donationId}`
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { transactionId, paymentId, signature } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: "transactionId is required" });
    }

    const donation = await Donation.findOne({ transactionId });
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    donation.paymentStatus = "SUCCESS";
    donation.paymentId = paymentId;
    await donation.save();

    return res.json({
      message: "Payment verified successfully",
      donation,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.gatewayCallback = async (req, res) => {
  try {
    const secret = req.headers['x-gateway-secret'];
    if (!process.env.PAYMENT_GATEWAY_SECRET) {
      return res.status(500).json({ message: 'Payment gateway secret not configured on server' });
    }
    if (!secret || secret !== process.env.PAYMENT_GATEWAY_SECRET) {
      return res.status(403).json({ message: 'Forbidden: invalid gateway secret' });
    }

    const { transactionId, status } = req.body;
    if (!transactionId || !status) return res.status(400).json({ message: 'transactionId and status required' });

    const donation = await Donation.findOne({ transactionId });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.paymentStatus = status;
    await donation.save();

    return res.json({ message: 'Donation status updated by gateway', donation });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};