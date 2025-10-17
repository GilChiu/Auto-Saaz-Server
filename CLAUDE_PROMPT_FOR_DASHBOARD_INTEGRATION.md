# Frontend Integration Prompt - Dashboard & Booking System

**Copy this entire prompt and paste it into Claude in your garage frontend workspace.**

---

## Context

The AutoSaaz backend has been updated with a complete **Booking Management and Dashboard System**. You need to integrate these new features into the garage owner dashboard.

---

## What Was Added to Backend

### New API Endpoints

#### Dashboard Endpoints
1. **GET** `/api/dashboard/stats`
   - Returns comprehensive statistics (today, this week, this month, all-time)
   - Requires: JWT authentication
   - Response structure:
   ```typescript
   {
     success: true,
     message: "Dashboard statistics fetched successfully",
     data: {
       today: {
         totalBookings: number,
         completedBookings: number,
         pendingBookings: number,
         inProgressBookings: number,
         cancelledBookings: number,
         totalRevenue: number,
         averageBookingCost: number
       },
       thisWeek: { /* same structure */ },
       thisMonth: { /* same structure */ },
       allTime: { /* same structure */ }
     }
   }
   ```

2. **GET** `/api/dashboard/booking-stats`
   - Returns all-time booking statistics
   - Requires: JWT authentication

#### Booking Endpoints
1. **GET** `/api/bookings`
   - List all bookings with filters and pagination
   - Query params: `status`, `service_type`, `payment_status`, `date_from`, `date_to`, `search`, `limit`, `offset`
   - Response:
   ```typescript
   {
     success: true,
     message: "Bookings fetched successfully",
     data: {
       bookings: Booking[],
       total: number
     }
   }
   ```

2. **GET** `/api/bookings/:id`
   - Get single booking by ID
   - Requires: JWT authentication

3. **POST** `/api/bookings`
   - Create new booking
   - Required fields: `customer_name`, `customer_phone`, `service_type`, `booking_date`
   - Optional fields: `customer_email`, `service_description`, `scheduled_time`, `vehicle_make`, `vehicle_model`, `vehicle_year`, `vehicle_plate_number`, `estimated_cost`, `notes`

4. **PATCH** `/api/bookings/:id`
   - Update booking
   - Can update: `status`, `payment_status`, `actual_cost`, `assigned_technician`, `notes`, `internal_notes`, `completion_date`

5. **DELETE** `/api/bookings/:id`
   - Delete booking permanently

---

## TypeScript Types for Frontend

Create a new file `types/booking.ts`:

```typescript
// Enums
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum ServiceType {
  OIL_CHANGE = 'oil_change',
  AC_REPAIR = 'ac_repair',
  BATTERY_CHANGE = 'battery_change',
  TIRE_SERVICE = 'tire_service',
  BRAKE_SERVICE = 'brake_service',
  ENGINE_DIAGNOSTIC = 'engine_diagnostic',
  TRANSMISSION = 'transmission',
  SUSPENSION = 'suspension',
  ELECTRICAL = 'electrical',
  BODY_WORK = 'body_work',
  DETAILING = 'detailing',
  INSPECTION = 'inspection',
  OTHER = 'other'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded'
}

// Main Booking Interface
export interface Booking {
  id: string;
  booking_number: string;
  garage_id: string;
  
  // Customer
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Service
  service_type: ServiceType;
  service_description?: string;
  booking_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:MM
  
  // Vehicle
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_plate_number?: string;
  
  // Financial
  estimated_cost?: number;
  actual_cost?: number;
  
  // Status
  status: BookingStatus;
  payment_status: PaymentStatus;
  completion_date?: string;
  
  // Assignment
  assigned_technician?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Statistics
export interface PeriodStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  inProgressBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingCost: number;
}

export interface DashboardStats {
  today: PeriodStats;
  thisWeek: PeriodStats;
  thisMonth: PeriodStats;
  allTime: PeriodStats;
}

// API Input Types
export interface CreateBookingInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_type: ServiceType;
  service_description?: string;
  booking_date: string;
  scheduled_time?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_plate_number?: string;
  estimated_cost?: number;
  notes?: string;
}

export interface UpdateBookingInput {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  actual_cost?: number;
  assigned_technician?: string;
  notes?: string;
  internal_notes?: string;
  completion_date?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  service_type?: ServiceType;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}
```

