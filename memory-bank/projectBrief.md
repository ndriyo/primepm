## Project Brief

### Overview
We are building a **SaaS Project Management Information System (PMIS)** with **Next.js**-based architecture. The solution focuses on *project selection* and *portfolio prioritization* during the **initiation phase** of project management. By combining **Next.js** for the frontend + backend (API routes) and **Supabase PostgreSQL** for data storage, we aim to deliver a secure, multi-tenant environment that supports:

- Dynamic definition of project selection criteria  
- Weighted scoring (including self-assessment and committee scoring)  
- Portfolio simulation based on real-time constraints (budget, resources, strategic alignment)  
- Authentication via **Email/Password**, **Google**, or **Microsoft** accounts  

### Core Requirements & Goals

1. **Multi-Tenant SaaS**  
   - Isolated data per organization (tenant), with subscription-based access.  
   - Scalable hosting and intuitive onboarding for new tenants.

2. **Project Selection & Prioritization**  
   - Define or update selection criteria yearly or before submission cycles.  
   - Weighted scoring based on criteria, with the option for self-assessment and committee scoring.  
   - Portfolio simulation under different scenarios and constraints (e.g., budgets, resources).

3. **User Authentication & Roles**  
   - Sign up/login using email & password or OAuth (Google/Microsoft).  
   - Role-based access: PMO, Management, Committee, Project Manager.

4. **Modern User Interface**  
   - Built with Next.js to leverage SSR/SSG where useful.  
   - **Tailwind CSS** plus **21st dev** component library for a clean, consistent design.  
   - Responsive layouts for desktop and mobile.

5. **Reporting & Data Export**  
   - Provide interactive dashboards and summary reports of final project scores.  
   - Export portfolio decisions to PDF or Excel for stakeholder distribution.

### Functional Requirements

1. **Criteria Management**  
   - PMO defines or updates project selection criteria (e.g., ROI, Risk, Strategic Alignment).  
   - Each criterion includes a scale (e.g., 1–5) and descriptions/rubrics.  
   - Criteria can be versioned (annually or per submission cycle).

2. **Weight Definition & Adjustments**  
   - PMO configures how important each criterion is (e.g., set weighting percentages).  
   - Optionally adapt advanced weighting methods (like Analytical Hierarchy Process) but coded for Next.js + Supabase.

3. **Project Submission & Self-Assessment**  
   - Project Managers create a new project record, entering basic info (name, sponsor, budget, timeline).  
   - Self-assessment: PM rates the project on each criterion based on the provided rubrics.

4. **Committee Scoring**  
   - Committee members view all project proposals and PM self-scores.  
   - Assign their own ratings, aggregated into a final composite score.

5. **Portfolio Simulation & Prioritization**  
   - Management applies constraints (total budget, resource capacity, must-do projects).  
   - The system calculates a recommended portfolio based on scoring and constraints.  
   - Management can adjust, finalize, and lock the portfolio selection for that cycle.

6. **Multi-Tenant & Subscription**  
   - Each tenant (organization) maintains unique criteria, projects, and user data.  
   - Billing or subscription logic (basic, premium tiers, etc.) to be implemented as needed.

### User Flows

1. **PMO Creates/Updates Criteria**  
   - PMO logs in → Goes to “Criteria Management” → Adds or edits selection criteria → Adjusts weighting or imports from prior cycles → Publishes final set.

2. **Project Manager Submits Project**  
   - PM logs in → “New Project” → Fills out form (name, sponsor, details) → Rates each criterion (self-score) → Submits.

3. **Committee Scoring**  
   - After submission deadline, Committee members log in → Access “Scoring Dashboard” → Review each project’s info and self-scores → Enter personal scores → System calculates combined/final scores.

4. **Portfolio Simulation**  
   - Management sets constraints (e.g., budget = $X million, no more than N concurrent projects).  
   - The system recommends a set of projects to meet constraints and maximize total score.  
   - Management adjusts as needed, then locks the final portfolio.

5. **Reporting & Export**  
   - Users can generate a “Portfolio Report” (PDF/Excel) summarizing chosen projects, budgets, and rationale.  
   - Visual dashboards or charts display overall project distribution, resource usage, etc.

### Constraints & Scope
- **Next.js** environment (API routes for backend, SSR/SSG for frontend).
- **Supabase PostgreSQL** for secure, hosted database services (native connections from Next.js).
- Must scale to handle potentially hundreds of users scoring projects concurrently.
- Enforce role-based permissions for PMO, Project Managers, Committee, and Management.