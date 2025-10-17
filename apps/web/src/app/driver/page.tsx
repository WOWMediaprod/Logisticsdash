"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Package,
  Calendar,
  TrendingUp
} from "lucide-react";

interface DriverStats {
  monthlyCompleted: number;
  monthlyDistance: number;
  currentMonth: string;
}

interface Job {
  id: string;
  status: string;
  client?: {
    name: string;
    code: string;
  };
  route?: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  pickupTs?: string;
  etaTs?: string;
  completedAt?: string;
}

// Will be fetched from API

const mockCompletedJobs: Job[] = [
  {
    id: 'JOB-2024-0155',
    status: 'COMPLETED',
    client: { name: 'African Steel Corp', code: 'ASC' },
    route: { origin: 'Cape Town Port', destination: 'Johannesburg', kmEstimate: 1200 },
    completedAt: '2024-09-21T14:20:00Z'
  },
  {
    id: 'JOB-2024-0154',
    status: 'COMPLETED',
    client: { name: 'Metro Logistics', code: 'MTL' },
    route: { origin: 'Pretoria', destination: 'Polokwane', kmEstimate: 280 },
    completedAt: '2024-09-20T11:45:00Z'
  },
  {
    id: 'JOB-2024-0153',
    status: 'COMPLETED',
    client: { name: 'Coastal Shipping Co', code: 'CSC' },
    route: { origin: 'Durban Port', destination: 'Bloemfontein', kmEstimate: 485 },
    completedAt: '2024-09-19T16:15:00Z'
  }
];

const mockStats: DriverStats = {
  monthlyCompleted: 8,
  monthlyDistance: 4520,
  currentMonth: 'September'
};

export default function DriverPortal() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set initial time on client mount
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || 'https://192.168.1.20:3004';
        const companyId = 'company-123'; // Would come from auth context

        // Fetch current active job for driver
        const jobsResponse = await fetch(`${backendUrl}/api/v1/jobs?companyId=${companyId}&limit=10&status=ASSIGNED`);
        const jobsData = await jobsResponse.json();

        if (jobsData.success && jobsData.data.length > 0) {
          // Get the first assigned job for this driver
          const assignedJob = jobsData.data.find((job: any) => job.status === 'ASSIGNED' || job.status === 'IN_TRANSIT');
          if (assignedJob) {
            setCurrentJob(assignedJob);
          }
        }

        // Fetch completed jobs
        const completedResponse = await fetch(`${backendUrl}/api/v1/jobs?companyId=${companyId}&limit=5&status=COMPLETED`);
        const completedData = await completedResponse.json();

        if (completedData.success) {
          setCompletedJobs(completedData.data || []);
        }

      } catch (error) {
        console.error('Failed to fetch driver data:', error);
        // Fallback to showing empty state
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, []);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Mobile Status Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-center px-4 py-2">
          <span className="text-sm font-medium text-gray-700">
            {currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
          </span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Driver Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900">John Mthembu</h1>
          <p className="text-gray-600">DRV-001 • GP 123 456</p>
        </motion.div>

        {/* Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockStats.monthlyCompleted}</p>
                <p className="text-sm text-gray-600">{mockStats.currentMonth} Jobs</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockStats.monthlyDistance.toLocaleString()}</p>
                <p className="text-sm text-gray-600">km Driven</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Job */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-3">Current Job</h2>

          {currentJob ? (
            <Link href={`/driver/${currentJob.id}`}>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{currentJob.id}</h3>
                    <p className="text-blue-100">{currentJob.client?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20`}>
                    {currentJob.status}
                  </span>
                </div>

                {currentJob.route && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Route</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{currentJob.route.origin}</p>
                      <p className="text-blue-200">↓ {currentJob.route.kmEstimate} km</p>
                      <p className="font-medium">{currentJob.route.destination}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Clock className="w-3 h-3" />
                      <span>Pickup</span>
                    </div>
                    <p className="font-medium">{formatTime(currentJob.pickupTs)}</p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Clock className="w-3 h-3" />
                      <span>Delivery ETA</span>
                    </div>
                    <p className="font-medium">{formatTime(currentJob.etaTs)}</p>
                  </div>
                </div>

                <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <span className="font-semibold">Tap to Start Job →</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active job assigned</p>
            </div>
          )}
        </motion.div>

        {/* Completed Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Completions</h2>

          <div className="space-y-3">
            {completedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.id}</h3>
                    <p className="text-sm text-gray-600">{job.client?.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Completed</span>
                  </div>
                </div>

                {job.route && (
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">{job.route.origin}</span>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="font-medium">{job.route.destination}</span>
                    <span className="text-gray-500 ml-2">({job.route.kmEstimate} km)</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Completed: {formatDate(job.completedAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer space for mobile navigation */}
        <div className="h-20" />
      </div>
    </main>
  );
}