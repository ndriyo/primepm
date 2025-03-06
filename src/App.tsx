import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProjectSelection } from './pages/ProjectSelection';
import { ProjectDetails } from './pages/ProjectDetails';
import { Reports } from './pages/Reports';
import { ProjectProvider } from './contexts/ProjectContext';
import { CriteriaProvider } from './contexts/CriteriaContext';

function App() {
  return (
    <CriteriaProvider>
      <ProjectProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/selection" element={<ProjectSelection />} />
              <Route path="/details" element={<ProjectDetails />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </Layout>
        </Router>
      </ProjectProvider>
    </CriteriaProvider>
  );
}

export default App;
