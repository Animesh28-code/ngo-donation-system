# PayHere Payment Gateway Integration - Complete Setup

## ✅ What's Been Done

1. **Backend Setup:**
   - ✅ Added PayHere credentials to `.env`
   - ✅ Created `/api/payment/init/:donationId` endpoint (generates payment hash)
   - ✅ Created `/api/payment/notify` endpoint (handles PayHere callbacks)
   - ✅ Created `/api/payment/status/:donationId` endpoint
   - ✅ Updated Donation model with PayHere fields

2. **Frontend Setup:**
   - ✅ Added PayHere JS library to `index.html`
   - ✅ Updated DonationForm with PayHere payment integration
   - ✅ Updated API service with PayHere endpoints

## 🔧 Configuration

### Credentials (Already Added)
```
PAYHERE_MERCHANT_ID=1233607
PAYHERE_MERCHANT_SECRET=MTkwMzIzMDQ3NzIzODY2MTEwMjE3NjMwMjQ5MzUyNDA4NDc4NDA1
```

### Environment Variables to Add (For Sandbox Testing)
Add these to `.env` if you want to customize URLs:

```
FRONTEND_URL=http://localhost:5173
NOTIFY_URL=http://localhost:5000
```

## 📋 How It Works

### User Flow:
1. User clicks "Donate Now" on the DonationForm
2. Frontend creates a donation record via API
3. Frontend calls `/api/payment/init/{donationId}` to get payment data
4. PayHere payment window opens
5. User enters payment details in PayHere
6. After payment, PayHere redirects to return_url or notifies via notify_url
7. Backend `/api/payment/notify` receives callback and updates donation status
8. User is redirected to donation history

### Hash Generation (Backend):
```
Hash = MD5(merchant_id + order_id + amount + currency + merchant_secret)
```

## ⚡ Important: For Testing with ngrok (Real Notify URL)

PayHere cannot call `localhost` - it needs a public URL.

### Quick Setup:
1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 5000`
3. Copy the HTTPS URL (e.g., `https://abcd-1234.ngrok-free.app`)
4. Update `.env`:
   ```
   NOTIFY_URL=https://abcd-1234.ngrok-free.app
   ```
5. Restart backend server

## 🧪 Testing Steps

### Test with Sandbox (No Real Money)
1. Start both servers:
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend
   node server.js
   ```

2. Go to http://localhost:5173
3. Login with:
   - Email: `user@example.com`
   - Password: `user123`

4. Click "Make a Donation"
5. Enter amount (e.g., 100)
6. Click "Donate Now"
7. PayHere sandbox will open

8. Use test cards:
   - Card: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`

### Verify Payment
After completing payment:
1. Check backend logs for `/api/payment/notify` callback
2. Go to Admin Dashboard → Manage Donations
3. Donation status should be "SUCCESS"

## 📊 Donation Model Fields

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  amount: Number,
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED",
  paymentId: String, // PayHere payment ID
  paymentMethod: "payhere",
  transactionDate: Date,
  address: String,
  city: String,
  // ... other fields
}
```

## 🔒 Security Notes

- ✅ Merchant Secret NEVER sent to frontend
- ✅ Hash verified on every notify callback
- ✅ Order ID includes donation ID (validation)
- ✅ Payment status updated only after hash verification

## 📝 Files Modified

1. `backend/.env` - Added PayHere credentials
2. `backend/controllers/paymentController.js` - Complete rewrite with PayHere logic
3. `backend/routes/paymentRoutes.js` - Added new endpoints
4. `backend/models/Donation.js` - Added PayHere fields
5. `frontend/index.html` - Added PayHere JS library
6. `frontend/src/pages/DonationForm.jsx` - Complete rewrite with PayHere integration
7. `frontend/src/services/api.js` - Updated payment API endpoints

## ✨ Next Steps

1. Test with sandbox (steps above)
2. Once verified, switch to live credentials
3. Change `sandbox: true` to `sandbox: false` in DonationForm.jsx
4. Update notify_url to production domain
5. Monitor payment confirmations in admin dashboard

## 🆘 Troubleshooting

**Q: PayHere window doesn't open?**
- Check browser console for errors
- Ensure PayHere library is loaded: `window.payhere` should exist
- Check if request to `/api/payment/init/{donationId}` succeeds

**Q: Payment marked as FAILED even though I paid?**
- Check hash verification in backend logs
- Ensure PAYHERE_MERCHANT_SECRET is correct
- Verify order_id format matches

**Q: Notify callback not received?**
- Use ngrok to expose localhost
- Update NOTIFY_URL in `.env`
- Check firewall settings
- Monitor backend logs for POST requests to `/api/payment/notify`

**Q: User redirected to return_url but payment still PENDING?**
- This is normal - PayHere sends notify callback asynchronously
- Wait 5-10 seconds and refresh the page
- Check admin dashboard for updated status
