import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = (import.meta as unknown as { env: Record<string, string> }).env?.CLIENT_BASE_PATH || '/';

const ErrorFallback = ({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#4A3F3A',
      backgroundColor: '#FFF8F3',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
        出错了
      </h2>
      <p style={{ fontSize: '14px', color: '#8B7D75', marginBottom: '20px', maxWidth: '320px', wordBreak: 'break-word' }}>
        {error?.message || '发生了未知错误'}
      </p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '10px 24px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: '#FF8C69',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          minHeight: '40px',
        }}
      >
        重试
      </button>
    </div>
  );
};

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback
              error={error as Error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
