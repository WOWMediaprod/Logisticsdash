'use client';

import { useRouter } from 'next/navigation';
import { useCompany } from '../../../contexts/CompanyContext';
import { JobWizard } from '../../../components/JobWizard';

export default function AdminCreateJobPage() {
  const router = useRouter();
  const { companyId } = useCompany();

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-gray-600">Company not selected</p>
      </div>
    );
  }

  return (
    <JobWizard
      mode="admin"
      companyId={companyId}
      onSuccess={(jobId) => {
        router.push(`/dashboard/jobs/${jobId}`);
      }}
      onCancel={() => {
        router.push('/dashboard');
      }}
    />
  );
}
