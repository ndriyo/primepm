# Committee Review Interface UI Design Plan

## Overview

This document outlines the detailed UI design plan for the Committee Review interface in PrimePM. The interface will enable committee members to efficiently review and score projects as part of the portfolio selection process.

## UI Design Principles

1. **Consistency**: Maintain visual consistency with existing PrimePM UI components
2. **Efficiency**: Optimize for quick scoring and review of multiple projects
3. **Clarity**: Clearly distinguish between self-assessment and committee scores
4. **Feedback**: Provide immediate feedback on user actions
5. **Progress**: Show clear progress indicators throughout the scoring process

## Key UI Components

### 1. Committee Dashboard

```
+----------------------------------------------------------------------+
|                                                                      |
| COMMITTEE REVIEW DASHBOARD                Current Portfolio: FY2025  |
| Your Progress: 12/20 Projects Scored                                 |
|                                                                      |
| +----------+  +----------+  +----------+  +----------+  +----------+ |
| |          |  |          |  |          |  |          |  |          | |
| |  Total   |  |Completed |  |   In     |  |   Not    |  |  Days    | |
| | Projects |  |          |  | Progress |  | Started  |  |Remaining | |
| |          |  |          |  |          |  |          |  |          | |
| |    20    |  |    12    |  |     3    |  |     5    |  |     7    | |
| |          |  |          |  |          |  |          |  |          | |
| +----------+  +----------+  +----------+  +----------+  +----------+ |
|                                                                      |
| +----------------------------------+  +-------------------------+     |
| | Filter: Status | Department | $  |  | Search: [          ]   |     |
| +----------------------------------+  +-------------------------+     |
|                                                                      |
| +----------------------------------------------------------------------+
| | Project Name         | Department | Budget | Status    | Your Score | Actions |
| |---------------------|------------|--------|-----------|------------|---------|
| | Data Warehouse      | IT         | $1.2M  | In Progress| 4.2/5     | Continue|
| | Mobile App Redesign | Marketing  | $450K  | Completed | 3.8/5     | View    |
| | ERP Implementation  | Finance    | $2.5M  | Not Started| -         | Score   |
| | Cloud Migration     | IT         | $800K  | Completed | 4.5/5     | View    |
| | CRM Integration     | Sales      | $350K  | In Progress| 3.2/5     | Continue|
| | Security Audit      | IT         | $200K  | Not Started| -         | Score   |
| | Website Redesign    | Marketing  | $180K  | Completed | 4.1/5     | View    |
| |                     |            |        |           |            |         |
| +----------------------------------------------------------------------+
|                                                                      |
| < Previous | Page 1 of 3 | Next >                                    |
|                                                                      |
+----------------------------------------------------------------------+
```

#### Component Details

**Header Section**
- Title with page name
- Portfolio selection cycle name and year
- Progress summary showing completed/total projects
- Deadline countdown

**Metrics Cards**
- Use existing `BentoCard` component with `AnimatedGradient` backgrounds
- Each card shows a key metric with large number and descriptive label
- Cards use different gradient color schemes to distinguish metrics
- Metrics include:
  - Total projects to review
  - Projects completed
  - Projects in progress
  - Projects not started
  - Days remaining until deadline

**Project List**
- Filterable, sortable table of projects
- Columns:
  - Project name (with link to scoring interface)
  - Department
  - Budget (formatted with K/M/B suffixes)
  - Status (Not Started, In Progress, Completed)
  - Your Score (average of your scores across all criteria)
  - Actions (Score, Continue, View)
- Status column uses color-coded badges
- Search field for quick project lookup
- Filter dropdown for department, status, and budget range
- Pagination controls for large project sets

### 2. Project Scoring Interface

