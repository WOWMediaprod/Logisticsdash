'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  LogOut,
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  DollarSign,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

interface Job {
  id: string;
  status: string;
  priority: string;
  jobType: string;
  pickupTs: string | null;
  etaTs: string | null;
  dropTs: string | null;
  specialNotes: string | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    code: string | null;
  };
  route?: {
    id: string;
    code: string;
    origin: string;
    destination: string;
    kmEstimate: number | null;
  };
  vehicle?: {
    id: string;
    regNo: string;
    class: string;
  };
  container?: {
    id: string;
    iso: string;
    size: string;
  };
  waypoints?: Array<{
    id: string;
    name: string;
    type: string;
    sequence: number;
    isCompleted: boolean;
    completedAt: string | null;
    address: string | null;
  }>;
  earnings?: Array<{
    id: string;
    totalAmount: number;
    currency: string;
    status: string;
    paidAt: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-200',
  AT_PICKUP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOADED: 'bg-orange-100 text-orange-800 border-orange-200',
  AT_DELIVERY: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  NORMAL: 'bg-blue-500',
  LOW: 'bg-gray-500',
};

export default function DriverDashboardPage() {
  const router = useRouter();
  const [driver, setDriver] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  useEffect(() => {
    // Check if driver is logged in
    const driverSession = localStorage.getItem('driver_session');
    if (!driverSession) {
      router.push('/driver');
      return;
    }

    const parsedDriver = JSON.parse(driverSession);
    setDriver(parsedDriver);

    // Fetch driver's jobs
    fetchDriverJobs(parsedDriver.id, parsedDriver.companyId);
  }, []);

  useEffect(() => {
    // Filter jobs based on selected tab
    if (filter === 'all') {
      setFilteredJobs(jobs);
    } else if (filter === 'active') {
      setFilteredJobs(jobs.filter(j => ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(j.status)));
    } else if (filter === 'completed') {
      setFilteredJobs(jobs.filter(j => j.status === 'COMPLETED'));
    }
  }, [filter, jobs]);

  const fetchDriverJobs = async (driverId: string, companyId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/v1/drivers/${driverId}/jobs?companyId=${companyId}`));
      const result = await response.json();

      if (result.success) {
        setJobs(result.data);

        // Find the current active job (first ASSIGNED or IN_TRANSIT job)
        const active = result.data.find((j: Job) =>
          ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(j.status)
        );
        setCurrentJob(active || null);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_session');
    router.push('/driver');
  };

  const handleJobClick = (jobId: string) => {
    router.push(`/driver/jobs/${jobId}`);
  };

  const getCompletedWaypoints = (waypoints?: Array<{isCompleted: boolean}>) => {
    if (!waypoints) return { completed: 0, total: 0 };
    return {
      completed: waypoints.filter(w => w.isCompleted).length,
      total: waypoints.length,
    };
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-LK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{driver?.name || 'Driver'}</h1>
                <p className="text-sm text-gray-600">{driver?.licenseNo || 'License Number'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {jobs.filter(j => j.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {jobs.filter(j => ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(j.status)).length}
            </p>
          </div>
        </div>

        {/* Current Job Card */}
        {currentJob ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Truck className="w-6 h-6" />
                  Current Job
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_COLORS[currentJob.status]} bg-white`}>
                  {currentJob.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-blue-100 text-sm">Client</p>
                    <p className="text-white font-semibold text-lg">{currentJob.client?.name || 'N/A'}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[currentJob.priority]} ring-4 ring-white/30`} />
                </div>

                <div className="flex items-center gap-2 text-white mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{currentJob.route?.origin || 'N/A'}</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{currentJob.route?.destination || 'N/A'}</span>
                </div>

                {currentJob.waypoints && currentJob.waypoints.length > 0 && (
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {getCompletedWaypoints(currentJob.waypoints).completed} / {getCompletedWaypoints(currentJob.waypoints).total} waypoints completed
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleJobClick(currentJob.id)}
                className="w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                View Job Details
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Job</h3>
            <p className="text-gray-600">You don't have any active jobs at the moment.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${
                filter === 'active'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Active ({jobs.filter(j => ['ASSIGNED', 'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY'].includes(j.status)).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Completed ({jobs.filter(j => j.status === 'COMPLETED').length})
            </button>
          </div>

          {/* Jobs List */}
          <div className="p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No jobs found</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleJobClick(job.id)}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{job.client?.name || 'Unknown Client'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{job.route?.origin || 'N/A'}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{job.route?.destination || 'N/A'}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${STATUS_COLORS[job.status]}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-600">
                        {job.pickupTs && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(job.pickupTs)}</span>
                          </div>
                        )}
                        {job.vehicle && (
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            <span>{job.vehicle.regNo}</span>
                          </div>
                        )}
                      </div>
                      {job.earnings && job.earnings.length > 0 && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.earnings[0].totalAmount.toLocaleString()} {job.earnings[0].currency}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
