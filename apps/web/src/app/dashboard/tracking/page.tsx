"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCompany } from "../../../contexts/CompanyContext";
import { useSocket } from "../../../contexts/SocketContext";
import { getApiUrl } from "../../../lib/api-config";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type TrackingJob = {
  jobId: string;
  status: string;
  client: {
    name: string;
    code: string;
  };
  route: {
    origin: string;
    destination: string;
    kmEstimate: number;
  };
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    regNo: string;
    make: string;
    model: string;
  };
  lastLocation: {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
    timeSinceUpdate: number;
    isStale: boolean;
  } | null;
  etaTs?: string;
  estimatedTimeMinutes?: number;
};

type TrackingResponse = {
  success: boolean;
  data: TrackingJob[];
  summary: {
    totalJobs: number;
    withLocation: number;
    staleLocations: number;
  };
};

const statusColors: Record<string, string> = {
  ASSIGNED: "#3b82f6",
  IN_TRANSIT: "#22c55e",
  AT_PICKUP: "#eab308",
  LOADED: "#a855f7",
  AT_DELIVERY: "#f97316",
};

const mapStatusColor = (status: string) => statusColors[status] || "#6B7280";

const formatEta = (etaTs?: string, estimatedTimeMinutes?: number) => {
  if (etaTs) {
    const etaDate = new Date(etaTs);
    const diffMinutes = Math.round((etaDate.getTime() - Date.now()) / (1000 * 60));
    if (diffMinutes <= 0) {
      return "Overdue";
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  if (estimatedTimeMinutes !== undefined && estimatedTimeMinutes !== null) {
    const hours = Math.floor(estimatedTimeMinutes / 60);
    const minutes = estimatedTimeMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  return null;
};

const SummaryCard = ({ title, value, accent }: { title: string; value: number; accent: string }) => (
  <div className={`glass rounded-2xl px-5 py-4 border border-white/60 ${accent}`}>
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
  </div>
);

function LeafletMap({ trackingData, selectedJob, onJobSelect }: {
  trackingData: TrackingJob[];
  selectedJob: TrackingJob | null;
  onJobSelect: (job: TrackingJob) => void;
}) {
  const mapRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Import Leaflet library and fix default icon
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);

      // Fix default icon issue in Leaflet
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    });

    // Load Leaflet CSS
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current) return;

    // Auto-center on fresh location
    const freshJobs = trackingData.filter(job => job.lastLocation && !job.lastLocation.isStale);
    if (freshJobs.length > 0 && mapRef.current) {
      freshJobs.sort((a, b) => a.lastLocation!.timeSinceUpdate - b.lastLocation!.timeSinceUpdate);
      const newestJob = freshJobs[0];
      const lat = Number(newestJob.lastLocation!.lat);
      const lng = Number(newestJob.lastLocation!.lng);

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        mapRef.current.setView([lat, lng], 13);
      }
    }
  }, [trackingData, L]);

  if (!mounted || !L) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Find center point - default to first location or Mumbai
  let centerLat = 19.076;
  let centerLng = 72.8777;

  const firstJobWithLocation = trackingData.find(job => job.lastLocation);
  if (firstJobWithLocation) {
    centerLat = Number(firstJobWithLocation.lastLocation!.lat);
    centerLng = Number(firstJobWithLocation.lastLocation!.lng);
  }

  // Custom icon function
  const createCustomIcon = (color: string) => {
    if (!L) return undefined;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={10}
      style={{ height: '400px', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trackingData.map((job) => {
        if (!job.lastLocation) return null;

        const lat = Number(job.lastLocation.lat);
        const lng = Number(job.lastLocation.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        const etaText = formatEta(job.etaTs, job.estimatedTimeMinutes);
        const icon = createCustomIcon(mapStatusColor(job.status));

        return (
          <Marker
            key={job.jobId}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{
              click: () => onJobSelect(job),
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>
                <strong>{job.driver.name}</strong><br />
                {job.vehicle.regNo}<br />
                {job.client.name}<br />
                Speed: {job.lastLocation.speed} km/h<br />
                Updated: {job.lastLocation.timeSinceUpdate} min ago<br />
                {etaText && `ETA: ${etaText}`}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default function TrackingPage() {
  const { companyId } = useCompany();
  const { socket, isConnected, joinTracking } = useSocket();

  const [trackingData, setTrackingData] = useState<TrackingJob[]>([]);
  const [summary, setSummary] = useState<TrackingResponse["summary"] | null>(null);
  const [selectedJob, setSelectedJob] = useState<TrackingJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setTrackingData([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(getApiUrl(`/api/v1/tracking/active/${companyId}`), { signal: controller.signal });
        clearTimeout(timeoutId);

        const data: TrackingResponse = await response.json();
        if (data.success) {
          setTrackingData(data.data);
          setSummary(data.summary);
          setSelectedJob((prev) => (prev ? prev : data.data[0] ?? null));
        } else {
          setTrackingData([]);
          setSummary(null);
        }
      } catch (err) {
        console.error("Failed to fetch tracking data", err);
        setTrackingData([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [companyId]);

  useEffect(() => {
    if (!socket || !isConnected || !companyId) {
      return;
    }

    joinTracking(companyId);

    const handleLocationUpdate = (payload: { data: any }) => {
      setTrackingData((prev) =>
        prev.map((job) =>
          job.jobId === payload.data.jobId
            ? {
                ...job,
                lastLocation: {
                  lat: payload.data.lat,
                  lng: payload.data.lng,
                  timestamp: payload.data.timestamp,
                  speed: payload.data.speed,
                  timeSinceUpdate: 0,
                  isStale: false,
                },
              }
            : job
        )
      );
    };

    const handleStatusUpdate = (payload: { data: { jobId: string; status: string } }) => {
      setTrackingData((prev) => prev.map((job) => (job.jobId === payload.data.jobId ? { ...job, status: payload.data.status } : job)));
    };

    socket.on("location-update", handleLocationUpdate);
    socket.on("job-status-update", handleStatusUpdate);

    return () => {
      socket.off("location-update", handleLocationUpdate);
      socket.off("job-status-update", handleStatusUpdate);
    };
  }, [socket, isConnected, companyId, joinTracking]);

  const trackingSummary = useMemo(() => {
    const totalJobs = summary?.totalJobs || 0;
    const withLocation = summary?.withLocation || 0;
    const staleLocations = summary?.staleLocations || 0;

    return {
      totalJobs,
      withLocation,
      staleLocations,
    };
  }, [summary]);

  if (!companyId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="glass max-w-xl mx-auto p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Company not selected</h1>
          <p className="text-gray-600">
            Choose a company to view tracking information. Provide a company identifier via the CompanyProvider or environment variable NEXT_PUBLIC_COMPANY_ID.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-semibold text-gray-700">Loading live tracking...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live tracking</h1>
            <p className="text-gray-600">Real-time location monitoring for active jobs</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm text-gray-600">{isConnected ? "Live" : "Offline"}</span>
            </div>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <SummaryCard title="Active jobs" value={trackingSummary.totalJobs} accent="bg-blue-50" />
          <SummaryCard title="With location" value={trackingSummary.withLocation} accent="bg-green-50" />
          <SummaryCard title="Stale jobs" value={trackingSummary.staleLocations} accent="bg-orange-50" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Live map</h2>
              <p className="text-sm text-gray-600">Real-time vehicle positions using OpenStreetMap</p>
            </div>
            <div className="relative">
              <LeafletMap
                trackingData={trackingData}
                selectedJob={selectedJob}
                onJobSelect={setSelectedJob}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Active jobs</h2>
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {trackingData.length === 0 && (
                  <p className="text-sm text-gray-500">No active jobs found.</p>
                )}
                {trackingData.map((job) => (
                  <motion.button
                    key={job.jobId}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-4 rounded-xl border transition shadow-sm ${selectedJob?.jobId === job.jobId ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{job.client.name}</p>
                        <p className="text-base font-semibold text-gray-900">{job.route.origin} → {job.route.destination}</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-900 text-white">
                        {job.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Driver: <strong className="text-gray-800">{job.driver.name}</strong></span>
                      <span>Vehicle: <strong className="text-gray-800">{job.vehicle.regNo}</strong></span>
                    </div>
                    {job.lastLocation ? (
                      <div className="mt-2 text-xs text-gray-500">
                        Updated {job.lastLocation.timeSinceUpdate} min ago • {job.lastLocation.speed} km/h
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-400">
                        Waiting for location update...
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
