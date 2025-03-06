# PrimePM - Project Portfolio Management Tool

PrimePM is a comprehensive project portfolio management application that helps organizations manage, prioritize, and select projects based on customizable criteria.

## Features

### Dynamic Project Selection Criteria

- **Customizable Criteria**: Define your own project evaluation criteria beyond the default set (revenue impact, policy impact, budget, resources, complexity).
- **Criteria Management**: Add, edit, and remove criteria as needed through an intuitive management interface.
- **Inverse Scale Support**: Configure whether higher or lower values are preferable for each criterion (e.g., higher revenue is good, but lower cost is better).
- **Persistent Settings**: Criteria definitions are saved in the browser's local storage for persistence between sessions.

### Project Visualization

- **Matrix View**: Compare projects across different criteria using an interactive scatter plot where axes can be dynamically changed.
- **Card View**: Browse projects in a card-based interface for quick overview and selection.
- **Table View**: Detailed tabular view with dynamic columns based on defined criteria, allowing for custom weighting and scoring.

### Project Management

- **Filtering & Sorting**: Filter projects by status, department, and search terms. Sort by various criteria or scores.
- **Scoring System**: Calculate project scores based on weighted criteria, helping prioritize projects objectively.
- **Status Tracking**: Track project status (planning, in-progress, completed, on-hold) throughout the lifecycle.

### Dashboard & Reporting

- **Project Overview**: Get a quick view of your project portfolio status and health.
- **Risk Analysis**: Visualize project risk factors using quadrant charts.
- **Top Projects**: Identify highest-scoring projects based on your criteria weightings.

## Technical Implementation

PrimePM is built using modern web technologies:

- **React**: Frontend framework for building the user interface
- **TypeScript**: For type-safe code and better developer experience
- **Tailwind CSS**: For responsive, utility-first styling
- **Recharts**: For interactive data visualization
- **Context API**: For state management across components

## Project Structure

- `/src/components/`: Reusable UI components
  - `/dashboard/`: Dashboard-specific components
  - `/layout/`: Layout components like sidebar and main container
  - `/project-selection/`: Components for the project selection functionality
- `/src/contexts/`: React contexts for state management
  - `ProjectContext.tsx`: Manages project data and selection state
  - `CriteriaContext.tsx`: Manages custom criteria definitions
- `/src/data/`: Data models and sample data
- `/src/pages/`: Main application pages

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

## Using the Criteria Management System

1. Navigate to the "Project Selection" page
2. Click the "Manage Criteria" button
3. From here you can:
   - View all existing criteria
   - Add new criteria with the "Add New Criterion" button
   - Edit existing criteria by clicking the "Edit" button
   - Delete custom criteria by clicking the "Delete" button (note: default criteria cannot be deleted)
   - Reset to default criteria with the "Reset to Defaults" button

When defining criteria, consider:
- **Key**: A unique identifier for the criterion (camelCase, no spaces)
- **Label**: User-friendly name displayed in the UI
- **Description**: Detailed explanation of what the criterion measures
- **Inverse Scale**: Whether lower values are better (e.g., for cost, risk, etc.)

## License

[MIT License](LICENSE)
