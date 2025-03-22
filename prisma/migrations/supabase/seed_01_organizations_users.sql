-- Seed data script for PrimePM database in Supabase (Part 1: Organizations and Users)
-- Run this script first

-- Organizations (no foreign key dependencies)
INSERT INTO organizations (id, name, description) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'Global technology leader'),
  ('22222222-2222-2222-2222-222222222222', 'TechInnovate', 'Cutting-edge software development');

-- Departments (depends on organizations)
INSERT INTO departments (id, organization_id, name, description) VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'IT', 'Information Technology'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Marketing', 'Marketing and Communications'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Operations', 'Business Operations'),
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'Engineering', 'Software Engineering'),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'Product', 'Product Management');

-- Users (depends on organizations, departments)
-- Note: We insert a first user without created_by/updated_by to resolve the circular dependency
INSERT INTO users (id, email, full_name, organization_id, department_id, roles) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@acme.com', 'Admin User', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', ARRAY['PMO', 'Management']);

-- Now we can update the organizations and departments with the admin user as creator
UPDATE organizations SET created_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', updated_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE departments SET created_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', updated_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Add more users now that foreign key constraints are satisfied
INSERT INTO users (id, email, full_name, organization_id, department_id, roles, created_by, updated_by) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pm@acme.com', 'Project Manager', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', ARRAY['Project Manager'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'committee@acme.com', 'Committee Member', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', ARRAY['Committee'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ops@acme.com', 'Operations Lead', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', ARRAY['Project Manager'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'owner@techinnovate.com', 'Owner', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', ARRAY['PMO', 'Management', 'Committee', 'Project Manager'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'product@techinnovate.com', 'Product Lead', '22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', ARRAY['Project Manager'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
