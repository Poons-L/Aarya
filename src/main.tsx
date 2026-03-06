import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import NewApp from './NewApp.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', {
    message,
    source,
    lineno,
    colno,
    error: error?.stack
  });
  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError.apply(console, args);
  try {
    const errorDiv = document.getElementById('error-log');
    if (errorDiv) {
      errorDiv.innerHTML += `<div style="border-bottom: 1px solid #ccc; padding: 8px; font-family: monospace; font-size: 12px;">${new Date().toISOString()}: ${args.join(' ')}</div>`;
    }
  } catch (e) {
    // Ignore logging errors
  }
};

console.log('Re.Me App Starting - Version:', import.meta.env.MODE);
console.log('Supabase URL available:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NewApp />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
