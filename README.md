# PrimePM - Project Management Application

PrimePM is a project management application built with React and Next.js, designed to help organizations manage, prioritize, and visualize their project portfolio.

## Features

- **Dashboard**: Overview of project metrics, risk assessments, and top projects
- **Project Selection**: Matrix view, table view, and card view for selecting projects based on criteria
- **Project Details**: Detailed view of a specific project with timeline and criteria analysis
- **Reports**: Generate various reports by department, status, criteria, or timeline

## Tech Stack

- **Frontend Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **Charts and Visualizations**: Recharts
- **UI Components**: Headless UI and Heroicons
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (version 18 or newer)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd primepm
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## Build for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Project Structure

- `/app`: Next.js App Router pages and layouts
- `/components`: Reusable React components
- `/app/contexts`: React Context providers
- `/src/data`: Data models and mock data
- `/src/pages`: Original page components
- `/public`: Static assets

## Migration Notes

This project was migrated from a Vite-based React application to Next.js with the App Router. The migration includes:

1. Converting the routing system from React Router to Next.js App Router
2. Setting up server-side rendering (SSR) capabilities
3. Organizing components in the Next.js preferred structure
4. Maintaining the existing features and functionality
