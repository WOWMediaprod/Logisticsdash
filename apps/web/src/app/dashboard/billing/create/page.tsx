'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCompany } from '../../../../contexts/CompanyContext';
import { getApiUrl } from '../../../../lib/api-config';
import {
  FileText,
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';

interface Job {
  id: string;
  status: string;
  client: {
    name: string;
    code: string;
  };
  route: {
    code: string;
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  vehicle?: {
    regNo: string;
  };
  driver?: {
    name: string;
  };
}

interface Bill {
  jobId: string;
}

export default function CreateBillPage() {
  const router = useRouter();
  const { companyId } = useCompany();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jobId: '',
    amount: 0,
    currency: 'LKR',
    issuedDate: '',
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [jobsRes, billsRes] = await Promise.all([
          fetch(getApiUrl(`/api/v1/jobs?companyId=${companyId}&limit=200`)),
          fetch(getApiUrl(`/api/v1/bills?limit=200`)),
        ]);

        const [jobsData, billsData] = await Promise.all([
          jobsRes.json(),
          billsRes.json(),
        ]);

        if (jobsData.success) {
          setJobs(jobsData.data);
        }

        if (billsData.success) {
          setBills(billsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  // Filter out jobs that already have bills
  const availableJobs = jobs.filter(
    job => !bills.some(bill => bill.jobId === job.id)
  );

  // Auto-calculate amount based on km estimate (Rs. 150 per km)
  const selectedJob = jobs.find(job => job.id === formData.jobId);
  useEffect(() => {
    if (selectedJob && formData.amount === 0) {
      const estimatedAmount = (selectedJob.route.kmEstimate || 0) * 150;
      setFormData(prev => ({ ...prev, amount: estimatedAmount }));
    }
  }, [selectedJob, formData.amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jobId) {
      setError('Please select a job');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        jobId: formData.jobId,
        amount: Number(formData.amount),
        currency: formData.currency,
      };

      if (formData.issuedDate) {
        payload.issuedDate = new Date(formData.issuedDate).toISOString();
      }

      if (formData.dueDate) {
        payload.dueDate = new Date(formData.dueDate).toISOString();
      }

      if (formData.notes) {
        payload.notes = formData.notes;
      }

      console.log('Creating bill with payload:', payload);

      const response = await fetch(getApiUrl(`/api/v1/bills`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/billing');
      } else {
        setError(result.message || 'Failed to create bill');
      }
    } catch (err) {
      console.error('Failed to create bill:', err);
      setError('Failed to create bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create New Bill</h1>
              <p className="text-slate-600">Generate a bill for a completed job</p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {availableJobs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No jobs available for billing.</p>
              <p className="text-slate-500 text-sm mt-1">All jobs have been billed or no jobs exist.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Job *
                </label>
                <select
                  value={formData.jobId}
                  onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select a Job --</option>
                  {availableJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.client.name} ({job.client.code}) - {job.route.origin} → {job.route.destination} - {job.route.kmEstimate} km
                      {job.vehicle && ` - ${job.vehicle.regNo}`}
                    </option>
                  ))}
                </select>
                {selectedJob && (
                  <p className="mt-2 text-sm text-slate-600">
                    Driver: {selectedJob.driver?.name || 'Not assigned'} |
                    Vehicle: {selectedJob.vehicle?.regNo || 'Not assigned'} |
                    Status: {selectedJob.status}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (LKR) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                {formData.amount > 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    Total: {formatCurrency(formData.amount)}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LKR">Sri Lankan Rupee (LKR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="INR">Indian Rupee (INR)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Issued Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Issued Date
                  </label>
                  <input
                    type="date"
                    value={formData.issuedDate}
                    onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes or remarks..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Create Bill
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
