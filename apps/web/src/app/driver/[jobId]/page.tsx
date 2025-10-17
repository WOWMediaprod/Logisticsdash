"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  FileText,
  Navigation,
  Phone,
  AlertTriangle
} from "lucide-react";
import { useCompany } from "../../../contexts/CompanyContext";

type Job = {
  id: string;
  status: string;
  pickupTs?: string;
  etaTs?: string;
  specialNotes?: string;
  client?: {
    name: string;
    code: string;
  };
  route?: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
};

const statusFlow = [
  { status: 'ASSIGNED', action: 'Start Journey', next: 'IN_TRANSIT', color: 'bg-blue-600' },
  { status: 'IN_TRANSIT', action: 'Arrived at Pickup', next: 'AT_PICKUP', color: 'bg-yellow-600' },
  { status: 'AT_PICKUP', action: 'Container Loaded', next: 'LOADED', color: 'bg-purple-600' },
  { status: 'LOADED', action: 'Arrived at Delivery', next: 'AT_DELIVERY', color: 'bg-indigo-600' },
  { status: 'AT_DELIVERY', action: 'Container Delivered', next: 'COMPLETED', color: 'bg-orange-600' },
  { status: 'COMPLETED', action: 'Job Complete', next: null, color: 'bg-green-600' }
];

export default function DriverJobPage() {
  const params = useParams();
  const { companyId } = useCompany();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || 'https://192.168.1.20:3004';
        const fallbackCompanyId = 'company-123'; // Use hardcoded company ID for now
        const actualCompanyId = companyId || fallbackCompanyId;

        console.log('Fetching job:', jobId, 'for company:', actualCompanyId);
        const response = await fetch(`${backendUrl}/api/v1/jobs/${jobId}?companyId=${actualCompanyId}`);
        const data = await response.json();

        console.log('Job fetch response:', data);

        if (data.success) {
          setJob(data.data);
          startLocationTracking();
        } else {
          console.error('Failed to fetch job:', data.message);
        }
      } catch (error) {
        console.error("Failed to fetch job", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, companyId]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;

    setIsTracking(true);
    navigator.geolocation.watchPosition(
      (position) => {
        // Send location update automatically
        sendLocationUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => console.warn("Location error:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const sendLocationUpdate = async (location: { lat: number; lng: number }) => {
    if (!job?.driver?.id) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || 'https://192.168.1.20:3004';
      await fetch(`${backendUrl}/api/v1/tracking/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          driverId: job.driver.id,
          lat: location.lat,
          lng: location.lng,
          accuracy: 10,
          speed: 0,
          heading: 0,
          timestamp: new Date().toISOString(),
          source: "MOBILE_GPS"
        })
      });
    } catch (error) {
      console.warn("Failed to send location:", error);
    }
  };

  const updateJobStatus = async (newStatus: string) => {
    if (!job) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || 'https://192.168.1.20:3004';
      const actualCompanyId = companyId || 'company-123';
      const response = await fetch(`${backendUrl}/api/v1/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          companyId: actualCompanyId,
          note: `Driver updated status to ${newStatus}`
        })
      });

      if (response.ok) {
        setJob({ ...job, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const openGoogleMaps = () => {
    if (!job?.route) return;

    const destination = encodeURIComponent(job.route.destination);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading job...</span>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
          <Link href="/driver" className="text-blue-600 hover:text-blue-700">
            ← Back to Driver Portal
          </Link>
        </div>
      </main>
    );
  }

  const currentStatusIndex = statusFlow.findIndex(s => s.status === job.status);
  const currentStatusConfig = statusFlow[currentStatusIndex];
  const nextStatusConfig = currentStatusIndex >= 0 && currentStatusIndex < statusFlow.length - 1
    ? statusFlow[currentStatusIndex + 1]
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/driver"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-600">
              {isTracking ? 'Live' : 'Off'}
            </span>
          </div>
        </div>

        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200"
        >
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{job.id}</h1>
            <p className="text-gray-600">{job.client?.name}</p>
          </div>

          {/* Route */}
          {job.route && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Route</span>
                </div>
                <p className="font-semibold text-gray-900">{job.route.origin}</p>
                <div className="flex items-center justify-center my-2">
                  <div className="w-6 h-6 border-2 border-blue-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="w-8 h-0.5 bg-blue-400"></div>
                  <span className="text-xs text-blue-600 px-2">{job.route.kmEstimate} km</span>
                  <div className="w-8 h-0.5 bg-blue-400"></div>
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">{job.route.destination}</p>
              </div>
            </div>
          )}

          {/* Times */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Pickup</p>
              <p className="font-semibold">{formatTime(job.pickupTs)}</p>
            </div>
            <div className="text-center">
              <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Delivery ETA</p>
              <p className="font-semibold">{formatTime(job.etaTs)}</p>
            </div>
          </div>
        </motion.div>

        {/* Special Instructions */}
        {job.specialNotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h2 className="font-bold text-yellow-800">Special Instructions</h2>
            </div>
            <p className="text-yellow-700">{job.specialNotes}</p>
          </motion.div>
        )}

        {/* Main Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Primary Action Button */}
          {nextStatusConfig && (
            <button
              onClick={() => updateJobStatus(nextStatusConfig.status)}
              className={`w-full ${currentStatusConfig?.color || 'bg-blue-600'} text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>{currentStatusConfig?.action || 'Update Status'}</span>
            </button>
          )}

          {/* Navigation Button */}
          <button
            onClick={openGoogleMaps}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Navigation className="w-5 h-5" />
            <span>Navigate to Destination</span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/driver/documents?jobId=${jobId}`}
              className="flex flex-col items-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:shadow-lg transition-all"
            >
              <FileText className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Documents</span>
            </Link>

            <button className="flex flex-col items-center p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <Phone className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Call Support</span>
            </button>
          </div>

          {/* Job Complete State */}
          {job.status === 'COMPLETED' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Job Completed!</h3>
              <p className="text-green-700 mb-4">Excellent work! Job has been marked as complete.</p>
              <Link
                href="/driver"
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Return to Portal
              </Link>
            </div>
          )}
        </motion.div>

        {/* Footer space */}
        <div className="h-20" />
      </div>
    </main>
  );
}