```
+----------------------------------------------------------------------+
| ← Back to Dashboard                                                  |
|                                                                      |
| Enterprise Data Warehouse                                            |
| Department: IT | Budget: $1.2M | Resources: 450 person-days          |
|                                                                      |
| +-------------+  +----------------+  +-------------------+           |
| |Project Info |  |Self-Assessment |  |Committee Scoring ▼|           |
| +-------------+  +----------------+  +-------------------+           |
|                                                                      |
| Progress: [==========75%==========]                                  |
|                                                                      |
| +---------------------------+  +--------------------------------+    |
| |                           |  |                                |    |
| | Criterion List:           |  | Strategic Alignment (25%)      |    |
| | ✓ Strategic Alignment     |  | PM Score: 4/5                  |    |
| | ✓ Financial Impact        |  |                                |    |
| | ✓ Technical Feasibility   |  | Select a score:                |    |
| | ⟳ Resource Availability   |  |                                |    |
| | ○ Risk Assessment         |  | +------+ +------+ +------+ +------+ +------+ |
| |                           |  | |      | |      | |      | |      | |      | |
| |                           |  | |  1   | |  2   | |  3   | |  4   | |  5   | |
| |                           |  | | Low  | |Some  | |Mod.  | |Strong| |Perfect| |
| |                           |  | |align.| |align.| |align.| |align.| |align. | |
| |                           |  | |      | |      | |      | |      | |      | |
| |                           |  | +------+ +------+ +------+ +------+ +------+ |
| |                           |  |                                |    |
| |                           |  | Comments:                      |    |
| |                           |  | +----------------------------+ |    |
| |                           |  | |                            | |    |
| |                           |  | |                            | |    |
| |                           |  | +----------------------------+ |    |
| |                           |  |                                |    |
| +---------------------------+  +--------------------------------+    |
|                                                                      |
| +------------+  +------------+  +------------+  +-------------------+|
| |Previous    |  |Next        |  |Save Draft  |  |Submit All Scores  ||
| +------------+  +------------+  +------------+  +-------------------+|
+----------------------------------------------------------------------+
```

#### Component Details

**Project Header**
- Sticky header with key project information
- Project name in large font
- Department, budget, resources, and other key metrics
- Back button to return to dashboard
- Status indicator showing scoring progress

**Tab Navigation**
- Three tabs:
  1. Project Information - Details submitted by PM
  2. Self-Assessment - Scores and comments from PM
  3. Committee Scoring - Interface for committee member to score
- Active tab highlighted
- Tab content fills main content area

**Project Information Tab**
```
+----------------------------------------------------------------------+
| ← Back to Dashboard                                                  |
|                                                                      |
| Enterprise Data Warehouse                                            |
| Department: IT | Budget: $1.2M | Resources: 450 person-days          |
|                                                                      |
| +-------------------+  +----------------+  +----------------+        |
| |Project Info ▼     |  |Self-Assessment |  |Committee Scoring|       |
| +-------------------+  +----------------+  +----------------+        |
|                                                                      |
| +----------------------------------------------------------------------+
| |                                                                    |
| | Basic Information                                                  |
| | ----------------------------------------------------------------- |
| | Project Name: Enterprise Data Warehouse                            |
| | Description: Centralized data repository for business intelligence |
| | Department: Information Technology                                 |
| | Sponsor: Sarah Johnson (CIO)                                       |
| |                                                                    |
| | Financial Information                                              |
| | ----------------------------------------------------------------- |
| | Budget: $1,200,000                                                 |
| | ROI: 135% over 3 years                                             |
| | Operating Cost: $180,000/year                                      |
| |                                                                    |
| | Timeline                                                           |
| | ----------------------------------------------------------------- |
| | Start Date: June 1, 2025                                           |
| | End Date: December 15, 2025                                        |
| | Duration: 6.5 months                                               |
| |                                                                    |
| | Resources                                                          |
| | ----------------------------------------------------------------- |
| | Team Size: 5 FTEs                                                  |
| | Person-days: 450                                                   |
| | Skills Required: Data Engineering, ETL, SQL, Cloud Infrastructure  |
| |                                                                    |
| | Attachments                                                        |
| | ----------------------------------------------------------------- |
| | [📄 Project Charter.pdf]  [📄 Technical Specifications.docx]       |
| |                                                                    |
| +----------------------------------------------------------------------+
|                                                                      |
| +------------+  +------------+  +------------+  +-------------------+|
| |Previous    |  |Next        |  |Save Draft  |  |Submit All Scores  ||
| +------------+  +------------+  +------------+  +-------------------+|
+----------------------------------------------------------------------+
```
- Displays all project details in a clean, organized layout
- Sections for:
  - Basic Information (name, description, department)
  - Financial Information (budget, ROI)
  - Timeline (start date, end date, milestones)
  - Resources (team size, skills required)
  - Attachments (if any)

