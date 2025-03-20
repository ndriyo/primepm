-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create owner role with full access
CREATE ROLE owner_role;

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  roles TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Add foreign key constraints for created_by and updated_by in organizations
ALTER TABLE organizations 
  ADD CONSTRAINT fk_organizations_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE organizations 
  ADD CONSTRAINT fk_organizations_updated_by 
  FOREIGN KEY (updated_by) REFERENCES users(id);

-- Add foreign key constraints for created_by and updated_by in departments
ALTER TABLE departments 
  ADD CONSTRAINT fk_departments_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE departments 
  ADD CONSTRAINT fk_departments_updated_by 
  FOREIGN KEY (updated_by) REFERENCES users(id);

-- Add foreign key constraints for created_by and updated_by in users
ALTER TABLE users 
  ADD CONSTRAINT fk_users_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE users 
  ADD CONSTRAINT fk_users_updated_by 
  FOREIGN KEY (updated_by) REFERENCES users(id);

-- Criteria Versions table
CREATE TABLE criteria_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Criteria table
CREATE TABLE criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES criteria_versions(id) ON DELETE CASCADE,
  key VARCHAR(50) NOT NULL, 
  label VARCHAR(255) NOT NULL,
  description TEXT,
  is_inverse BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  weight FLOAT,
  scale JSONB,
  rubric JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Pairwise Comparisons table
CREATE TABLE pairwise_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES criteria_versions(id) ON DELETE CASCADE,
  criterion_a_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  criterion_b_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  value FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget FLOAT,
  resources INTEGER NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Project Criteria Scores table
CREATE TABLE project_criteria_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES criteria_versions(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Committee Scores table
CREATE TABLE committee_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Portfolio Selections table
CREATE TABLE portfolio_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  selection_date DATE NOT NULL,
  constraints JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Portfolio Projects table
CREATE TABLE portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolio_selections(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_selected BOOLEAN DEFAULT FALSE,
  score FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create functions for auto-updating 'updated_at' columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_departments_timestamp BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_criteria_versions_timestamp BEFORE UPDATE ON criteria_versions
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_criteria_timestamp BEFORE UPDATE ON criteria
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_project_criteria_scores_timestamp BEFORE UPDATE ON project_criteria_scores
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_committee_scores_timestamp BEFORE UPDATE ON committee_scores
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_portfolio_selections_timestamp BEFORE UPDATE ON portfolio_selections
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairwise_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create a 'bypass_rls' role for administrative access
CREATE ROLE bypass_rls;
GRANT bypass_rls TO owner_role;

-- Create policies for 'owner_role' to bypass RLS
CREATE POLICY owner_bypass ON organizations TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON departments TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON users TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON criteria_versions TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON criteria TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON pairwise_comparisons TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON projects TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON project_criteria_scores TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON committee_scores TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON portfolio_selections TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON portfolio_projects TO bypass_rls USING (true);
CREATE POLICY owner_bypass ON audit_logs TO bypass_rls USING (true);

-- Organization access policy - users can only see their organization
CREATE POLICY organization_access ON organizations
  USING (id IN (SELECT organization_id FROM users WHERE users.id = current_user_id()));

-- Department access policy - users can only see departments in their organization
CREATE POLICY department_access ON departments
  USING (organization_id IN (SELECT organization_id FROM users WHERE users.id = current_user_id()));

-- User access policy - users can only see users in their organization
CREATE POLICY user_access ON users
  USING (organization_id IN (SELECT organization_id FROM users WHERE users.id = current_user_id()));

-- Project access policy - basic read access for all organization members
CREATE POLICY project_access ON projects
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM users WHERE users.id = current_user_id()
  ));

-- Project modify policy - only Project Managers, PMO and creators can modify
CREATE POLICY project_modify ON projects
  FOR UPDATE USING (
    created_by = current_user_id() OR 
    current_user_id() IN (
      SELECT id FROM users 
      WHERE organization_id = projects.organization_id 
      AND (
        'PMO' = ANY(roles) OR 
        'Management' = ANY(roles)
      )
    )
  );

-- Grant all privileges to owner_role
GRANT ALL PRIVILEGES ON DATABASE primepm TO owner_role;
GRANT ALL PRIVILEGES ON SCHEMA public TO owner_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO owner_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO owner_role;

-- Create a generic function to get current user ID (to be implemented in application code)
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
