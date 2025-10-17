# Booking & Dashboard API Documentation

## Overview

This document describes the booking management and dashboard API endpoints. All endpoints require authentication via JWT token.

## Authentication

All endpoints require the `Authorization` header:

```
Authorization: Bearer <your-access-token>
```

Get the access token from the login response or registration completion.

---

## Dashboard Endpoints

### Get Dashboard Statistics

Get comprehensive dashboard statistics for different time periods (today, this week, this month, all-time).

**Endpoint:** `GET /api/dashboard/stats`

**Authentication:** Required

**Request:**
```bash
curl -X GET https://your-api.com/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Dashboard statistics fetched successfully",
  "data": {
    "today": {
      "totalBookings": 5,
      "completedBookings": 2,
      "pendingBookings": 2,
      "inProgressBookings": 1,
      "cancelledBookings": 0,
      "totalRevenue": 1450.00,
      "averageBookingCost": 725.00
    },
    "thisWeek": {
      "totalBookings": 18,
      "completedBookings": 12,
      "pendingBookings": 4,
      "inProgressBookings": 2,
      "cancelledBookings": 0,
      "totalRevenue": 8900.00,
      "averageBookingCost": 494.44
    },
    "thisMonth": {
      "totalBookings": 67,
      "completedBookings": 54,
      "pendingBookings": 8,
      "inProgressBookings": 3,
      "cancelledBookings": 2,
      "totalRevenue": 32500.00,
      "averageBookingCost": 485.07
    },
    "allTime": {
      "totalBookings": 234,
      "completedBookings": 198,
      "pendingBookings": 15,
      "inProgressBookings": 8,
      "cancelledBookings": 13,
      "totalRevenue": 115000.00,
      "averageBookingCost": 491.45
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get Booking Statistics

Get all-time booking statistics (simpler version of dashboard stats).

**Endpoint:** `GET /api/dashboard/booking-stats`

**Authentication:** Required

**Request:**
```bash
curl -X GET https://your-api.com/api/dashboard/booking-stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking statistics fetched successfully",
  "data": {
    "totalBookings": 234,
    "completedBookings": 198,
    "pendingBookings": 15,
    "inProgressBookings": 8,
    "cancelledBookings": 13,
    "totalRevenue": 115000.00,
    "averageBookingCost": 491.45
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Booking Endpoints

### Get All Bookings

Get a paginated list of bookings with optional filters.

**Endpoint:** `GET /api/bookings`

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`)
- `service_type` (optional): Filter by service type (`oil_change`, `ac_repair`, `battery_change`, `tire_service`, `brake_service`, `engine_diagnostic`, etc.)
- `payment_status` (optional): Filter by payment status (`pending`, `paid`, `partial`, `refunded`)
- `date_from` (optional): Filter bookings from this date (format: `YYYY-MM-DD`)
- `date_to` (optional): Filter bookings until this date (format: `YYYY-MM-DD`)
- `search` (optional): Search in customer name, phone, email, vehicle details
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Request Examples:**

```bash
# Get all bookings
curl -X GET https://your-api.com/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get pending bookings
curl -X GET "https://your-api.com/api/bookings?status=pending" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get completed bookings for oil changes
curl -X GET "https://your-api.com/api/bookings?status=completed&service_type=oil_change" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Search for customer "Ali"
curl -X GET "https://your-api.com/api/bookings?search=Ali" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get bookings for date range with pagination
curl -X GET "https://your-api.com/api/bookings?date_from=2024-01-01&date_to=2024-01-31&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "data": {
    "bookings": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "booking_number": "BK1705318800001",
        "garage_id": "123e4567-e89b-12d3-a456-426614174000",
        "customer_name": "Ali Khan",
        "customer_phone": "+971501234567",
        "customer_email": "ali@example.com",
        "service_type": "oil_change",
        "service_description": "Full synthetic oil change",
        "booking_date": "2024-01-15",
        "scheduled_time": "10:00",
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_year": 2020,
        "vehicle_plate_number": "ABC123",
        "estimated_cost": 250.00,
        "actual_cost": null,
        "status": "in_progress",
        "payment_status": "pending",
        "completion_date": null,
        "assigned_technician": "Ahmed Hassan",
        "notes": "Customer requested high-quality oil",
        "internal_notes": "Regular customer, VIP treatment",
        "created_at": "2024-01-14T09:30:00.000Z",
        "updated_at": "2024-01-15T08:00:00.000Z"
      }
      // ... more bookings
    ],
    "total": 67
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get Single Booking

