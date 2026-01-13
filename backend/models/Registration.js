const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    address: String,
    city: String,
    state: String,
    pincode: String,
    cause: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
