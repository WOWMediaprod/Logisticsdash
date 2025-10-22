'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCompany } from '../../../contexts/CompanyContext';
import { useClientAuth } from '../../../contexts/ClientAuthContext';
import { getApiUrl } from '../../../lib/api-config';
import { ArrowLeft, Package, Clock, CheckCircle, MapPin, Truck, AlertCircle } from 'lucide-react';

interface Job {
  id: string;
  status: string;
  jobType: string;
  priority: string;
  specialNotes?: string;
  pickupTs?: string;
  etaTs?: string;
  client?: {
    name: string;
    code: string;
  };
  route?: {
    code: string;
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  container?: {
    iso: string;
    size: string;
  };
  driver?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    regNo: string;
  };
}

interface JobRequest {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  requestedPickupTs: string | null;
  requestedDropTs: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt: string;
  reviewNotes: string | null;
  client?: {
    name: string;
    code: string;
  };
  route?: {
    code: string;
    origin: string;
    destination: string;
  };
}

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-yellow-100 text-yellow-800',
  AT_PICKUP: 'bg-purple-100 text-purple-800',
  LOADED: 'bg-indigo-100 text-indigo-800',
  AT_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-600',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
};

export default function ClientDashboardPage() {
  const { companyId } = useCompany();
  const { clientId } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'requests'>('jobs');

  useEffect(() => {
    if (!companyId || !clientId) return;

    const loadData = async () => {
      setLoading(true);

      try {
        // Load jobs for this client
        const jobsResponse = await fetch(getApiUrl(`/api/v1/jobs?companyId=${companyId}&clientId=${clientId}&limit=50`));
        const jobsResult = await jobsResponse.json();
        if (jobsResult.success) {
          setJobs(jobsResult.data);
        }

        // Load job requests for this client
        const requestsResponse = await fetch(getApiUrl(`/api/v1/job-requests?companyId=${companyId}&clientId=${clientId}&limit=50`));
        const requestsResult = await requestsResponse.json();
        if (requestsResult.success) {
          setJobRequests(requestsResult.data);
        }
      } catch (error) {
        console.error('Failed to load client data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, clientId]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/client"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Client Portal
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Track your jobs and requests in real-time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => !['COMPLETED', 'CANCELLED'].includes(j.status)).length}
                </p>
              </div>
              <Truck className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobRequests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'IN_TRANSIT').length}
                </p>
              </div>
              <Package className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Requests ({jobRequests.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs yet</h3>
                    <p className="text-gray-600 mb-4">Submit a job request to get started</p>
                    <Link
                      href="/client/request"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Submit Request
                    </Link>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          <span className={`text-sm font-semibold ${priorityColors[job.priority]}`}>
                            {job.priority}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{job.jobType.replace('_', ' ')}</span>
                      </div>

                      {job.route && (
                        <div className="flex items-center gap-2 mb-4 text-gray-700">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">{job.route.origin}</span>
                          <span>→</span>
                          <span className="font-medium">{job.route.destination}</span>
                          <span className="text-sm text-gray-500">({job.route.kmEstimate} km)</span>
                        </div>
                      )}

                      {job.container && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">Container:</span> {job.container.iso} ({job.container.size})
                          </p>
                        </div>
                      )}

                      {(job.driver || job.vehicle) && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                          {job.driver && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Driver:</span> {job.driver.name}
                              {job.driver.phone && ` - ${job.driver.phone}`}
                            </p>
                          )}
                          {job.vehicle && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Vehicle:</span> {job.vehicle.regNo}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Pickup:</span>
                          <span className="ml-2 font-medium text-gray-900">{formatDate(job.pickupTs)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">ETA:</span>
                          <span className="ml-2 font-medium text-gray-900">{formatDate(job.etaTs)}</span>
                        </div>
                      </div>

                      {job.specialNotes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {job.specialNotes}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                {jobRequests.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
                    <p className="text-gray-600 mb-4">Submit your first job request</p>
                    <Link
                      href="/client/request"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Submit Request
                    </Link>
                  </div>
                ) : (
                  jobRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{request.title}</h3>
                          {request.description && (
                            <p className="text-sm text-gray-600">{request.description}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>

                      {request.route && (
                        <div className="flex items-center gap-2 mb-4 text-gray-700">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">{request.route.origin}</span>
                          <span>→</span>
                          <span className="font-medium">{request.route.destination}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2 font-medium text-gray-900">{formatDate(request.createdAt)}</span>
                        </div>
                        <span className={`font-semibold ${priorityColors[request.priority]}`}>
                          {request.priority} Priority
                        </span>
                      </div>

                      {request.reviewNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                          <strong>Review Notes:</strong> {request.reviewNotes}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
