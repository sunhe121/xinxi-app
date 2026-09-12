import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = (import.meta as any).env?.CLIENT_BASE_PATH || '/';

function SimpleErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <h2 style={{ color: '#d32f2f' }}>应用出错了</h2>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          color: '#666',
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: '1px solid #ccc',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        重试
      </button>
    </div>
  );
}

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <div>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <SimpleErrorFallback
              error={error as Error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
