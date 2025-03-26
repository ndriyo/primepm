# Implementation Plan: Committee Review Interface

## Overview

This document outlines the implementation plan for the Committee Review interface in PrimePM. The Committee Review interface will allow committee members to efficiently review and score projects that have been submitted by Project Managers, as part of the portfolio selection process.

## Implementation Phases

### Phase 1: Database Schema Updates

1. **Update Prisma Schema**
   - Enhance `PortfolioSelection` model with cycle fields
   - Add `portfolioStatus` and `portfolioSelectionId` to `Project` model
   - Create `CommitteeReviewSession` model
   - Add status and relationship fields to `CommitteeScore` model
   - Create `PortfolioSimulation` and `PortfolioSimulationProject` models

2. **Generate and Apply Migrations**
   - Create migration script using Prisma
   - Test migration on development database
   - Apply migration to production database

### Phase 2: Backend API Development

1. **Create Repository Methods**
   - Enhance `ProjectRepository` with portfolio-related methods
   - Create `CommitteeRepository` for committee score operations
   - Create `PortfolioSimulationRepository` for simulation operations

2. **Develop API Routes**
   - `GET /api/committee/sessions` - List review sessions
   - `POST /api/committee/sessions` - Create a new review session
   - `GET /api/committee/projects` - List projects for committee review
   - `GET /api/committee/projects/[projectId]` - Get project details with self-assessment
   - `POST /api/committee/scores` - Submit scores for a project
   - `PUT /api/committee/scores/[scoreId]` - Update a score
   - `GET /api/committee/progress` - Get scoring progress for a committee member

3. **Implement Business Logic**
   - Score calculation and aggregation
   - Progress tracking for committee members
   - Validation rules for committee scoring

### Phase 3: Frontend Component Development

1. **Create Context Provider**
   - `CommitteeContext` for managing committee review state

2. **Develop Core Components**
   - `CommitteeReview.tsx` - Main component
   - `CommitteeDashboard.tsx` - Dashboard view
   - `ProjectList.tsx` - List of projects to review
   - `ProjectScoring.tsx` - Scoring interface
   - `ScoringCard.tsx` - Card-based scoring component
   - `ScoringProgress.tsx` - Progress tracking

3. **Implement UI Screens**
   - Committee dashboard screen
   - Project list screen
   - Project scoring screen
   - Score submission confirmation screen

### Phase 4: Integration and Testing

1. **Integration Testing**
   - Test API endpoints with Postman or similar tool
   - Test frontend components with mock data
   - Test end-to-end flow with real data

2. **User Acceptance Testing**
   - Conduct UAT with committee members
   - Gather feedback and make adjustments

### Phase 5: Deployment and Documentation

1. **Deployment**
   - Deploy database changes
   - Deploy API changes
   - Deploy frontend changes

2. **Documentation**
   - Update user documentation
   - Create training materials for committee members

## Component Structure

Following the project's file structure conventions:

```
app/
  # Page components
  committee/
    page.tsx                                # Main committee review page
  
  # Feature-specific components
  committee/_components/
    CommitteeDashboard.tsx                  # Committee dashboard component
    ProjectList.tsx                         # List of projects to review
    ProjectScoring.tsx                      # Project scoring interface
    ScoringCard.tsx                         # Card-based scoring component
    ScoringProgress.tsx                     # Progress tracking component
    ConfirmationDialog.tsx                  # Score submission confirmation
  
  # Shared components
  _components/
    ui/
      BentoCard.tsx                         # Already exists, will be reused
      AnimatedGradient.tsx                  # Already exists, will be reused
      ConfirmationDialog.tsx                # Already exists, will be reused
  
  # Context providers
  _contexts/
    CommitteeContext.tsx                    # Committee review state management
  
  # Custom hooks
  _hooks/
    useCommitteeScores.ts                   # Hook for committee scoring operations
    useCommitteeProgress.ts                 # Hook for tracking scoring progress
  
  # Data models and repositories
  _repositories/
    CommitteeRepository.ts                  # Committee score data operations
    PortfolioSimulationRepository.ts        # Portfolio simulation operations
  
  # Utility functions
  _lib/
    scoreCalculator.ts                       # Reuse existing Score calculation utilities 
  
  # API routes
  api/
    committee/
      route.ts                              # GET/POST committee sessions
      sessions/
        [sessionId]/
          route.ts                          # Session-specific operations
      projects/
        route.ts                            # GET projects for committee review
        [projectId]/
          route.ts                          # Project details with self-assessment
          scores/
            route.ts                        # Submit/update scores for a project
      scores/
        route.ts                            # Committee score operations
      progress/
        route.ts                            # Get scoring progress
```

## UI Design

### Committee Dashboard

The Committee Dashboard will provide an overview of the committee member's review tasks and progress:

- Header with portfolio selection name and progress summary
- Metrics cards showing:
  - Total projects to review
  - Projects completed
  - Projects in progress
  - Projects not started
  - Days remaining until deadline
- Project list with filtering and search capabilities
- Progress visualization

### Project Scoring Interface

The Project Scoring interface will allow committee members to review and score projects:

- Project header with key information (name, department, budget, etc.)
- Tabs for:
  - Project Information (details submitted by PM)
  - Self-Assessment (scores and comments from PM)
  - Committee Scoring (interface for committee member to score)
- Scoring area with:
  - Criterion information (name, description, weight)
  - PM's self-score for reference
  - Card-based scoring options (1-5 with descriptions)
  - Comment field for justification
- Navigation controls:
  - Previous/Next criterion buttons
  - Save Draft button
  - Submit All Scores button

## Data Flow

1. Committee member logs in and navigates to Committee Review page
2. System loads active portfolio selection and committee review session
3. System fetches projects assigned to the committee member
4. Committee member selects a project to review
5. System loads project details, self-assessment scores, and any existing committee scores
6. Committee member scores each criterion and adds comments
7. Scores can be saved as drafts and later submitted
8. On submission, scores are validated and stored
9. Progress is updated on the dashboard

## Technical Considerations

1. **Performance**
   - Optimize database queries for large project sets
   - Implement pagination for project lists
   - Use React Query for efficient data fetching and caching

2. **State Management**
   - Use React Context for global state
   - Implement form state management with React Hook Form
   - Handle optimistic updates for better UX

3. **Security**
   - Enforce role-based access control
   - Validate all input on the server
   - Implement proper error handling

4. **Accessibility**
   - Ensure all components are keyboard navigable
   - Implement proper ARIA attributes
   - Test with screen readers

## Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Database Schema Updates | 1 week | None |
| 2 | Backend API Development | 2 weeks | Phase 1 |
| 3 | Frontend Component Development | 3 weeks | Phase 2 |
| 4 | Integration and Testing | 2 weeks | Phase 3 |
| 5 | Deployment and Documentation | 1 week | Phase 4 |

Total estimated time: 9 weeks

## Success Criteria

1. Committee members can efficiently review and score projects
2. Scores are accurately calculated and stored
3. Progress is tracked and visualized
4. The interface is intuitive and user-friendly
5. The system performs well with large numbers of projects and users
6. The implementation integrates seamlessly with the existing portfolio selection process

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Complex scoring logic leads to calculation errors | High | Medium | Implement comprehensive unit tests for scoring logic |
| Poor performance with large project sets | Medium | Medium | Implement pagination, optimize queries, use caching |
| User resistance to new interface | Medium | Low | Conduct user training, gather feedback early |
| Integration issues with existing portfolio process | High | Medium | Thorough testing of end-to-end flows |
| Data inconsistency between self-assessment and committee scores | Medium | Low | Implement validation rules and clear UI differentiation |
