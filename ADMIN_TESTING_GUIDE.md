# 🧪 Admin Dashboard Testing Guide

## Quick Start

### Credentials
```
👨‍💼 Admin Email:    admin@ngo.com
👨‍💼 Admin Password: admin123
```

### Access
1. Open `http://localhost:5173`
2. Click "Fill Admin Credentials" button (blue button on login page)
3. Click "Login"
4. You'll be redirected to Admin Dashboard

---

## ✅ Test Cases

### Test 1: View Dashboard Statistics
**Steps:**
1. Login as admin
2. You should see Admin Dashboard
3. Look for 3 statistics cards at the top:
   - Total Registrations
   - Total Donations  
   - Total Amount Received (in ₹)

**Expected Result:**
- ✅ All cards display with numbers
- ✅ Numbers are not negative
- ✅ Amount is in rupees format (₹)

---

### Test 2: View All Registrations
**Steps:**
1. Click "Registrations" tab
2. You should see a table with columns:
   - Email
   - Name
   - Phone
   - City
   - State
   - Cause
   - Registered At

**Expected Result:**
- ✅ Table loads without errors
- ✅ Shows at least the demo user (user@example.com)
- ✅ All registration details are visible
- ✅ Dates are properly formatted

---

### Test 3: Filter Registrations by Search
**Steps:**
1. In "Registrations" tab, find the search box
2. Type "user" (partial search)
3. Table should filter in real-time

**Expected Result:**
- ✅ Filtered results show only matching records
- ✅ Filter works for name, email, phone, city
- ✅ Empty search shows all records again

---

### Test 4: Filter Registrations by Cause
**Steps:**
1. In "Registrations" tab, find the "Cause" dropdown
2. Select "Education" from dropdown
3. Table should filter automatically

**Expected Result:**
- ✅ Only registrations with "Education" cause show
- ✅ All causes are available in dropdown
- ✅ Selecting "All Causes" shows all records

---

### Test 5: Export Registrations as CSV
**Steps:**
1. In "Registrations" tab, find "Export as CSV" button
2. Click the button
3. File should download automatically

**Expected Result:**
- ✅ CSV file downloads (registrations.csv)
- ✅ File can be opened in Excel/Sheets
- ✅ Contains all registration data
- ✅ Headers: email, name, phone, address, city, state, pincode, cause, registeredAt

---

### Test 6: View All Donations
**Steps:**
1. Click "Donations" tab
2. You should see a table with columns:
   - User Email
   - Amount
   - Status (with color badge)
   - Transaction ID
   - Created Date
   - Verified Date
   - Actions

**Expected Result:**
- ✅ Table loads without errors
- ✅ Status badges are color-coded:
  - 🟢 Green for SUCCESS
  - 🟡 Yellow for PENDING
  - 🔴 Red for FAILED

---

### Test 7: Filter Donations by Status
**Steps:**
1. In "Donations" tab, find "Status" filter
2. Select "SUCCESS" from dropdown
3. Table should filter automatically

**Expected Result:**
- ✅ Only SUCCESS donations show
- ✅ Can filter by PENDING and FAILED too
- ✅ "All" shows all donations

---

### Test 8: Filter Donations by Search
**Steps:**
1. In "Donations" tab, find search box
2. Type a transaction ID or email
3. Table should filter in real-time

**Expected Result:**
- ✅ Donations matching search appear
- ✅ Search works across email and transaction ID
- ✅ Empty search shows all again

---

### Test 9: Update Donation Status
**Steps:**
1. In "Donations" tab, find a PENDING donation
2. Look for an "Update" or "Edit" button in that row
3. Click to open status update dialog
4. Change status from PENDING to SUCCESS
5. Click Save

**Expected Result:**
- ✅ Status badge changes color
- ✅ Verified timestamp updates to current time
- ✅ "Verified By" shows admin email
- ✅ Status change appears immediately in table

---

### Test 10: Add Failure Reason to Donation
**Steps:**
1. In "Donations" tab, find a PENDING donation
2. Click update button
3. Change status to FAILED
4. Add failure reason (e.g., "Payment declined")
5. Click Save

**Expected Result:**
- ✅ Status changes to FAILED
- ✅ Badge turns red
- ✅ Failure reason is saved and visible
- ✅ Verified timestamp updates

---

## 📊 Tab Navigation Test

### Test 11: Switch Between Tabs
**Steps:**
1. Login as admin
2. Click "Registrations" tab - verify it loads
3. Click "Donations" tab - verify it loads
4. Click back to overview (first card section)
5. All tabs should work smoothly

**Expected Result:**
- ✅ Tabs switch without page reload
- ✅ Data loads for each tab
- ✅ No errors in console
- ✅ Active tab is highlighted

---

## 🔐 Access Control Test

### Test 12: Verify Admin-Only Access
**Steps:**
1. Logout from admin account
2. Login as regular user (user@example.com / user123)
3. Try to navigate to `/admin/dashboard` directly

**Expected Result:**
- ✅ Regular users cannot see admin dashboard
- ✅ Redirected to user dashboard instead
- ✅ No access to admin features

