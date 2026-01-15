const Donation = require("../models/Donation");
const Registration = require("../models/Registration");
const { toCSV } = require("../utils/csvExport");

exports.getDashboard = async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();
    
    const donationStats = await Donation.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]);

    const totalDonations = donationStats[0]?.total || 0;
    const totalAmount = donationStats[0]?.amount || 0;

    return res.json({
      totalRegistrations,
      totalDonations,
      totalAmount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email role");

    return res.json(donations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getDonationStats = async (req, res) => {
  try {
    const total = await Donation.countDocuments();
    const success = await Donation.countDocuments({ status: "SUCCESS" });
    const failed = await Donation.countDocuments({ status: "FAILED" });

    const totalAmountAgg = await Donation.aggregate([
      { $match: { status: "SUCCESS" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    return res.json({
      totalDonations: total,
      successCount: success,
      failedCount: failed,
      successPercentage: total ? ((success / total) * 100).toFixed(2) : 0,
      totalAmountCollected: totalAmountAgg[0]?.totalAmount || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin-only: update any donation status and record who verified it
exports.updateDonationStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, failureReason } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({ message: "transactionId and status are required" });
    }

    if (!["SUCCESS", "FAILED", "PENDING"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const update = {
      status,
      failureReason: status === "FAILED" ? failureReason : null,
      verifiedAt: status === "PENDING" ? null : new Date(),
      verifiedBy: req.user.id
    };

    const donation = await Donation.findOneAndUpdate({ transactionId }, update, { new: true });
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    return res.json({ message: "Donation updated", donation });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAdminSummary = async (req, res) => {
  try {
    const recentDonations = await Donation.find().sort({ createdAt: -1 }).limit(10).populate("userId", "name email");
    return res.json({ recentDonations });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 }).populate("userId", "name email phone");
    return res.json(regs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.exportRegistrationsCSV = async (req, res) => {
  try {
    const regs = await Registration.find().populate("userId", "name email");
    const rows = regs.map(r => ({ name: r.userId?.name || "", email: r.userId?.email || "", address: r.address || "", city: r.city || "", state: r.state || "", pincode: r.pincode || "", cause: r.cause || "", registeredAt: r.createdAt }));
    const csv = toCSV(rows, [
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'address', title: 'Address' },
      { id: 'city', title: 'City' },
      { id: 'state', title: 'State' },
      { id: 'pincode', title: 'Pincode' },
      { id: 'cause', title: 'Cause' },
      { id: 'registeredAt', title: 'RegisteredAt' }
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
