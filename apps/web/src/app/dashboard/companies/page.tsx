'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Trash2, Edit, Star, StarOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiUrl } from '../../../lib/api-config';
import { useCompany } from '../../../contexts/CompanyContext';

interface Company {
  id: string;
  name: string;
  role: string;
  isDefault: boolean;
  userCompanyId: string;
  createdAt: string;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isDefaultCompany, setIsDefaultCompany] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Assuming we have a user ID from auth context (placeholder for now)
  const userId = 'temp-user-id'; // TODO: Get from auth context

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/companies?userId=${userId}`));
      const result = await response.json();
      if (result.success) {
        setCompanies(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/companies?userId=${userId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName,
          isDefault: isDefaultCompany,
          role: 'ADMIN',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowAddModal(false);
        setNewCompanyName('');
        setIsDefaultCompany(false);
        fetchCompanies();
      } else {
        alert('Failed to add company');
      }
    } catch (error) {
      console.error('Failed to add company:', error);
      alert('Failed to add company');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefault = async (companyId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/v1/companies/${companyId}/set-default?userId=${userId}`),
        {
          method: 'POST',
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchCompanies();
      } else {
        alert('Failed to set default company');
      }
    } catch (error) {
      console.error('Failed to set default company:', error);
      alert('Failed to set default company');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to remove "${companyName}" from your account?`)) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/v1/companies/${companyId}?userId=${userId}`),
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchCompanies();
      } else {
        alert('Failed to remove company');
      }
    } catch (error) {
      console.error('Failed to remove company:', error);
      alert('Failed to remove company');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies</h1>
              <p className="text-gray-600">Manage your company accounts</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>

        {/* Companies List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-600 mb-4">Add your first company to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Company
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {companies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                        {company.isDefault && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-800" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Role: {company.role} • Added {new Date(company.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!company.isDefault && (
                      <button
                        onClick={() => handleSetDefault(company.id)}
                        disabled={processing}
                        className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Set as default"
                      >
                        <StarOff className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCompany(company.id, company.name)}
                      disabled={processing}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove company"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Company Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Company</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={processing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefaultCompany}
                    onChange={(e) => setIsDefaultCompany(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={processing}
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                    Set as default company
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCompanyName('');
                    setIsDefaultCompany(false);
                  }}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCompany}
                  disabled={processing || !newCompanyName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Adding...' : 'Add Company'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