Get detailed information about a specific booking.

**Endpoint:** `GET /api/bookings/:id`

**Authentication:** Required

**Request:**
```bash
curl -X GET https://your-api.com/api/bookings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking fetched successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_number": "BK1705318800001",
    "garage_id": "123e4567-e89b-12d3-a456-426614174000",
    "customer_name": "Ali Khan",
    "customer_phone": "+971501234567",
    "customer_email": "ali@example.com",
    "service_type": "oil_change",
    "service_description": "Full synthetic oil change",
    "booking_date": "2024-01-15",
    "scheduled_time": "10:00",
    "vehicle_make": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_year": 2020,
    "vehicle_plate_number": "ABC123",
    "estimated_cost": 250.00,
    "actual_cost": null,
    "status": "in_progress",
    "payment_status": "pending",
    "completion_date": null,
    "assigned_technician": "Ahmed Hassan",
    "notes": "Customer requested high-quality oil",
    "internal_notes": "Regular customer, VIP treatment",
    "created_at": "2024-01-14T09:30:00.000Z",
    "updated_at": "2024-01-15T08:00:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Booking not found",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Create Booking

Create a new booking for a customer.

**Endpoint:** `POST /api/bookings`

**Authentication:** Required

**Request Body:**
```json
{
  "customer_name": "Ali Khan",
  "customer_phone": "+971501234567",
  "customer_email": "ali@example.com",
  "service_type": "oil_change",
  "service_description": "Full synthetic oil change",
  "booking_date": "2024-01-15",
  "scheduled_time": "10:00",
  "vehicle_make": "Toyota",
  "vehicle_model": "Camry",
  "vehicle_year": 2020,
  "vehicle_plate_number": "ABC123",
  "estimated_cost": 250.00,
  "notes": "Customer requested high-quality oil"
}
```

**Required Fields:**
- `customer_name` (string)
- `customer_phone` (string)
- `service_type` (string: oil_change, ac_repair, battery_change, tire_service, brake_service, engine_diagnostic, transmission_repair, suspension_work, electrical_repair, body_work, detailing, inspection, other)
- `booking_date` (string: YYYY-MM-DD format)

**Optional Fields:**
- `customer_email` (string)
- `service_description` (string)
- `scheduled_time` (string: HH:MM format)
- `vehicle_make` (string)
- `vehicle_model` (string)
- `vehicle_year` (number)
- `vehicle_plate_number` (string)
- `estimated_cost` (number)
- `notes` (string)

**Request:**
```bash
curl -X POST https://your-api.com/api/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ali Khan",
    "customer_phone": "+971501234567",
    "customer_email": "ali@example.com",
    "service_type": "oil_change",
    "booking_date": "2024-01-15",
    "scheduled_time": "10:00",
    "estimated_cost": 250.00
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_number": "BK1705318800001",
    "garage_id": "123e4567-e89b-12d3-a456-426614174000",
    "customer_name": "Ali Khan",
    "customer_phone": "+971501234567",
    "customer_email": "ali@example.com",
    "service_type": "oil_change",
    "service_description": null,
    "booking_date": "2024-01-15",
    "scheduled_time": "10:00",
    "vehicle_make": null,
    "vehicle_model": null,
    "vehicle_year": null,
    "vehicle_plate_number": null,
    "estimated_cost": 250.00,
    "actual_cost": null,
    "status": "pending",
    "payment_status": "pending",
    "completion_date": null,
    "assigned_technician": null,
    "notes": null,
    "internal_notes": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "message": "Customer name, phone, service type, and booking date are required",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update Booking

