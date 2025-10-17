'use client';

import { CompanyProvider } from '../../contexts/CompanyContext';
import { ClientAuthProvider } from '../../contexts/ClientAuthContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <ClientAuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          {children}
        </div>
      </ClientAuthProvider>
    </CompanyProvider>
  );
}