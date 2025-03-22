-- Seed data script for PrimePM database in Supabase (Part 4: Portfolios)
-- Run this script after seed_03_projects.sql

-- Project Criteria Scores for Acme's Supply Chain Optimization
INSERT INTO project_criteria_scores (id, project_id, criterion_id, version_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '88888888-8888-8888-8888-888888888888', 8, 'Significant cost savings expected', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  (uuid_generate_v4(), 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', '88888888-8888-8888-8888-888888888888', 5, 'Moderate alignment with overall strategy', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  (uuid_generate_v4(), 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', '88888888-8888-8888-8888-888888888888', 4, 'Moderate investment required', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  (uuid_generate_v4(), 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', '88888888-8888-8888-8888-888888888888', 3, 'Significant operations resources needed', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  (uuid_generate_v4(), 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', '88888888-8888-8888-8888-888888888888', 4, 'Moderate complexity involving multiple vendors', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Project Criteria Scores for TechInnovate's AI Assistant
INSERT INTO project_criteria_scores (id, project_id, criterion_id, version_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '99999999-9999-9999-9999-999999999999', 8, 'Innovative implementation of AI technology', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '99999999-9999-9999-9999-999999999999', 7, 'Strong market demand for AI assistants', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '99999999-9999-9999-9999-999999999999', 4, 'Moderate development cost', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '99999999-9999-9999-9999-999999999999', 4, 'Moderate timeline to market', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  (uuid_generate_v4(), 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', '99999999-9999-9999-9999-999999999999', 3, 'Some technical risk with AI integration', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Project Criteria Scores for TechInnovate's Smart Office
INSERT INTO project_criteria_scores (id, project_id, criterion_id, version_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '99999999-9999-9999-9999-999999999999', 9, 'Highly innovative product line', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (uuid_generate_v4(), 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '99999999-9999-9999-9999-999999999999', 8, 'Excellent market fit with growing demand', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (uuid_generate_v4(), 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '99999999-9999-9999-9999-999999999999', 2, 'Expensive development costs', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (uuid_generate_v4(), 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '99999999-9999-9999-9999-999999999999', 3, 'Longer timeline to market', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (uuid_generate_v4(), 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', '99999999-9999-9999-9999-999999999999', 2, 'Higher technical risk with new technologies', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff');

-- Committee Scores for Digital Transformation Initiative
INSERT INTO committee_scores (id, project_id, criterion_id, user_id, score, comment, created_by, updated_by) VALUES
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 8, 'Strong revenue potential', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 9, 'Excellent policy alignment', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 'Very expensive project', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 'High resource requirements', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  (uuid_generate_v4(), 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 'Complex implementation but manageable', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Create Portfolio Selection for Acme Corp
INSERT INTO portfolio_selections (id, organization_id, name, description, version, status, selection_date, constraints, is_active, created_by, updated_by) VALUES
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '11111111-1111-1111-1111-111111111111', '2025 Strategic Projects', 'Primary portfolio for 2025 fiscal year with focus on digital transformation', '1.0', 'final', '2025-01-01', '{"budgetLimit": 3000000, "resourceLimit": 6000}', TRUE, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Create Portfolio Projects
INSERT INTO portfolio_projects (id, portfolio_id, project_id, is_selected, score) VALUES
  (uuid_generate_v4(), 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', TRUE, 7.2),
  (uuid_generate_v4(), 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', TRUE, 6.1),
  (uuid_generate_v4(), 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', FALSE, 5.4);

-- Create Portfolio Selection for TechInnovate
INSERT INTO portfolio_selections (id, organization_id, name, description, version, status, selection_date, constraints, is_active, created_by, updated_by) VALUES
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '22222222-2222-2222-2222-222222222222', '2025 Product Development', 'Portfolio for 2025 product development initiatives', '1.0', 'final', '2025-01-15', '{"budgetLimit": 2500000, "resourceLimit": 4500}', TRUE, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Create Portfolio Projects for TechInnovate
INSERT INTO portfolio_projects (id, portfolio_id, project_id, is_selected, score) VALUES
  (uuid_generate_v4(), 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', TRUE, 6.8),
  (uuid_generate_v4(), 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', FALSE, 5.9);

-- Create Audit Logs for initial actions
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, created_at) VALUES
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'organization', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 day'),
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'organization', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '30 day'),
  (uuid_generate_v4(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CREATE', 'criteria_version', '88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '28 day'),
  (uuid_generate_v4(), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'CREATE', 'criteria_version', '99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '28 day'),
  (uuid_generate_v4(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CREATE', 'project', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', NOW() - INTERVAL '25 day'),
  (uuid_generate_v4(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'UPDATE', 'project', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', NOW() - INTERVAL '20 day'),
  (uuid_generate_v4(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CREATE', 'portfolio_selection', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', NOW() - INTERVAL '15 day');
