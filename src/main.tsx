import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/useAuth';
import { useProjectStore } from './store/projectStore';
import './index.css';

if (import.meta.env.DEV) {
  // Expose store for dev-time debugging (e.g. from devtools console).
  (window as unknown as { __store: typeof useProjectStore }).__store = useProjectStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
