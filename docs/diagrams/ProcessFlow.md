# Process Flow Documentation

This document details the user workflows and process flows for the PrimePM system, with a focus on the Portfolio Selection and Committee Review processes.

## General User Workflows

### User Workflows (user_workflows.png)
![User Workflows](user_workflows.png)

```mermaid
flowchart TD
    subgraph "Authentication Flow"
        Login[User Login]
        Auth[Authentication]
        Session[Session Management]
        Roles[Role-Based Access]
        
        Login --> Auth
        Auth --> Session
        Session --> Roles
    end
    
    subgraph "PMO Workflow"
        CriteriaSetup[Create/Edit Criteria]
        WeightConfig[Configure Weights]
        Publish[Publish Criteria]
        Monitor[Monitor Submissions]
        CreatePortfolio[Create Portfolio Selection]
        
        CriteriaSetup --> WeightConfig
        WeightConfig --> Publish
        Publish --> Monitor
        Monitor --> CreatePortfolio
    end
    
    subgraph "Project Manager Workflow"
        Submit[Submit Project]
        Info[Enter Project Info]
        SelfAssess[Self-Assessment]
        ViewResults[View Results]
        
        Submit --> Info
        Info --> SelfAssess
        SelfAssess --> ViewResults
    end
    
    subgraph "Committee Workflow"
        ReviewProjects[Review Projects]
        EvaluateCriteria[Evaluate Criteria]
        SubmitScores[Submit Scores]
        ReviewAggregates[Review Aggregated Scores]
        
        ReviewProjects --> EvaluateCriteria
        EvaluateCriteria --> SubmitScores
        SubmitScores --> ReviewAggregates
    end
    
    subgraph "Management Workflow"
        SetConstraints[Set Constraints]
        CreateSimulations[Create Portfolio Simulations]
        RunSimulation[Run Simulations]
        CompareResults[Compare Simulation Results]
        SelectSimulation[Select Final Simulation]
        FinalizePortfolio[Finalize Portfolio]
        ExportReports[Export Reports]
        
        SetConstraints --> CreateSimulations
        CreateSimulations --> RunSimulation
        RunSimulation --> CompareResults
        CompareResults --> SelectSimulation
        SelectSimulation --> FinalizePortfolio
        FinalizePortfolio --> ExportReports
    end
    
    %% Cross-workflow connections
    Publish -->|Criteria Available| Submit
    SelfAssess -->|Scores Available| ReviewProjects
    ReviewAggregates -->|Final Scores| SetConstraints
    CreatePortfolio -->|Portfolio Created| ReviewProjects
    FinalizePortfolio -->|Projects Selected| ViewResults
```

## Portfolio Selection Process

### Portfolio Selection Lifecycle (portfolio_lifecycle.png)

```mermaid
flowchart TD
    %% Main process flow
    A[Portfolio Creation] --> B[Project Submission]
    B --> C[Committee Review]
    C --> D1[Portfolio Simulation]
    D1 --> D2[Portfolio Selection]
    D2 --> E[Portfolio Activation]
    E --> F[Project Execution]
    F --> G[Portfolio Closure]
    G --> H[New Cycle]
    H --> A
    
    %% Detailed stages
    subgraph "1. Portfolio Creation"
        A1[PMO creates new portfolio selection]
        A2[Set criteria version]
        A3[Define deadlines]
        
        A1 --> A2 --> A3
    end
    
    subgraph "2. Project Submission"
        B1[PMs submit new projects]
        B2[Complete self-assessment]
        
        B1 --> B2
    end
    
    subgraph "3. Committee Review"
        C1[Create review sessions]
        C2[Committee members score projects]
        C3[Save scores with comments]
        C4[Calculate aggregate scores]
        
        C1 --> C2 --> C3 --> C4
    end
    
    subgraph "4. Portfolio Selection Process"
        D1A[Create portfolio simulations]
        D1B[Add projects to simulations]
        D1C[Evaluate constraints]
        D1D[Compare simulation results]
        D1E[Select final simulation]
        D1F[Apply to project portfolioStatus]
        
        D1A --> D1B --> D1C --> D1D --> D1E --> D1F
    end
    
    subgraph "5. Portfolio Activation"
        E1[Mark portfolio as active]
        E2[Update project statuses]
        
        E1 --> E2
    end
    
    subgraph "6. Project Execution"
        F1[Projects move to In Progress]
        F2[Monitor and track projects]
        
        F1 --> F2
    end
    
    subgraph "7. Portfolio Closure"
        G1[Complete projects]
        G2[Archive portfolio]
        
        G1 --> G2
    end
    
    D1 -.-> D1A
```

