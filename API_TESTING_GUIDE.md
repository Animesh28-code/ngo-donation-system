# API Testing Guide

Complete guide for testing all API endpoints of the NGO Donation System.

## Setup

### Prerequisites
- Backend running on http://localhost:5000
- Postman, cURL, or REST client installed
- Test user and admin accounts created

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePassword123",
  "registration": {
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "cause": "Education for underprivileged children"
  }
}
```

**Expected Response** (201):
```json
{
  "message": "Registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePassword123",
    "registration": {
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "cause": "Education for underprivileged children"
    }
  }'
```

---

### 1.2 Login User

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Expected Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Store Token for Next Requests**:
```bash
TOKEN="<token_from_response>"
```

---

## 2. User Endpoints

### 2.1 Get User Profile

**Endpoint**: `GET /user/profile`

**Headers**:
```
Authorization: Bearer $TOKEN
```

**Expected Response** (200):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "role": "USER",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "registration": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "cause": "Education for underprivileged children",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**cURL**:
```bash
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2.2 Create Donation

**Endpoint**: `POST /user/donate`

**Headers**:
```
Authorization: Bearer $TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "amount": 500
}
```

**Expected Response** (201):
```json
{
  "message": "Donation initiated",
  "donation": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "amount": 500,
    "status": "PENDING",
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:05:00Z"
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/user/donate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500
  }'
```

---

### 2.3 List User Donations

**Endpoint**: `GET /user/donations`

**Headers**:
```
Authorization: Bearer $TOKEN
```

**Expected Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "amount": 500,
    "status": "PENDING",
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:05:00Z",
    "verifiedAt": null
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "507f1f77bcf86cd799439011",
    "amount": 1000,
    "status": "SUCCESS",
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2024-01-14T15:00:00Z",
    "verifiedAt": "2024-01-14T15:30:00Z"
  }
]
```

**cURL**:
```bash
curl -X GET http://localhost:5000/api/user/donations \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2.4 Update User's Donation Status

**Endpoint**: `POST /user/donate/status`

**Headers**:
```
Authorization: Bearer $TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS"
}
```

**Expected Response** (200):
```json
{
  "message": "Donation updated",
  "donation": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "SUCCESS",
    "verifiedAt": "2024-01-15T10:10:00Z"
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/user/donate/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
    "status": "SUCCESS"
  }'
```

---

## 3. Admin Endpoints

### 3.1 Get Admin Dashboard

**Endpoint**: `GET /admin/dashboard`

**Headers**:
```
Authorization: Bearer $ADMIN_TOKEN
```

**Expected Response** (200):
```json
{
  "totalRegistrations": 25,
  "totalDonations": 18,
  "totalAmount": 15000
}
```

**cURL**:
```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3.2 Get All Registrations

**Endpoint**: `GET /admin/registrations`

**Headers**:
```
Authorization: Bearer $ADMIN_TOKEN
```

**Query Parameters** (Optional):
```
?search=john&city=Mumbai
```

**Expected Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "cause": "Education",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

**cURL**:
```bash
curl -X GET "http://localhost:5000/api/admin/registrations?search=john" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3.3 Export Registrations as CSV

**Endpoint**: `GET /admin/registrations/export`

**Headers**:
```
Authorization: Bearer $ADMIN_TOKEN
```

**Expected Response**: CSV file download

**cURL**:
```bash
curl -X GET http://localhost:5000/api/admin/registrations/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o registrations.csv
```

---

### 3.4 Get All Donations

**Endpoint**: `GET /admin/donations`

**Headers**:
```
Authorization: Bearer $ADMIN_TOKEN
```

**Query Parameters** (Optional):
```
?status=SUCCESS
```

**Expected Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "amount": 500,
    "status": "SUCCESS",
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
    "verifiedAt": "2024-01-15T10:10:00Z",
    "verifiedBy": "507f1f77bcf86cd799439099",
    "createdAt": "2024-01-15T10:05:00Z"
  }
]
```

**cURL**:
```bash
curl -X GET "http://localhost:5000/api/admin/donations?status=SUCCESS" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3.5 Get Donation Statistics

**Endpoint**: `GET /admin/stats`

**Headers**:
```
Authorization: Bearer $ADMIN_TOKEN
```

**Expected Response** (200):
```json
{
  "totalDonations": 42,
  "successCount": 35,
  "failedCount": 7,
  "successPercentage": "83.33",
  "totalAmountCollected": 45000
}
```