---

## API Service for Frontend

Create `services/bookingService.ts`:

```typescript
import { apiClient } from './apiClient'; // Your existing API client
import type {
  Booking,
  DashboardStats,
  CreateBookingInput,
  UpdateBookingInput,
  BookingFilters
} from '../types/booking';

export const bookingService = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.data;
  },

  async getBookingStats() {
    const response = await apiClient.get('/dashboard/booking-stats');
    return response.data.data;
  },

  // Bookings
  async getBookings(filters?: BookingFilters, limit = 50, offset = 0): Promise<{ bookings: Booking[], total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.service_type) params.append('service_type', filters.service_type);
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.search) params.append('search', filters.search);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await apiClient.get(`/bookings?${params.toString()}`);
    return response.data.data;
  },

  async getBookingById(id: string): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data.data;
  },

  async createBooking(data: CreateBookingInput): Promise<Booking> {
    const response = await apiClient.post('/bookings', data);
    return response.data.data;
  },

  async updateBooking(id: string, data: UpdateBookingInput): Promise<Booking> {
    const response = await apiClient.patch(`/bookings/${id}`, data);
    return response.data.data;
  },

  async deleteBooking(id: string): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  }
};
```

---

## UI Components to Create

### 1. Dashboard Page (`pages/dashboard.tsx` or `app/dashboard/page.tsx`)

**Features:**
- Display statistics cards (Today, This Week, This Month, All Time)
- Show total bookings, completed, pending, in progress, revenue
- Recent bookings table
- Quick actions (Create Booking, View All)

**Component Structure:**
```typescript
import { useEffect, useState } from 'react';
import { bookingService } from '@/services/bookingService';
import type { DashboardStats } from '@/types/booking';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Today" stats={stats.today} />
        <StatsCard title="This Week" stats={stats.thisWeek} />
        <StatsCard title="This Month" stats={stats.thisMonth} />
        <StatsCard title="All Time" stats={stats.allTime} />
      </div>

      {/* Recent Bookings */}
      <RecentBookingsSection />
    </div>
  );
}
```

### 2. Bookings List Page (`pages/bookings.tsx`)

**Features:**
- Table/grid view of all bookings
- Filters: Status, Service Type, Payment Status, Date Range, Search
- Pagination
- Actions: View, Edit, Delete
- Status badges with colors

**Key Features:**
```typescript
- Search by customer name, phone, vehicle plate
- Filter by status (pending, confirmed, in_progress, completed, cancelled, no_show)
- Filter by service type (oil_change, ac_repair, battery_change, etc.)
- Filter by payment status (pending, paid, partial, refunded)
- Date range filtering
- Sortable columns
- Pagination (50 items per page)
```

### 3. Create/Edit Booking Modal/Page

**Form Fields:**

**Customer Information (Required):**
- Customer Name (text)
- Customer Phone (tel, format: +971XXXXXXXXX)
- Customer Email (email, optional)

**Service Information (Required):**
- Service Type (select dropdown)
  - Oil Change
  - AC Repair
  - Battery Change
  - Tire Service
  - Brake Service
  - Engine Diagnostic
  - Transmission
  - Suspension
  - Electrical
  - Body Work
  - Detailing
  - Inspection
  - Other
- Service Description (textarea, optional)
- Booking Date (date picker)
- Scheduled Time (time picker, optional)

**Vehicle Information (Optional):**
- Vehicle Make (text)
- Vehicle Model (text)
- Vehicle Year (number)
- Vehicle Plate Number (text)

**Financial (Optional):**
- Estimated Cost (number, AED)

**Notes (Optional):**
- Customer Notes (textarea)

### 4. Booking Details/Edit Page

**View Mode:**
- Display all booking information
- Show status history
- Show payment status
- Action buttons: Edit, Delete, Update Status

**Edit Mode:**
- Update status (pending → confirmed → in_progress → completed)
- Update payment status
- Add actual cost
- Assign technician
- Add internal notes
- Set completion date

### 5. Status Update Component

Quick status update widget:
```typescript
const statusFlow = [
  { status: 'pending', label: 'Pending', color: 'gray' },
  { status: 'confirmed', label: 'Confirmed', color: 'blue' },
  { status: 'in_progress', label: 'In Progress', color: 'yellow' },
  { status: 'completed', label: 'Completed', color: 'green' }
];

// Allow quick status updates with one click
```

