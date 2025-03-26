# Entity Relationship Documentation

This document details the entity relationships and database schema for the PrimePM system, with a focus on the Portfolio Selection and Committee Review components.

## Entity Relationship Diagram

### Portfolio Selection Entity Relationship (portfolio_entity_relationship.png)

```mermaid
erDiagram
    Organization ||--o{ PortfolioSelection : "organizes"
    Organization ||--o{ Department : "contains"
    Organization ||--o{ User : "employs"
    Organization ||--o{ CriteriaVersion : "defines"
    
    PortfolioSelection ||--o{ Project : "contains"
    PortfolioSelection ||--o{ CommitteeReviewSession : "schedules"
    PortfolioSelection ||--|| CriteriaVersion : "uses"
    PortfolioSelection ||--o{ PortfolioSimulation : "has"
    
    PortfolioSimulation ||--o{ PortfolioSimulationProject : "includes"
    
    Department ||--o{ Project : "owns"
    Department ||--o{ User : "associates"
    
    User ||--o{ CommitteeScore : "submits"
    User ||--o{ Project : "creates"
    
    CriteriaVersion ||--o{ Criterion : "includes"
    
    Criterion ||--o{ ProjectCriteriaScore : "evaluated in"
    Criterion ||--o{ CommitteeScore : "evaluated in"
    
    Project ||--o{ ProjectCriteriaScore : "receives"
    Project ||--o{ CommitteeScore : "receives"
    Project ||--o{ PortfolioSimulationProject : "included in"
    
    CommitteeReviewSession ||--o{ CommitteeScore : "collects"
    
    PortfolioSelection {
        string id PK
        string organizationId FK
        string name
        string description
        string version
        string status "Planning, Open, Scoring, Selection, Active, Closed, Archived"
        datetime selectionDate
        json constraints
        boolean isActive
        int year
        datetime startDate
        datetime endDate
        datetime submissionDeadline
        datetime scoringDeadline
        string criteriaVersionId FK
    }
    
    PortfolioSimulation {
        string id PK
        string portfolioSelectionId FK
        string name
        string description
        json constraints
        boolean isSelected
    }
    
    PortfolioSimulationProject {
        string id PK
        string simulationId FK
        string projectId FK
        boolean isSelected
        float score
    }
    
    Project {
        string id PK
        string organizationId FK
        string departmentId FK
        string portfolioSelectionId FK
        string name
        string description
        string status
        string portfolioStatus "Proposed, Selected, In Progress, Completed, Cancelled"
        datetime startDate
        datetime endDate
        float budget
        int resources
        string[] tags
        float score
    }
    
    CommitteeReviewSession {
        string id PK
        string organizationId FK
        string portfolioSelectionId FK
        string name
        string description
        datetime startDate
        datetime endDate
        string status "Active, Completed, Cancelled"
    }
    
    CommitteeScore {
        string id PK
        string projectId FK
        string criterionId FK
        string userId FK
        string sessionId FK
        string portfolioSelectionId FK
        float score
        string comment
        string status "Draft, Submitted, Approved"
    }
}
```

## Database Schema Changes

The following SQL migration script defines the changes needed to implement the Portfolio Selection and Committee Review functionality:

```sql
-- Add portfolioStatus field to Project table
ALTER TABLE projects 
ADD COLUMN portfolio_status VARCHAR(50),
ADD COLUMN portfolio_selection_id UUID REFERENCES portfolio_selections(id);

-- Create CommitteeReviewSession table
CREATE TABLE committee_review_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  portfolio_selection_id UUID NOT NULL REFERENCES portfolio_selections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Add status and portfolioSelectionId fields to CommitteeScore table
ALTER TABLE committee_scores
ADD COLUMN status VARCHAR(50) DEFAULT 'DRAFT',
ADD COLUMN portfolio_selection_id UUID REFERENCES portfolio_selections(id),
ADD COLUMN session_id UUID REFERENCES committee_review_sessions(id);

-- Enhance PortfolioSelection table with cycle fields
ALTER TABLE portfolio_selections
ADD COLUMN year INT,
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE,
ADD COLUMN submission_deadline DATE,
ADD COLUMN scoring_deadline DATE,
ADD COLUMN criteria_version_id UUID REFERENCES criteria_versions(id);

-- Create PortfolioSimulation table
CREATE TABLE portfolio_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_selection_id UUID NOT NULL REFERENCES portfolio_selections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  constraints JSONB,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create PortfolioSimulationProject table (renamed from PortfolioProject)
CREATE TABLE portfolio_simulation_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES portfolio_simulations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_selected BOOLEAN DEFAULT FALSE,
  score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_projects_portfolio_selection ON projects(portfolio_selection_id);
CREATE INDEX idx_projects_portfolio_status ON projects(portfolio_status);
CREATE INDEX idx_committee_scores_portfolio ON committee_scores(portfolio_selection_id);
CREATE INDEX idx_committee_scores_session ON committee_scores(session_id);
CREATE INDEX idx_committee_scores_status ON committee_scores(status);
CREATE INDEX idx_portfolio_simulations_selection ON portfolio_simulations(portfolio_selection_id);
CREATE INDEX idx_portfolio_simulation_projects_simulation ON portfolio_simulation_projects(simulation_id);
CREATE INDEX idx_portfolio_simulation_projects_project ON portfolio_simulation_projects(project_id);
CREATE INDEX idx_committee_review_sessions_portfolio ON committee_review_sessions(portfolio_selection_id);
```

