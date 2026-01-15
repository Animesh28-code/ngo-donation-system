# Quick Start Guide

Get the NGO Donation System up and running in 5 minutes!

## Prerequisites
- Node.js v18+ installed
- MongoDB connection string (local or MongoDB Atlas)
- Two terminal windows

## Step 1: Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your MongoDB URI:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ngo_system...
# JWT_SECRET=your_strong_random_key_here
```

## Step 2: Start Backend (Terminal 1)

```bash
# From backend directory
npm run dev
```

Wait for: `✅ Server running on http://localhost:5000`

## Step 3: Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Wait for: `VITE v7.x.x  ready in xxx ms`

## Step 4: Access Application

Open your browser to `http://localhost:5173`

## Step 5: Test the Application

### Register a User:
1. Click "Register here" link on login page
2. Fill in user details (name, email, phone, password)
3. Add address, city, state, pincode (optional)
4. Click "Register"

### Login as User:
1. Use registered credentials to login
2. You'll be redirected to User Dashboard
3. Click "Make a Donation" to donate
4. View "Donation History" to see your donations

### Login as Admin (Optional):
1. Run: `node scripts/createAdmin.js` in backend directory
2. Follow prompts to set admin email and password
3. Use admin credentials to login
4. Access Admin Dashboard with complete analytics

## Troubleshooting

### Port 5000 already in use
```bash
# Change PORT in backend .env
PORT=5001
```

### MongoDB connection error
- Verify MongoDB URI in .env
- Ensure database cluster is accessible
- Check username/password in URI

### CORS errors
- Ensure backend is running on http://localhost:5000
- Check browser console for specific errors

### Frontend not loading
- Ensure backend API is running
- Check API_BASE_URL in `src/services/api.js`
- Clear browser cache and localStorage

## Key Test Accounts

After running the backend:

**Default Admin** (created by createAdmin.js):
- Email: admin@ngo.com
- Password: (as set during script execution)

**Test User** (create during registration):
- Any email you register with
- Any password

## Important Files to Know

- **Backend Config**: `backend/.env`
- **API Routes**: `backend/routes/` directory
- **Frontend Config**: `frontend/src/services/api.js`
- **Frontend Routes**: `frontend/src/App.jsx`

## Next Steps

1. **Explore Features**: Try all user and admin features
2. **Check Database**: View MongoDB collections to see data
3. **API Testing**: Use Postman or cURL to test endpoints
4. **Make Donations**: Create test donations and track them
5. **Export Data**: Use admin feature to export registrations

## Commands Reference

### Backend Commands
```bash
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
npm run create-admin # Create admin user
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
```

## System Flow

```
User Registration
    ↓
Data saved to DB
    ↓
User Login
    ↓
View Dashboard
    ↓
Create Donation
    ↓
Donation status: PENDING
    ↓
Process Payment (Mock)
    ↓
Update Status: SUCCESS/FAILED
    ↓
View in Donation History
    ↓
Admin can view and filter all donations
```

## Features Checklist

- [ ] User can register with details
- [ ] User can login with email/password
- [ ] User can view profile and registration details
- [ ] User can create donations
- [ ] User can track donation history
- [ ] Admin can view dashboard statistics
- [ ] Admin can see all registrations
- [ ] Admin can filter registrations
- [ ] Admin can export registrations as CSV
- [ ] Admin can view all donations
- [ ] Admin can filter donations by status
- [ ] Payment status shows correctly (PENDING, SUCCESS, FAILED)

## Database Test

### Check Collections
```bash
# In MongoDB
db.ngo_system.users.find().pretty()
db.ngo_system.registrations.find().pretty()
db.ngo_system.donations.find().pretty()
```

## Common Patterns

### Make a Donation
1. Login as user
2. Click "Make a Donation"
3. Enter amount (minimum ₹1)
4. Submit
5. Check "Donation History" to see status as PENDING

### View Admin Dashboard
1. Login as admin (use default or created admin account)
2. View total statistics
3. Click on "Registrations" tab to see all users
4. Click on "Donations" tab to see all donations
5. Use filters to search/filter data
6. Export registrations as CSV

---

**All set! The system is now running.**

If you encounter any issues, check the full README.md for detailed documentation.
