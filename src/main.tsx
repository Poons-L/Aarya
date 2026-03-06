import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import NewApp from './NewApp.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <NewApp />
      </NavigationProvider>
    </AuthProvider>
  </StrictMode>
);
