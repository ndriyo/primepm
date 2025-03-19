# Product Requirements Document (PRD)

This document outlines everything that the AI model needs to know about building the Project Management Information System (PMIS) for project selection during the initiation phase. The system is designed to support the Project Management Office (PMO), Management, and Project Sponsors by providing a structured, data-driven method to evaluate projects using a simulation based on the Analytical Hierarchy Process (AHP). The idea is to let the PMO set criteria and assign relative weights via an automated wizard, while project sponsors submit the basic project details and self-assessments. The system then simulates rankings and produces actionable insights that allow selected stakeholders to make well-informed final decisions.

The system is being built to bring consistency, flexibility, and transparency into the project selection process. Success will be measured by the trustworthy simulation results, the clear presentation of data through dashboards and reports, and the seamless integration with existing project management tools like Microsoft Project and JIRA. The key objectives include flexibility in adjusting evaluation criteria over time, security in handling sensitive project data, and ensuring a user-friendly experience across devices—from desktops to smartphones.

## In-Scope vs Out-of-Scope

**In-Scope:**

*   A web-based application accessible on desktops, tablets, and smartphones.

*   A dynamic criteria setup module for the PMO to:

    *   Define and adjust selection criteria.
    *   Use an interactive wizard to perform pairwise comparisons and assign AHP-based weights automatically.
    *   Create and modify rubrics for each criterion.

*   Project submission interface for Project Sponsors to:

    *   Input project details (duration, mandays, budget/investment cost, operational costs, risks).
    *   Complete a self-assessment based on created rubrics.

*   An evaluation and scoring engine that:

    *   Simulates project ranking based on PMO-defined criteria, weights, and submitted scores.
    *   Allows Management and PMO to adjust rankings within preset conditions (like budget).

*   Comprehensive dashboard and reporting:

    *   Visuals (charts, graphs, sortable tables) to present simulation results.
    *   Detailed breakdowns for individual project scores.
    *   Options to filter and compare simulation scenarios.
    *   Exportable reports in formats such as PDF and CSV.

*   Integration capabilities with popular project management tools (Microsoft Project, JIRA) and data repositories (databases, Excel files).

*   Secure data storage with encryption, regular backups, and role-based access control.

**Out-of-Scope:**

*   Advanced mobile-native applications separate from the responsive web experience.
*   In-depth customization beyond the clean, professional design aesthetic (no specific branding guidelines).
*   Complex third-party integrations outside of the mentioned project management tools and common data sources.
*   Features that extend beyond the project submission and simulation phase (e.g., project execution or resource management).

## User Flow

A new user (depending on their role) signs into the web application using secure login methods such as OAuth Google. After the login process, the system displays a role-specific dashboard: PMO users see options to create and manage evaluation criteria and configure AHP-driven settings; Project Sponsors are taken to the project submission interface where they enter their project details and perform a self-assessment; Management enjoys a view focused on reviewing simulation results and applying adjustments where necessary.

After criteria and weights are set by the PMO through an automated wizard, Project Sponsors submit their projects with required details. Next, the PMO and selection committee review each project to confirm their evaluations against the set rubrics. The system then processes the data to simulate project rankings based on the input values, with simulation results shown on an interactive dashboard. This dashboard provides interactive charts, sortable tables, and detailed score breakdowns, and also allows for final adjustments by Management before making final selection decisions.

## Core Features

*   **User Authentication & Role Management:**

    *   Secure login with options for OAuth (Google).
    *   Different interfaces for PMO, Management, and Project Sponsor with role-based permissions.

*   **Criteria Setup and AHP Wizard:**

    *   Interactive wizard for the PMO to perform pairwise comparisons between criteria.
    *   Automatic computation of AHP-based weights.
    *   Module for creating, modifying, or removing criteria and rubrics.

*   **Project Submission Module:**

    *   Interface for Project Sponsors to submit project details (duration, mandays, budget, operational costs, risks).
    *   Self-assessment tool based on the pre-defined rubrics.

*   **Simulation Engine & Ranking:**

    *   Process to simulate project rankings based on AHP criteria, weights, and self-assessed scores.
    *   Mechanism allowing Management and PMO to adjust simulation results based on organizational objectives.

