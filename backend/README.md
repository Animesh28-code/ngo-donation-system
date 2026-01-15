# NGO Donation System - Backend

Quick notes to run and secure your backend:

1. Copy `.env.example` to `.env` and set values (do NOT commit `.env`).

2. Important env vars:
   - `MONGO_URI` - your MongoDB connection string
   - `JWT_SECRET` - **set a strong random secret** (do not use `change_this_secret`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (optional, used for `node scripts/createAdmin.js`)

3. Start server:
   - `npm run dev` (development)
   - `npm start` (production)

4. To create or promote an admin (safe server-side operation):
   - Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your environment and run:
     `node scripts/createAdmin.js`

Security and behavior changes made:
- Public registration cannot set the `ADMIN` role (prevents role escalation).
- JWT secret is required and server will refuse to start with a default/empty secret.
- Users cannot mark their own donations as `SUCCESS` (only admins or gateways can mark success).
- Donation transaction IDs are now UUID-based and robust against collisions.
- Admins can update any donation status with an audit trail (`verifiedBy`, `verifiedAt`).

Payment gateway simulation:
- A gateway callback endpoint is available at `POST /api/payment/callback`.
- The gateway must send header `x-gateway-secret` equal to `PAYMENT_GATEWAY_SECRET` and body `{ transactionId, status, failureReason }`.

If you'd like, I can add automated tests next for the critical flows (auth, donations, admin updates).