### Portfolio Status Transitions (portfolio_status_transitions.png)

```mermaid
stateDiagram-v2
    [*] --> Planning: Create new portfolio
    
    Planning --> Open: Open for submissions
    Open --> Scoring: Close submissions
    Scoring --> Selection: Complete committee scoring
    Selection --> Active: Finalize portfolio
    Active --> Closed: Complete all projects
    Closed --> Archived: Start new cycle
    
    state "Project Status Flow" as ProjectFlow {
        [*] --> Proposed: Submit project
        Proposed --> Selected: Include in portfolio
        Proposed --> Rejected: Exclude from portfolio
        Selected --> InProgress: Start work
        InProgress --> Completed: Finish work
        InProgress --> Cancelled: Terminate early
    }
    
    Open --> ProjectFlow: Projects submitted
    Selection --> ProjectFlow: Projects selected
```

## Committee Review Process

### Committee Review Workflow (committee_review_workflow.png)

```mermaid
flowchart TD
    A[Committee Login] --> B[Committee Dashboard]
    B --> C[Project List View]
    C --> D[Select Project]
    D --> E[Review Project Details]
    E --> F[Score Project]
    F --> G[Submit Scores]
    G --> H[Confirmation]
    H --> C
    
    C --> I[Filter Projects]
    I --> C
    
    C --> J[View Progress/Stats]
    J --> C
    
    subgraph "Project Scoring Interface"
        F1[View Criteria List]
        F2[Score Each Criterion]
        F3[Add Comments]
        F4[Save Draft]
        F5[Submit Final Scores]
        
        F1 --> F2
        F2 --> F3
        F3 --> F4
        F4 --> F2
        F3 --> F5
    end
    
    F -.-> F1
```

## Detailed Process Descriptions

### 1. Portfolio Creation Stage

**Actors**: PMO (Portfolio Management Office)

**Process**:
1. PMO creates a new PortfolioSelection record with:
   - Name, description, version, year
   - Status = 'Planning'
   - Start and end dates
   - Submission and scoring deadlines
2. PMO links the appropriate CriteriaVersion to be used for this selection cycle
3. PMO configures any constraints or requirements for the portfolio

**Database Impact**:
- New PortfolioSelection record created
- Status set to 'Planning'

**UI Components**:
- Portfolio creation form
- Criteria version selector
- Date pickers for deadlines

### 2. Project Submission Stage

**Actors**: Project Managers, PMO

**Process**:
1. PMO changes portfolio status to 'Open'
2. Project Managers submit new projects or update existing ones
3. Each project is linked to the current portfolio selection
4. Project Managers complete self-assessment for each criterion
5. Projects are marked with portfolioStatus = 'Proposed'

**Database Impact**:
- PortfolioSelection status updated to 'Open'
- New Project records created
- ProjectCriteriaScore records created for self-assessment
- Projects linked to current portfolio via portfolioSelectionId
- Projects marked with portfolioStatus = 'Proposed'

**UI Components**:
- Project submission form
- Self-assessment interface
- Project list view with submission status

### 3. Committee Review Stage

**Actors**: Committee Members, PMO

**Process**:
1. PMO changes portfolio status to 'Scoring'
2. PMO creates CommitteeReviewSession(s)
3. Committee members review projects and their self-assessments
4. Committee members score each criterion for each project
5. Scores can be saved as drafts and later submitted
6. Once all scores are submitted, aggregate scores are calculated

