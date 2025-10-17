# Quick API Reference - Dashboard & Bookings

## 🔑 Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Get token from login endpoint:
```bash
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
```

---

## 📊 Dashboard Endpoints

### Get Dashboard Statistics
```
GET /api/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "totalBookings": 5,
      "completedBookings": 2,
      "pendingBookings": 2,
      "inProgressBookings": 1,
      "cancelledBookings": 0,
      "totalRevenue": 1250.00,
      "averageBookingCost": 625.00
    },
    "thisWeek": { ... },
    "thisMonth": { ... },
    "allTime": { ... }
  }
}
```

### Get All-Time Booking Stats
```
GET /api/dashboard/booking-stats
```

---

## 📅 Booking Endpoints

### 1. List All Bookings (with filters)
```
GET /api/bookings
GET /api/bookings?status=pending
GET /api/bookings?service_type=oil_change
GET /api/bookings?search=Ali
GET /api/bookings?date_from=2024-01-01&date_to=2024-01-31
GET /api/bookings?limit=10&offset=0
```

**Query Parameters:**
- `status` - pending | confirmed | in_progress | completed | cancelled | no_show
- `service_type` - oil_change | ac_repair | battery_change | tire_service | etc.
- `payment_status` - pending | paid | partial | refunded
- `date_from` - YYYY-MM-DD
- `date_to` - YYYY-MM-DD
- `search` - searches customer name, phone, vehicle plate
- `limit` - number of results (default: 50)
- `offset` - pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "booking_number": "BK1705318800001",
        "customer_name": "Ali Khan",
        "customer_phone": "+971501234567",
        "service_type": "oil_change",
        "booking_date": "2024-01-20",
        "status": "in_progress",
        "payment_status": "pending",
        "estimated_cost": 250.00,
        ...
      }
    ],
    "total": 25
  }
}
```

### 2. Get Single Booking
```
GET /api/bookings/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "booking_number": "BK1705318800001",
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
    "actual_cost": null,
    "status": "pending",
    "payment_status": "pending",
    "assigned_technician": null,
    "notes": "Customer prefers premium oil",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Create Booking
```
POST /api/bookings
Content-Type: application/json
```

**Required Fields:**
- `customer_name` (string)
- `customer_phone` (string)
- `service_type` (string)
- `booking_date` (string, YYYY-MM-DD)

**Optional Fields:**
- `customer_email` (string)
- `service_description` (string)
- `scheduled_time` (string, HH:MM)
- `vehicle_make` (string)
- `vehicle_model` (string)
- `vehicle_year` (number)
- `vehicle_plate_number` (string)
- `estimated_cost` (number)
- `notes` (string)

**Example Request:**
```json
{
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
  "notes": "Customer prefers premium oil"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "booking_number": "BK1705318800001",
    "status": "pending",
    "payment_status": "pending",
    ...
  }
}
```

### 4. Update Booking
```
PATCH /api/bookings/:id
Content-Type: application/json
```

**Updatable Fields:**
- `status` - pending | confirmed | in_progress | completed | cancelled | no_show
- `payment_status` - pending | paid | partial | refunded
- `actual_cost` (number)
- `assigned_technician` (string)
- `notes` (string)
- `internal_notes` (string)
- `completion_date` (string, ISO 8601)

**Example Requests:**

**Mark as In Progress:**
```json
{
  "status": "in_progress",
  "assigned_technician": "Ahmed Hassan"
}
```

**Mark as Completed:**
```json
{
  "status": "completed",
  "payment_status": "paid",
  "actual_cost": 275.00,
  "completion_date": "2024-01-20T14:30:00Z"
}
```

**Update Payment:**
```json
{
  "payment_status": "paid",
  "actual_cost": 250.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "id": "uuid",
    "status": "completed",
    "payment_status": "paid",
    "actual_cost": 275.00,
    "updated_at": "2024-01-20T14:35:00Z",
    ...
  }
}
```

### 5. Delete Booking
```
DELETE /api/bookings/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Booking deleted successfully",
  "data": null
}
```

---

## 📋 Service Types Reference

```
oil_change         → Oil Change
ac_repair          → AC Repair
battery_change     → Battery Change
tire_service       → Tire Service
brake_service      → Brake Service
engine_diagnostic  → Engine Diagnostic
transmission       → Transmission
suspension         → Suspension
electrical         → Electrical
body_work          → Body Work
detailing          → Detailing
inspection         → Inspection
other              → Other
```

---

## 🚦 Status Values

**Booking Status:**
```
pending       → Pending (Gray)
confirmed     → Confirmed (Blue)
in_progress   → In Progress (Yellow/Orange)
completed     → Completed (Green)
cancelled     → Cancelled (Red)
no_show       → No Show (Dark Gray)
```

**Payment Status:**
```
pending   → Pending (Gray)
paid      → Paid (Green)
partial   → Partial Payment (Yellow)
refunded  → Refunded (Orange)
```

---

## 🧪 cURL Examples

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ali Khan",
    "customer_phone": "+971501234567",
    "service_type": "oil_change",
    "booking_date": "2024-01-20",
    "estimated_cost": 250
  }'
```

### Get All Bookings
```bash
curl -X GET http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter Pending Bookings
```bash
curl -X GET "http://localhost:5000/api/bookings?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Booking Status
```bash
curl -X PATCH http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","assigned_technician":"Ahmed"}'
```

### Delete Booking
```bash
curl -X DELETE http://localhost:5000/api/bookings/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Customer name, phone, service type, and booking date are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🔗 Base URLs

**Development:** `http://localhost:5000`
**Production:** `https://your-app.onrender.com`

Replace the base URL in all examples with your actual backend URL.

---

## 📱 Frontend Integration Example

```typescript
// Example: Fetch dashboard stats
const response = await fetch('http://localhost:5000/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
console.log(data.data.today.totalBookings);

// Example: Create booking
const response = await fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_name: 'Ali Khan',
    customer_phone: '+971501234567',
    service_type: 'oil_change',
    booking_date: '2024-01-20',
    estimated_cost: 250
  })
});
const data = await response.json();
console.log(data.data.booking_number);
```

---

## ✅ Testing Checklist

- [ ] Login and get access token
- [ ] Get dashboard stats (all time periods load)
- [ ] Create booking (returns 201 with booking_number)
- [ ] Get all bookings (returns array)
- [ ] Filter by status (only matching bookings returned)
- [ ] Search by customer name (fuzzy search works)
- [ ] Update booking status (updated_at changes)
- [ ] Update payment status (updates correctly)
- [ ] Delete booking (returns success)
- [ ] Dashboard stats update after changes

---

**Documentation Version:** 1.0
**Last Updated:** October 17, 2025
**Backend Version:** AutoSaaz Server v1.0