---

## UI/UX Guidelines

### Status Colors (matching your mockup)
- **Pending**: Gray (#6B7280)
- **Confirmed**: Blue (#3B82F6)
- **In Progress**: Yellow/Orange (#F59E0B)
- **Completed**: Green (#10B981)
- **Cancelled**: Red (#EF4444)
- **No Show**: Dark Gray (#374151)

### Payment Status Colors
- **Pending**: Gray
- **Paid**: Green
- **Partial**: Yellow
- **Refunded**: Orange

### Service Type Labels
```typescript
const serviceLabels = {
  oil_change: 'Oil Change',
  ac_repair: 'AC Repair',
  battery_change: 'Battery Change',
  tire_service: 'Tire Service',
  brake_service: 'Brake Service',
  engine_diagnostic: 'Engine Diagnostic',
  transmission: 'Transmission',
  suspension: 'Suspension',
  electrical: 'Electrical',
  body_work: 'Body Work',
  detailing: 'Detailing',
  inspection: 'Inspection',
  other: 'Other'
};
```

---

## Sample Components

### Stats Card Component

```typescript
interface StatsCardProps {
  title: string;
  stats: PeriodStats;
}

function StatsCard({ title, stats }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <div className="space-y-3">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalBookings}
          </p>
          <p className="text-xs text-gray-500">Total Bookings</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="font-semibold text-green-600">{stats.completedBookings}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div>
            <p className="font-semibold text-yellow-600">{stats.inProgressBookings}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">{stats.pendingBookings}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div>
            <p className="font-semibold text-red-600">{stats.cancelledBookings}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
        <div className="pt-3 border-t">
          <p className="text-lg font-bold text-gray-900">
            AED {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Total Revenue</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            AED {stats.averageBookingCost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Average Cost</p>
        </div>
      </div>
    </div>
  );
}
```

### Booking Table Row Component

```typescript
interface BookingRowProps {
  booking: Booking;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function BookingRow({ booking, onEdit, onDelete }: BookingRowProps) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-200 text-gray-900'
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 font-medium">{booking.booking_number}</td>
      <td className="px-4 py-3">{booking.customer_name}</td>
      <td className="px-4 py-3">{serviceLabels[booking.service_type]}</td>
      <td className="px-4 py-3">{new Date(booking.booking_date).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
          {booking.status.replace('_', ' ').toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        {booking.estimated_cost ? `AED ${booking.estimated_cost}` : '-'}
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onEdit(booking.id)} className="text-blue-600 hover:text-blue-800 mr-2">
          Edit
        </button>
        <button onClick={() => onDelete(booking.id)} className="text-red-600 hover:text-red-800">
          Delete
        </button>
      </td>
    </tr>
  );
}
```

### Create Booking Form Component

```typescript
import { useState } from 'react';
import { bookingService } from '@/services/bookingService';
import type { CreateBookingInput, ServiceType } from '@/types/booking';

export function CreateBookingForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateBookingInput>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_type: 'oil_change' as ServiceType,
    booking_date: '',
    estimated_cost: undefined
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await bookingService.createBooking(formData);
      onSuccess();
      // Show success toast
    } catch (error) {
      console.error('Failed to create booking:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Customer Name *
        </label>
        <input
          type="text"
          required
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {/* Customer Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Customer Phone *
        </label>
        <input
          type="tel"
          required
          placeholder="+971501234567"
          value={formData.customer_phone}
          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Service Type *
        </label>
        <select
          required
          value={formData.service_type}
          onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="oil_change">Oil Change</option>
          <option value="ac_repair">AC Repair</option>
          <option value="battery_change">Battery Change</option>
          <option value="tire_service">Tire Service</option>
          <option value="brake_service">Brake Service</option>
          <option value="engine_diagnostic">Engine Diagnostic</option>
          <option value="transmission">Transmission</option>
          <option value="suspension">Suspension</option>
          <option value="electrical">Electrical</option>
          <option value="body_work">Body Work</option>
          <option value="detailing">Detailing</option>
          <option value="inspection">Inspection</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Booking Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Booking Date *
        </label>
        <input
          type="date"
          required
          value={formData.booking_date}
          onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {/* Estimated Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Estimated Cost (AED)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.estimated_cost || ''}
          onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      {/* Add more fields as needed */}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Booking'}
      </button>
    </form>
  );
}
```

---

## React Hooks for State Management

### useDashboardStats Hook

```typescript
import { useState, useEffect } from 'react';
import { bookingService } from '@/services/bookingService';
import type { DashboardStats } from '@/types/booking';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, loading, error, refresh: loadStats };
}
```

### useBookings Hook

```typescript
import { useState, useEffect } from 'react';
import { bookingService } from '@/services/bookingService';
import type { Booking, BookingFilters } from '@/types/booking';

export function useBookings(filters?: BookingFilters, limit = 50, offset = 0) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBookings(filters, limit, offset);
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [JSON.stringify(filters), limit, offset]);

  return { bookings, total, loading, error, refresh: loadBookings };
}
```

---

## Navigation Updates

Add these menu items to your garage owner navigation:

```typescript
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Bookings', href: '/bookings', icon: CalendarIcon },
  { name: 'Create Booking', href: '/bookings/new', icon: PlusIcon },
  // ... existing items
];
```

---

## Testing Checklist

After implementation, test:

1. **Dashboard Page:**
   - [ ] Stats load correctly
   - [ ] All time periods display (today, week, month, all-time)
   - [ ] Numbers update when bookings change

2. **Bookings List:**
   - [ ] All bookings display
   - [ ] Filters work (status, service type, payment status)
   - [ ] Search works (customer name, phone, vehicle)
   - [ ] Date range filtering works
   - [ ] Pagination works
   - [ ] Status badges show correct colors

3. **Create Booking:**
   - [ ] Form validation works
   - [ ] Required fields enforced
   - [ ] Booking created successfully
   - [ ] Redirects to bookings list
   - [ ] Success message shown

4. **Edit Booking:**
   - [ ] Booking details load
   - [ ] Updates save successfully
   - [ ] Status changes work
   - [ ] Payment status updates

5. **Delete Booking:**
   - [ ] Confirmation dialog shown
   - [ ] Booking deleted successfully
   - [ ] List refreshes

---

## Error Handling

Add proper error handling for:

1. **Network errors**: Show toast/notification
2. **Validation errors**: Display field-specific errors
3. **Authorization errors**: Redirect to login
4. **Not found errors**: Show 404 page

```typescript
try {
  await bookingService.createBooking(data);
  toast.success('Booking created successfully');
} catch (error: any) {
  if (error.response?.status === 401) {
    // Redirect to login
    router.push('/login');
  } else if (error.response?.status === 400) {
    toast.error(error.response.data.message || 'Invalid data');
  } else {
    toast.error('Something went wrong. Please try again.');
  }
}
```

---

## Performance Optimization

1. **Pagination**: Load 50 bookings at a time
2. **Debounce search**: Wait 300ms before searching
3. **Cache stats**: Refresh every 5 minutes
4. **Optimistic updates**: Update UI before API call completes

```typescript
// Debounced search
import { debounce } from 'lodash';

const handleSearch = debounce((query: string) => {
  setFilters({ ...filters, search: query });
}, 300);
```

---

## Mobile Responsiveness

Ensure mobile-friendly:
- Stack stats cards vertically on mobile
- Horizontal scroll for booking table on mobile
- Bottom sheet for filters on mobile
- Full-screen modals on mobile

---

## Accessibility

- Add ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management in modals

---

## Summary

You need to create:

1. ✅ Type definitions (`types/booking.ts`)
2. ✅ API service (`services/bookingService.ts`)
3. ✅ Dashboard page with stats cards
4. ✅ Bookings list page with table/grid
5. ✅ Create booking form/modal
6. ✅ Edit booking page/modal
7. ✅ Status badge component
8. ✅ Stats card component
9. ✅ Custom hooks (useDashboardStats, useBookings)
10. ✅ Navigation updates

**Priority Order:**
1. Dashboard page (most important - user sees first)
2. Bookings list page
3. Create booking form
4. Edit booking functionality
5. Delete confirmation

**Estimated Development Time:** 4-6 hours

Good luck with the implementation! The backend is fully ready and tested. All endpoints return proper JSON responses with type-safe data structures.