*   **Dashboard & Reporting Interface:**

    *   Interactive charts and graphs (bar charts, pie charts, line graphs) for visual analysis.
    *   Sortable and filterable tables displaying projects with various scoring parameters.
    *   Detailed drill-down views for individual projects and criteria contribution.
    *   Downloadable and exportable reports in PDF and CSV formats.

*   **Integration Capabilities:**

    *   Seamless integration with project management tools like Microsoft Project and JIRA.
    *   Import/export functionality for data via spreadsheets or common databases.

*   **Data Security & Backup System:**

    *   Use of secure protocols (HTTPS, SSL/TLS).
    *   Role-based access control and encrypted data storage.
    *   Scheduled backups (daily, with incremental backups).

## Tech Stack & Tools

*   **Frontend:**

    *   Framework: React for building a responsive and dynamic user interface.
    *   Styling: CSS frameworks (could include Bootstrap or Material UI) for a clean and professional design.

*   **Backend:**

    *   Framework: Express (Node.js) for handling server-side logic.
    *   Language: JavaScript/TypeScript.
    *   Database: PostgreSQL for robust, secure data storage, with encryption at rest and in transit.

*   **Authentication:**

    *   JWT (JSON Web Tokens) for session management.
    *   OAuth integration (Google login).

*   **AI Models & Libraries:**

    *   gpt_o3_mini – for providing automated guidance during the AHP wizard and other reasoning tasks.
    *   claude_3_7_sonnet – leveraging Anthropic’s advanced reasoning capabilities to assist in decision support and simulation.

*   **Development Tools:**

    *   VS Code as the primary IDE.
    *   Integration with plugins like Cursor and Windsurf for code enhancements.

*   **Additional Backend Scripting:**

    *   Python for potential data processing as needed.

## Non-Functional Requirements

*   **Performance:**

    *   The system should load dashboards and simulation results within a few seconds even under load.
    *   Real-time updates and responsiveness across all user interfaces.

*   **Security:**

    *   Strong encryption protocols for data at rest and in transit.
    *   Implementation of role-based access control.
    *   Secure API connections via HTTPS and SSL/TLS.

*   **Usability:**

    *   Intuitive, clean and user-friendly interfaces.
    *   Mobile compatibility to ensure access on various devices.
    *   Clear interactive dashboards and visualizations.

*   **Reliability & Scalability:**

    *   Regular backup schedules (daily with incremental backups).
    *   Ability to handle increasing numbers of projects and users without performance degradation.

*   **Compliance:**

    *   Adherence to best practices regarding data security and privacy.

## Constraints & Assumptions

*   The system assumes availability of reliable internet connectivity for all users.
*   Assumes that trusted third-party systems (e.g., Microsoft Project, JIRA) will use standard APIs for integration.
*   The AHP and the criteria evaluation relies on accurate user inputs; the system will provide guidance, but the quality of outcomes depends on data quality.
*   Deployment will be on a cloud-based environment (e.g., AWS or Google Cloud) that supports PostgreSQL and auto-backup features.
*   Assumes that selected AI models (gpt_o3_mini and claude_3_7_sonnet) are accessible and integrated with minimal latency.

## Known Issues & Potential Pitfalls

*   **Data Accuracy:**\
    Inaccurate inputs during the project submission or criteria setup phase may lead to skewed simulation results. To mitigate this, incorporate data validation and provide clear instructions during submission.
*   **Integration Challenges:**\
    Connecting seamlessly with external tools like Microsoft Project and JIRA may encounter API changes or rate limits. Keeping flexible integration points and using well-documented APIs can help reduce this risk.
*   **User Adoption:**\
    Different stakeholder groups may have varying levels of technical expertise. To address this, the interface must be intuitive and include tutorials or tooltips guiding them through the processes.
*   **Performance Under Load:**\
    As more projects and data are processed, the simulation engine and dashboard may suffer from performance slowdowns. Pre-deployment load testing and potential scaling strategies (like database indexing and caching) will be essential.
*   **Security Concerns:**\
    Handling sensitive project and selection data is critical. Regular security audits and adherence to robust encryption and role-based access measures are required to mitigate potential data breaches.

This PRD provides a complete and unambiguous guide to building the PMIS focused on project selection using AHP. It clearly outlines the workflow, features, technology stack, and critical requirements ensuring that subsequent technical documents can be generated smoothly without confusion.
