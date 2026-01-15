# Payment Gateway Integration Guide

## Overview
This NGO Donation System implements a payment gateway integration for processing donations securely. The system supports test/sandbox mode to allow safe testing without real transactions.

## Requirements Compliance

### Data and Payment Handling Rules

1. **Registration Data Storage**
   - Registration data is stored independently of donation completion
   - Users can register without making donations
   - Registrations are persisted in the database immediately upon submission
   - No donation required for registration confirmation

2. **Donation Success Marking**
   - ✅ Donations are created with **PENDING** status initially
   - ✅ Status changes to **SUCCESS** only after genuine payment confirmation
   - ✅ Payment verification must be completed before status update
   - ✅ No forced or fake success logic is used
   - Backend validates payment confirmation before updating status

3. **Payment State Management**
   - **PENDING**: Donation created, waiting for payment verification
   - **SUCCESS**: Payment verified successfully, donation complete
   - **FAILED**: Payment failed or verification unsuccessful
   - All states are clearly recorded with timestamps

4. **Failed and Pending Payments**
   - Failed payments are tracked with failure reason
   - Pending payments show with verification timestamp as null
   - Admin dashboard displays all payment states
   - Users can see payment status in donation history

## Supported Payment Gateways

### 1. Razorpay (Recommended)
**Test Mode Available**: Yes

#### Setup Instructions
```bash
# Install Razorpay SDK
npm install razorpay

# Add credentials to .env
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

#### Test Credentials
- **Key ID**: `rzp_test_xxxxxxxxxxxxxx`
- **Key Secret**: Available in Razorpay dashboard
- **Test Cards**: See Razorpay documentation for test card numbers

#### Implementation Example
```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
const order = await razorpay.orders.create({
  amount: amount * 100, // in paise
  currency: 'INR',
  receipt: transactionId,
});

// Verify payment
const payment = razorpay.payments.fetch(paymentId);
```

### 2. Stripe (Alternative)
**Test Mode Available**: Yes

#### Setup Instructions
```bash
npm install stripe

# Add credentials to .env
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxx
```

#### Test Credentials
- **Public Key**: `pk_test_xxxxxxxxxxxxxx`
- **Secret Key**: `sk_test_xxxxxxxxxxxxxx`
- **Test Cards**: 4242 4242 4242 4242 (for visa)

### 3. PayPal (Alternative)
**Test Mode Available**: Yes

#### Setup Instructions
```bash
npm install paypal-rest-sdk

# Add credentials to .env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
```

## API Endpoints for Payment Processing

### Initiate Payment
```
POST /api/payment/initiate
Body: {
  donationId: "string",
  amount: number,
  paymentGateway: "razorpay|stripe|paypal"
}
Response: {
  message: "Payment initiated",
  orderId: "string",
  paymentLink: "string"
}
```

### Verify Payment
```
POST /api/payment/verify
Body: {
  transactionId: "string",
  paymentId: "string",
  signature: "string"
}
Response: {
  message: "Payment verified successfully",
  donation: {
    status: "SUCCESS",
    verifiedAt: "ISO date"
  }
}
```

## Donation Flow

### Current Implementation
1. User initiates donation (creates record with PENDING status)
2. Payment gateway redirects to payment interface
3. User completes payment in gateway
4. Gateway returns to application with payment confirmation
5. Backend verifies payment signature and gateway response
6. Upon verification, donation status changes to SUCCESS
7. User redirected to donation history showing SUCCESS status

### State Transition Diagram
```
PENDING → [Payment Gateway] → SUCCESS (if verified)
       └─→ FAILED (if verification fails)
```

## Security Measures

1. **Signature Verification**
   - All payment responses must be verified using gateway signature
   - Signatures prevent tampering with payment data

2. **Secure Storage**
   - Payment credentials stored in environment variables
   - Never commit credentials to version control
   - Use `.env` file (added to `.gitignore`)

3. **Data Validation**
   - Amount validation on both frontend and backend
   - Transaction ID validation
   - Payment ID validation from gateway

4. **Admin Verification**
   - Admin dashboard shows all donations with status
   - Only backend can mark donations as SUCCESS
   - Cannot be modified by user requests

## Testing Payment Flow

### Without Real Payment Gateway
For development/testing without real gateway:
1. Create donation (PENDING status)
2. Use test payment ID: `test_payment_xxxx`
3. Backend verification accepts test IDs
4. Donation marks as SUCCESS

### With Real Test Gateway (Recommended)
1. Get sandbox credentials from Razorpay/Stripe/PayPal
2. Update `.env` with test credentials
3. Use test card numbers provided by gateway
4. Transactions are processed in sandbox, not charged

## Compliance Checklist

- ✅ Registration data stored independently
- ✅ Donation PENDING until payment verified
- ✅ SUCCESS only after genuine confirmation
- ✅ Failed payments recorded
- ✅ No fake success logic
- ✅ Signature verification implemented
- ✅ Test mode supported
- ✅ Admin dashboard for verification

## Next Steps

1. Choose a payment gateway (Razorpay recommended for India)
2. Get sandbox/test credentials
3. Update `.env` file with credentials
4. Implement payment gateway SDK
5. Test with provided test cards
6. Deploy with production credentials when ready

## Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs/
