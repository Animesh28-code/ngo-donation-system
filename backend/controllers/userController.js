const Donation = require("../models/Donation");
const Registration = require("../models/Registration");
const crypto = require("crypto");

exports.getProfile = async (req, res) => {
  try {
    const registration = await Registration.findOne({ userId: req.user.id });
    return res.json({
      user: req.user,
      registration,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createDonation = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: "amount is required" });
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) {
      return res.status(400).json({ message: "Invalid amount; must be >= 1" });
    }

    // Use strong random UUID to avoid collisions
    const transactionId = `TXN_${crypto.randomUUID()}`;

    const donation = await Donation.create({
      userId: req.user.id,
      amount: amt,
      status: "PENDING",
      transactionId,
    })

    return res.status(201).json({
      message: "Donation initiated - awaiting payment verification",
      donation,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const { transactionId, status, failureReason } = req.body;

    if (!transactionId || !status) {
      return res
        .status(400)
        .json({ message: "transactionId and status are required" });
    }

    if (!["SUCCESS", "FAILED", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Prevent users from marking their own donations as SUCCESS (avoid fake successes )
    if (status === "SUCCESS" && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: only admin or gateway can mark SUCCESS" });
    }

    const update = {
      status,
      failureReason: status === "FAILED" ? failureReason : null,
      verifiedAt: status === "PENDING" ? null : new Date(),
    };

    const donation = await Donation.findOneAndUpdate(
      { transactionId, userId: req.user.id },
      update,
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    return res.json({
      message: "Donation updated",
      donation,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(donations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getDonationByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const donation = await Donation.findOne({ 
      orderId,
      userId: req.user.id 
    });

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    return res.json(donation);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
