const Donation = require("../models/Donation");

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

    if (donation.status !== "PENDING") {
      return res.status(400).json({ message: "Donation is not in PENDING state" });
    }

    // In a real scenario, integrate with payment gateway like Razorpay, Stripe, etc.
    // For now, return a mock payment link
    return res.json({
      message: "Payment initiated",
      paymentLink: `https://sandbox-payment-gateway.com/pay/${donation.transactionId}`,
      transactionId: donation.transactionId,
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

    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }

    const donation = await Donation.findOne({ transactionId });
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Donation must be in PENDING state to verify
    if (donation.status !== "PENDING") {
      return res.status(400).json({ 
        message: "Donation is not in PENDING state. Cannot verify.",
        currentStatus: donation.status 
      });
    }

    // IMPORTANT: In production, verify signature with actual payment gateway
    // For test mode: accept paymentId as valid
    
    // In real implementation with Razorpay:
    // const crypto = require('crypto');
    // const generatedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(orderId + '|' + paymentId)
    //   .digest('hex');
    // if (generatedSignature !== signature) {
    //   donation.status = "FAILED";
    //   donation.failureReason = "Invalid signature - possible tampering";
    //   donation.verifiedAt = new Date();
    //   await donation.save();
    //   return res.json({ message: "Payment verification failed", donation });
    // }

    // Mark donation as SUCCESS after verification
    donation.status = "SUCCESS";
    donation.paymentId = paymentId;
    donation.verifiedAt = new Date();
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

    const { transactionId, status, failureReason } = req.body;
    if (!transactionId || !status) return res.status(400).json({ message: 'transactionId and status required' });
    if (!["SUCCESS", "FAILED", "PENDING"].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const update = {
      status,
      failureReason: status === 'FAILED' ? failureReason : null,
      verifiedAt: status === 'PENDING' ? null : new Date(),
    };

    const donation = await Donation.findOneAndUpdate({ transactionId }, update, { new: true });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    return res.json({ message: 'Donation status updated by gateway', donation });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};