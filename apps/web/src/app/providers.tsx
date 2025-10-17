'use client';

import { CompanyProvider } from '../contexts/CompanyContext';
import { SocketProvider } from '../contexts/SocketContext';
import ErrorBoundary from '../components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <CompanyProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </CompanyProvider>
    </ErrorBoundary>
  );
}
