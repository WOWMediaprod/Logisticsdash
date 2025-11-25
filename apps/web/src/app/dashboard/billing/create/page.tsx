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
  pickupTs: string | null;
  loadingLocation?: string;
  deliveryAddress?: string;
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
    registrationNo?: string;
  };
  driver?: {
    name: string;
    firstName?: string;
    lastName?: string;
  };
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
  }>;
}

interface Bill {
  jobId: string;
}

interface CDNDetails {
  originLocation: string;
  destinationLocation: string;
  vehicleNo: string;
  driverName: string;
  dateOfHire: string;
  hasDelay: boolean;
  delayFactoryName?: string;
  timeEnteredFactory?: string;
  timeUnloadedAtPort?: string;
  delayDurationHours?: number;
  detentionCharges?: number;
  delayReason?: string;
  cdnDocumentId?: string;
}

export default function CreateBillPage() {
  const router = useRouter();
  const { companyId } = useCompany();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCdnDetails, setShowCdnDetails] = useState(false);

  const [formData, setFormData] = useState({
    jobId: '',
    amount: 0,
    currency: 'LKR',
    issuedDate: '',
    dueDate: '',
    notes: '',
  });

  const [cdnDetails, setCdnDetails] = useState<CDNDetails>({
    originLocation: '',
    destinationLocation: '',
    vehicleNo: '',
    driverName: '',
    dateOfHire: '',
    hasDelay: false,
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

  // Selected job (routes removed - manual amount entry required)
  const selectedJob = jobs.find(job => job.id === formData.jobId);

  // Auto-populate CDN details when job selected
  useEffect(() => {
    if (selectedJob) {
      const cdnDoc = selectedJob.documents?.find(doc => doc.type === 'CDN');

      setCdnDetails({
        originLocation: selectedJob.loadingLocation || '',
        destinationLocation: selectedJob.deliveryAddress || '',
        vehicleNo: selectedJob.vehicle?.registrationNo || selectedJob.vehicle?.regNo || '',
        driverName: selectedJob.driver?.name ||
                    `${selectedJob.driver?.firstName || ''} ${selectedJob.driver?.lastName || ''}`.trim(),
        dateOfHire: selectedJob.pickupTs ? new Date(selectedJob.pickupTs).toISOString().split('T')[0] : '',
        hasDelay: false,
        cdnDocumentId: cdnDoc?.id,
      });

      // Always auto-expand CDN section when job selected
      setShowCdnDetails(true);
    }
  }, [selectedJob]);

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

      // Add CDN details to metadata if populated
      if (cdnDetails.originLocation || cdnDetails.hasDelay) {
        payload.metadata = {
          cdnDetails: cdnDetails
        };
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
                      {job.client.name} ({job.client.code}) - {job.loadingLocation || 'N/A'} → {job.deliveryAddress || 'N/A'}
                      {job.vehicle && ` - ${job.vehicle.regNo}`}
                    </option>
                  ))}
                </select>
                {selectedJob && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold">Job ID:</span> {selectedJob.id}
                    </p>
                    <p className="text-sm text-slate-600">
                      Driver: {selectedJob.driver?.name || 'Not assigned'} |
                      Vehicle: {selectedJob.vehicle?.regNo || 'Not assigned'} |
                      Status: {selectedJob.status}
                    </p>
                  </div>
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

              {/* Driver Uploaded CDN Document */}
              {selectedJob && cdnDetails.cdnDocumentId && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Driver Uploaded CDN</h3>
                        <p className="text-sm text-green-700">Review the document before entering detention details</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await fetch(getApiUrl(`/api/v1/documents/${cdnDetails.cdnDocumentId}/download`));
                          const data = await response.json();
                          if (data.success && data.data.url) {
                            window.open(data.data.url, '_blank');
                          }
                        } catch (error) {
                          console.error('Failed to open CDN:', error);
                          alert('Failed to open CDN document');
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <FileText className="w-5 h-5" />
                      View CDN Document
                    </button>
                  </div>
                </div>
              )}

              {/* CDN & Detention Details */}
              {selectedJob && (
                <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        CDN & Detention Details
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCdnDetails(!showCdnDetails)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        {showCdnDetails ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 ml-7">
                      Capture: Origin/Destination, Vehicle, Driver, Date of Hire, Delay/Detention charges
                    </p>
                  </div>

                  {showCdnDetails && (
                    <div className="space-y-4 bg-white p-4 rounded-lg">
                      {/* Basic Route & Hire Info (Auto-populated) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Origin Location
                          </label>
                          <input
                            type="text"
                            value={cdnDetails.originLocation}
                            onChange={(e) => setCdnDetails({ ...cdnDetails, originLocation: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Dankotuwa"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Destination Location
                          </label>
                          <input
                            type="text"
                            value={cdnDetails.destinationLocation}
                            onChange={(e) => setCdnDetails({ ...cdnDetails, destinationLocation: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Colombo Port"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Vehicle Number
                          </label>
                          <input
                            type="text"
                            value={cdnDetails.vehicleNo}
                            onChange={(e) => setCdnDetails({ ...cdnDetails, vehicleNo: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., CAB-1234"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Driver Name
                          </label>
                          <input
                            type="text"
                            value={cdnDetails.driverName}
                            onChange={(e) => setCdnDetails({ ...cdnDetails, driverName: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., John Silva"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Date of Hire
                        </label>
                        <input
                          type="date"
                          value={cdnDetails.dateOfHire}
                          onChange={(e) => setCdnDetails({ ...cdnDetails, dateOfHire: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Delay/Detention Details */}
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id="hasDelay"
                            checked={cdnDetails.hasDelay}
                            onChange={(e) => setCdnDetails({ ...cdnDetails, hasDelay: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="hasDelay" className="text-sm font-medium text-slate-700">
                            There was a delay/detention
                          </label>
                        </div>

                        {cdnDetails.hasDelay && (
                          <div className="space-y-4 pl-6 border-l-2 border-red-200">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Factory Name (where delayed)
                              </label>
                              <input
                                type="text"
                                value={cdnDetails.delayFactoryName || ''}
                                onChange={(e) => setCdnDetails({ ...cdnDetails, delayFactoryName: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., ABC Ceramics Factory"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Time Entered Factory
                                </label>
                                <input
                                  type="datetime-local"
                                  value={cdnDetails.timeEnteredFactory || ''}
                                  onChange={(e) => {
                                    setCdnDetails({ ...cdnDetails, timeEnteredFactory: e.target.value });
                                    // Auto-calculate duration if both times are set
                                    if (e.target.value && cdnDetails.timeUnloadedAtPort) {
                                      const hours = (new Date(cdnDetails.timeUnloadedAtPort).getTime() - new Date(e.target.value).getTime()) / (1000 * 60 * 60);
                                      setCdnDetails(prev => ({ ...prev, delayDurationHours: Math.round(hours * 100) / 100 }));
                                    }
                                  }}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Time Unloaded at Port
                                </label>
                                <input
                                  type="datetime-local"
                                  value={cdnDetails.timeUnloadedAtPort || ''}
                                  onChange={(e) => {
                                    setCdnDetails({ ...cdnDetails, timeUnloadedAtPort: e.target.value });
                                    // Auto-calculate duration if both times are set
                                    if (e.target.value && cdnDetails.timeEnteredFactory) {
                                      const hours = (new Date(e.target.value).getTime() - new Date(cdnDetails.timeEnteredFactory).getTime()) / (1000 * 60 * 60);
                                      setCdnDetails(prev => ({ ...prev, delayDurationHours: Math.round(hours * 100) / 100 }));
                                    }
                                  }}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Delay Duration (hours)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cdnDetails.delayDurationHours || ''}
                                  onChange={(e) => setCdnDetails({ ...cdnDetails, delayDurationHours: parseFloat(e.target.value) || undefined })}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="6.25"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  Detention Charges (LKR)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cdnDetails.detentionCharges || ''}
                                  onChange={(e) => setCdnDetails({ ...cdnDetails, detentionCharges: parseFloat(e.target.value) || undefined })}
                                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="5000.00"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Delay Reason
                              </label>
                              <textarea
                                value={cdnDetails.delayReason || ''}
                                onChange={(e) => setCdnDetails({ ...cdnDetails, delayReason: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Waiting for loading clearance"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
