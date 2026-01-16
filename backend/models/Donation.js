const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING", index: true },
    paymentStatus: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING", index: true },
    transactionId: { type: String, required: true, unique: true },
    paymentId: String, // PayHere payment ID
    paymentMethod: { type: String, default: "payhere" },
    transactionDate: Date,
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    failureReason: String,
    // Address details for payment
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