## Prisma Schema Updates

The following updates to the Prisma schema reflect the database changes:

```prisma
// Enhanced PortfolioSelection model
model PortfolioSelection {
  id                String             @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  organizationId    String             @map("organization_id") @db.Uuid
  name              String             @db.VarChar(255)
  description       String?
  version           String             @db.VarChar(50)
  status            String             @db.VarChar(50) // "Planning", "Open", "Scoring", "Selection", "Active", "Closed", "Archived"
  selectionDate     DateTime           @map("selection_date") @db.Date
  constraints       Json?
  isActive          Boolean?           @default(false) @map("is_active")
  year              Int                // Fiscal or calendar year
  startDate         DateTime           @map("start_date") @db.Date
  endDate           DateTime           @map("end_date") @db.Date
  submissionDeadline DateTime?         @map("submission_deadline") @db.Date
  scoringDeadline   DateTime?          @map("scoring_deadline") @db.Date
  criteriaVersionId String?            @map("criteria_version_id") @db.Uuid
  
  // Existing timestamps and audit
  createdAt         DateTime?          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime?          @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdById       String             @map("created_by") @db.Uuid
  updatedById       String?            @map("updated_by") @db.Uuid
  
  // Relationships
  portfolioSimulations PortfolioSimulation[]
  projects          Project[]
  committeeReviewSessions CommitteeReviewSession[]
  committeeScores   CommitteeScore[]
  createdBy         User               @relation("PortfolioCreatedBy", fields: [createdById], references: [id])
  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  updatedBy         User?              @relation("PortfolioUpdatedBy", fields: [updatedById], references: [id])
  criteriaVersion   CriteriaVersion?   @relation(fields: [criteriaVersionId], references: [id])

  @@map("portfolio_selections")
}

// New PortfolioSimulation model
model PortfolioSimulation {
  id                 String                     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  portfolioSelectionId String                   @map("portfolio_selection_id") @db.Uuid
  name               String                     @db.VarChar(255)
  description        String?
  constraints        Json?
  isSelected         Boolean                    @default(false) @map("is_selected")
  createdAt          DateTime?                  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime?                  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdById        String                     @map("created_by") @db.Uuid
  updatedById        String?                    @map("updated_by") @db.Uuid
  
  simulationProjects PortfolioSimulationProject[]
  portfolioSelection PortfolioSelection         @relation(fields: [portfolioSelectionId], references: [id], onDelete: Cascade)
  createdBy          User                       @relation("SimulationCreatedBy", fields: [createdById], references: [id])
  updatedBy          User?                      @relation("SimulationUpdatedBy", fields: [updatedById], references: [id])

  @@map("portfolio_simulations")
}

// Renamed PortfolioSimulationProject model (previously PortfolioProject)
model PortfolioSimulationProject {
  id               String                @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  simulationId     String                @map("simulation_id") @db.Uuid
  projectId        String                @map("project_id") @db.Uuid
  isSelected       Boolean               @default(false) @map("is_selected")
  score            Float
  createdAt        DateTime?             @default(now()) @map("created_at") @db.Timestamptz(6)
  
  simulation       PortfolioSimulation   @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  project          Project               @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("portfolio_simulation_projects")
}

// Enhanced Project model
model Project {
  // Existing fields
  id                String                     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  organizationId    String                     @map("organization_id") @db.Uuid
  departmentId      String?                    @map("department_id") @db.Uuid
  name              String                     @db.VarChar(255)
  description       String?
  status            String                     @db.VarChar(50)
  startDate         DateTime                   @map("start_date") @db.Date
  endDate           DateTime                   @map("end_date") @db.Date
  budget            Float?
  resources         Int
  tags              String[]
  score             Float?                     @map("score")
  
  // New fields for portfolio relationship
  portfolioSelectionId String?                 @map("portfolio_selection_id") @db.Uuid
  portfolioStatus     String?                  @map("portfolio_status") @db.VarChar(50) // "Proposed", "Selected", "In Progress", "Completed", "Cancelled"
  
  // Existing timestamps and audit
  createdAt          DateTime?                 @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime?                 @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdById        String                    @map("created_by") @db.Uuid
  updatedById        String?                   @map("updated_by") @db.Uuid
  
  // Relationships
  committeeScores    CommitteeScore[]
  simulationProjects PortfolioSimulationProject[]
  projectScores      ProjectCriteriaScore[]
  
  createdBy          User                      @relation("ProjectCreatedBy", fields: [createdById], references: [id])
  department         Department?               @relation(fields: [departmentId], references: [id])
  organization       Organization              @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  updatedBy          User?                     @relation("ProjectUpdatedBy", fields: [updatedById], references: [id])
  portfolioSelection PortfolioSelection?       @relation(fields: [portfolioSelectionId], references: [id])

  @@map("projects")
}

// New CommitteeReviewSession model
model CommitteeReviewSession {
  id              String             @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  organizationId  String             @map("organization_id") @db.Uuid
  portfolioSelectionId String        @map("portfolio_selection_id") @db.Uuid
  name            String             @db.VarChar(255)
  description     String?
  startDate       DateTime           @map("start_date") @db.Date
  endDate         DateTime           @map("end_date") @db.Date
  status          String             @db.VarChar(50) // "Active", "Completed", "Cancelled"
  createdAt       DateTime?          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime?          @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdById     String             @map("created_by") @db.Uuid
  updatedById     String?            @map("updated_by") @db.Uuid
  
  organization    Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  portfolioSelection PortfolioSelection @relation(fields: [portfolioSelectionId], references: [id])
  createdBy       User               @relation("SessionCreatedBy", fields: [createdById], references: [id])
  updatedBy       User?              @relation("SessionUpdatedBy", fields: [updatedById], references: [id])
  committeeScores CommitteeScore[]

  @@map("committee_review_sessions")
}

// Enhanced CommitteeScore model
model CommitteeScore {
  id                 String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  projectId          String    @map("project_id") @db.Uuid
  criterionId        String    @map("criterion_id") @db.Uuid
  userId             String    @map("user_id") @db.Uuid
  sessionId          String?   @map("session_id") @db.Uuid
  portfolioSelectionId String? @map("portfolio_selection_id") @db.Uuid
  score              Float
  comment            String?
  status             String    @default("DRAFT") @db.VarChar(50) // "DRAFT", "SUBMITTED", "APPROVED"
  createdAt          DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  createdById        String    @map("created_by") @db.Uuid
  updatedById        String?   @map("updated_by") @db.Uuid
  
  createdBy          User      @relation("CommitteeScoreCreatedBy", fields: [createdById], references: [id])
  criterion          Criterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)
  project            Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  updatedBy          User?     @relation("CommitteeScoreUpdatedBy", fields: [updatedById], references: [id])
  user               User      @relation("CommitteeScoresByUser", fields: [userId], references: [id], onDelete: Cascade)
  session            CommitteeReviewSession? @relation(fields: [sessionId], references: [id])
  portfolioSelection PortfolioSelection? @relation(fields: [portfolioSelectionId], references: [id])

  @@map("committee_scores")
}
```

## Key Entity Relationships

1. **PortfolioSelection**
   - Central entity for managing portfolio selection cycles
   - Contains timeline information (startDate, endDate, submissionDeadline, scoringDeadline)
   - Tracks status through the selection lifecycle
   - Links to the criteria version used for evaluation

2. **Project**
   - Links to a specific PortfolioSelection via portfolioSelectionId
   - Tracks its status within the portfolio via portfolioStatus
   - Can be included in multiple portfolio simulations

3. **PortfolioSimulation**
   - Represents a "what-if" scenario for portfolio selection
   - Belongs to a specific PortfolioSelection
   - Contains constraints used for the simulation
   - One simulation can be marked as selected (isSelected = true)

4. **PortfolioSimulationProject**
   - Junction table linking projects to simulations
   - Tracks which projects are selected in each simulation
   - Stores simulation-specific scores

5. **CommitteeReviewSession**
   - Represents a period when committee members review projects
   - Linked to a specific PortfolioSelection
   - Has start and end dates for the review period

6. **CommitteeScore**
   - Records a committee member's evaluation of a project criterion
   - Links to a specific CommitteeReviewSession and PortfolioSelection
   - Tracks status of the score (DRAFT, SUBMITTED, APPROVED)