Update an existing booking's status, payment, costs, notes, etc.

**Endpoint:** `PATCH /api/bookings/:id`

**Authentication:** Required

**Request Body (all fields optional):**
```json
{
  "status": "completed",
  "payment_status": "paid",
  "actual_cost": 275.00,
  "completion_date": "2024-01-15T14:30:00.000Z",
  "assigned_technician": "Ahmed Hassan",
  "internal_notes": "Used premium oil filter"
}
```

**Updatable Fields:**
- `customer_name` (string)
- `customer_phone` (string)
- `customer_email` (string)
- `service_type` (string)
- `service_description` (string)
- `booking_date` (string)
- `scheduled_time` (string)
- `vehicle_make` (string)
- `vehicle_model` (string)
- `vehicle_year` (number)
- `vehicle_plate_number` (string)
- `estimated_cost` (number)
- `actual_cost` (number)
- `status` (string: pending, confirmed, in_progress, completed, cancelled, no_show)
- `payment_status` (string: pending, paid, partial, refunded)
- `completion_date` (string: ISO 8601 timestamp)
- `assigned_technician` (string)
- `notes` (string)
- `internal_notes` (string)

**Request:**
```bash
curl -X PATCH https://your-api.com/api/bookings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "payment_status": "paid",
    "actual_cost": 275.00
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_number": "BK1705318800001",
    "status": "completed",
    "payment_status": "paid",
    "actual_cost": 275.00,
    "updated_at": "2024-01-15T14:35:00.000Z"
    // ... other fields
  },
  "meta": {
    "timestamp": "2024-01-15T14:35:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Booking not found",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Delete Booking

Delete a booking permanently.

**Endpoint:** `DELETE /api/bookings/:id`

**Authentication:** Required

**Request:**
```bash
curl -X DELETE https://your-api.com/api/bookings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking deleted successfully",
  "data": null,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Booking not found",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Service Types

The following service types are supported:

- `oil_change` - Oil Change
- `ac_repair` - AC Repair
- `battery_change` - Battery Change
- `tire_service` - Tire Service
- `brake_service` - Brake Service
- `engine_diagnostic` - Engine Diagnostic
- `transmission_repair` - Transmission Repair
- `suspension_work` - Suspension Work
- `electrical_repair` - Electrical Repair
- `body_work` - Body Work
- `detailing` - Detailing
- `inspection` - Inspection
- `other` - Other

---

## Booking Status Values

- `pending` - Booking created, awaiting confirmation
- `confirmed` - Booking confirmed by garage
- `in_progress` - Service is currently being performed
- `completed` - Service completed
- `cancelled` - Booking cancelled
- `no_show` - Customer didn't show up

---

## Payment Status Values

- `pending` - Payment not received
- `paid` - Fully paid
- `partial` - Partially paid
- `refunded` - Payment refunded

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Unauthorized",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Integration Example (React/Next.js)

```typescript
// api/bookings.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const bookingAPI = {
  // Get dashboard stats
  async getDashboardStats(token: string) {
    const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get all bookings
  async getBookings(token: string, filters?: any) {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/api/bookings?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get single booking
  async getBooking(token: string, id: string) {
    const response = await axios.get(`${API_URL}/api/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Create booking
  async createBooking(token: string, data: any) {
    const response = await axios.post(`${API_URL}/api/bookings`, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // Update booking
  async updateBooking(token: string, id: string, updates: any) {
    const response = await axios.patch(`${API_URL}/api/bookings/${id}`, updates, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // Delete booking
  async deleteBooking(token: string, id: string) {
    const response = await axios.delete(`${API_URL}/api/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Costs are in decimal format with 2 decimal places
- Booking numbers are auto-generated and unique
- All endpoints automatically filter by the authenticated user's garage_id
- The `updated_at` field is automatically updated on every modification
