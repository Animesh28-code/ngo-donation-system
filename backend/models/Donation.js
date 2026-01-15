const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING", index: true },
    transactionId: { type: String, required: true, unique: true },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    failureReason: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