---

## ⚡ Performance Tests

### Test 13: Load Time
**Steps:**
1. Open Admin Dashboard
2. Check browser DevTools (F12 → Network tab)
3. Initial load time should be < 2 seconds

**Expected Result:**
- ✅ Dashboard loads quickly
- ✅ No hanging requests
- ✅ All data displays within 2 seconds

---

### Test 14: Responsive Design
**Steps:**
1. Open Admin Dashboard
2. Press F12 to open DevTools
3. Click responsive design toggle (Ctrl+Shift+M)
4. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px)

**Expected Result:**
- ✅ All tables are readable
- ✅ Cards stack properly on mobile
- ✅ Buttons are clickable
- ✅ No horizontal scrolling issues

---

## 🔍 Data Validation Tests

### Test 15: Verify Statistics Accuracy
**Steps:**
1. Note the "Total Registrations" count
2. In Registrations tab, count visible records (multiply by pages)
3. Verify count matches
4. Repeat for "Total Donations" and "Total Amount"

**Expected Result:**
- ✅ Statistics match actual data
- ✅ Amount calculation is correct
- ✅ Only SUCCESS donations counted for amount

---

### Test 16: Check Timestamp Formats
**Steps:**
1. Look at any donation's Created/Verified dates
2. Verify format: YYYY-MM-DD HH:MM:SS
3. Check if timestamps are in correct timezone

**Expected Result:**
- ✅ All timestamps are properly formatted
- ✅ Verified time is after Created time
- ✅ No invalid dates (like 1970-01-01)

---

## 🧨 Error Handling Tests

### Test 17: Handle Empty Data
**Steps:**
1. If database has no donations, check Donations tab
2. Should show "No data" message or empty table
3. Statistics should show 0

**Expected Result:**
- ✅ No errors thrown
- ✅ Empty state is handled gracefully
- ✅ UI doesn't crash

---

### Test 18: Network Error Handling
**Steps:**
1. Stop backend server (press Ctrl+C in backend terminal)
2. Refresh admin dashboard
3. Try to perform any action

**Expected Result:**
- ✅ Shows error message
- ✅ Doesn't crash or hang
- ✅ User can retry when server is back

---

## 📋 Complete Checklist

Use this to verify all admin features work:

```
[ ] ✅ Login with admin credentials
[ ] ✅ View dashboard overview
[ ] ✅ View total registrations count
[ ] ✅ View total donations count
[ ] ✅ View total amount received
[ ] ✅ Navigate to registrations tab
[ ] ✅ See all registrations in table
[ ] ✅ Filter registrations by search
[ ] ✅ Filter registrations by cause
[ ] ✅ Export registrations as CSV
[ ] ✅ Navigate to donations tab
[ ] ✅ See all donations in table
[ ] ✅ See colored status badges
[ ] ✅ Filter donations by status
[ ] ✅ Filter donations by search
[ ] ✅ Update donation status
[ ] ✅ Add failure reason
[ ] ✅ Verify timestamps update
[ ] ✅ Verify "Verified By" shows admin
[ ] ✅ Tab switching works
[ ] ✅ Responsive on mobile
[ ] ✅ Error messages show
[ ] ✅ Statistics are accurate
```

---

## 🐛 Common Issues & Solutions

### Issue: Cannot login as admin
**Solution:**
- Check credentials: admin@ngo.com / admin123
- Ensure backend is running
- Check network in browser (F12 → Network)
- Run `npm run setup-demo` to create demo accounts

### Issue: Dashboard shows "Loading..." forever
**Solution:**
- Check if backend is running
- Verify MongoDB connection
- Check browser console for errors (F12 → Console)
- Try refreshing page

### Issue: Statistics show 0
**Solution:**
- Make some donations as regular user
- Update at least one donation status
- Refresh admin dashboard
- Check if filters are too restrictive

### Issue: Export CSV is empty
**Solution:**
- Ensure there are registrations in database
- Check browser console for errors
- Try with different filters
- Verify CSV download completed

### Issue: Cannot update donation status
**Solution:**
- Ensure you're logged in as admin
- Check if donation exists
- Look at browser console for error details
- Verify backend is running

---

## 🚀 Next Steps After Testing

1. ✅ Verify all admin features work
2. Record video demo showing:
   - Admin login
   - Dashboard overview
   - Registration management
   - Donation management
   - CSV export
3. Create PDF report documenting the features
4. Push to GitHub

---

## 📞 Support

If tests fail:
1. Check `ADMIN_FEATURES_GUIDE.md` for feature details
2. Review error messages in browser console (F12)
3. Check backend logs for server errors
4. Restart both servers
5. Run setup script again: `npm run setup-demo`

---

**Happy Testing! 🎉**

For questions or issues, refer to:
- ADMIN_FEATURES_GUIDE.md - Detailed feature documentation
- README.md - Full project documentation
- API_TESTING_GUIDE.md - API endpoint testing

---

*Test Guide Version: 1.0.0*  
*Last Updated: January 15, 2026*