**Self-Assessment Tab**
```
+----------------------------------------------------------------------+
| ← Back to Dashboard                                                  |
|                                                                      |
| Enterprise Data Warehouse                                            |
| Department: IT | Budget: $1.2M | Resources: 450 person-days          |
|                                                                      |
| +----------------+  +-------------------+  +----------------+        |
| |Project Info    |  |Self-Assessment ▼  |  |Committee Scoring|       |
| +----------------+  +-------------------+  +----------------+        |
|                                                                      |
| +----------------------------------------------------------------------+
| |                                                                    |
| | PM's Self-Assessment                                               |
| |                                                                    |
| | Strategic Alignment (25%)                                          |
| | ----------------------------------------------------------------- |
| | Score: ★★★★☆ (4/5)                                                |
| | Comment: "This project directly supports our strategic goal of     |
| | data-driven decision making and will enable real-time analytics    |
| | for executive dashboards."                                         |
| |                                                                    |
| | Financial Impact (20%)                                             |
| | ----------------------------------------------------------------- |
| | Score: ★★★★★ (5/5)                                                |
| | Comment: "ROI analysis shows 135% return over 3 years with         |
| | significant cost savings from consolidated reporting systems."     |
| |                                                                    |
| | Technical Feasibility (15%)                                        |
| | ----------------------------------------------------------------- |
| | Score: ★★★☆☆ (3/5)                                                |
| | Comment: "Technology is well-understood but requires integration   |
| | with legacy systems which adds complexity."                        |
| |                                                                    |
| | Resource Availability (20%)                                        |
| | ----------------------------------------------------------------- |
| | Score: ★★★★☆ (4/5)                                                |
| | Comment: "Core team members are available, may need to contract    |
| | specialized ETL developers."                                       |
| |                                                                    |
| | Risk Assessment (20%)                                              |
| | ----------------------------------------------------------------- |
| | Score: ★★★☆☆ (3/5)                                                |
| | Comment: "Data migration risks are moderate. Mitigation plans      |
| | include phased implementation and parallel systems."               |
| |                                                                    |
| +----------------------------------------------------------------------+
|                                                                      |
| +------------+  +------------+  +------------+  +-------------------+|
| |Previous    |  |Next        |  |Save Draft  |  |Submit All Scores  ||
| +------------+  +------------+  +------------+  +-------------------+|
+----------------------------------------------------------------------+
```
- Shows PM's self-scores for each criterion
- Displays PM's comments/justification
- Organized in the same order as the committee scoring tab
- Clearly labeled as "PM's Assessment" to avoid confusion

