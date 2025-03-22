-- Seed data script for PrimePM database in Supabase

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

-- Criteria Versions
INSERT INTO criteria_versions (id, organization_id, name, description, is_active, created_by, updated_by) VALUES
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '2025 Selection Criteria', 'Criteria for 2025 project selection cycle', TRUE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', '2025 Product Criteria', 'Criteria for 2025 product development', TRUE, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Criteria for Acme Corp
INSERT INTO criteria (id, version_id, key, label, description, is_inverse, is_default, weight, scale, rubric, created_by, updated_by) VALUES
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '88888888-8888-8888-8888-888888888888', 'revenue', 'Revenue Impact', 'Potential revenue generation or savings', FALSE, TRUE, 0.30, '{"min": 1, "max": 10}', '{"1": "No impact", "5": "Moderate impact", "10": "Very high impact"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', '88888888-8888-8888-8888-888888888888', 'policyImpact', 'Policy Impact', 'Impact on organizational policies and strategies', FALSE, TRUE, 0.25, '{"min": 1, "max": 10}', '{"1": "No impact", "5": "Moderate impact", "10": "Very high impact"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', '88888888-8888-8888-8888-888888888888', 'budget', 'Budget', 'Required financial investment', TRUE, TRUE, 0.15, '{"min": 1, "max": 10}', '{"1": "Very high cost", "5": "Moderate cost", "10": "Very low cost"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', '88888888-8888-8888-8888-888888888888', 'resources', 'Resources', 'Required human and other resources', TRUE, TRUE, 0.15, '{"min": 1, "max": 10}', '{"1": "Many resources", "5": "Moderate resources", "10": "Few resources"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', '88888888-8888-8888-8888-888888888888', 'complexity', 'Complexity', 'Technical and implementation complexity', TRUE, TRUE, 0.15, '{"min": 1, "max": 10}', '{"1": "Very complex", "5": "Moderately complex", "10": "Simple"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Projects for Acme Corp
INSERT INTO projects (id, organization_id, department_id, name, description, status, start_date, end_date, budget, resources, tags, created_by, updated_by) VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Digital Transformation Initiative', 'Enterprise-wide digital transformation to modernize legacy systems and implement cloud solutions.', 'in-progress', '2025-01-15', '2025-12-31', 1500000, 2400, ARRAY['digital', 'cloud', 'transformation', 'high-priority'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Customer Experience Redesign', 'Redesign the customer experience journey across all touchpoints to improve satisfaction and loyalty.', 'planning', '2025-04-01', '2025-09-30', 750000, 1200, ARRAY['customer-experience', 'design', 'marketing'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Project Criteria Scores
INSERT INTO project_criteria_scores (id, project_id, criterion_id, version_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '88888888-8888-8888-8888-888888888888', 9, 'Expected to generate significant savings through improved efficiency', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', '88888888-8888-8888-8888-888888888888', 8, 'Aligns with digital transformation strategy', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
