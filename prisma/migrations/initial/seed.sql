-- Seed data script for PrimePM database

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

-- Criteria for TechInnovate
INSERT INTO criteria (id, version_id, key, label, description, is_inverse, is_default, weight, scale, rubric, created_by, updated_by) VALUES
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '99999999-9999-9999-9999-999999999999', 'innovation', 'Innovation', 'Level of innovation', FALSE, TRUE, 0.30, '{"min": 1, "max": 10}', '{"1": "Already exists", "5": "Somewhat innovative", "10": "Groundbreaking"}', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '99999999-9999-9999-9999-999999999999', 'marketFit', 'Market Fit', 'Alignment with market needs', FALSE, TRUE, 0.25, '{"min": 1, "max": 10}', '{"1": "Limited fit", "5": "Good fit", "10": "Perfect fit"}', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '99999999-9999-9999-9999-999999999999', 'developmentCost', 'Development Cost', 'Cost to develop', TRUE, TRUE, 0.15, '{"min": 1, "max": 10}', '{"1": "Very expensive", "5": "Moderate cost", "10": "Low cost"}', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '99999999-9999-9999-9999-999999999999', 'timeline', 'Timeline', 'Time to market', TRUE, TRUE, 0.15, '{"min": 1, "max": 10}', '{"1": "Very long", "5": "Moderate", "10": "Very short"}', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', '99999999-9999-9999-9999-999999999999', 'technicalRisk', 'Technical Risk', 'Level of technical risk', TRUE, TRUE, 0.15, '{"min": 1, "max": 10}', '{"1": "High risk", "5": "Moderate risk", "10": "Low risk"}', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Pairwise Comparisons for Acme Corp
INSERT INTO pairwise_comparisons (id, version_id, criterion_a_id, criterion_b_id, value) VALUES
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 1),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 3),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 3),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 3),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 3),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 3),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 3),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 1),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 1),
  (uuid_generate_v4(), '88888888-8888-8888-8888-888888888888', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 1);

-- Projects for Acme Corp
INSERT INTO projects (id, organization_id, department_id, name, description, status, start_date, end_date, budget, resources, tags, created_by, updated_by) VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Digital Transformation Initiative', 'Enterprise-wide digital transformation to modernize legacy systems and implement cloud solutions.', 'in-progress', '2025-01-15', '2025-12-31', 1500000, 2400, ARRAY['digital', 'cloud', 'transformation', 'high-priority'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Customer Experience Redesign', 'Redesign the customer experience journey across all touchpoints to improve satisfaction and loyalty.', 'planning', '2025-04-01', '2025-09-30', 750000, 1200, ARRAY['customer-experience', 'design', 'marketing'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Supply Chain Optimization', 'Optimize the supply chain to reduce costs and improve delivery times.', 'in-progress', '2025-02-10', '2025-08-15', 850000, 1500, ARRAY['supply-chain', 'optimization', 'logistics'], 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Projects for TechInnovate
INSERT INTO projects (id, organization_id, department_id, name, description, status, start_date, end_date, budget, resources, tags, created_by, updated_by) VALUES
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'AI Assistant Implementation', 'Implement AI-powered assistants across customer service and internal support functions.', 'planning', '2025-04-15', '2025-11-30', 950000, 1800, ARRAY['ai', 'automation', 'customer-service', 'innovation'], 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', '22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'New Product Launch: Smart Office', 'Launch a new product line focused on smart office technologies.', 'planning', '2025-06-01', '2026-01-31', 1200000, 2100, ARRAY['product-launch', 'innovation', 'tech', 'high-priority'], 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff');

-- Project Criteria Scores for Acme Corp
INSERT INTO project_criteria_scores (id, project_id, criterion_id, version_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '88888888-8888-8888-8888-888888888888', 9, 'Expected to generate significant savings through improved efficiency', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', '88888888-8888-8888-8888-888888888888', 8, 'Aligns with digital transformation strategy', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', '88888888-8888-8888-8888-888888888888', 3, 'Significant investment required', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', '88888888-8888-8888-8888-888888888888', 2, 'Requires substantial resources across multiple departments', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', '88888888-8888-8888-8888-888888888888', 2, 'Very complex implementation', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Project Criteria Scores for TechInnovate project
INSERT INTO project_criteria_scores (id, project_id, criterion_id, version_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '99999999-9999-9999-9999-999999999999', 8, 'Innovative implementation of AI technology', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '99999999-9999-9999-9999-999999999999', 7, 'Strong market demand for AI assistants', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '99999999-9999-9999-9999-999999999999', 4, 'Moderate development cost', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '99999999-9999-9999-9999-999999999999', 4, 'Moderate timeline to market', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', '99999999-9999-9999-9999-999999999999', 3, 'Some technical risk with AI integration', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Committee Scores for Acme Corp projects
INSERT INTO committee_scores (id, project_id, criterion_id, user_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 8, 'Strong revenue potential', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 9, 'Excellent policy alignment', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 'Very expensive project', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 'Resource intensive', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 'Technically challenging', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Portfolio Selections
INSERT INTO portfolio_selections (id, organization_id, name, description, version, status, selection_date, constraints, is_active, created_by, updated_by) VALUES
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '11111111-1111-1111-1111-111111111111', '2025 Q1 Portfolio', 'First quarter project portfolio', '2025-Q1', 'final', '2025-01-01', '{"budget_limit": 3000000, "resource_limit": 5000}', TRUE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '22222222-2222-2222-2222-222222222222', '2025 Innovation Portfolio', 'Innovation projects for 2025', '2025', 'draft', '2025-01-15', '{"budget_limit": 2500000, "resource_limit": 4000}', TRUE, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Portfolio Projects
INSERT INTO portfolio_projects (id, portfolio_id, project_id, is_selected, score) VALUES
  (uuid_generate_v4(), 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', TRUE, 7.5),
  (uuid_generate_v4(), 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', FALSE, 6.2),
  (uuid_generate_v4(), 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', TRUE, 6.8),
  (uuid_generate_v4(), 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', TRUE, 7.8),
  (uuid_generate_v4(), 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', TRUE, 8.2);

-- Audit Logs
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id) VALUES
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'organization', '11111111-1111-1111-1111-111111111111'),
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'organization', '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'criteria_version', '88888888-8888-8888-8888-888888888888'),
  (uuid_generate_v4(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'CREATE', 'criteria_version', '99999999-9999-9999-9999-999999999999'),
  (uuid_generate_v4(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CREATE', 'project', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'),
  (uuid_generate_v4(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'CREATE', 'project', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1'),
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'portfolio_selection', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'),
  (uuid_generate_v4(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'CREATE', 'portfolio_selection', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2');

-- Create a database user with owner role permissions
-- CREATE USER owner_user WITH PASSWORD 'change_this_password';
-- GRANT owner_role TO owner_user;
