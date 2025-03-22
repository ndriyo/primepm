-- Seed data script for PrimePM database in Supabase (Part 2: Criteria)
-- Run this script after seed_01_organizations_users.sql

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

-- Pairwise Comparisons for TechInnovate (additional data to showcase more examples)
INSERT INTO pairwise_comparisons (id, version_id, criterion_a_id, criterion_b_id, value) VALUES
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 1),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 3),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 3),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 3),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 2),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 2),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 2),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 1),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 1),
  (uuid_generate_v4(), '99999999-9999-9999-9999-999999999999', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 1);
