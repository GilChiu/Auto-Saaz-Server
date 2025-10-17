# Quick Testing Guide - Dashboard & Booking API

## Prerequisites

1. **Database Migration**: Run the bookings table migration (see `database/MIGRATION_BOOKINGS.md`)
2. **Authentication**: Get your access token from login endpoint

---

## Step 1: Login to Get Token

```bash
# Login (adjust credentials as needed)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "..."
    }
  }
}
```

**Save the `accessToken` for the next requests!**

---

## Step 2: Test Dashboard Stats

```bash
# Replace YOUR_TOKEN with the accessToken from login
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics fetched successfully",
  "data": {
    "today": {
      "totalBookings": 0,
      "completedBookings": 0,
      "pendingBookings": 0,
      "inProgressBookings": 0,
      "cancelledBookings": 0,
      "totalRevenue": 0,
      "averageBookingCost": 0
    },
    "thisWeek": { ... },
    "thisMonth": { ... },
    "allTime": { ... }
  }
}
```

---

## Step 3: Create a Test Booking

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ali Khan",
    "customer_phone": "+971501234567",
    "customer_email": "ali@example.com",
    "service_type": "oil_change",
    "service_description": "Full synthetic oil change",
    "booking_date": "2024-01-20",
    "scheduled_time": "10:00",
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2020,
    "vehicle_plate_number": "ABC123",
    "estimated_cost": 250.00,
    "notes": "Customer requested premium oil"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_number": "BK1705318800001",
    "status": "pending",
    "payment_status": "pending",
    ...
  }
}
```

**Save the `id` and `booking_number` for the next requests!**

---

## Step 4: Get All Bookings

```bash
# Get all bookings
curl -X GET http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only pending bookings
curl -X GET "http://localhost:5000/api/bookings?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search for "Ali"
curl -X GET "http://localhost:5000/api/bookings?search=Ali" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by service type
curl -X GET "http://localhost:5000/api/bookings?service_type=oil_change" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "data": {
    "bookings": [
      { ... booking data ... }
    ],
    "total": 1
  }
}
```

---

## Step 5: Get Single Booking

```bash
# Replace BOOKING_ID with the ID from step 3
curl -X GET http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Step 6: Update Booking Status

```bash
# Mark booking as "in_progress"
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_technician": "Ahmed Hassan"
  }'

# Mark as completed with actual cost
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "payment_status": "paid",
    "actual_cost": 275.00,
    "completion_date": "2024-01-20T14:30:00Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "id": "...",
    "status": "completed",
    "payment_status": "paid",
    "actual_cost": 275.00,
    "updated_at": "2024-01-20T14:35:00Z",
    ...
  }
}
```

---

## Step 7: Check Dashboard Stats Again

```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Now you should see:**
```json
{
  "data": {
    "today": {
      "totalBookings": 1,
      "completedBookings": 1,
      "totalRevenue": 275.00,
      "averageBookingCost": 275.00
    },
    ...
  }
}
```

---

## Step 8: Create Multiple Test Bookings

```bash
# Booking 2 - AC Repair
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Sara Malik",
    "customer_phone": "+971509876543",
    "service_type": "ac_repair",
    "booking_date": "2024-01-21",
    "estimated_cost": 800.00
  }'

# Booking 3 - Battery Change
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Hamza Ahmed",
    "customer_phone": "+971505555555",
    "service_type": "battery_change",
    "booking_date": "2024-01-22",
    "estimated_cost": 350.00
  }'

# Booking 4 - Tire Service
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Rehman Ali",
    "customer_phone": "+971501111111",
    "service_type": "tire_service",
    "booking_date": "2024-01-23",
    "estimated_cost": 1200.00
  }'
```

---

## Step 9: Test Filtering & Pagination

```bash
# Get pending bookings only
curl -X GET "http://localhost:5000/api/bookings?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get bookings for specific date range
curl -X GET "http://localhost:5000/api/bookings?date_from=2024-01-20&date_to=2024-01-25" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get first 2 bookings
curl -X GET "http://localhost:5000/api/bookings?limit=2&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get next 2 bookings
curl -X GET "http://localhost:5000/api/bookings?limit=2&offset=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Step 10: Test Delete Booking

```bash
# Delete a booking
curl -X DELETE http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking deleted successfully",
  "data": null
}
```

---

## Common Test Scenarios

### Scenario 1: Complete Workflow
1. Create booking (status: pending)
2. Update to confirmed
3. Update to in_progress (assign technician)
4. Update to completed (set actual_cost, payment_status: paid)
5. Check dashboard stats

### Scenario 2: Search & Filter
1. Create 10+ bookings with different services
2. Filter by service_type
3. Filter by status
4. Search by customer name
5. Combine filters

### Scenario 3: Date Range Analysis
1. Create bookings for different dates
2. Get this week's bookings
3. Get this month's bookings
4. Compare dashboard stats

---

## PowerShell Testing (Windows)

For PowerShell users, use `Invoke-RestMethod`:

```powershell
# Set token variable
$token = "YOUR_ACCESS_TOKEN"

# Get dashboard stats
$headers = @{
    "Authorization" = "Bearer $token"
}
Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/stats" -Headers $headers

# Create booking
$body = @{
    customer_name = "Ali Khan"
    customer_phone = "+971501234567"
    service_type = "oil_change"
    booking_date = "2024-01-20"
    estimated_cost = 250.00
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method Post -Headers $headers -Body $body
```

---

## Postman Collection

Import this into Postman for easy testing:

1. Create new collection: "AutoSaaz Bookings"
2. Add environment variable: `access_token`
3. Add these requests:

**Collection Structure:**
```
AutoSaaz Bookings/
├── Auth/
│   └── Login
├── Dashboard/
│   ├── Get Dashboard Stats
│   └── Get Booking Stats
└── Bookings/
    ├── Create Booking
    ├── Get All Bookings
    ├── Get Single Booking
    ├── Update Booking
    └── Delete Booking
```

---

## Expected Behavior

✅ **All endpoints return JSON**
✅ **401 if token missing/invalid**
✅ **404 if booking not found**
✅ **400 if required fields missing**
✅ **201 for successful creation**
✅ **200 for successful retrieval/update/delete**

---

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Check if token is valid and properly formatted in Authorization header

### Issue: 404 Booking Not Found
**Solution:** Verify booking ID exists and belongs to your garage

### Issue: 400 Bad Request
**Solution:** Check required fields (customer_name, customer_phone, service_type, booking_date)

### Issue: Empty bookings array
**Solution:** Create some test bookings first using POST /api/bookings

---

## Production Testing

When testing on Render:

1. Replace `http://localhost:5000` with your Render URL
2. Use production access token
3. Ensure database migration has been run on production database

```bash
# Example with Render URL
curl -X GET https://your-app.onrender.com/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN"
```

---

## Next Steps

After successful testing:
1. ✅ Integrate with frontend
2. ✅ Add booking validation schemas (optional Zod validation)
3. ✅ Implement real-time updates (optional websockets)
4. ✅ Add email notifications for booking status changes
5. ✅ Configure SMTP for production emails

---

**Happy Testing! 🚀**