**Committee Scoring Tab**
```
+----------------------------------------------------------------------+
| ← Back to Dashboard                                                  |
|                                                                      |
| Enterprise Data Warehouse                                            |
| Department: IT | Budget: $1.2M | Resources: 450 person-days          |
|                                                                      |
| +----------------+  +----------------+  +-------------------+        |
| |Project Info    |  |Self-Assessment |  |Committee Scoring ▼|        |
| +----------------+  +----------------+  +-------------------+        |
|                                                                      |
| Progress: [==========75%==========]   Criterion 3 of 5               |
|                                                                      |
| +---------------------------+  +--------------------------------+    |
| |                           |  |                                |    |
| | Criterion List:           |  | Technical Feasibility (15%)    |    |
| | ✓ Strategic Alignment     |  | PM Score: 3/5                  |    |
| | ✓ Financial Impact        |  |                                |    |
| | ⟳ Technical Feasibility   |  | Description:                   |    |
| | ○ Resource Availability   |  | Evaluate the technical complexity |  |
| | ○ Risk Assessment         |  | and feasibility of implementation. |  |
| |                           |  | Consider integration requirements, |  |
| |                           |  | technology maturity, and team     |  |
| |                           |  | capabilities.                    |    |
| |                           |  |                                |    |
| |                           |  | Select a score:                |    |
| |                           |  |                                |    |
| |                           |  | +------+ +------+ +------+ +------+ +------+ |
| |                           |  | |      | |      | |●●●●●●| |      | |      | |
| |                           |  | |  1   | |  2   | |  3   | |  4   | |  5   | |
| |                           |  | | Very | | Some | | Mod. | | High | | Very | |
| |                           |  | | diff.| | chall.| |feasib.| |feasib.| | easy | |
| |                           |  | |      | |      | |      | |      | |      | |
| |                           |  | +------+ +------+ +------+ +------+ +------+ |
| |                           |  |                                |    |
| |                           |  | Comments:                      |    |
| |                           |  | +----------------------------+ |    |
| |                           |  | | I agree with the PM's      | |    |
| |                           |  | | assessment. Legacy system  | |    |
| |                           |  | | integration will be the    | |    |
| |                           |  | | biggest challenge.         | |    |
| |                           |  | +----------------------------+ |    |
| +---------------------------+  +--------------------------------+    |
|                                                                      |
| +------------+  +------------+  +------------+  +-------------------+|
| |Previous    |  |Next        |  |Save Draft  |  |Submit All Scores  ||
| +------------+  +------------+  +------------+  +-------------------+|
+----------------------------------------------------------------------+
```
- Main scoring interface
- Components:
  - Criterion header with name, description, and weight
  - PM's score displayed for reference (visually distinct)
  - Card-based scoring options (described below)
  - Comment field for justification
  - Navigation controls

**Card-Based Scoring**
- Five cards representing score levels 1-5
- Each card contains:
  - Large number (1-5)
  - Short description of that score level
  - Visual indicator of score value (color gradient)
- Cards highlight when hovered
- Selected card has prominent visual indicator
- Cards arranged horizontally on desktop, vertically on mobile

**Comments Field**
- Text area for entering justification
- Character counter
- Placeholder text prompting for justification
- Optional but encouraged

**Navigation Controls**
- Previous/Next buttons to move between criteria
- Progress indicator showing current criterion / total
- Save Draft button (saves current progress without submitting)
- Submit All Scores button (only enabled when all criteria scored)
- Confirmation dialog before final submission

