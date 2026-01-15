# Data and Payment Handling Rules

## 1. Registration Data Management

### Independent Storage
- ✅ Registration data is stored **independently** of donation records
- ✅ Users can complete registration without making any donation
- ✅ Registration form submission creates a Registration record immediately
- ✅ No registration completion depends on payment success

### Data Structure
```javascript
// Registration collection - independent of donations
{
  userId: ObjectId,        // Link to user account
  name: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  cause: String,
  createdAt: Date,
  updatedAt: Date
}

// Donation collection - independent records
{
  userId: ObjectId,        // Link to user account
  transactionId: String,
  amount: Number,
  status: "PENDING|SUCCESS|FAILED",
  verifiedAt: Date,
  failureReason: String,
  paymentGateway: String,
  paymentId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Relationships
- **User** → **Registration** (One-to-One or One-to-Many)
- **User** → **Donation** (One-to-Many)
- Registration and Donations are separate collections
- Deleting registration doesn't delete donation records
- Deleting donation records doesn't affect registration

## 2. Donation Success Marking Rules

### STRICT REQUIREMENT: No Forced Payment Success
❌ **FORBIDDEN**: Creating donations directly as SUCCESS
❌ **FORBIDDEN**: Skipping payment verification
❌ **FORBIDDEN**: Marking donations SUCCESS without gateway confirmation
❌ **FORBIDDEN**: Using fake payment IDs

### ✅ ALLOWED: Proper Payment Flow
✅ Create donation with **PENDING** status
✅ Process payment through gateway (Razorpay/Stripe/PayPal)
✅ Verify signature and gateway response
✅ Update status to **SUCCESS** only after verification
✅ Record failure reason if verification fails

### Donation Status Flow

#### Initial Creation
```javascript
const donation = await Donation.create({
  userId: req.user.id,
  amount: amt,
  status: "PENDING",           // ALWAYS PENDING initially
  transactionId: generateId(),
  createdAt: new Date(),
})
```

#### Payment Verification
```javascript
exports.verifyPayment = async (req, res) => {
  // Step 1: Validate payment gateway signature
  const isValid = await gateway.verifySignature(req.body);
  
  if (!isValid) {
    // INVALID: Mark as FAILED
    donation.status = "FAILED";
    donation.failureReason = "Invalid signature - possible tampering";
    await donation.save();
    return res.json({ status: "FAILED" });
  }

  // Step 2: Verify amount matches
  if (req.body.amount !== donation.amount * 100) {
    donation.status = "FAILED";
    donation.failureReason = "Amount mismatch";
    await donation.save();
    return res.json({ status: "FAILED" });
  }

  // Step 3: Confirm payment status in gateway
  const gatewayPayment = await gateway.getPaymentStatus(req.body.paymentId);
  
  if (gatewayPayment.status !== "captured") {
    donation.status = "FAILED";
    donation.failureReason = "Payment not captured by gateway";
    await donation.save();
    return res.json({ status: "FAILED" });
  }

  // Step 4: ALL CHECKS PASSED - Mark as SUCCESS
  donation.status = "SUCCESS";
  donation.verifiedAt = new Date();
  donation.paymentId = req.body.paymentId;
  await donation.save();
  
  return res.json({ status: "SUCCESS", donation });
}
```

## 3. Payment State Management

### Three Valid States

#### 1. PENDING (Initial State)
- Donation created, waiting for payment
- User at payment gateway screen
- No payment confirmed yet
- Display: "Awaiting Payment Confirmation"

#### 2. SUCCESS (Verified State)
- Payment confirmed by gateway
- Signature verified
- Amount verified
- Payment captured/charged
- Display: "✅ Payment Successful" (Green Badge)
- Include: Verification timestamp
- Include: Payment ID from gateway

#### 3. FAILED (Failed State)
- Payment failed at gateway
- Signature verification failed
- Amount mismatch
- Payment not captured
- Display: "❌ Payment Failed" (Red Badge)
- Include: Failure reason
- Include: Verification timestamp

### State Transition Rules
```
PENDING ──[Valid Payment]──→ SUCCESS
   ├──[Invalid Signature]──→ FAILED
   ├──[Amount Mismatch]────→ FAILED
   ├──[Not Captured]───────→ FAILED
   └──[User Closes/Timeout]→ FAILED
