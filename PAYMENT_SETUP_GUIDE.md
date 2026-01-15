# Payment Gateway Setup Guide

## Quick Start - Test Mode (No Real Charges)

This guide helps you set up a payment gateway in **test/sandbox mode** for development and testing.

## Option 1: Razorpay (Recommended for India)

### Why Razorpay?
- ✅ Free sandbox/test mode
- ✅ Test credentials available immediately
- ✅ Simple integration
- ✅ Popular in India
- ✅ Comprehensive test card support

### Step 1: Create Razorpay Account
1. Go to https://razorpay.com
2. Click "Sign Up"
3. Enter email and create account
4. Verify email
5. Complete KYC (can skip for test mode)

### Step 2: Get Test Credentials
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Copy **Key ID** (starts with `rzp_test_`)
4. Copy **Key Secret**

### Step 3: Update Environment Variables
Create/update `.env` file in backend folder:

```env
# Razorpay Credentials (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
PAYMENT_GATEWAY=razorpay
```

### Step 4: Install Razorpay SDK
```bash
cd backend
npm install razorpay
```

### Step 5: Update Payment Controller
```javascript
// backend/controllers/paymentController.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.verifyPayment = async (req, res) => {
  const { transactionId, paymentId, signature } = req.body;
  
  try {
    // Verify signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(transactionId + '|' + paymentId)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      return res.json({
        message: "Payment verification failed - Invalid signature",
        status: "FAILED"
      });
    }

    // Update donation to SUCCESS
    const donation = await Donation.findOne({ transactionId });
    donation.status = "SUCCESS";
    donation.paymentId = paymentId;
    donation.verifiedAt = new Date();
    await donation.save();

    return res.json({
      message: "Payment verified successfully",
      donation
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
```

