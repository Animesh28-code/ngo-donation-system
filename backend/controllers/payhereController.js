const crypto = require("crypto");
const Donation = require("../models/Donation");

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

// POST /api/payhere/init
// body: { amount, items, donor: {first_name,last_name,email,phone,address,city} }
exports.initPayment = async (req, res) => {
  try {
    const merchant_id = process.env.PAYHERE_MERCHANT_ID;
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    const sandbox = String(process.env.PAYHERE_SANDBOX) === "true";
    const isDevelopmentMode = String(process.env.DEVELOPMENT_MODE_SKIP_PAYMENT_GATEWAY) === "true";
    const userId = req.user.id; // Get from auth middleware

    const {
      amount,
      items = "NGO Donation",
      donor,
    } = req.body;

    if (!amount || !donor?.email || !donor?.first_name) {
      return res.status(400).json({ message: "amount and donor details required" });
    }

    // Validate minimum donation amount (LKR 30)
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 30) {
      return res.status(400).json({ message: "Minimum donation amount is LKR 30" });
    }

    // 1) create a pending donation attempt in DB (IMPORTANT rule)
    const order_id = `DON_${Date.now()}`;
    const currency = "LKR";

    const donationData = {
      userId,
      orderId: order_id,
      amount: numAmount,
      status: isDevelopmentMode ? "SUCCESS" : "PENDING",
      paymentStatus: isDevelopmentMode ? "SUCCESS" : "PENDING",
      paymentMethod: "payhere",
      transactionId: order_id,
      address: donor.address || "",
      city: donor.city || "",
    };

    const donation = await Donation.create(donationData);

    // If in development mode, auto-approve the payment
    if (isDevelopmentMode) {
      console.log("✅ DEVELOPMENT MODE: Payment auto-approved for donation:", donation._id);
      return res.json({
        sandbox: true,
        merchant_id: "TEST",
        order_id,
        amount: numAmount.toFixed(2),
        currency,
        donationId: donation._id,
        message: "DEVELOPMENT MODE: Payment auto-approved",
        isDevelopmentMode: true,
      });
    }

    // 2) hash generation (PayHere style)
    const amountFormatted = numAmount.toFixed(2);
    const secretHash = md5(merchant_secret).toUpperCase();
    const hash = md5(
      merchant_id +
      order_id +
      amountFormatted +
      currency +
      secretHash
    ).toUpperCase();

    // 3) build PayHere payment object (frontend will use this)
    const frontend = process.env.FRONTEND_URL;
    const notify = process.env.PAYHERE_NOTIFY_URL || `${process.env.BACKEND_URL}/api/payhere/notify`;

    console.log("✅ Payment initialized:", {
      order_id,
      amount: amountFormatted,
      hash,
    });

    return res.json({
      sandbox,
      merchant_id,
      return_url: `${frontend}/payment/success?order_id=${order_id}`,
      cancel_url: `${frontend}/payment/cancel?order_id=${order_id}`,
      notify_url: notify,

      order_id,
      items,
      amount: amountFormatted,
      currency,
      hash,

      first_name: donor.first_name,
      last_name: donor.last_name || "",
      email: donor.email,
      phone: donor.phone || "",
      address: donor.address || "",
      city: donor.city || "",
      country: "Sri Lanka",

      donationDbId: donation._id,
    });
  } catch (err) {
    console.error("initPayment error:", err);
    res.status(500).json({ message: "initPayment failed: " + err.message });
  }
};

// POST /api/payhere/notify
// PayHere will POST with: order_id, status_code, payhere_amount, payhere_currency, md5sig, etc.
exports.notifyPayment = async (req, res) => {
  try {
    const merchant_id = process.env.PAYHERE_MERCHANT_ID;
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
    const isDevelopmentMode = String(process.env.DEVELOPMENT_MODE_SKIP_PAYMENT_GATEWAY) === "true";

    const {
      order_id,
      status_code,
      payhere_amount,
      payhere_currency,
      md5sig,
    } = req.body;

    console.log("📨 PayHere notify received:", {
      order_id,
      status_code,
      payhere_amount,
      payhere_currency,
      md5sig,
    });

    if (!order_id) {
      console.error("❌ Missing order_id in notify");
      return res.status(400).send("missing order_id");
    }

    // If in development mode, skip signature verification
    let isValid = isDevelopmentMode;

    if (!isDevelopmentMode) {
      // Verify signature (genuine confirmation)
      const secretHash = md5(merchant_secret).toUpperCase();
      const expectedSig = md5(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        secretHash
      ).toUpperCase();

      isValid = (expectedSig === String(md5sig || "").toUpperCase());

      console.log("🔐 Signature verification:", {
        expected: expectedSig,
        received: String(md5sig || "").toUpperCase(),
        isValid,
      });
    } else {
      console.log("✅ DEVELOPMENT MODE: Skipping signature verification");
    }

    // Map PayHere status_code to your system status
    // 2 = success, 0 = pending, anything else = failed
    let newStatus = "FAILED";
    if (String(status_code) === "2") newStatus = "SUCCESS";
    else if (String(status_code) === "0") newStatus = "PENDING";

    // Update DB only if signature valid (or dev mode)
    if (isValid) {
      const updated = await Donation.findOneAndUpdate(
        { orderId: order_id },
        {
          status: newStatus,
          paymentStatus: newStatus,
          verifiedAt: new Date(),
          transactionDate: new Date(),
        },
        { new: true }
      );
      console.log("✅ Donation updated to", newStatus, "for order", order_id);
      console.log("Updated donation:", updated);
    } else {
      const updated = await Donation.findOneAndUpdate(
        { orderId: order_id },
        {
          status: "FAILED",
          paymentStatus: "FAILED",
          failureReason: "Invalid payment signature",
        },
        { new: true }
      );
      console.log("❌ Invalid signature for order", order_id);
      console.log("Updated donation:", updated);
    }

    // PayHere expects 200 OK
    return res.status(200).send("OK");
  } catch (err) {
    console.error("notifyPayment error:", err);
    res.status(200).send("OK"); // still respond OK to stop retries
  }
};
