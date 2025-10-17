'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Package,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Truck,
  FileText,
  Phone
} from 'lucide-react';
import { useCompany } from '../../../contexts/CompanyContext';

interface Job {
  id: string;
  title: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'AT_PICKUP' | 'LOADED' | 'AT_DELIVERY' | 'COMPLETED';
  requestId?: string;
  requestStatus?: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'DECLINED';
  pickup: {
    address: string;
    date: string;
    time?: string;
  };
  delivery: {
    address: string;
    date: string;
    time?: string;
  };
  driver?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    regNo: string;
    make: string;
    model: string;
  };
  estimatedValue: string;
  currentLocation?: string;
  progress: number;
  timeline: TimelineEvent[];
}

interface JobRequest {
  id: string;
  title: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  submittedDate: string;
  reviewedBy?: string;
  reviewNotes?: string;
  pickup: {
    address: string;
    requestedDate: string;
  };
  delivery: {
    address: string;
    requestedDate: string;
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'status' | 'location' | 'note' | 'issue';
  location?: string;
}

export default function TrackingPage() {
  const { companyId } = useCompany();
  const [activeTab, setActiveTab] = useState<'jobs' | 'requests'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadJobs = async () => {
      if (!companyId) {
        setJobs([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`/api/v1/jobs?limit=50`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!cancelled) {
          const json = await response.json();
          if (json.success) {
            // Transform backend job data to match frontend interface
            const transformedJobs: Job[] = json.data.map((job: any) => ({
              id: job.id,
              title: `${job.jobType} - ${job.route?.origin || 'Unknown'} to ${job.route?.destination || 'Unknown'}`,
              status: job.status,
              pickup: {
                address: job.route?.origin || 'Unknown',
                date: job.pickupTs ? new Date(job.pickupTs).toISOString().split('T')[0] : '',
                time: job.pickupTs ? new Date(job.pickupTs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
              },
              delivery: {
                address: job.route?.destination || 'Unknown',
                date: job.etaTs ? new Date(job.etaTs).toISOString().split('T')[0] : '',
                time: job.etaTs ? new Date(job.etaTs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
              },
              driver: job.driver ? {
                name: job.driver.name,
                phone: job.driver.phone
              } : undefined,
              vehicle: job.vehicle ? {
                regNo: job.vehicle.regNo,
                make: job.vehicle.make || '',
                model: job.vehicle.model || ''
              } : undefined,
              estimatedValue: '0',
              currentLocation: job.route?.origin || 'Unknown',
              progress: calculateProgress(job.status),
              timeline: job.statusEvents?.map((event: any, index: number) => ({
                id: event.id || `${index}`,
                timestamp: event.timestamp,
                title: event.code,
                description: event.note || '',
                type: 'status' as const,
                location: event.lat && event.lng ? `${event.lat}, ${event.lng}` : undefined
              })) || []
            }));
            setJobs(transformedJobs);
          }
        }
      } catch (error) {
        console.error('Failed to load jobs', error);
        if (!cancelled) {
          setJobs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const calculateProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      'CREATED': 10,
      'ASSIGNED': 20,
      'AT_PICKUP': 40,
      'LOADED': 50,
      'IN_TRANSIT': 70,
      'AT_DELIVERY': 90,
      'DELIVERED': 95,
      'COMPLETED': 100,
      'CANCELLED': 0
    };
    return progressMap[status] || 0;
  };

  const filteredJobs = jobs.filter(job =>
    job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Please select a company to view tracking information.
          </p>
        </div>
      </main>
    );
  }

  if (loading && jobs.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading jobs...</span>
        </div>
      </main>
    );
  }

  if (selectedJob) {
    return <JobDetailView job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/client"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Shipments</h1>
        <p className="text-gray-600">Monitor your active jobs and pending requests</p>
      </motion.div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex border border-gray-300 rounded-lg">
            <div className="px-4 py-2 font-medium bg-blue-600 text-white rounded-lg">
              Active Jobs ({jobs.length})
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or title..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => setSelectedJob(job)}
            />
          ))}
          {filteredJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No jobs found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AT_PICKUP': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOADED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AT_DELIVERY': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{job.id}</h3>
            <p className="text-sm text-gray-600">{job.title}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Pickup</p>
            <p className="text-gray-600">{job.pickup.address}</p>
            <p className="text-gray-500">{job.pickup.date} {job.pickup.time}</p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Delivery</p>
            <p className="text-gray-600">{job.delivery.address}</p>
            <p className="text-gray-500">{job.delivery.date} {job.delivery.time}</p>
          </div>
        </div>
      </div>

      {job.currentLocation && (
        <div className="flex items-center space-x-2 mb-3">
          <Truck className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-600">Current location: {job.currentLocation}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {job.driver && (
            <span>Driver: {job.driver.name}</span>
          )}
          {job.vehicle && (
            <span>Vehicle: {job.vehicle.regNo}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{job.progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}

function RequestCard({ request }: { request: JobRequest }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DECLINED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.id}</h3>
            <p className="text-sm text-gray-600">{request.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Pickup</p>
            <p className="text-gray-600">{request.pickup.address}</p>
            <p className="text-gray-500">Requested: {request.pickup.requestedDate}</p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">Delivery</p>
            <p className="text-gray-600">{request.delivery.address}</p>
            <p className="text-gray-500">Requested: {request.delivery.requestedDate}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Submitted: {request.submittedDate}</span>
        {request.reviewedBy && (
          <span>Reviewed by: {request.reviewedBy}</span>
        )}
      </div>

      {request.reviewNotes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Review Notes:</span> {request.reviewNotes}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function JobDetailView({ job, onBack }: { job: Job; onBack: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tracking
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.id}</h1>
            <p className="text-gray-600">{job.title}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{job.progress}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Timeline</h2>
            <div className="space-y-4">
              {job.timeline.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                      {event.type === 'status' && <CheckCircle className="w-4 h-4" />}
                      {event.type === 'location' && <MapPin className="w-4 h-4" />}
                      {event.type === 'note' && <FileText className="w-4 h-4" />}
                      {event.type === 'issue' && <AlertCircle className="w-4 h-4" />}
                    </div>
                    {index < job.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                      {event.location && <span>📍 {event.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Route Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 text-green-600 mr-2" />
                  Pickup Location
                </h4>
                <p className="text-gray-600 mb-1">{job.pickup.address}</p>
                <p className="text-sm text-gray-500">
                  Scheduled: {job.pickup.date} {job.pickup.time}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 text-red-600 mr-2" />
                  Delivery Location
                </h4>
                <p className="text-gray-600 mb-1">{job.delivery.address}</p>
                <p className="text-sm text-gray-500">
                  Scheduled: {job.delivery.date} {job.delivery.time}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="mt-1">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Estimated Value:</span>
                <p className="text-gray-900">R{job.estimatedValue}</p>
              </div>
              {job.currentLocation && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Current Location:</span>
                  <p className="text-gray-900">{job.currentLocation}</p>
                </div>
              )}
            </div>
          </div>

          {job.driver && (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Driver Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{job.driver.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Contact:</span>
                  <a
                    href={`tel:${job.driver.phone}`}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {job.driver.phone}
                  </a>
                </div>
                {job.vehicle && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Vehicle:</span>
                    <p className="text-gray-900">
                      {job.vehicle.make} {job.vehicle.model} ({job.vehicle.regNo})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Progress</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}