**Database Impact**:
- PortfolioSelection status updated to 'Scoring'
- CommitteeReviewSession records created
- CommitteeScore records created for each score
- CommitteeScore status transitions: DRAFT → SUBMITTED → APPROVED

**UI Components**:
- Committee dashboard
- Project list for committee
- Scoring interface with card-based selection
- Progress tracking for committee members

### 4. Portfolio Simulation Stage

**Actors**: Management, PMO

**Process**:
1. PMO changes portfolio status to 'Selection'
2. Management defines constraints (budget limits, resource caps, etc.)
3. Multiple portfolio simulations are created with different parameters
4. Projects are added to simulations and marked as selected or not
5. Simulations are run and results compared
6. Management selects the final simulation

**Database Impact**:
- PortfolioSelection status updated to 'Selection'
- PortfolioSimulation records created
- PortfolioSimulationProject records created
- One simulation marked with isSelected = true

**UI Components**:
- Simulation creation interface
- Constraint definition form
- Simulation comparison view
- Project selection matrix

### 5. Portfolio Activation Stage

**Actors**: Management, PMO

**Process**:
1. PMO changes portfolio status to 'Active'
2. Selected projects are marked with portfolioStatus = 'Selected'
3. Non-selected projects are marked with portfolioStatus = 'Rejected'
4. The portfolio becomes the active portfolio for the organization

**Database Impact**:
- PortfolioSelection status updated to 'Active'
- PortfolioSelection isActive set to true
- Project portfolioStatus updated to 'Selected' or 'Rejected'

**UI Components**:
- Portfolio activation confirmation
- Portfolio summary view
- Project status dashboard

### 6. Project Execution Stage

**Actors**: Project Managers, PMO

**Process**:
1. Selected projects move to portfolioStatus = 'In Progress'
2. Project Managers update project status as work progresses
3. PMO monitors overall portfolio progress

**Database Impact**:
- Project portfolioStatus updated to 'In Progress'
- Project status updated throughout execution

**UI Components**:
- Project tracking dashboard
- Status update forms
- Portfolio progress visualization

### 7. Portfolio Closure Stage

**Actors**: PMO

**Process**:
1. As projects complete, they are marked with portfolioStatus = 'Completed'
2. Projects that are terminated early are marked with portfolioStatus = 'Cancelled'
3. Once all projects are either Completed or Cancelled, the portfolio can be closed
4. PMO changes portfolio status to 'Closed'

**Database Impact**:
- Project portfolioStatus updated to 'Completed' or 'Cancelled'
- PortfolioSelection status updated to 'Closed'
- PortfolioSelection isActive set to false

**UI Components**:
- Portfolio closure confirmation
- Final portfolio report generation

### 8. New Cycle Initiation

**Actors**: PMO

**Process**:
1. Previous portfolio is archived (status = 'Archived')
2. New portfolio selection cycle is created
3. Process begins again at Portfolio Creation stage

**Database Impact**:
- Previous PortfolioSelection status updated to 'Archived'
- New PortfolioSelection record created

**UI Components**:
- Portfolio archival confirmation
- New cycle creation form

## Multi-Year Portfolio Management

The system supports managing multiple portfolio selection cycles simultaneously:

```mermaid
flowchart TD
    subgraph "Year 1 Portfolio"
        Y1P[Portfolio Selection]
        Y1P1[Project 1: Selected]
        Y1P2[Project 2: Selected]
        Y1P3[Project 3: Rejected]
        
        Y1P --> Y1P1
        Y1P --> Y1P2
        Y1P --> Y1P3
    end
    
    subgraph "Year 2 Portfolio"
        Y2P[Portfolio Selection]
        Y2P1[Project 4: Proposed]
        Y2P2[Project 5: Proposed]
        Y2P3[Project 1: In Progress]
        
        Y2P --> Y2P1
        Y2P --> Y2P2
        Y2P --> Y2P3
    end
    
    Y1P1 -.-> Y2P3
```

This allows:
1. Tracking projects across multiple years
2. Continuing projects from previous portfolios
3. Historical reporting across portfolio cycles
4. Comparing performance year-over-year
