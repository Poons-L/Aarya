import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import NewApp from './NewApp.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { FeedbackProvider } from './components/Feedback';
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

// Service worker: installable app, offline shell, phone notifications.
// Production only, so the dev server never serves stale cached code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Service worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FeedbackProvider>
        <AuthProvider>
          <NewApp />
        </AuthProvider>
      </FeedbackProvider>
    </ErrorBoundary>
  </StrictMode>
);