```

## 4. Failed and Pending Payments Recording

### Mandatory Fields for All Donations
```javascript
{
  transactionId: String,        // Unique ID for tracking
  status: String,               // PENDING, SUCCESS, or FAILED
  amount: Number,               // Original amount
  createdAt: Date,              // When donation was initiated
  verifiedAt: Date,             // When payment was verified (null if PENDING)
  failureReason: String,        // Why it failed (null if SUCCESS/PENDING)
  paymentId: String,            // Payment ID from gateway
  paymentGateway: String,       // Which gateway (razorpay, stripe, etc)
}
```

### PENDING Payment Recording
```javascript
// Record pending state with all info
{
  transactionId: "TXN_unique_id",
  status: "PENDING",
  amount: 500,
  createdAt: 2026-01-15T10:30:00Z,
  verifiedAt: null,             // No verification yet
  failureReason: null,
  paymentId: null,              // Not assigned yet
  userId: ObjectId,
  message: "Awaiting payment confirmation"
}
```

### FAILED Payment Recording
```javascript
// Record failed state with reason
{
  transactionId: "TXN_unique_id",
  status: "FAILED",
  amount: 500,
  createdAt: 2026-01-15T10:30:00Z,
  verifiedAt: 2026-01-15T10:35:00Z,  // When verification happened
  failureReason: "Invalid signature - possible tampering",
  paymentId: "pay_xxxx",
  userId: ObjectId,
  message: "Payment verification failed"
}
```

### SUCCESS Payment Recording
```javascript
// Record successful state with proof
{
  transactionId: "TXN_unique_id",
  status: "SUCCESS",
  amount: 500,
  createdAt: 2026-01-15T10:30:00Z,
  verifiedAt: 2026-01-15T10:35:00Z,  // When payment was confirmed
  failureReason: null,
  paymentId: "pay_1A9qXXXXXXXXXX",  // From gateway
  paymentGateway: "razorpay",
  userId: ObjectId,
  message: "Payment verified successfully"
}
```

## 5. Admin Dashboard Reporting

### All Donations Visible
- ✅ PENDING donations shown in list
- ✅ SUCCESS donations shown in list
- ✅ FAILED donations shown in list
- ✅ Timestamps recorded for each state
- ✅ Failure reasons visible for FAILED

### Statistics Calculation
- **Total Donations**: COUNT(all donations)
- **Successful Amount**: SUM(where status = "SUCCESS")
- **Pending Donations**: COUNT(where status = "PENDING")
- **Failed Donations**: COUNT(where status = "FAILED")

### Sample Display
```
Status     Count   Amount        Verified
SUCCESS    15      ₹75,000       ✅ Yes
PENDING    3       ₹2,500        ⏳ Awaiting
FAILED     2       ₹1,000        ❌ No
```

## 6. Audit Trail

### Every Donation Has Complete Timeline
```
TXN_12345
├─ 10:30:00 - CREATED (PENDING)
│  └─ User initiated donation of ₹500
├─ 10:31:00 - GATEWAY RESPONSE RECEIVED
│  └─ Payment ID: pay_xxxxx, Signature verified
├─ 10:31:05 - VERIFIED (SUCCESS)
│  └─ Amount verified, payment captured
└─ Display: "✅ Donation Successful - Jan 15, 2026"

TXN_12346
├─ 10:32:00 - CREATED (PENDING)
│  └─ User initiated donation of ₹250
├─ 10:33:00 - GATEWAY RESPONSE RECEIVED
│  └─ Signature verification FAILED
└─ 10:33:05 - FAILED
   └─ Reason: "Invalid signature - possible tampering"
   └─ Display: "❌ Payment Failed - Signature Invalid"
```

## 7. Compliance Checklist

- ✅ Registration data **independent** of donations
- ✅ Donations created **PENDING** by default
- ✅ Status changes to **SUCCESS** only after **genuine confirmation**
- ✅ Payment **signature verified** before marking SUCCESS
- ✅ **Failed payments clearly recorded** with reasons
- ✅ **Pending payments** clearly marked as awaiting
- ✅ **No fake success logic** anywhere in code
- ✅ **No forced status changes** without verification
- ✅ **No hardcoded test data** marking donations SUCCESS
- ✅ **Admin dashboard** shows all states with timestamps
- ✅ **Database records** include complete audit trail

## 8. Anti-Patterns to Avoid

### ❌ Wrong: Creating donations as SUCCESS
```javascript
// DON'T DO THIS
const donation = Donation.create({
  status: "SUCCESS",  // ← WRONG! No verification yet
});
```

### ❌ Wrong: Skipping verification
```javascript
// DON'T DO THIS
if (paymentId) {
  donation.status = "SUCCESS";  // ← WRONG! No signature check
  await donation.save();
}
```

### ❌ Wrong: Using dummy payment IDs
```javascript
// DON'T DO THIS
const paymentId = 'payment_' + Date.now();  // ← WRONG! Fake ID
verifyPayment({ paymentId });
```

### ❌ Wrong: Ignoring failed payments
```javascript
// DON'T DO THIS
try {
  verifyPayment();
  // Success handled
} catch (err) {
  // ← WRONG! Failed payment ignored
}
```

### ✅ Correct: Complete verification flow
```javascript
// DO THIS
1. Create donation with PENDING
2. Get gateway signature/response
3. Verify signature matches
4. Verify amount matches
5. Verify payment captured in gateway
6. Update status to SUCCESS or FAILED
7. Record all details
```

## References
- [PAYMENT_GATEWAY_INTEGRATION.md](./PAYMENT_GATEWAY_INTEGRATION.md) - Payment gateway setup
- [README.md](./README.md) - Project overview
- API documentation in [backend/README.md](./backend/README.md)
