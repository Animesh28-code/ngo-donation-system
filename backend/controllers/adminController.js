const Registration = require("../models/Registration");
const Donation = require("../models/Donation");
const { toCSV } = require("../utils/csvExport");

exports.dashboard = async (req, res) => {
  const totalRegistrations = await Registration.countDocuments();

  const successAgg = await Donation.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  res.json({
    totalRegistrations,
    totalDonationsReceived: successAgg[0]?.total || 0
  });
};

exports.getRegistrations = async (req, res) => {
  const { city } = req.query;
  const q = city ? { city: new RegExp(city, "i") } : {};
  const regs = await Registration.find(q).populate("userId", "name email phone role");
  res.json(regs);
};

exports.exportRegistrationsCSV = async (req, res) => {
  const regs = await Registration.find().populate("userId", "name email phone role");

  const rows = regs.map(r => ({
    name: r.userId?.name || "",
    email: r.userId?.email || "",
    phone: r.userId?.phone || "",
    role: r.userId?.role || "",
    city: r.city || "",
    state: r.state || "",
    cause: r.cause || "",
    registeredAt: r.createdAt?.toISOString() || ""
  }));

  const headers = [
    { id: "name", title: "Name" },
    { id: "email", title: "Email" },
    { id: "phone", title: "Phone" },
    { id: "role", title: "Role" },
    { id: "city", title: "City" },
    { id: "state", title: "State" },
    { id: "cause", title: "Cause" },
    { id: "registeredAt", title: "RegisteredAt" }
  ];

  const csv = toCSV(rows, headers);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=registrations.csv");
  res.send(csv);
};

exports.getDonations = async (req, res) => {
  const { status } = req.query;
  const q = status ? { status } : {};
  const donations = await Donation.find(q).populate("userId", "name email").sort({ createdAt: -1 });
  res.json(donations);
};
