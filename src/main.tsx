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
      // textContent, not innerHTML: error messages can contain user-entered data
      const entry = document.createElement('div');
      entry.style.cssText = 'border-bottom: 1px solid #ccc; padding: 8px; font-family: monospace; font-size: 12px;';
      entry.textContent = `${new Date().toISOString()}: ${args.join(' ')}`;
      errorDiv.appendChild(entry);
    }
  } catch {
    // Ignore logging errors
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NewApp />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