**cURL**:
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3.6 Update Donation Status (Admin Only)

**Endpoint**: `PATCH /admin/donations/:transactionId`

**Headers**:
```
Authorization: Bearer $ADMIN_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "SUCCESS"
}
```

**Expected Response** (200):
```json
{
  "message": "Donation updated",
  "donation": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "SUCCESS",
    "verifiedAt": "2024-01-15T10:15:00Z",
    "verifiedBy": "507f1f77bcf86cd799439099"
  }
}
```

**cURL**:
```bash
curl -X PATCH "http://localhost:5000/api/admin/donations/TXN_550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUCCESS"
  }'
```

---

## 4. Payment Endpoints

### 4.1 Initiate Payment

**Endpoint**: `POST /payment/initiate`

**Headers**:
```
Authorization: Bearer $TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "donationId": "507f1f77bcf86cd799439013",
  "amount": 500,
  "userId": "507f1f77bcf86cd799439011"
}
```

**Expected Response** (200):
```json
{
  "message": "Payment initiated",
  "paymentLink": "https://sandbox-payment-gateway.com/pay/TXN_550e8400-e29b-41d4-a716-446655440000",
  "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/payment/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "donationId": "507f1f77bcf86cd799439013",
    "amount": 500,
    "userId": "507f1f77bcf86cd799439011"
  }'
```

---

### 4.2 Verify Payment

**Endpoint**: `POST /payment/verify`

**Headers**:
```
Authorization: Bearer $TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
  "paymentId": "pay_550e8400e29b41d4"
}
```

**Expected Response** (200):
```json
{
  "message": "Payment verified successfully",
  "donation": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "SUCCESS",
    "verifiedAt": "2024-01-15T10:20:00Z"
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/payment/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
    "paymentId": "pay_550e8400e29b41d4"
  }'
```

---

### 4.3 Payment Gateway Callback

**Endpoint**: `POST /payment/callback` (Public, no auth needed)

**Headers**:
```
Content-Type: application/json
x-gateway-secret: <PAYMENT_GATEWAY_SECRET>
```

**Request Body**:
```json
{
  "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS"
}
```

**Expected Response** (200):
```json
{
  "message": "Donation status updated by gateway",
  "donation": {
    "_id": "507f1f77bcf86cd799439013",
    "status": "SUCCESS",
    "verifiedAt": "2024-01-15T10:25:00Z"
  }
}
```

**cURL**:
```bash
curl -X POST http://localhost:5000/api/payment/callback \
  -H "Content-Type: application/json" \
  -H "x-gateway-secret: 7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6" \
  -d '{
    "transactionId": "TXN_550e8400-e29b-41d4-a716-446655440000",
    "status": "SUCCESS"
  }'
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "amount is required"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized: token missing"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: Admin only"
}
```

### 404 Not Found
```json
{
  "message": "Donation not found"
}
```

### 409 Conflict
```json
{
  "message": "Email already registered"
}
```

### 500 Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Testing Workflow

### Complete User Journey

```bash
# 1. Register user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}' | jq -r '.token')

# 2. Get profile
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer $TOKEN"

# 3. Create donation
TXNID=$(curl -s -X POST http://localhost:5000/api/user/donate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}' | jq -r '.donation.transactionId')

# 4. List donations
curl -X GET http://localhost:5000/api/user/donations \
  -H "Authorization: Bearer $TOKEN"

# 5. Verify payment (as gateway)
curl -X POST http://localhost:5000/api/payment/callback \
  -H "Content-Type: application/json" \
  -H "x-gateway-secret: $(cat backend/.env | grep PAYMENT_GATEWAY_SECRET)" \
  -d "{\"transactionId\": \"$TXNID\", \"status\": \"SUCCESS\"}"
```

---

## Postman Collection Template

Create a new collection in Postman and add these requests with your TOKEN variable.

**Base URL Variable**:
```
{{base_url}} = http://localhost:5000/api
```

**Token Variable**:
```
{{token}} = <extracted_from_login_response>
```

---

## Notes

- Replace all placeholder IDs with real values from responses
- Admin endpoints require ADMIN role
- User endpoints require USER role  
- Tokens expire after JWT_EXPIRES_IN (default 7 days)
- PAYMENT_GATEWAY_SECRET must match header value for callbacks
- All timestamps are in ISO 8601 format
- All amounts are in the smallest currency unit (e.g., paise for INR)

---

**Last Updated**: January 15, 2026
