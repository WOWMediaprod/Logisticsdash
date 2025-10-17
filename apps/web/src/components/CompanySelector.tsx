'use client';

import { useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';

export function CompanySelector() {
  const { companyId, setCompanyId } = useCompany();
  const [inputValue, setInputValue] = useState(companyId || '');
  const [showSelector, setShowSelector] = useState(!companyId);

  const predefinedCompanies = [
    { id: 'cmfp73bw20000vjy0pjsfhykz', name: 'Demo Logistics Company' },
    { id: 'cmfmbojit0000vj0ch078cnbu', name: 'Legacy Demo Company' },
  ];

  const handleSetCompany = (id: string) => {
    setCompanyId(id);
    setInputValue(id);
    setShowSelector(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSetCompany(inputValue.trim());
    }
  };

  if (!showSelector && companyId) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowSelector(true)}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md border"
        >
          Change Company ({companyId.slice(-8)})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Select Company</h2>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-600">
            Current: <code className="bg-gray-100 px-1 rounded">{companyId || 'None'}</code>
          </p>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div>ENV: NEXT_PUBLIC_DEV_COMPANY_ID = {process.env.NEXT_PUBLIC_DEV_COMPANY_ID}</div>
            <div>ENV: NEXT_PUBLIC_COMPANY_ID = {process.env.NEXT_PUBLIC_COMPANY_ID || 'undefined'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Quick Select:</h3>
          {predefinedCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSetCompany(company.id)}
              className="w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">{company.name}</div>
              <div className="text-sm text-gray-500 font-mono">{company.id}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <form onSubmit={handleCustomSubmit}>
            <label className="block text-sm font-medium mb-2">
              Custom Company ID:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter company ID"
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Set
              </button>
            </div>
          </form>
        </div>

        {companyId && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setShowSelector(false)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Continue with Current Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
}