### 3. Scoring Progress Tracker
```
# Scoring Progress Tracker

----------------------------
|  Overall Progress: 75%   |
|  [██████████░░░░░░░░░░]   |
----------------------------

Criteria:
[✓] Strategic Alignment  
[✓] Financial Impact  
[✓] Technical Feasibility  
[⟳] Resource Availability  
[○] Risk Assessment  


#### Component Details

**Progress Bar**
- Visual progress bar showing percentage of criteria scored
- Color changes as progress increases (red → yellow → green)
- Positioned at top of scoring interface

**Criterion List**
- Compact list of all criteria with status indicators:
  - ✓ Completed
  - ⟳ In Progress
  - ○ Not Started
- Current criterion highlighted
- Clickable to jump directly to a criterion
- Shows at side of scoring interface on desktop, collapsible on mobile

### 4. Confirmation Dialog

+-------------------------------------------+
|              Submit Scores                |
+-------------------------------------------+
| You've completed scoring for              |
| 'Enterprise Data Warehouse'.              |
|                                           |
| Once submitted, scores cannot be changed. |
+-------------------------------------------+
|             [Cancel]  [Submit]            |
+-------------------------------------------+


#### Component Details

**Confirmation Dialog**
- Modal dialog with clear title
- Message explaining the action and consequences
- Cancel button to return to scoring
- Submit button to finalize scores
- Uses existing `ConfirmationDialog` component

### 5. Completion Screen
```
+----------------------------------------------------------------------+
|                                                                      |
|                                                                      |
|                                                                      |
|                          ✓                                           |
|                                                                      |
|                  Scores Submitted Successfully                       |
|                                                                      |
|                                                                      |
|     Project: Enterprise Data Warehouse                               |
|     Your Average Score: 4.2/5                                        |
|     Criteria Scored: 5/5                                             |
|                                                                      |
|     Thank you for your evaluation. Your scores have been recorded    |
|     and will be used in the portfolio selection process.             |
|                                                                      |
|                                                                      |
|                                                                      |
|     +--------------------+      +--------------------+               |
|     |  Back to Dashboard |      |  Score Next Project |              |
|     +--------------------+      +--------------------+               |
|                                                                      |
|                                                                      |
+----------------------------------------------------------------------+
```

#### Component Details

**Completion Screen**
- Success message with checkmark icon
- Summary of submitted scores
- Average score calculation
- Options to:
  - Return to dashboard
  - Proceed to next unscored project
- Confetti animation for positive reinforcement

## Responsive Design Considerations

### Desktop Layout
- Full three-column layout for scoring interface
- Criterion list visible at all times
- Card-based scoring options displayed horizontally
- Side-by-side comparison of PM and committee scores

### Tablet Layout
- Two-column layout
- Collapsible criterion list
- Card-based scoring options displayed horizontally
- Tabbed view for PM and committee scores

### Mobile Layout
- Single-column layout
- Collapsible criterion list accessed via button
- Card-based scoring options displayed vertically
- Tabbed view for PM and committee scores
- Fixed navigation controls at bottom of screen

## UI Component Implementation

### Using Existing Components

The Committee Review interface will leverage these existing UI components:

1. **BentoCard**
   - Used for metrics cards on dashboard
   - Used for score option cards in scoring interface
   - Configured with different animations and colors

2. **AnimatedGradient**
   - Used as backgrounds for metrics cards
   - Used for score option cards with intensity matching score value
   - Configured with different color schemes for visual distinction

3. **ConfirmationDialog**
   - Used for submission confirmation
   - Used for cancellation confirmation if changes would be lost

4. **PageLayout**
   - Used as container for all committee interface pages
   - Provides consistent header, sidebar, and content areas

### New Components to Create

1. **CommitteeDashboard**
   ```tsx
   interface CommitteeDashboardProps {
     portfolioSelection: PortfolioSelection;
     progress: {
       total: number;
       completed: number;
       inProgress: number;
       notStarted: number;
       daysRemaining: number;
     };
     projects: Project[];
   }
   ```

2. **ProjectScoring**
   ```tsx
   interface ProjectScoringProps {
     project: Project;
     criteria: Criterion[];
     selfScores: ProjectCriteriaScore[];
     committeeScores: CommitteeScore[];
     onSaveDraft: (scores: CommitteeScore[]) => Promise<void>;
     onSubmit: (scores: CommitteeScore[]) => Promise<void>;
   }
   ```

3. **ScoringCard**
   ```tsx
   interface ScoringCardProps {
     value: number;
     label: string;
     description: string;
     selected: boolean;
     onSelect: () => void;
   }
   ```

4. **ScoringProgress**
   ```tsx
   interface ScoringProgressProps {
     criteria: Criterion[];
     scores: CommitteeScore[];
     currentCriterionId: string;
     onCriterionSelect: (criterionId: string) => void;
   }
   ```

5. **ProjectList**
   ```tsx
   interface ProjectListProps {
     projects: Project[];
     filters: {
       status: string[];
       department: string[];
       budgetRange: [number, number];
     };
     onFilterChange: (filters: any) => void;
     onProjectSelect: (projectId: string) => void;
   }
   ```

## Interaction Patterns

### Scoring Workflow

1. Committee member selects a project from dashboard
2. System loads project details and any existing scores
3. Committee member reviews project information and PM self-assessment
4. Committee member navigates to Committee Scoring tab
5. For each criterion:
   - Read criterion description and weight
   - View PM's self-score for reference
   - Select appropriate score card
   - Add optional comment
   - Click Next to proceed to next criterion
6. Progress is saved automatically when moving between criteria
7. Committee member can save as draft at any point
8. When all criteria are scored, Submit button becomes enabled
9. On submission, confirmation dialog appears
10. After confirmation, scores are submitted and completion screen shown

### Dashboard Interaction

1. Committee member logs in and navigates to Committee Review page
2. Dashboard loads with metrics and project list
3. Committee member can:
   - Filter projects by status, department, or budget
   - Search for specific projects
   - Sort projects by different columns
   - Select a project to score
   - Continue scoring a project in progress
   - View a completed project's scores

### Progress Tracking

1. Progress is tracked at multiple levels:
   - Overall progress across all projects (dashboard)
   - Progress within a specific project (scoring interface)
   - Progress for each criterion (criterion list)
2. Visual indicators show status at each level
3. Committee member can jump to any unscored criterion directly

## Visual Design Specifications

### Color Scheme

- **Primary Action**: #007bff (blue)
- **Success/Completed**: #28a745 (green)
- **Warning/In Progress**: #ffc107 (yellow)
- **Danger/Not Started**: #dc3545 (red)
- **Neutral/Background**: #f8f9fa (light gray)
- **Text Primary**: #212529 (dark gray)
- **Text Secondary**: #6c757d (medium gray)

### Typography

- **Headings**: Inter, sans-serif
- **Body Text**: Inter, sans-serif
- **Dashboard Metrics**: Inter, sans-serif (bold)
- **Score Values**: Inter, sans-serif (bold)

### Spacing

- Follow existing Tailwind CSS spacing scale
- Consistent padding within cards (p-4)
- Consistent margins between sections (my-4)
- Adequate spacing between score cards (mx-2)

### Animations

- Subtle hover effects on interactive elements
- Smooth transitions between tabs
- Progress bar animations
- Card selection animations
- Success animation on completion

## Accessibility Considerations

1. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Logical tab order through the interface
   - Keyboard shortcuts for common actions (save, next, previous)

2. **Screen Reader Support**
   - Proper ARIA labels for all interactive elements
   - Descriptive alt text for icons and visual indicators
   - Announcements for status changes and form submissions

3. **Color and Contrast**
   - Sufficient contrast ratios for all text and interactive elements
   - Visual indicators beyond color alone (icons, patterns)
   - Support for high contrast mode

4. **Responsive Design**
   - Usable at all screen sizes and orientations
   - Touch targets sized appropriately for mobile use
   - Simplified layouts for smaller screens

## Implementation Priorities

1. **MVP Features** (Phase 1)
   - Committee dashboard with basic metrics
   - Project list with filtering
   - Basic scoring interface with card selection
   - Save draft and submit functionality

2. **Enhanced Features** (Phase 2)
   - Advanced progress tracking
   - Improved navigation between criteria
   - Comment functionality
   - Comparison view with PM scores

3. **Polish Features** (Phase 3)
   - Animations and transitions
   - Advanced filtering and sorting
   - Keyboard shortcuts
   - Performance optimizations


## Next Steps

1. Develop component prototypes using existing UI library
2. Conduct usability testing with committee members
3. Refine designs based on feedback
4. Implement final UI components
