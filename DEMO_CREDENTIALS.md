# 🎫 Demo Credentials Quick Reference

## Login Page Access

Open application: **http://localhost:5173**

On the login page, you will see two credential cards with one-click fill buttons!

---

## 👨‍💼 Admin Account

```
┌─────────────────────────────────────────┐
│              ADMIN ACCOUNT              │
├─────────────────────────────────────────┤
│  Email:    admin@ngo.com                │
│  Password: admin123                     │
├─────────────────────────────────────────┤
│  Access: Admin Dashboard                │
│  • View Statistics                      │
│  • Manage Registrations                 │
│  • Manage Donations                     │
│  • Export Data                          │
│  • Filter & Search                      │
│  • Update Payment Status                │
│  • Track Audit Trail                    │
└─────────────────────────────────────────┘
```

### Quick Login Steps
1. Open login page
2. Click blue **"Fill Admin Credentials"** button
3. Click **"Login"** button
4. Redirected to Admin Dashboard ✅

---

## 👤 User Account

```
┌─────────────────────────────────────────┐
│              USER ACCOUNT               │
├─────────────────────────────────────────┤
│  Email:    user@example.com             │
│  Password: user123                      │
├─────────────────────────────────────────┤
│  Access: User Dashboard                 │
│  • View Profile                         │
│  • Make Donations                       │
│  • View Donation History                │
│  • Download Receipts                    │
└─────────────────────────────────────────┘
```

### Quick Login Steps
1. Open login page
2. Click green **"Fill User Credentials"** button
3. Click **"Login"** button
4. Redirected to User Dashboard ✅

---

## 🔐 What Can Admin Do?

### Overview Tab
- 📊 View total registrations count
- 💰 View total donations count
- 🏦 View total amount received

### Registrations Tab
- 👥 View all registered users
- 🔍 Search by name/email/phone/city
- 🏷️ Filter by cause
- 📥 **Export as CSV**

### Donations Tab
- 💳 View all donations
- 📍 Track payment status (PENDING/SUCCESS/FAILED)
- 🕐 View timestamps (created & verified)
- ✏️ Update donation status
- 📝 Add failure reasons

---

## 🔐 What Can User Do?

### Dashboard
- 👤 View profile & registration
- 💳 Make new donation
- 📜 View donation history

### Donation Form
- 💵 Enter donation amount
- 🔗 Get payment link
- ✅ Verify payment

### History
- 📊 See all donations
- 📅 View dates & times
- 🟢 Check payment status

---

## 📱 Login Page Layout

```
┌──────────────────────────────────────────────┐
│   NGO Donation System - Login                │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │  Admin Account  │  │  User Account   │   │
│  │  admin@ngo.com  │  │user@example.com │   │
│  │  admin123       │  │  user123        │   │
│  │  [Fill Button]  │  │  [Fill Button]  │   │
│  └─────────────────┘  └─────────────────┘   │
│                                              │
│  Email:    [_________________]              │
│  Password: [_________________]              │
│                                              │
│         [    LOGIN BUTTON    ]              │
│                                              │
│  Don't have account? Register               │
│                                              │
└──────────────────────────────────────────────┘
```

---

## ⚡ Quick Navigation

| Role | URL After Login | First Tab |
|------|-----------------|-----------|
| Admin | `/admin/dashboard` | Overview |
| User | `/user/dashboard` | Profile |

---

## 🎯 5-Minute Test Flow

### As Admin
1. Login as admin (30 sec)
2. View dashboard (30 sec)
3. Check registrations (1 min)
4. Check donations (1 min)
5. Try filtering (1 min)
6. Try export (30 sec)
**Total: 5 minutes** ✅

### As User
1. Login as user (30 sec)
2. View profile (30 sec)
3. Make donation (2 min)
4. View history (1 min)
**Total: 4 minutes** ✅

---

## 🔄 Account Reset

If you make mistakes or want fresh data:

```bash
# Stop both servers (Ctrl+C)

# Run setup script again
cd backend
npm run setup-demo

# Restart servers
npm run dev
```

This recreates demo accounts with fresh data.

---

## ✅ Verification Checklist

After logging in as admin, verify:

- [ ] Page title shows "Admin Dashboard"
- [ ] See 3 statistics cards at top
- [ ] Can switch between tabs
- [ ] Registrations tab shows table
- [ ] Can filter registrations
- [ ] Can export CSV
- [ ] Donations tab shows table
- [ ] Can update donation status
- [ ] Logout button works

---

## 🐛 Troubleshooting

### Problem: Login fails
**Solution:** 
- Verify credentials exactly
- Check backend is running
- Clear browser cache (Ctrl+Shift+Del)

### Problem: Cannot see credential cards
**Solution:**
- Refresh page (Ctrl+R)
- Verify you're on login page
- Check browser console (F12)

### Problem: Admin dashboard won't load
**Solution:**
- Verify you logged in as admin
- Check MongoDB is connected
- Restart servers
- Run setup script again

### Problem: Data not showing
**Solution:**
- Check if database has data
- Run `npm run setup-demo` 
- Refresh admin dashboard
- Make some test donations

---

## 📚 Documentation

For more details:
- **ADMIN_FEATURES_GUIDE.md** - What admin can do
- **ADMIN_TESTING_GUIDE.md** - How to test
- **README.md** - Full documentation
- **ADMIN_IMPLEMENTATION_SUMMARY.md** - What was added

---

## 🚀 You're Ready!

1. Open: **http://localhost:5173**
2. See credential cards on login
3. Click "Fill Admin Credentials" or "Fill User Credentials"
4. Click "Login"
5. Enjoy the app! 🎉

---

**Print this page or keep it open while testing!**

*Version: 1.0.0 | Last Updated: Jan 15, 2026*
