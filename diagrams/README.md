# Diagram Generation Instructions

This directory contains the diagram source code and images for the PrimePM system architecture.

## How to Generate Images

1. Copy the Mermaid code for each diagram below
2. Visit [Mermaid Live Editor](https://mermaid.live/)
3. Paste the code into the editor
4. Use the "Export" button to download as PNG or SVG
5. Save the image in this directory with the appropriate filename

## Diagram Source Code

### System Architecture (system_architecture.png)

```mermaid
flowchart TD
    subgraph "Client Layer"
        Browser["Web Browser"]
        
        subgraph "UI Components"
            Pages["Pages (Next.js)"]
            Components["React Components"]
            TailwindCSS["Tailwind CSS"]
            UI["21st dev UI Library"]
        end
    end
    
    subgraph "Server Layer"
        NextJS["Next.js Server"]
        
        subgraph "API Routes"
            AuthAPI["Authentication APIs"]
            ProjectAPI["Project APIs"]
            CriteriaAPI["Criteria APIs"]
            PortfolioAPI["Portfolio APIs"]
            ReportAPI["Reporting APIs"]
        end
        
        subgraph "Business Logic"
            AuthLogic["Authentication Logic"]
            ProjectLogic["Project Management"]
            CriteriaLogic["Criteria Management"]
            ScoringLogic["Scoring Logic"]
            PortfolioLogic["Portfolio Simulation"]
        end
    end
    
    subgraph "Database Layer"
        PostgreSQL["Supabase PostgreSQL"]
        
        subgraph "Data Models"
            OrgModel["Organizations"]
            UserModel["Users"]
            DeptModel["Departments"]
            CriteriaModel["Criteria & Versions"]
            ProjectModel["Projects"]
            ScoreModel["Scores (Self & Committee)"]
            PortfolioModel["Portfolio Selections"]
            AuditModel["Audit Logs"]
        end
    end
    
    subgraph "Authentication"
        NextAuth["NextAuth.js"]
        OAuth["OAuth Providers (Google, Microsoft)"]
        EmailAuth["Email/Password"]
    end
    
    %% Client to Server connections
    Browser -->|HTTP/HTTPS| NextJS
    
    %% UI Component relationships
    Browser --> Pages
    Pages --> Components
    Components --> TailwindCSS
    Components --> UI
    
    %% Server to API routes
    NextJS --> AuthAPI
    NextJS --> ProjectAPI
    NextJS --> CriteriaAPI
    NextJS --> PortfolioAPI
    NextJS --> ReportAPI
    
    %% API to Business Logic
    AuthAPI --> AuthLogic
    ProjectAPI --> ProjectLogic
    CriteriaAPI --> CriteriaLogic
    ProjectAPI --> ScoringLogic
    CriteriaAPI --> ScoringLogic
    PortfolioAPI --> PortfolioLogic
    
    %% Business Logic to Database
    AuthLogic --> PostgreSQL
    ProjectLogic --> PostgreSQL
    CriteriaLogic --> PostgreSQL
    ScoringLogic --> PostgreSQL
    PortfolioLogic --> PostgreSQL
    
    %% Database to Models
    PostgreSQL --> OrgModel
    PostgreSQL --> UserModel
    PostgreSQL --> DeptModel
    PostgreSQL --> CriteriaModel
    PostgreSQL --> ProjectModel
    PostgreSQL --> ScoreModel
    PostgreSQL --> PortfolioModel
    PostgreSQL --> AuditModel
    
    %% Authentication connections
    AuthAPI --> NextAuth
    NextAuth --> OAuth
    NextAuth --> EmailAuth
    
    %% Multi-tenancy enforcement
    AuthLogic -->|Tenant Isolation| PostgreSQL
```

### User Workflows (user_workflows.png)

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
        
        CriteriaSetup --> WeightConfig
        WeightConfig --> Publish
        Publish --> Monitor
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
        RunSimulation[Run Portfolio Simulation]
        SelectProjects[Select Projects]
        FinalizePortfolio[Finalize Portfolio]
        ExportReports[Export Reports]
        
        SetConstraints --> RunSimulation
        RunSimulation --> SelectProjects
        SelectProjects --> FinalizePortfolio
        FinalizePortfolio --> ExportReports
    end
    
    %% Cross-workflow connections
    Publish -->|Criteria Available| Submit
    SelfAssess -->|Scores Available| ReviewProjects
    ReviewAggregates -->|Final Scores| SetConstraints
```

### Data Flow (data_flow.png)

```mermaid
flowchart TD
    subgraph "Frontend (Next.js)"
        FE_Pages[Pages & Components]
        FE_State[Client State]
        FE_Forms[Forms & Inputs]
    end
    
    subgraph "API Layer (Next.js API Routes)"
        API_Auth[Auth Endpoints]
        API_Projects[Project Endpoints]
        API_Criteria[Criteria Endpoints]
        API_Scoring[Scoring Endpoints]
        API_Portfolio[Portfolio Endpoints]
    end
    
    subgraph "Business Logic"
        BL_Auth[Auth Service]
        BL_Projects[Project Service]
        BL_Criteria[Criteria Service]
        BL_Scoring[Scoring Service]
        BL_Portfolio[Portfolio Service]
        BL_Reports[Reporting Service]
    end
    
    subgraph "Data Access"
        DA_Repositories[Repositories]
        DA_Prisma[Prisma Client]
    end
    
    subgraph "Database (Supabase PostgreSQL)"
        DB_Organizations[Organizations]
        DB_Users[Users]
        DB_Criteria[Criteria]
        DB_Projects[Projects]
        DB_Scores[Scores]
        DB_Portfolios[Portfolios]
    end

    %% Frontend to API Layer
    FE_Forms -->|HTTP Request| API_Auth
    FE_Forms -->|HTTP Request| API_Projects
    FE_Forms -->|HTTP Request| API_Criteria
    FE_Forms -->|HTTP Request| API_Scoring
    FE_Forms -->|HTTP Request| API_Portfolio
    
    %% API Layer to Business Logic
    API_Auth --> BL_Auth
    API_Projects --> BL_Projects
    API_Criteria --> BL_Criteria
    API_Scoring --> BL_Scoring
    API_Portfolio --> BL_Portfolio
    
    %% Business Logic to Data Access
    BL_Auth --> DA_Repositories
    BL_Projects --> DA_Repositories
    BL_Criteria --> DA_Repositories
    BL_Scoring --> DA_Repositories
    BL_Portfolio --> DA_Repositories
    BL_Reports --> DA_Repositories
    
    %% Data Access to Database
    DA_Repositories --> DA_Prisma
    DA_Prisma --> DB_Organizations
    DA_Prisma --> DB_Users
    DA_Prisma --> DB_Criteria
    DA_Prisma --> DB_Projects
    DA_Prisma --> DB_Scores
    DA_Prisma --> DB_Portfolios
    
    %% API Layer to Frontend
    API_Auth -->|HTTP Response| FE_State
    API_Projects -->|HTTP Response| FE_State
    API_Criteria -->|HTTP Response| FE_State
    API_Scoring -->|HTTP Response| FE_State
    API_Portfolio -->|HTTP Response| FE_State
    
    %% Frontend State to Pages
    FE_State --> FE_Pages
```

### URL to File Mapping (url_file_mapping.png)

```mermaid
flowchart TD
    classDef pageFiles fill:#f9f,stroke:#333,stroke-width:2px
    classDef layoutFiles fill:#bbf,stroke:#333,stroke-width:2px
    classDef componentFiles fill:#bfb,stroke:#333,stroke-width:2px
    classDef apiFiles fill:#fbb,stroke:#333,stroke-width:2px
    classDef dataFiles fill:#fdb,stroke:#333,stroke-width:2px
    
    Browser[Browser Request]
    
    subgraph "URL to File Mapping"
        URL_Root["/ (Root URL)"]
        URL_Dashboard["/dashboard"]
        URL_Projects["/projects"]
        URL_ProjectsNew["/projects/new"]
        URL_Details["/details/[projectId]"]
        URL_Selection["/selection"]
        URL_Reports["/reports"]
        URL_Criteria["/criteria"]
        
        URL_API_Projects["/api/projects"]
        URL_API_Projects_ID["/api/projects/[projectId]"]
        URL_API_Criteria["/api/criteria"]
        URL_API_Criteria_ID["/api/criteria/[criterionId]"]
    end
    
    subgraph "Page Files (app/*.tsx)"
        Page_Root["app/page.tsx"]:::pageFiles
        Page_Dashboard["app/dashboard/page.tsx (Not created yet)"]:::pageFiles
        Page_Projects["app/projects/page.tsx (Not created yet)"]:::pageFiles
        Page_ProjectsNew["app/projects/new/page.tsx"]:::pageFiles
        Page_Details["app/details/[projectId]/page.tsx"]:::pageFiles
        Page_Selection["app/selection/page.tsx"]:::pageFiles
        Page_Reports["app/reports/page.tsx"]:::pageFiles
        Page_Criteria["app/criteria/page.tsx"]:::pageFiles
    end
    
    subgraph "Layout Files"
        RootLayout["app/layout.tsx"]:::layoutFiles
        Providers["app/providers.tsx"]:::layoutFiles
    end
    
    subgraph "Component Files"
        ProjectDetails["app/components/project-details/ProjectDetails.tsx"]:::componentFiles
        ProjectInformation["app/components/project-details/ProjectInformation.tsx"]:::componentFiles
        ProjectSelectionComp["app/components/project-selection/ProjectSelection.tsx"]:::componentFiles
        ProjectEntryForm["app/components/project-entry/ProjectEntryForm.tsx"]:::componentFiles
        ReportsComponent["app/components/reports/Reports.tsx"]:::componentFiles
        DashboardComponent["app/components/dashboard/Dashboard.tsx"]:::componentFiles
    end
    
    subgraph "API Route Handlers"
        API_Projects["app/api/projects/route.ts"]:::apiFiles
        API_Projects_ID["app/api/projects/[projectId]/route.ts"]:::apiFiles
        API_Projects_Scores["app/api/projects/[projectId]/scores/route.ts"]:::apiFiles
        API_Criteria["app/api/criteria/[criterionId]/route.ts"]:::apiFiles
        API_Criteria_Versions["app/api/criteria/versions/route.ts"]:::apiFiles
    end
    
    subgraph "Context Providers"
        AuthContext["app/contexts/AuthContext.tsx"]
        ProjectContext["app/contexts/ProjectContext.tsx"]
        CriteriaContext["app/contexts/CriteriaContext.tsx"]
    end
    
    subgraph "Data Layer"
        Repositories["src/repositories/*.ts"]:::dataFiles
        Hooks["src/hooks/*.ts"]:::dataFiles
        PrismaClient["src/lib/prisma.ts"]:::dataFiles
    end
    
    %% URL to Page File mapping
    URL_Root --> Page_Root
    URL_Dashboard --> Page_Dashboard
    URL_Projects --> Page_Projects
    URL_ProjectsNew --> Page_ProjectsNew
    URL_Details --> Page_Details
    URL_Selection --> Page_Selection
    URL_Reports --> Page_Reports
    URL_Criteria --> Page_Criteria
    
    %% URL to API mapping
    URL_API_Projects --> API_Projects
    URL_API_Projects_ID --> API_Projects_ID
    URL_API_Criteria --> API_Criteria
    URL_API_Criteria_ID --> API_Criteria
    
    %% Page to Component mapping
    Page_Root --> DashboardComponent
    Page_Selection --> ProjectSelectionComp
    Page_Details --> ProjectDetails
    Page_ProjectsNew --> ProjectEntryForm
    Page_Reports --> ReportsComponent
    
    %% Component relationships
    ProjectDetails --> ProjectInformation
    
    %% Layout relationships
    Browser --> RootLayout
    RootLayout --> Providers
    Providers --> |wraps all pages| Page_Root
    
    %% Context relationships
    Providers --> AuthContext
    Providers --> ProjectContext
    Providers --> CriteriaContext
    
    %% Data flow for API routes
    API_Projects --> Repositories
    API_Projects_ID --> Repositories
    API_Criteria --> Repositories
    Repositories --> PrismaClient
    
    %% Component to API data flow
    DashboardComponent --> |fetch| API_Projects
    ProjectDetails --> |fetch| API_Projects_ID
    ProjectSelectionComp --> |fetch| API_Projects
    ProjectSelectionComp --> |fetch| API_Criteria_Versions
    
    %% Hook usage
    DashboardComponent --> |uses| Hooks
    ProjectDetails --> |uses| Hooks
    ProjectSelectionComp --> |uses| Hooks
