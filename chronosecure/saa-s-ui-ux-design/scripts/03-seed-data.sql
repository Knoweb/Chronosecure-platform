-- Insert a sample organization (for demo purposes)
INSERT INTO organizations (id, name, subscription_plan, subscription_status, max_employees, trial_ends_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Company', 'professional', 'active', 100, NOW() + INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- Note: User profiles will be created automatically when users sign up via Supabase Auth

-- Insert sample departments
INSERT INTO departments (organization_id, name, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Engineering', 'Software development team'),
  ('00000000-0000-0000-0000-000000000001', 'Sales', 'Sales and business development'),
  ('00000000-0000-0000-0000-000000000001', 'Operations', 'Operations and logistics'),
  ('00000000-0000-0000-0000-000000000001', 'Human Resources', 'HR and recruitment')
ON CONFLICT DO NOTHING;

-- Insert sample shifts
INSERT INTO shifts (organization_id, name, start_time, end_time, grace_period_minutes, color)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Morning Shift', '08:00:00', '16:00:00', 5, '#3b82f6'),
  ('00000000-0000-0000-0000-000000000001', 'Afternoon Shift', '14:00:00', '22:00:00', 5, '#f59e0b'),
  ('00000000-0000-0000-0000-000000000001', 'Night Shift', '22:00:00', '06:00:00', 5, '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Insert sample location
INSERT INTO locations (organization_id, name, address, latitude, longitude)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Main Office', '123 Business Street, San Francisco, CA 94105', 37.7749, -122.4194)
ON CONFLICT DO NOTHING;