### Test Cards for Razorpay
Use these cards in test mode (won't be charged):

| Card Type | Card Number | Expiry | CVV |
|-----------|-------------|--------|-----|
| Visa | 4111111111111111 | 12/25 | 123 |
| Visa | 4242424242424242 | 12/25 | 123 |
| Mastercard | 5555555555554444 | 12/25 | 123 |
| Amex | 378282246310005 | 12/25 | 123 |

### Test OTP for Razorpay
- OTP: Any 6-digit number (e.g., 123456)
- 3D Secure: Any option works

---

## Option 2: Stripe (International)

### Why Stripe?
- ✅ Global payments
- ✅ Excellent test mode
- ✅ Detailed documentation
- ✅ No KYC for test mode
- ✅ Works in most countries

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Click "Sign Up"
3. Create account
4. Verify email

### Step 2: Get Test Credentials
1. Login to Stripe Dashboard
2. Ensure "Test Mode" is enabled (top left)
3. Go to Developers → API Keys
4. Copy **Publishable Key** (pk_test_...)
5. Copy **Secret Key** (sk_test_...)

### Step 3: Update Environment Variables
```env
# Stripe Credentials (Test Mode)
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
PAYMENT_GATEWAY=stripe
```

### Step 4: Install Stripe SDK
```bash
cd backend
npm install stripe
```

### Step 5: Update Payment Controller
```javascript
// backend/controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.verifyPayment = async (req, res) => {
  const { transactionId, paymentIntentId } = req.body;
  
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.json({
        message: "Payment not confirmed by Stripe",
        status: "FAILED"
      });
    }

    // Update donation to SUCCESS
    const donation = await Donation.findOne({ transactionId });
    donation.status = "SUCCESS";
    donation.paymentId = paymentIntentId;
    donation.verifiedAt = new Date();
    await donation.save();

    return res.json({
      message: "Payment verified successfully",
      donation
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
```

### Test Cards for Stripe
| Card Type | Card Number | Expiry | CVC |
|-----------|-------------|--------|-----|
| Visa | 4242424242424242 | 12/25 | 123 |
| Visa | 4000002500003155 | 12/25 | 123 |
| Mastercard | 5555555555554444 | 12/25 | 123 |
| Amex | 378282246310005 | 12/25 | 123 |

### Test Result Codes for Stripe
- Successful: Use any valid test card above
- Declined: Use card ending in 0002
- Requires authentication: Use card ending in 0002

---

## Option 3: PayPal (Global)

### Why PayPal?
- ✅ Global payment method
- ✅ Free business account
- ✅ Sandbox environment
- ✅ Widely recognized
- ✅ No card details needed

### Step 1: Create PayPal Business Account
1. Go to https://www.paypal.com
2. Create Business Account
3. Verify email

### Step 2: Access Sandbox Environment
1. Go to https://developer.paypal.com
2. Login with PayPal account
3. Go to Settings → Sandbox Accounts
4. Create test accounts (Buyer & Merchant)

### Step 3: Get Sandbox Credentials
1. Go to Apps & Credentials
2. Create app
3. Copy **Client ID** and **Secret**

### Step 4: Update Environment Variables
```env
# PayPal Credentials (Sandbox Mode)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYMENT_GATEWAY=paypal
```

### Step 5: Install PayPal SDK
```bash
cd backend
npm install paypal-rest-sdk
```

---

## Current Implementation (Development Mode)

The current system uses **test payment IDs** for development:
- Donations created with **PENDING** status
- Payment verification accepts `test_payment_*` IDs
- Status changes to **SUCCESS** after verification
- **NO REAL CHARGES** - completely safe

### How to Test Current Implementation

1. **Start both servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Login as User**
   - Email: `user@example.com`
   - Password: `user123`

3. **Make a Donation**
   - Go to "Make a Donation"
   - Enter amount (e.g., ₹100)
   - Click "Proceed to Payment"
   - Wait for success message (2 seconds)
   - Check donation history

4. **Verify in Admin Dashboard**
   - Login as Admin
   - Email: `admin@ngo.com`
   - Password: `admin123`
   - Go to Donations tab
   - See donation with SUCCESS status ✅

---

## Moving to Production

### Checklist Before Going Live
- ✅ Replace test credentials with production credentials
- ✅ Update production environment variables
- ✅ Test with real payment gateway
- ✅ Implement proper error handling
- ✅ Add payment webhook handlers
- ✅ Implement refund mechanism
- ✅ Add payment logging and audit trail
- ✅ Security: Never commit credentials to git
- ✅ SSL/HTTPS enabled on production
- ✅ Rate limiting on payment endpoints

### Environment Variables for Production
```env
# Production Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Or Production Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here


# Or Production PayPal
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=production_client_id
PAYPAL_CLIENT_SECRET=production_client_secret

NODE_ENV=production
PAYMENT_GATEWAY=razorpay  # Choose one
```

---

## Troubleshooting

### Payment Gateway Connection Failed
- Check API credentials are correct
- Verify network connectivity
- Check firewall/proxy settings
- Ensure payment gateway IP is whitelisted

### Signature Verification Failed
- Verify correct secret key is used
- Check signature generation algorithm
- Ensure correct order of parameters

### Payment Status Not Updating
- Check if webhook is configured
- Verify database connection
- Check server logs for errors
- Ensure donation exists with matching transactionId

### Test Cards Not Working
- Use correct test card number
- Verify test mode is enabled
- Check card expiry date is future
- Try different test cards

---

## Resources

- **Razorpay Docs**: https://razorpay.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs
- **Payment Gateway Integration**: [PAYMENT_GATEWAY_INTEGRATION.md](./PAYMENT_GATEWAY_INTEGRATION.md)
- **Data & Payment Rules**: [DATA_PAYMENT_RULES.md](./DATA_PAYMENT_RULES.md)

---

## Need Help?

1. Check error message in browser console or terminal
2. Review payment gateway documentation
3. Verify API credentials match
4. Check database connection
5. Review logs in both frontend and backend

**Next Step**: Choose a payment gateway above and follow setup instructions. Start with test/sandbox mode to verify integration works correctly.
