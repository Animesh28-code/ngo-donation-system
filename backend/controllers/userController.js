const Registration = require("../models/Registration");
const Donation = require("../models/Donation");
const { mockPayment } = require("../utils/paymentMock");

function makeTxnId() {
  return "TXN_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

exports.getMyRegistration = async (req, res) => {
  const reg = await Registration.findOne({ userId: req.user.id });
  res.json(reg);
};

exports.getMyDonations = async (req, res) => {
  const list = await Donation.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(list);
};

exports.createDonation = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 1) return res.status(400).json({ message: "Amount must be >= 1" });

  const donation = await Donation.create({
    userId: req.user.id,
    amount,
    status: "PENDING",
    transactionId: makeTxnId()
  });

  res.status(201).json({ message: "Donation attempt created", donation });
};

exports.verifyDonation = async (req, res) => {
  const { transactionId } = req.params;

  const donation = await Donation.findOne({ transactionId, userId: req.user.id });
  if (!donation) return res.status(404).json({ message: "Donation not found" });

  const result = mockPayment(donation.amount);

  donation.status = result.status;
  donation.verifiedAt = new Date();
  donation.failureReason = result.status === "FAILED" ? (result.reason || "Mock failed") : undefined;

  await donation.save();
  res.json({ message: "Verification done", donation });
};
