'use client';

import { useRouter } from 'next/navigation';
import { useCompany } from '../../../contexts/CompanyContext';
import { useClientAuth } from '../../../contexts/ClientAuthContext';
import { JobWizard } from '../../../components/JobWizard';

export default function ClientRequestPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { clientId, clientName, clientCode } = useClientAuth();

  if (!companyId || !clientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-gray-600">Please log in</p>
      </div>
    );
  }

  return (
    <JobWizard
      mode="client"
      companyId={companyId}
      clientId={clientId}
      clientName={clientName ?? undefined}
      clientCode={clientCode ?? undefined}
      onSuccess={(requestId) => {
        router.push('/client/dashboard');
      }}
      onCancel={() => {
        router.push('/client/dashboard');
      }}
    />
  );
}
