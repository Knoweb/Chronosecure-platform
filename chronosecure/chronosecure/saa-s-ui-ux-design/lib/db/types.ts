export interface Organization {
  id: string
  name: string
  subscription_plan: "starter" | "professional" | "enterprise"
  subscription_status: "trial" | "active" | "cancelled" | "expired"
  trial_ends_at: string | null
  max_employees: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  organization_id: string
  full_name: string
  role: "super_admin" | "admin" | "manager" | "viewer"
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  organization_id: string
  name: string
  description: string | null
  manager_id: string | null
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  organization_id: string
  name: string
  start_time: string
  end_time: string
  grace_period_minutes: number
  color: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  organization_id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string | null
  phone_number: string | null
  department_id: string | null
  shift_id: string | null
  position: string | null
  hire_date: string | null
  employment_type: "full_time" | "part_time" | "contract" | "temporary"
  hourly_rate: number | null
  biometric_id: string | null
  photo_url: string | null
  status: "active" | "inactive" | "terminated"
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  organization_id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  geofence_radius: number
  created_at: string
  updated_at: string
}

export interface Kiosk {
  id: string
  organization_id: string
  location_id: string | null
  name: string
  device_id: string
  status: "active" | "inactive" | "maintenance"
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  organization_id: string
  employee_id: string
  kiosk_id: string | null
  clock_in_time: string
  clock_in_photo_url: string | null
  clock_in_biometric_verified: boolean
  clock_out_time: string | null
  clock_out_photo_url: string | null
  clock_out_biometric_verified: boolean
  total_hours: number | null
  regular_hours: number | null
  overtime_hours: number | null
  break_duration_minutes: number
  status: "clocked_in" | "clocked_out" | "on_break"
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TimeOffRequest {
  id: string
  organization_id: string
  employee_id: string
  start_date: string
  end_date: string
  request_type: "vacation" | "sick" | "personal" | "unpaid"
  total_days: number
  reason: string | null
  status: "pending" | "approved" | "rejected"
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface PayrollPeriod {
  id: string
  organization_id: string
  period_start: string
  period_end: string
  pay_date: string | null
  status: "open" | "processing" | "completed" | "exported"
  total_employees: number | null
  total_hours: number | null
  total_amount: number | null
  created_at: string
  updated_at: string
}
